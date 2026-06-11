from __future__ import annotations
from datetime import date, datetime
from typing import Optional
from fastapi import FastAPI, HTTPException, Query, Depends
from sqlalchemy import func
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session, sessionmaker
from models import Base, Person, Meeting, Topic, ActionItem, ActionStatus, engine
from schemas import (
    PersonCreate, PersonOut,
    MeetingCreate, MeetingOut, MeetingSummary, MeetingUpdate,
    TopicCreate, TopicOut, TopicUpdate, TopicCarry,
    ActionCreate, ActionOut, ActionUpdate, ActionSummary,
)

app = FastAPI(title="1:1 Facilitator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SessionLocal = sessionmaker(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─── People ────────────────────────────────────────────────

@app.get("/api/people", response_model=list[PersonOut])
def list_people(db: Session = Depends(get_db)):
    return db.query(Person).order_by(Person.name).all()


@app.post("/api/people", response_model=PersonOut)
def create_person(data: PersonCreate, db: Session = Depends(get_db)):
    p = Person(**data.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@app.delete("/api/people/{person_id}")
def delete_person(person_id: int, db: Session = Depends(get_db)):
    p = db.get(Person, person_id)
    if not p:
        raise HTTPException(404)
    db.delete(p)
    db.commit()
    return {"ok": True}


# ─── Meetings ──────────────────────────────────────────────

@app.get("/api/meetings", response_model=list[MeetingSummary])
def list_meetings(
    person_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Meeting)
    if person_id:
        q = q.filter(Meeting.person_id == person_id)
    q = q.order_by(Meeting.scheduled_at.desc())
    out = []
    for m in q.all():
        out.append(MeetingSummary(
            id=m.id, person_id=m.person_id, scheduled_at=m.scheduled_at,
            notes=m.notes, topic_count=len(m.topics),
            action_count=len(m.action_items),
            person_name=m.person.name,
        ))
    return out


@app.get("/api/meetings/{meeting_id}")
def get_meeting(meeting_id: int, db: Session = Depends(get_db)):
    m = db.get(Meeting, meeting_id)
    if not m:
        raise HTTPException(404)
    return {
        "id": m.id,
        "person_id": m.person_id,
        "person_name": m.person.name,
        "scheduled_at": str(m.scheduled_at),
        "notes": m.notes,
        "created_at": str(m.created_at),
        "topics": [{
            "id": t.id,
            "meeting_id": t.meeting_id,
            "sort_order": t.sort_order,
            "title": t.title,
            "content": t.content,
            "category": t.category,
            "carried_from_meeting_id": t.carried_from_meeting_id,
            "resolved": t.resolved,
            "created_at": str(t.created_at),
        } for t in m.topics],
        "action_items": [{
            "id": a.id,
            "meeting_id": a.meeting_id,
            "description": a.description,
            "assignee": a.assignee,
            "status": a.status.value if isinstance(a.status, ActionStatus) else str(a.status),
            "due_date": str(a.due_date) if a.due_date else None,
            "resolved_at": str(a.resolved_at) if a.resolved_at else None,
            "created_at": str(a.created_at),
        } for a in m.action_items],
    }


@app.post("/api/meetings")
def create_meeting(data: MeetingCreate, db: Session = Depends(get_db)):
    m = Meeting(
        person_id=data.person_id,
        scheduled_at=data.scheduled_at,
        notes=data.notes,
    )
    db.add(m)
    db.flush()  # Flush to get m.id before commit

    # Scheme B: Carry forward ALL historically unresolved topics and non-completed actions,
    # preventing duplicates by keeping only the most recent iteration of each unique item.
    from collections import defaultdict
    
    # 1. Find all unresolved topics for this person
    # Use Topic.meeting.has() to avoid AmbiguousForeignKeysError since Topic has 2 FKs to Meeting
    all_unresolved_topics = db.query(Topic).filter(
        Topic.meeting.has(Meeting.person_id == data.person_id),
        Topic.resolved == False
    ).all()
    
    print(f"DEBUG: Found {len(all_unresolved_topics)} unresolved topics for person {data.person_id}")
    for t in all_unresolved_topics:
        print(f"  - '{t.title}' (Meeting {t.meeting_id}, Resolved: {t.resolved})")
    
    # Group by signature (title + content) to prevent duplicates from carry-over chains
    topic_groups = defaultdict(list)
    for t in all_unresolved_topics:
        sig = (t.title.strip().lower(), (t.content or "").strip().lower())
        topic_groups[sig].append(t)
        
    latest_topics = []
    for sig, topics in topic_groups.items():
        topics.sort(key=lambda x: x.created_at, reverse=True)
        latest_topics.append(topics[0])
        
    print(f"DEBUG: After deduplication, carrying {len(latest_topics)} topics: {[t.title for t in latest_topics]}")
        
    # Keep only the most recently created version of each unresolved topic
    latest_topics = []
    for sig, topics in topic_groups.items():
        topics.sort(key=lambda x: x.created_at, reverse=True)
        latest_topics.append(topics[0])
        
    # Carry them into the new meeting
    for i, t in enumerate(latest_topics):
        db.add(Topic(
            meeting_id=m.id,
            sort_order=i,
            title=t.title,
            content=t.content,
            category=t.category,
            carried_from_meeting_id=t.meeting_id,
        ))

    # 2. Find all non-completed action items for this person
    all_uncompleted_actions = db.query(ActionItem).filter(
        ActionItem.meeting.has(Meeting.person_id == data.person_id),
        ActionItem.status.notin_([ActionStatus.completed, ActionStatus.cancelled])
    ).all()
    
    # Group by signature (description) to prevent duplicates
    action_groups = defaultdict(list)
    for a in all_uncompleted_actions:
        sig = (a.description.strip().lower(), (a.assignee or "").strip().lower())
        action_groups[sig].append(a)
        
    latest_actions = []
    for sig, actions in action_groups.items():
        actions.sort(key=lambda x: x.created_at, reverse=True)
        latest_actions.append(actions[0])
        
    # Carry them into the new meeting
    for a in latest_actions:
        db.add(ActionItem(
            meeting_id=m.id,
            description=a.description,
            assignee=a.assignee,
            status=a.status,
            due_date=a.due_date,
        ))

    db.commit()
    db.refresh(m)
    return {
        "id": m.id,
        "person_id": m.person_id,
        "person_name": m.person.name,
        "scheduled_at": str(m.scheduled_at),
        "notes": m.notes,
        "created_at": str(m.created_at),
        "topics": [{
            "id": t.id, "meeting_id": t.meeting_id, "sort_order": t.sort_order,
            "title": t.title, "content": t.content, "category": t.category,
            "carried_from_meeting_id": t.carried_from_meeting_id,
            "resolved": t.resolved, "created_at": str(t.created_at),
        } for t in m.topics],
        "action_items": [],
    }


@app.patch("/api/meetings/{meeting_id}")
def update_meeting(meeting_id: int, data: MeetingUpdate, db: Session = Depends(get_db)):
    m = db.get(Meeting, meeting_id)
    if not m:
        raise HTTPException(404)
    if data.notes is not None:
        m.notes = data.notes
    db.commit()
    return {"ok": True}


# ─── Topics ────────────────────────────────────────────────

@app.post("/api/meetings/{meeting_id}/topics")
def add_topic(meeting_id: int, data: TopicCreate, db: Session = Depends(get_db)):
    m = db.get(Meeting, meeting_id)
    if not m:
        raise HTTPException(404, "Meeting not found")
    t = Topic(meeting_id=meeting_id, **data.model_dump())
    db.add(t)
    db.commit()
    db.refresh(t)
    return {
        "id": t.id, "meeting_id": t.meeting_id, "sort_order": t.sort_order,
        "title": t.title, "content": t.content, "category": t.category,
        "carried_from_meeting_id": t.carried_from_meeting_id,
        "resolved": t.resolved, "created_at": str(t.created_at),
    }


@app.patch("/api/topics/{topic_id}")
def update_topic(topic_id: int, data: TopicUpdate, db: Session = Depends(get_db)):
    t = db.get(Topic, topic_id)
    if not t:
        raise HTTPException(404)
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(t, k, v)
    db.commit()
    db.refresh(t)
    return {
        "id": t.id, "meeting_id": t.meeting_id, "sort_order": t.sort_order,
        "title": t.title, "content": t.content, "category": t.category,
        "carried_from_meeting_id": t.carried_from_meeting_id,
        "resolved": t.resolved, "created_at": str(t.created_at),
    }


@app.delete("/api/topics/{topic_id}")
def delete_topic(topic_id: int, db: Session = Depends(get_db)):
    t = db.get(Topic, topic_id)
    if not t:
        raise HTTPException(404)
    db.delete(t)
    db.commit()
    return {"ok": True}


@app.post("/api/meetings/{meeting_id}/topics/carry")
def carry_topics(meeting_id: int, data: TopicCarry, db: Session = Depends(get_db)):
    m = db.get(Meeting, meeting_id)
    if not m:
        raise HTTPException(404)
    existing_count = len(m.topics)
    for i, tid in enumerate(data.topic_ids):
        src = db.get(Topic, tid)
        if not src:
            continue
        db.add(Topic(
            meeting_id=meeting_id,
            sort_order=existing_count + i,
            title=src.title,
            content=src.content,
            category=src.category,
            carried_from_meeting_id=src.meeting_id,
        ))
    db.commit()
    db.refresh(m)
    return {"ok": True, "count": len(m.topics)}


# ─── Action Items ──────────────────────────────────────────

@app.post("/api/meetings/{meeting_id}/actions")
def add_action(meeting_id: int, data: ActionCreate, db: Session = Depends(get_db)):
    m = db.get(Meeting, meeting_id)
    if not m:
        raise HTTPException(404)
    a = ActionItem(meeting_id=meeting_id, **data.model_dump())
    db.add(a)
    db.commit()
    db.refresh(a)
    return {
        "id": a.id, "meeting_id": a.meeting_id,
        "description": a.description, "assignee": a.assignee,
        "status": a.status.value if isinstance(a.status, ActionStatus) else str(a.status),
        "due_date": str(a.due_date) if a.due_date else None,
        "resolved_at": str(a.resolved_at) if a.resolved_at else None,
        "created_at": str(a.created_at),
    }


@app.patch("/api/actions/{action_id}")
def update_action(action_id: int, data: ActionUpdate, db: Session = Depends(get_db)):
    a = db.get(ActionItem, action_id)
    if not a:
        raise HTTPException(404)
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(a, k, v)
    if data.status == "completed":
        a.resolved_at = datetime.utcnow()
    db.commit()
    db.refresh(a)
    return {
        "id": a.id, "meeting_id": a.meeting_id,
        "description": a.description, "assignee": a.assignee,
        "status": a.status.value if isinstance(a.status, ActionStatus) else str(a.status),
        "due_date": str(a.due_date) if a.due_date else None,
        "resolved_at": str(a.resolved_at) if a.resolved_at else None,
        "created_at": str(a.created_at),
    }


@app.delete("/api/actions/{action_id}")
def delete_action(action_id: int, db: Session = Depends(get_db)):
    a = db.get(ActionItem, action_id)
    if not a:
        raise HTTPException(404)
    db.delete(a)
    db.commit()
    return {"ok": True}



@app.delete("/api/meetings/{meeting_id}")
def delete_meeting(meeting_id: int, db: Session = Depends(get_db)):
    m = db.get(Meeting, meeting_id)
    if not m:
        raise HTTPException(404)
    db.delete(m)
    db.commit()
    return {"ok": True}

# ─── Reports ───────────────────────────────────────────────

@app.get("/api/report")
def report(
    person_id: Optional[int] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    mq = db.query(Meeting)
    if person_id:
        mq = mq.filter(Meeting.person_id == person_id)
    if date_from:
        mq = mq.filter(func.date(Meeting.scheduled_at) >= date_from)
    if date_to:
        mq = mq.filter(func.date(Meeting.scheduled_at) <= date_to)
    meetings = mq.order_by(Meeting.scheduled_at.desc()).all()
    meeting_ids = [m.id for m in meetings]

    topics = (
        db.query(Topic).filter(Topic.meeting_id.in_(meeting_ids)).order_by(Topic.created_at.desc()).all()
    ) if meeting_ids else []

    actions = (
        db.query(ActionItem)
        .filter(ActionItem.meeting_id.in_(meeting_ids))
        .order_by(ActionItem.status, ActionItem.due_date)
        .all()
    ) if meeting_ids else []

    action_summaries = []
    for a in actions:
        st = a.status.value if isinstance(a.status, ActionStatus) else str(a.status)
        action_summaries.append({
            "id": a.id, "meeting_id": a.meeting_id,
            "meeting_date": str(a.meeting.scheduled_at),
            "person_name": a.meeting.person.name,
            "description": a.description, "assignee": a.assignee,
            "status": st,
            "due_date": str(a.due_date) if a.due_date else None,
        })

    return {
        "meetings": [{
            "id": m.id, "person_id": m.person_id, "scheduled_at": str(m.scheduled_at),
            "notes": m.notes, "topic_count": len(m.topics),
            "action_count": len(m.action_items),
            "person_name": m.person.name,
        } for m in meetings],
        "topic_highlights": [{
            "id": t.id, "meeting_id": t.meeting_id,
            "meeting_date": str(t.meeting.scheduled_at), "person_name": t.meeting.person.name,
            "title": t.title, "category": t.category,
            "resolved": t.resolved, "carried_from": bool(t.carried_from_meeting_id),
        } for t in topics],
        "action_items": action_summaries,
        "stats": {
            "total_meetings": len(meetings),
            "total_topics": len(topics),
            "open_actions": sum(1 for a in action_summaries if a["status"] in ("pending", "in_progress")),
            "completed_actions": sum(1 for a in action_summaries if a["status"] == "completed"),
        },
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
