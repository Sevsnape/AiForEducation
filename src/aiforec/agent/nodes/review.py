from __future__ import annotations


def review(state: dict) -> dict:
    draft = state.get("artifact_draft")
    if not draft:
        return {"review_result": {"ok": True, "skipped": True}}

    questions = draft.get("questions") or []
    errors: list[str] = []
    if not questions:
        errors.append("empty_questions")

    for i, q in enumerate(questions):
        if not q.get("stem"):
            errors.append(f"q{i}_missing_stem")
        if q.get("answer") in (None, ""):
            errors.append(f"q{i}_missing_answer")

    ok = not errors
    result = {"ok": ok, "errors": errors}
    updates: dict = {"review_result": result}
    if not ok:
        updates["response_text"] = (
            "题目生成未通过质检，请换个知识点或减少题量后再试。"
            f"（问题：{', '.join(errors)}）"
        )
        updates["response_payload"] = {"type": "review_failed", "errors": errors}
        updates["ui_hints"] = list(state.get("ui_hints") or [])
    return updates
