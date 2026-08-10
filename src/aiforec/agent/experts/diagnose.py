from __future__ import annotations


def diagnose(state: dict) -> dict:
    learning = state.get("learning_snapshot") or {}
    weak = learning.get("weak_knowledge") or []
    if weak:
        tags = "、".join(w.get("tag", "?") for w in weak[:5])
        text = f"根据当前学情画像，相对薄弱的点可能包括：{tags}。要不要针对其中一点做一组短练习？"
    else:
        text = (
            "目前画像里还没有足够的错题证据。建议先做一组短测，我会据此更新薄弱点。"
            "回复「开始练习」即可。"
        )
    return {
        "expert_raw": {"agent": "diagnose"},
        "artifact_draft": None,
        "response_text": text,
        "response_payload": {
            "type": "diagnose",
            "weak_knowledge": weak,
        },
        "ui_hints": [],
    }
