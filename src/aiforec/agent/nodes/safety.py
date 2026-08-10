from __future__ import annotations

SAFETY_REPLY = (
    "我很关心你现在的状态。你并不孤单，若你正处于危险或有伤害自己的想法，"
    "请立刻联系身边可信赖的人，或寻求当地紧急求助/心理危机热线帮助。"
    "我可以继续陪你慢慢说感受，但现在不会安排练习或出题。"
    "（本系统提供学业情绪支持，不能替代专业医疗或危机干预。）"
)


def safety_reply(state: dict) -> dict:
    return {
        "intent": "safety",
        "response_text": SAFETY_REPLY,
        "response_payload": {
            "type": "safety_card",
            "resources": [
                {"label": "请联系身边可信的人", "kind": "social"},
                {"label": "紧急情况请拨打当地急救电话", "kind": "emergency"},
            ],
        },
        "ui_hints": ["show_private_badge", "disable_more_practice"],
        "expert_raw": {"agent": "safety"},
        "audit_events": [
            {
                "actor_user_id": state.get("user_id"),
                "action": "safety_reply",
                "resource_type": "thread",
                "resource_id": state.get("thread_id"),
                "purpose": "crisis_or_high_risk",
                "detail": {"risk_level": state.get("risk_level")},
            }
        ],
    }
