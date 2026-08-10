from __future__ import annotations


def general(state: dict) -> dict:
    role = state.get("role")
    if role == "teacher":
        text = "你好，我是教学助手。可以直接说「出题：初二数学一次函数 3 道选择题」，或切换出题模式。"
    else:
        text = (
            "你好，我是你的学习支持 AI。你可以：\n"
            "1）练习巩固  2）让我出题  3）聊聊学习压力或心情\n"
            "直接告诉我你现在最想做哪一件就行。"
        )
    return {
        "expert_raw": {"agent": "general"},
        "artifact_draft": None,
        "response_text": text,
        "response_payload": {"type": "general"},
        "ui_hints": [],
    }
