from __future__ import annotations

from uuid import uuid4

from aiforec.agent.policies.visibility import can_read_support
from aiforec.config import get_settings
from aiforec.domain.models.enums import UserRole
from aiforec.domain.services.memory_store import get_store


def load_context(state: dict) -> dict:
    settings = get_settings()
    store = get_store()
    user_id = state["user_id"]
    role = UserRole(state.get("role", UserRole.STUDENT))
    teacher_view = role == UserRole.TEACHER

    thread = store.get_or_create_thread(
        owner_user_id=user_id,
        thread_id=state.get("thread_id"),
    )

    # For MVP, profile is keyed by user_id for students.
    # Teachers get empty support and optional empty learning of self.
    profile = store.ensure_profile(user_id)
    consent = profile.consent.model_dump()

    learning_snapshot = profile.learning.model_dump()
    support_snapshot: dict = {}
    if not teacher_view and can_read_support(
        viewer_id=user_id, viewer_role=role, student_id=user_id
    ):
        if consent.get("learning_personalize", True):
            support_snapshot = profile.support.model_dump(mode="json")
        else:
            support_snapshot = {}

    if teacher_view:
        learning_snapshot = {}
        support_snapshot = {}

    history_rows = []
    if consent.get("history_retain", True) and not teacher_view:
        for m in store.list_messages(thread.id, limit=settings.history_top_k):
            history_rows.append(
                {
                    "role": m.role,
                    "content": m.content[:500],
                    "intent": m.intent,
                }
            )

    return {
        "state_version": settings.state_version,
        "thread_id": thread.id,
        "teacher_view": teacher_view,
        "consent_flags": consent,
        "learning_snapshot": learning_snapshot,
        "support_snapshot": support_snapshot,
        "retrieved_history": history_rows,
        "session_summary_so_far": state.get("session_summary_so_far") or "",
        "trace_id": state.get("trace_id") or str(uuid4()),
        "client_mode": state.get("client_mode") or "auto",
        "persist_ops": [],
        "audit_events": [],
        "ui_hints": [],
        "response_payload": {},
    }
