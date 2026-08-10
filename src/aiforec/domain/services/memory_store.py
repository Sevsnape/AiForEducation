"""In-process domain store for Phase 1 smoke / tests.

Mirrors SQL tables conceptually; swap for SQLAlchemy-backed services later.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from threading import Lock
from typing import Any
from uuid import uuid4

from aiforec.domain.models.account import AccountRecord, SessionRecord
from aiforec.domain.models.enums import UserRole
from aiforec.domain.models.profile import ConsentFlags, LearningSnapshot, StudentProfile, SupportSnapshot
from aiforec.domain.services.passwords import hash_password


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


@dataclass
class QuestionAskRecord:
    """Learning-side question ask → knowledge module (never counsel content)."""

    id: str
    student_id: str
    module_tag: str
    subject: str = "数学"
    intent: str | None = None
    thread_id: str | None = None
    message_id: str | None = None
    question_preview: str = ""
    org_id: str | None = None
    class_id: str | None = None
    created_at: datetime = field(default_factory=_utcnow)


class InMemoryDomainStore:
    def __init__(self) -> None:
        self._lock = Lock()
        self.profiles: dict[str, StudentProfile] = {}
        self.threads: dict[str, ThreadRecord] = {}
        self.messages: list[MessageRecord] = []
        self.audits: list[AuditRecord] = []
        self.artifacts: dict[str, dict[str, Any]] = {}
        self.question_asks: list[QuestionAskRecord] = []
        self.study_plans: dict[str, dict[str, Any]] = {}  # student_id -> plan
        self.accounts: dict[str, AccountRecord] = {}
        self.accounts_by_email: dict[str, str] = {}
        self.sessions: dict[str, SessionRecord] = {}  # key = token_hash

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

    def add_question_ask(self, **kwargs: Any) -> QuestionAskRecord:
        with self._lock:
            rec = QuestionAskRecord(id=str(uuid4()), **kwargs)
            self.question_asks.append(rec)
            return rec

    def list_question_asks(self) -> list[QuestionAskRecord]:
        with self._lock:
            return list(self.question_asks)

    def save_study_plan(self, student_id: str, plan: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            self.study_plans[student_id] = plan
            return plan

    def get_study_plan(self, student_id: str) -> dict[str, Any] | None:
        with self._lock:
            return self.study_plans.get(student_id)

    # ---- accounts / sessions ----

    def upsert_account(self, account: AccountRecord) -> AccountRecord:
        with self._lock:
            self.accounts[account.id] = account
            self.accounts_by_email[account.email.lower()] = account.id
            return account

    def get_account(self, user_id: str) -> AccountRecord | None:
        with self._lock:
            return self.accounts.get(user_id)

    def get_account_by_email(self, email: str) -> AccountRecord | None:
        with self._lock:
            uid = self.accounts_by_email.get(email.lower())
            return self.accounts.get(uid) if uid else None

    def list_accounts(self) -> list[AccountRecord]:
        with self._lock:
            return list(self.accounts.values())

    def save_session(self, session: SessionRecord) -> SessionRecord:
        with self._lock:
            self.sessions[session.token_hash] = session
            return session

    def get_session_by_token_hash(self, token_hash: str) -> SessionRecord | None:
        with self._lock:
            return self.sessions.get(token_hash)

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

    def seed_demo_accounts(self) -> None:
        """Align with frontend demo logins."""
        demos = [
            ("u-admin", "admin@school.demo", "系统管理员", "admin123", [UserRole.ADMIN], "示例中学", None),
            (
                "u-t1",
                "wang@school.demo",
                "王老师",
                "teacher123",
                [UserRole.TEACHER],
                "示例中学",
                "初二(3)班",
            ),
            (
                "u-s1",
                "linxiao@student.demo",
                "林晓",
                "student123",
                [UserRole.STUDENT],
                "示例中学",
                "初二(3)班",
            ),
            (
                "u-s2",
                "zhouyu@student.demo",
                "周予",
                "student123",
                [UserRole.STUDENT],
                "示例中学",
                "初二(3)班",
            ),
            (
                "u-s3",
                "disabled@student.demo",
                "停用示例",
                "student123",
                [UserRole.STUDENT],
                "示例中学",
                "初二(1)班",
            ),
        ]
        for uid, email, name, password, roles, org, clazz in demos:
            status = "disabled" if uid == "u-s3" else "active"
            self.upsert_account(
                AccountRecord(
                    id=uid,
                    email=email,
                    display_name=name,
                    password_hash=hash_password(password),
                    roles=roles,
                    status=status,
                    org_name=org,
                    class_name=clazz,
                    created_at=_utcnow(),
                )
            )
            if UserRole.STUDENT in roles and status == "active":
                self.ensure_profile(uid)


_STORE: InMemoryDomainStore | None = None


def get_store() -> InMemoryDomainStore:
    global _STORE
    if _STORE is None:
        _STORE = InMemoryDomainStore()
        _STORE.seed_demo_student()
        _STORE.seed_demo_accounts()
        from aiforec.domain.services.analytics_service import seed_demo_asks

        seed_demo_asks(_STORE)
    return _STORE


def reset_store() -> InMemoryDomainStore:
    global _STORE
    _STORE = InMemoryDomainStore()
    _STORE.seed_demo_student()
    _STORE.seed_demo_accounts()
    from aiforec.domain.services.analytics_service import seed_demo_asks

    seed_demo_asks(_STORE)
    return _STORE
