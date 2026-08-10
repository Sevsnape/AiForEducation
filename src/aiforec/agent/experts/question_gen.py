from __future__ import annotations

from uuid import uuid4


def question_gen(state: dict) -> dict:
    """Phase 1 stub: structured question draft without LLM."""
    learning = state.get("learning_snapshot") or {}
    difficulty = learning.get("difficulty_sweet_spot") or 3
    subjects = learning.get("subjects_focus") or ["数学"]
    subject = subjects[0] if subjects else "数学"

    artifact_id = str(uuid4())
    questions = [
        {
            "stem": f"【{subject}·示例】若一次函数 y=2x+b 过点 (1,3)，则 b=？",
            "type": "short_answer",
            "options": [],
            "answer": "1",
            "explanation": "代入得 3=2+b => b=1。",
            "knowledge_tags": ["一次函数"],
            "difficulty": difficulty,
        }
    ]
    draft = {
        "id": artifact_id,
        "artifact_type": "question_set",
        "questions": questions,
    }
    return {
        "expert_raw": {"agent": "question_gen", "count": len(questions)},
        "artifact_draft": draft,
        "response_text": (
            f"已为你生成 {len(questions)} 道{subject}示例题（框架占位，尚未接大模型）。"
            "可通过质检后查看解析。"
        ),
        "response_payload": {"type": "question_set", "artifact_id": artifact_id, "questions": questions},
        "ui_hints": [],
    }
