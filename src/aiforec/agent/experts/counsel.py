from __future__ import annotations


def counsel(state: dict) -> dict:
    support = state.get("support_snapshot") or {}
    preference = support.get("support_preference") or "warm"
    helps = support.get("what_helps") or []
    avoid = support.get("what_to_avoid") or []

    style = {
        "warm": "我在认真听你说。学习压力大的时候，先允许自己喘口气是很正常的。",
        "direct": "我们直接看现在最卡住你的一点，一步一步拆。",
        "structured": "我们可以按三步来：说出现状 → 标出可控部分 → 选一个小行动。",
    }.get(preference, "我在这儿陪你。")

    tip = ""
    if helps:
        tip = f" 之前对你较有帮助的方式包括：{'、'.join(helps[:3])}。"
    caution = ""
    if avoid:
        caution = " 我会尽量避免让你更有压力的说法。"

    text = (
        f"{style}{tip}{caution}\n"
        "想先说说最近哪一件事最让你难受，还是学习上的哪一块最让你焦虑？"
        "（这段对话默认仅你可见；我不能替代专业心理咨询。）"
    )
    return {
        "expert_raw": {"agent": "counsel"},
        "artifact_draft": None,
        "response_text": text,
        "response_payload": {"type": "counsel", "private": True},
        "ui_hints": ["show_private_badge"],
        # Suggest support tags for async summary_graph (not merged here).
        "persist_ops": [
            {
                "op": "support_tag_suggestion",
                "tags": {"from_user_text": True},
            }
        ],
    }
