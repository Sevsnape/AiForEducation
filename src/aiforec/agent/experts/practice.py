from __future__ import annotations

from uuid import uuid4


def practice(state: dict) -> dict:
    learning = state.get("learning_snapshot") or {}
    support = state.get("support_snapshot") or {}
    difficulty = int(learning.get("difficulty_sweet_spot") or 3)
    mood = support.get("current_mood_trend") or "stable"

    # Soft link: stressed students get fewer / easier items — without exposing mood to teachers.
    count = 3
    if mood in {"stressed", "low"}:
        count = 1
        difficulty = max(1, difficulty - 1)

    qid = str(uuid4())
    item = {
        "id": qid,
        "stem": "计算：(-3)+5=？",
        "type": "short_answer",
        "answer": "2",
        "explanation": "负数加正数：5-3=2。",
        "knowledge_tags": ["有理数加减"],
        "difficulty": difficulty,
    }
    return {
        "expert_raw": {"agent": "practice", "count": count},
        "artifact_draft": {
            "id": str(uuid4()),
            "artifact_type": "practice_set",
            "questions": [item],
        },
        "response_text": (
            f"我们先做 {count} 道巩固题（当前难度约 {difficulty}/5）。"
            f"第一题：{item['stem']} 作答后可继续（续跑将在后续 Phase 接入 interrupt）。"
        ),
        "response_payload": {
            "type": "practice_set",
            "awaiting_answer": True,
            "question": item,
        },
        "ui_hints": ["disable_more_practice"] if mood in {"stressed", "low"} else [],
    }
