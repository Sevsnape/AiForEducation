"""In-process domain store for Phase 1 smoke / tests.

Mirrors SQL tables conceptually; swap for SQLAlchemy-backed services later.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from threading import Lock
from typing import Any
from uuid import uuid4

from aiforec.domain.models.profile import ConsentFlags, LearningSnapshot, StudentProfile, SupportSnapshot


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


@dataclass
class ThreadRecord:
    id: str
    owner_user_id: str
    title: str = ""
    primary_intent: str | None = None
    started_at: datetime = field(default_factory=_utcnow)
    last_active_at: datetime = field(default_factory=_utcnow)
    deleted_at: datetime | None = None


@dataclass
class MessageRecord:
    id: str
    thread_id: str
    role: str
    content: str
    intent: str | None = None
    agent_name: str | None = None
    risk_level: str | None = None
    trace_id: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=_utcnow)


@dataclass
class AuditRecord:
    id: str
    actor_user_id: str | None
    action: str
    resource_type: str
    resource_id: str | None
    purpose: str | None
    detail: dict[str, Any]
    created_at: datetime = field(default_factory=_utcnow)


class InMemoryDomainStore:
    def __init__(self) -> None:
        self._lock = Lock()
        self.profiles: dict[str, StudentProfile] = {}
        self.threads: dict[str, ThreadRecord] = {}
        self.messages: list[MessageRecord] = []
        self.audits: list[AuditRecord] = []
        self.artifacts: dict[str, dict[str, Any]] = {}

    def ensure_profile(self, student_id: str) -> StudentProfile:
        with self._lock:
            if student_id not in self.profiles:
                self.profiles[student_id] = StudentProfile(student_id=student_id)
            return self.profiles[student_id]

    def get_profile(self, student_id: str) -> StudentProfile | None:
        with self._lock:
            return self.profiles.get(student_id)

    def upsert_profile(self, profile: StudentProfile) -> StudentProfile:
        with self._lock:
            profile.updated_at = _utcnow()
            self.profiles[profile.student_id] = profile
            return profile

    def get_or_create_thread(self, *, owner_user_id: str, thread_id: str | None) -> ThreadRecord:
        with self._lock:
            if thread_id and thread_id in self.threads:
                t = self.threads[thread_id]
                t.last_active_at = _utcnow()
                return t
            tid = thread_id or str(uuid4())
            rec = ThreadRecord(id=tid, owner_user_id=owner_user_id)
            self.threads[tid] = rec
            return rec

    def add_message(self, **kwargs: Any) -> MessageRecord:
        with self._lock:
            rec = MessageRecord(id=str(uuid4()), **kwargs)
            self.messages.append(rec)
            if rec.thread_id in self.threads:
                self.threads[rec.thread_id].last_active_at = _utcnow()
            return rec

    def list_messages(self, thread_id: str, *, limit: int = 50) -> list[MessageRecord]:
        with self._lock:
            rows = [m for m in self.messages if m.thread_id == thread_id]
            return rows[-limit:]

    def add_audit(self, **kwargs: Any) -> AuditRecord:
        with self._lock:
            rec = AuditRecord(id=str(uuid4()), **kwargs)
            self.audits.append(rec)
            return rec

    def save_artifact(self, artifact_id: str, payload: dict[str, Any]) -> None:
        with self._lock:
            self.artifacts[artifact_id] = payload

    def seed_demo_student(self, student_id: str = "student-demo") -> StudentProfile:
        profile = StudentProfile(
            student_id=student_id,
            consent=ConsentFlags(
                learning_personalize=True,
                history_retain=True,
                share_learning_with_teacher=False,
            ),
            learning=LearningSnapshot(
                subjects_focus=["数学"],
                weak_knowledge=[],
                preferred_question_types=["选择题"],
                difficulty_sweet_spot=3,
                near_term_goal="巩固基础题",
            ),
            support=SupportSnapshot(safe_summary=""),
        )
        return self.upsert_profile(profile)


_STORE: InMemoryDomainStore | None = None


def get_store() -> InMemoryDomainStore:
    global _STORE
    if _STORE is None:
        _STORE = InMemoryDomainStore()
        _STORE.seed_demo_student()
    return _STORE


def reset_store() -> InMemoryDomainStore:
    global _STORE
    _STORE = InMemoryDomainStore()
    _STORE.seed_demo_student()
    return _STORE
