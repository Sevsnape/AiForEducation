from __future__ import annotations

from aiforec.agent.policies.visibility import strip_support_from_payload
from aiforec.domain.models.enums import RiskLevel


def assemble(state: dict) -> dict:
    teacher_view = bool(state.get("teacher_view"))
    text = state.get("response_text") or ""
    payload = dict(state.get("response_payload") or {})
    hints = list(state.get("ui_hints") or [])

    if teacher_view:
        payload = strip_support_from_payload(payload)
        # Belt-and-suspenders: never emit support snapshot fields.
        payload.pop("support_snapshot", None)

    risk = state.get("risk_level") or RiskLevel.NONE.value
    if risk == RiskLevel.HIGH and "disable_more_practice" not in hints:
        hints.append("disable_more_practice")

    if state.get("intent") == "counsel" and "show_private_badge" not in hints:
        hints.append("show_private_badge")

    if not text:
        text = "我在这儿。可以告诉我你想练习、出题，还是先聊聊最近的学习压力？"

    return {
        "response_text": text,
        "response_payload": payload,
        "ui_hints": hints,
    }
