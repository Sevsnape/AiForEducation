"""Pure visibility / RBAC helpers — no I/O."""

from __future__ import annotations

from typing import Any

from aiforec.domain.models.enums import UserRole
from aiforec.domain.models.profile import ConsentFlags, StudentProfile


def can_read_support(*, viewer_id: str, viewer_role: UserRole | str, student_id: str) -> bool:
    """MVP: only the student themself may read support domain."""
    role = UserRole(viewer_role)
    if role == UserRole.STUDENT and viewer_id == student_id:
        return True
    return False


def can_share_learning_with_teacher(consent: ConsentFlags) -> bool:
    return bool(consent.share_learning_with_teacher)


def filter_profile_for_viewer(
    profile: StudentProfile,
    *,
    viewer_id: str,
    viewer_role: UserRole | str,
) -> dict[str, Any]:
    """Serialize profile for a viewer; never leak support to teachers."""
    role = UserRole(viewer_role)
    base: dict[str, Any] = {
        "student_id": profile.student_id,
        "profile_version": profile.profile_version,
        "updated_at": profile.updated_at.isoformat() if profile.updated_at else None,
        "source": profile.source,
    }

    if role == UserRole.TEACHER:
        if not can_share_learning_with_teacher(profile.consent):
            return {**base, "learning": None, "support": None, "denied": "consent"}
        return {
            **base,
            "learning": {
                "weak_knowledge": [w.model_dump() for w in profile.learning.weak_knowledge],
                "last_practice_snapshot": profile.learning.last_practice_snapshot,
                "near_term_goal": profile.learning.near_term_goal,
            },
            "support": None,
        }

    if can_read_support(viewer_id=viewer_id, viewer_role=role, student_id=profile.student_id):
        return {
            **base,
            "learning": profile.learning.model_dump(),
            "support": profile.support.model_dump(mode="json"),
        }

    return {**base, "learning": None, "support": None, "denied": "forbidden"}


def strip_support_from_payload(payload: dict[str, Any] | None) -> dict[str, Any]:
    if not payload:
        return {}
    cleaned = dict(payload)
    cleaned.pop("support", None)
    cleaned.pop("support_snapshot", None)
    cleaned.pop("counsel_transcript", None)
    return cleaned
