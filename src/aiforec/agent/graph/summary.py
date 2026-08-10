from __future__ import annotations

from typing import Any, NotRequired, TypedDict

from langgraph.graph import END, START, StateGraph

from aiforec.domain.services.memory_store import get_store


class SummaryState(TypedDict):
    student_id: str
    thread_id: NotRequired[str | None]
    summary_text: NotRequired[str]
    profile_patch: NotRequired[dict[str, Any]]
    status: NotRequired[str]


def gather_recent_messages(state: SummaryState) -> dict:
    store = get_store()
    thread_id = state.get("thread_id")
    texts: list[str] = []
    if thread_id:
        for m in store.list_messages(thread_id, limit=20):
            texts.append(f"{m.role}: {m.content[:200]}")
    return {
        "summary_text": " | ".join(texts)[:1000] if texts else "(no messages)",
        "status": "gathered",
    }


def session_summarize(state: SummaryState) -> dict:
    # Placeholder until LLM patching is wired.
    raw = state.get("summary_text") or ""
    return {
        "summary_text": f"[auto-summary stub] {raw[:300]}",
        "status": "summarized",
    }


def profile_merge_patch(state: SummaryState) -> dict:
    store = get_store()
    profile = store.ensure_profile(state["student_id"])
    profile.needs_resummary = False
    profile.source = "auto_summary"
    profile.profile_version += 1
    # Keep learning/support unchanged in stub; only bump version.
    store.upsert_profile(profile)
    return {
        "profile_patch": {"profile_version": profile.profile_version},
        "status": "merged",
    }


def persist_profile(state: SummaryState) -> dict:
    return {"status": "persisted"}


def build_summary_graph():
    g = StateGraph(SummaryState)
    g.add_node("gather_recent_messages", gather_recent_messages)
    g.add_node("session_summarize", session_summarize)
    g.add_node("profile_merge_patch", profile_merge_patch)
    g.add_node("persist_profile", persist_profile)
    g.add_edge(START, "gather_recent_messages")
    g.add_edge("gather_recent_messages", "session_summarize")
    g.add_edge("session_summarize", "profile_merge_patch")
    g.add_edge("profile_merge_patch", "persist_profile")
    g.add_edge("persist_profile", END)
    return g.compile()
