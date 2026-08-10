from __future__ import annotations

from datetime import date
from uuid import uuid4


def study_plan(state: dict) -> dict:
    """Co-create a learning-side study plan with the student (no counsel content)."""
    learning = state.get("learning_snapshot") or {}
    weak = learning.get("weak_knowledge") or []
    focus = [w.get("tag") for w in weak[:3] if w.get("tag")] or ["二次函数"]
    goal = learning.get("near_term_goal") or "稳步提升薄弱模块正确率"
    text = (
        "好，我们一起来定学习计划。下面是一版草稿：你可以改目标、天数或模块；"
        "确认后会写入「我的 · 学习计划」。高风险时不会加压排满刷题。"
    )
    plan = {
        "id": str(uuid4()),
        "title": "共创学习计划（草稿）",
        "horizon_days": 14,
        "goals": [goal, "每天可完成的小目标"],
        "steps": [
            "第 1–3 天：诊断错因 + 基础题热身",
            "第 4–10 天：主攻模块短练（每天 10–15 分钟）",
            "第 11–14 天：综合回顾与错题复盘",
        ],
        "focus_modules": focus,
        "status": "draft",
        "updated_at": date.today().isoformat(),
    }
    return {
        "expert_raw": {"agent": "study_plan"},
        "artifact_draft": None,
        "response_text": text,
        "response_payload": {"type": "study_plan", "plan": plan},
        "ui_hints": ["open_me_study_plan"],
    }
