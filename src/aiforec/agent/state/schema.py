from __future__ import annotations

import operator
from typing import Annotated, Any, NotRequired, TypedDict

from langchain_core.messages import AnyMessage
from langgraph.graph.message import add_messages


def _append_list(left: list[Any] | None, right: list[Any] | None) -> list[Any]:
    return (left or []) + (right or [])


class InputState(TypedDict):
    """Caller-facing input (partial AgentState)."""

    user_id: str
    role: str
    user_text: str
    thread_id: NotRequired[str]
    client_mode: NotRequired[str]
    metadata: NotRequired[dict[str, Any]]


class AgentState(TypedDict):
    """LangGraph working memory for one turn / thread continuation."""

    state_version: NotRequired[int]

    # identity / policy
    user_id: str
    role: str
    teacher_view: NotRequired[bool]
    consent_flags: NotRequired[dict[str, Any]]
    org_id: NotRequired[str | None]
    class_ids: NotRequired[list[str]]

    # session
    thread_id: NotRequired[str]
    messages: Annotated[list[AnyMessage], add_messages]
    session_summary_so_far: NotRequired[str]

    # routing / safety
    user_text: str
    client_mode: NotRequired[str]
    intent: NotRequired[str]
    risk_level: NotRequired[str]
    guard_decision: NotRequired[str]
    route_reason: NotRequired[str]

    # memory slices
    learning_snapshot: NotRequired[dict[str, Any]]
    support_snapshot: NotRequired[dict[str, Any]]
    retrieved_history: NotRequired[list[dict[str, Any]]]

    # expert intermediates
    expert_raw: NotRequired[dict[str, Any]]
    artifact_draft: NotRequired[dict[str, Any] | None]
    review_result: NotRequired[dict[str, Any] | None]

    # response
    response_text: NotRequired[str]
    response_payload: NotRequired[dict[str, Any]]
    ui_hints: NotRequired[list[str]]
    trace_id: NotRequired[str]

    # side-effect markers
    persist_ops: Annotated[list[dict[str, Any]], _append_list]
    needs_resummary: NotRequired[bool]
    audit_events: Annotated[list[dict[str, Any]], operator.add]
