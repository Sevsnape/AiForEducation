from __future__ import annotations

from aiforec.domain.models.enums import ClientMode, Intent, RiskLevel, UserRole


def _keyword_intent(text: str) -> Intent | None:
    t = text.lower()
    counsel_keys = ["难过", "焦虑", "压力", "心情", "害怕", "抑郁", "想哭", "紧张"]
    practice_keys = ["练习", "刷题", "巩固", "错题", "再测"]
    question_keys = ["出题", "组卷", "出几道", "出一些题", "试卷"]
    diagnose_keys = ["薄弱", "哪里不会", "诊断", "学情"]

    if any(k in text for k in counsel_keys):
        return Intent.COUNSEL
    if any(k in text for k in question_keys) or "generate question" in t:
        return Intent.QUESTION_GEN
    if any(k in text for k in practice_keys):
        return Intent.PRACTICE
    if any(k in text for k in diagnose_keys):
        return Intent.DIAGNOSE
    return None


def route(state: dict) -> dict:
    risk = RiskLevel(state.get("risk_level") or RiskLevel.NONE)
    role = UserRole(state.get("role") or UserRole.STUDENT)
    mode = (state.get("client_mode") or ClientMode.AUTO.value).lower()
    text = state.get("user_text") or ""

    if risk == RiskLevel.HIGH:
        return {
            "intent": Intent.SAFETY.value,
            "route_reason": "risk_high_short_circuit",
        }

    if mode != ClientMode.AUTO.value:
        # Honor explicit UI mode, still blocked earlier by guard for teacher+counsel.
        mapping = {
            ClientMode.QUESTION_GEN.value: Intent.QUESTION_GEN,
            ClientMode.PRACTICE.value: Intent.PRACTICE,
            ClientMode.COUNSEL.value: Intent.COUNSEL,
        }
        intent = mapping.get(mode, Intent.GENERAL)
        return {
            "intent": intent.value,
            "route_reason": f"client_mode:{mode}",
        }

    if role == UserRole.TEACHER:
        guessed = _keyword_intent(text) or Intent.QUESTION_GEN
        if guessed == Intent.COUNSEL:
            guessed = Intent.QUESTION_GEN
        return {
            "intent": guessed.value,
            "route_reason": "teacher_default_question_or_keyword",
        }

    guessed = _keyword_intent(text) or Intent.GENERAL
    return {
        "intent": guessed.value,
        "route_reason": "keyword_or_general",
    }
