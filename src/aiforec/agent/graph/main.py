from __future__ import annotations

from functools import lru_cache
from typing import Any, Literal

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph

from aiforec.agent.experts.counsel import counsel
from aiforec.agent.experts.diagnose import diagnose
from aiforec.agent.experts.general import general
from aiforec.agent.experts.practice import practice
from aiforec.agent.experts.question_gen import question_gen
from aiforec.agent.experts.study_plan import study_plan
from aiforec.agent.nodes.assemble import assemble
from aiforec.agent.nodes.guard import guard
from aiforec.agent.nodes.load_context import load_context
from aiforec.agent.nodes.persist import persist_turn
from aiforec.agent.nodes.review import review
from aiforec.agent.nodes.risk import post_risk_check, risk_screen
from aiforec.agent.nodes.route import route
from aiforec.agent.nodes.safety import safety_reply
from aiforec.agent.state.schema import AgentState
from aiforec.domain.models.enums import GuardDecision, Intent, RiskLevel


def _after_guard(state: AgentState) -> Literal["risk_screen", "safety_reply"]:
    if state.get("guard_decision") == GuardDecision.DENY.value:
        return "safety_reply"
    return "risk_screen"


def _after_risk(state: AgentState) -> Literal["route", "safety_reply"]:
    if state.get("risk_level") == RiskLevel.HIGH.value:
        return "safety_reply"
    return "route"


def _after_route(
    state: AgentState,
) -> Literal[
    "question_gen",
    "practice",
    "diagnose",
    "counsel",
    "general",
    "study_plan",
    "safety_reply",
]:
    intent = state.get("intent") or Intent.GENERAL.value
    mapping = {
        Intent.QUESTION_GEN.value: "question_gen",
        Intent.PRACTICE.value: "practice",
        Intent.DIAGNOSE.value: "diagnose",
        Intent.COUNSEL.value: "counsel",
        Intent.GENERAL.value: "general",
        Intent.STUDY_PLAN.value: "study_plan",
        Intent.SAFETY.value: "safety_reply",
    }
    return mapping.get(intent, "general")  # type: ignore[return-value]


def _deny_safety_text(state: dict) -> dict:
    """Used when guard denies (e.g. teacher + counsel mode)."""
    if state.get("guard_decision") == GuardDecision.DENY.value:
        return {
            "response_text": (
                "当前账号无权进入学生心理支持会话。"
                "老师端可使用出题与学情（在授权与同意范围内）功能。"
            ),
            "response_payload": {"type": "guard_deny"},
            "ui_hints": [],
            "expert_raw": {"agent": "guard"},
            "intent": Intent.SAFETY.value,
        }
    return safety_reply(state)


def build_main_graph(*, checkpointer: Any | None = None):
    graph = StateGraph(AgentState)

    graph.add_node("load_context", load_context)
    graph.add_node("guard", guard)
    graph.add_node("risk_screen", risk_screen)
    graph.add_node("route", route)
    graph.add_node("question_gen", question_gen)
    graph.add_node("practice", practice)
    graph.add_node("diagnose", diagnose)
    graph.add_node("counsel", counsel)
    graph.add_node("general", general)
    graph.add_node("study_plan", study_plan)
    graph.add_node("safety_reply", _deny_safety_text)
    graph.add_node("post_risk_check", post_risk_check)
    graph.add_node("review", review)
    graph.add_node("assemble", assemble)
    graph.add_node("persist_turn", persist_turn)

    graph.add_edge(START, "load_context")
    graph.add_edge("load_context", "guard")
    graph.add_conditional_edges(
        "guard",
        _after_guard,
        {"risk_screen": "risk_screen", "safety_reply": "safety_reply"},
    )
    graph.add_conditional_edges(
        "risk_screen",
        _after_risk,
        {"route": "route", "safety_reply": "safety_reply"},
    )
    graph.add_conditional_edges(
        "route",
        _after_route,
        {
            "question_gen": "question_gen",
            "practice": "practice",
            "diagnose": "diagnose",
            "counsel": "counsel",
            "general": "general",
            "study_plan": "study_plan",
            "safety_reply": "safety_reply",
        },
    )

    for expert in ("question_gen", "practice", "diagnose", "counsel", "general", "study_plan"):
        graph.add_edge(expert, "post_risk_check")

    graph.add_edge("safety_reply", "assemble")
    graph.add_edge("post_risk_check", "review")
    graph.add_edge("review", "assemble")
    graph.add_edge("assemble", "persist_turn")
    graph.add_edge("persist_turn", END)

    return graph.compile(checkpointer=checkpointer or MemorySaver())


@lru_cache
def get_main_graph():
    return build_main_graph()
