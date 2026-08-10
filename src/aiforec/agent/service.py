from __future__ import annotations

from typing import Any
from uuid import uuid4

from aiforec.agent.graph.main import get_main_graph
from aiforec.agent.policies.visibility import strip_support_from_payload
from aiforec.domain.models.enums import UserRole
from aiforec.domain.services.auth_service import AuthError, AuthService


def invoke_agent(
    *,
    user_id: str,
    role: str,
    user_text: str,
    thread_id: str | None = None,
    client_mode: str = "auto",
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Public facade matching InvokeAgentRequest / Response."""
    graph = get_main_graph()
    tid = thread_id or str(uuid4())
    config = {"configurable": {"thread_id": tid}}

    result = graph.invoke(
        {
            "user_id": user_id,
            "role": role,
            "user_text": user_text,
            "thread_id": tid,
            "client_mode": client_mode,
            "metadata": metadata or {},
            "messages": [],
        },
        config=config,
    )

    payload = dict(result.get("response_payload") or {})
    if UserRole(role) == UserRole.TEACHER:
        payload = strip_support_from_payload(payload)

    return {
        "thread_id": result.get("thread_id") or tid,
        "response_text": result.get("response_text") or "",
        "intent": result.get("intent"),
        "risk_level": result.get("risk_level"),
        "response_payload": payload,
        "ui_hints": result.get("ui_hints") or [],
        "trace_id": result.get("trace_id"),
        "route_reason": result.get("route_reason"),
        "teacher_view": bool(result.get("teacher_view")),
        "support_snapshot": result.get("support_snapshot") if role == UserRole.STUDENT.value else {},
        "user_id": user_id,
        "role": role,
    }


def invoke_agent_with_token(
    *,
    token: str,
    user_text: str,
    thread_id: str | None = None,
    client_mode: str = "auto",
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Resolve session token then invoke — preferred path for API gateway."""
    auth = AuthService()
    try:
        account, role = auth.resolve(token)
    except AuthError as exc:
        raise PermissionError(exc.message) from exc
    return invoke_agent(
        user_id=account.id,
        role=role.value,
        user_text=user_text,
        thread_id=thread_id,
        client_mode=client_mode,
        metadata=metadata,
    )
