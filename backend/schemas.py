from __future__ import annotations
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field


class PersonCreate(BaseModel):
    name: str
    role: Optional[str] = None


class PersonOut(PersonCreate):
    id: int
    created_at: datetime
    model_config = {"from_attributes": True}


class TopicCreate(BaseModel):
    title: str
    content: Optional[str] = None
    category: Optional[str] = None
    carried_from_meeting_id: Optional[int] = None
    sort_order: int = 0


class TopicOut(BaseModel):
    id: int
    meeting_id: int
    sort_order: int
    title: str
    content: Optional[str] = None
    category: Optional[str] = None
    carried_from_meeting_id: Optional[int] = None
    resolved: bool
    created_at: datetime
    model_config = {"from_attributes": True}


class TopicUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    resolved: Optional[bool] = None
    sort_order: Optional[int] = None


class ActionCreate(BaseModel):
    description: str
    assignee: Optional[str] = None
    status: str = "pending"
    due_date: Optional[date] = None


class ActionUpdate(BaseModel):
    description: Optional[str] = None
    assignee: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[date] = None


class ActionOut(BaseModel):
    id: int
    meeting_id: int
    description: str
    assignee: Optional[str] = None
    status: str
    due_date: Optional[date] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    model_config = {"from_attributes": True}


class MeetingCreate(BaseModel):
    person_id: int
    date: Optional[date] = None
    notes: Optional[str] = None


class MeetingOut(BaseModel):
    id: int
    person_id: int
    person_name: str = ""
    date: date
    notes: Optional[str] = None
    created_at: datetime
    topics: list[TopicOut] = []
    action_items: list[ActionOut] = []
    model_config = {"from_attributes": True}


class MeetingSummary(BaseModel):
    id: int
    person_id: int
    date: date
    notes: Optional[str] = None
    topic_count: int
    action_count: int
    person_name: str


class ReportFilters(BaseModel):
    person_id: Optional[int] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None


class ActionSummary(BaseModel):
    id: int
    meeting_id: int
    meeting_date: date
    person_name: str
    description: str
    assignee: Optional[str] = None
    status: str
    due_date: Optional[date] = None


class TopicCarry(BaseModel):
    topic_ids: list[int]

class MeetingUpdate(BaseModel):
    notes: Optional[str] = None
