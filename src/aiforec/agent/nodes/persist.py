from __future__ import annotations

from langchain_core.messages import AIMessage, HumanMessage

from aiforec.domain.services.analytics_service import AnalyticsService
from aiforec.domain.services.memory_store import get_store


def persist_turn(state: dict) -> dict:
    store = get_store()
    thread_id = state.get("thread_id")
    user_id = state.get("user_id")
    if not thread_id or not user_id:
        return {"needs_resummary": False}

    user_msg = store.add_message(
        thread_id=thread_id,
        role="user",
        content=state.get("user_text") or "",
        intent=state.get("intent"),
        risk_level=state.get("risk_level"),
        trace_id=state.get("trace_id"),
        metadata={"client_mode": state.get("client_mode")},
    )
    store.add_message(
        thread_id=thread_id,
        role="assistant",
        content=state.get("response_text") or "",
        intent=state.get("intent"),
        agent_name=(state.get("expert_raw") or {}).get("agent"),
        risk_level=state.get("risk_level"),
        trace_id=state.get("trace_id"),
        metadata={
            "ui_hints": state.get("ui_hints") or [],
            "payload_type": (state.get("response_payload") or {}).get("type"),
        },
    )

    asks = AnalyticsService(store).record_ask_from_turn(
        student_id=user_id,
        user_text=state.get("user_text") or "",
        intent=state.get("intent"),
        thread_id=thread_id,
        message_id=user_msg.id,
    )

    payload = state.get("response_payload") or {}
    if payload.get("type") == "study_plan" and payload.get("plan"):
        store.save_study_plan(user_id, payload["plan"])

    for event in state.get("audit_events") or []:
        store.add_audit(
            actor_user_id=event.get("actor_user_id"),
            action=event.get("action") or "unknown",
            resource_type=event.get("resource_type") or "unknown",
            resource_id=event.get("resource_id"),
            purpose=event.get("purpose"),
            detail=event.get("detail") or {},
        )

    artifact = state.get("artifact_draft")
    if artifact and artifact.get("id"):
        store.save_artifact(artifact["id"], artifact)

    # Keep graph short-term message channel in sync for checkpointer resumes.
    return {
        "messages": [
            HumanMessage(content=state.get("user_text") or ""),
            AIMessage(content=state.get("response_text") or ""),
        ],
        "needs_resummary": True,
        "persist_ops": [
            {"op": "messages_written", "thread_id": thread_id},
            {"op": "question_asks_written", "count": len(asks)},
            {"op": "audits_written", "count": len(state.get("audit_events") or [])},
        ],
    }
