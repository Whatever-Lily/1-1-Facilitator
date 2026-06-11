from __future__ import annotations
from datetime import datetime, date
from typing import Optional, List
from sqlalchemy import (
    create_engine, Column, Integer, String, Text, Date, DateTime,
    ForeignKey, Enum as SAEnum, Boolean
)
from sqlalchemy.orm import DeclarativeBase, relationship, Mapped, mapped_column
import enum


class Base(DeclarativeBase):
    pass


class ActionStatus(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"


class Person(Base):
    __tablename__ = "people"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    role: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    meetings: Mapped[List["Meeting"]] = relationship(back_populates="person", cascade="all, delete-orphan")


class Meeting(Base):
    __tablename__ = "meetings"
    id: Mapped[int] = mapped_column(primary_key=True)
    person_id: Mapped[int] = mapped_column(ForeignKey("people.id"))
    scheduled_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    person: Mapped["Person"] = relationship(back_populates="meetings")
    topics: Mapped[List["Topic"]] = relationship(cascade="all, delete-orphan", 
        back_populates="meeting",
        foreign_keys="Topic.meeting_id",
        order_by="Topic.sort_order",
    )
    action_items: Mapped[List["ActionItem"]] = relationship(cascade="all, delete-orphan", 
        back_populates="meeting",
        order_by="ActionItem.id",
    )


class Topic(Base):
    __tablename__ = "topics"
    id: Mapped[int] = mapped_column(primary_key=True)
    meeting_id: Mapped[int] = mapped_column(ForeignKey("meetings.id"))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    title: Mapped[str] = mapped_column(String(500))
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    carried_from_meeting_id: Mapped[Optional[int]] = mapped_column(ForeignKey("meetings.id"), nullable=True)
    resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    meeting: Mapped["Meeting"] = relationship(
        back_populates="topics",
        foreign_keys=[meeting_id],
    )


class ActionItem(Base):
    __tablename__ = "action_items"
    id: Mapped[int] = mapped_column(primary_key=True)
    meeting_id: Mapped[int] = mapped_column(ForeignKey("meetings.id"))
    description: Mapped[str] = mapped_column(Text)
    assignee: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    status: Mapped[ActionStatus] = mapped_column(
        SAEnum(ActionStatus, values_callable=lambda e: [v.value for v in e],
               create_constraint=True, name="action_status"),
        default=ActionStatus.pending
    )
    due_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    meeting: Mapped["Meeting"] = relationship(back_populates="action_items")


engine = create_engine("sqlite:///one_on_one.db", echo=False)
Base.metadata.create_all(engine)
