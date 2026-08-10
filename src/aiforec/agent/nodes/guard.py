from __future__ import annotations

from aiforec.domain.models.enums import GuardDecision, UserRole


def guard(state: dict) -> dict:
    role = UserRole(state.get("role", UserRole.STUDENT))
    client_mode = (state.get("client_mode") or "auto").lower()
    teacher_view = bool(state.get("teacher_view"))
    consent = state.get("consent_flags") or {}

    decision = GuardDecision.ALLOW
    reason_events: list[dict] = []

    # Teachers must not enter student counsel / support memory paths.
    if teacher_view and client_mode == "counsel":
        decision = GuardDecision.DENY
        reason_events.append(
            {
                "action": "guard_deny",
                "resource_type": "counsel",
                "purpose": "teacher_cannot_access_student_support",
            }
        )

    if not consent.get("history_retain", True) and not teacher_view:
        decision = GuardDecision.LIMITED

    return {
        "guard_decision": decision.value,
        "audit_events": [
            {
                "actor_user_id": state.get("user_id"),
                "action": e["action"],
                "resource_type": e["resource_type"],
                "resource_id": state.get("thread_id"),
                "purpose": e.get("purpose"),
                "detail": {"role": role.value, "client_mode": client_mode},
            }
            for e in reason_events
        ],
    }
