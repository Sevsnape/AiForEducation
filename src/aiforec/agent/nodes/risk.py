from __future__ import annotations

import re

from aiforec.domain.models.enums import RiskLevel

# Deterministic MVP screen — replace/extend with classifier later.
_HIGH_PATTERNS = [
    r"自杀",
    r"自残",
    r"不想活",
    r"结束生命",
    r"杀死自己",
    r"kill myself",
    r"suicide",
    r"self-?harm",
]

_WATCH_PATTERNS = [
    r"绝望",
    r"活着没意思",
    r"极端痛苦",
]


def _match_any(text: str, patterns: list[str]) -> bool:
    return any(re.search(p, text, flags=re.IGNORECASE) for p in patterns)


def risk_screen(state: dict) -> dict:
    text = state.get("user_text") or ""
    if _match_any(text, _HIGH_PATTERNS):
        level = RiskLevel.HIGH
    elif _match_any(text, _WATCH_PATTERNS):
        level = RiskLevel.WATCH
    else:
        level = RiskLevel.NONE

    events = []
    if level != RiskLevel.NONE:
        events.append(
            {
                "actor_user_id": state.get("user_id"),
                "action": "risk_screen",
                "resource_type": "message",
                "resource_id": state.get("thread_id"),
                "purpose": "safety",
                "detail": {"risk_level": level.value},
            }
        )

    return {"risk_level": level.value, "audit_events": events}


def post_risk_check(state: dict) -> dict:
    """Second-pass placeholder; may elevate risk from expert_raw later."""
    return {
        "risk_level": state.get("risk_level") or RiskLevel.NONE.value,
    }
