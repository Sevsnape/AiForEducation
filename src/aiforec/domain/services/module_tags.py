"""Heuristic knowledge-module tagging for learning asks (no counsel text)."""

from __future__ import annotations

# (canonical_tag, aliases) — extend as curriculum grows
_MODULE_CATALOG: list[tuple[str, list[str]]] = [
    ("二次函数", ["二次函数", "抛物线", "顶点式", "一般式"]),
    ("一次函数", ["一次函数", "正比例函数", "斜率"]),
    ("有理数", ["有理数", "正负数", "绝对值"]),
    ("方程", ["一元一次方程", "二元一次方程", "解方程", "方程"]),
    ("几何证明", ["证明题", "全等", "相似三角形", "几何证明"]),
    ("应用题", ["应用题", "行程问题", "工程问题", "审题"]),
    ("概率统计", ["概率", "统计", "平均数", "频率"]),
]


def extract_module_tags(text: str, *, fallback: str = "未归类") -> list[str]:
    """Return matched module tags from student question text (learning only)."""
    if not text or not text.strip():
        return [fallback]
    hits: list[str] = []
    for tag, aliases in _MODULE_CATALOG:
        if any(a in text for a in aliases):
            hits.append(tag)
    return hits or [fallback]


def catalog_tags() -> list[str]:
    return [t for t, _ in _MODULE_CATALOG]
