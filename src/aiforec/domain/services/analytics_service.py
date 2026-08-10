"""Learning analytics: question-ask recording and module frequency aggregates.

Privacy: only learning-side asks (practice / question_gen / diagnose / general).
Counsel / safety turns are never recorded here.
"""

from __future__ import annotations

from collections import Counter, defaultdict
from dataclasses import dataclass
from typing import Any

from aiforec.domain.services.memory_store import (
    InMemoryDomainStore,
    QuestionAskRecord,
    get_store,
)
from aiforec.domain.services.module_tags import extract_module_tags

_LEARNING_INTENTS = frozenset(
    {"practice", "question_gen", "diagnose", "general", "study_plan"}
)


@dataclass
class ModuleHotspot:
    module_tag: str
    ask_count: int
    unique_students: int
    subject: str = "数学"


@dataclass
class StudentModuleAsk:
    module_tag: str
    ask_count: int


@dataclass
class StudentAskProfile:
    student_id: str
    display_name: str
    total_asks: int
    modules: list[StudentModuleAsk]


class AnalyticsService:
    def __init__(self, store: InMemoryDomainStore | None = None) -> None:
        self.store = store or get_store()

    def record_ask_from_turn(
        self,
        *,
        student_id: str,
        user_text: str,
        intent: str | None,
        thread_id: str | None = None,
        message_id: str | None = None,
        subject: str = "数学",
        org_id: str | None = None,
        class_id: str | None = None,
        preview_max: int = 80,
    ) -> list[QuestionAskRecord]:
        """Persist one row per matched module for a learning turn."""
        if intent and intent not in _LEARNING_INTENTS:
            return []
        if not user_text.strip():
            return []

        tags = extract_module_tags(user_text)
        preview = user_text.strip().replace("\n", " ")[:preview_max]
        rows: list[QuestionAskRecord] = []
        for tag in tags:
            rows.append(
                self.store.add_question_ask(
                    student_id=student_id,
                    module_tag=tag,
                    subject=subject,
                    intent=intent,
                    thread_id=thread_id,
                    message_id=message_id,
                    question_preview=preview,
                    org_id=org_id,
                    class_id=class_id,
                )
            )
        return rows

    def module_hotspots(
        self,
        *,
        class_id: str | None = None,
        org_id: str | None = None,
        limit: int = 20,
    ) -> list[ModuleHotspot]:
        rows = self._filtered_asks(class_id=class_id, org_id=org_id)
        by_tag: dict[str, list[QuestionAskRecord]] = defaultdict(list)
        for r in rows:
            by_tag[r.module_tag].append(r)

        out: list[ModuleHotspot] = []
        for tag, items in by_tag.items():
            students = {i.student_id for i in items}
            subject = items[0].subject if items else "数学"
            out.append(
                ModuleHotspot(
                    module_tag=tag,
                    ask_count=len(items),
                    unique_students=len(students),
                    subject=subject,
                )
            )
        out.sort(key=lambda x: (-x.ask_count, -x.unique_students, x.module_tag))
        return out[:limit]

    def student_profiles(
        self,
        *,
        class_id: str | None = None,
        org_id: str | None = None,
        student_id: str | None = None,
        limit: int = 50,
    ) -> list[StudentAskProfile]:
        rows = self._filtered_asks(class_id=class_id, org_id=org_id)
        if student_id:
            rows = [r for r in rows if r.student_id == student_id]

        by_student: dict[str, list[QuestionAskRecord]] = defaultdict(list)
        for r in rows:
            by_student[r.student_id].append(r)

        profiles: list[StudentAskProfile] = []
        for sid, items in by_student.items():
            counter = Counter(i.module_tag for i in items)
            modules = [
                StudentModuleAsk(module_tag=tag, ask_count=n)
                for tag, n in counter.most_common()
            ]
            account = self.store.get_account(sid)
            name = account.display_name if account else sid
            profiles.append(
                StudentAskProfile(
                    student_id=sid,
                    display_name=name,
                    total_asks=len(items),
                    modules=modules,
                )
            )
        profiles.sort(key=lambda p: (-p.total_asks, p.display_name))
        return profiles[:limit]

    def overview(self, *, class_id: str | None = None, org_id: str | None = None) -> dict[str, Any]:
        hotspots = self.module_hotspots(class_id=class_id, org_id=org_id)
        students = self.student_profiles(class_id=class_id, org_id=org_id)
        rows = self._filtered_asks(class_id=class_id, org_id=org_id)
        return {
            "total_asks": len(rows),
            "unique_students": len({r.student_id for r in rows}),
            "module_count": len(hotspots),
            "hotspots": [
                {
                    "module_tag": h.module_tag,
                    "ask_count": h.ask_count,
                    "unique_students": h.unique_students,
                    "subject": h.subject,
                }
                for h in hotspots
            ],
            "students": [
                {
                    "student_id": s.student_id,
                    "display_name": s.display_name,
                    "total_asks": s.total_asks,
                    "top_modules": [
                        {"module_tag": m.module_tag, "ask_count": m.ask_count}
                        for m in s.modules[:5]
                    ],
                }
                for s in students
            ],
        }

    def _filtered_asks(
        self,
        *,
        class_id: str | None = None,
        org_id: str | None = None,
    ) -> list[QuestionAskRecord]:
        rows = self.store.list_question_asks()
        if class_id:
            rows = [r for r in rows if r.class_id == class_id]
        if org_id:
            rows = [r for r in rows if r.org_id == org_id]
        return rows


def seed_demo_asks(store: InMemoryDomainStore | None = None) -> None:
    """Demo rows aligned with frontend mock students."""
    store = store or get_store()
    if store.list_question_asks():
        return
    samples: list[tuple[str, str, str, str]] = [
        ("u-s1", "二次函数", "练习：二次函数开口方向怎么判断？", "practice"),
        ("u-s1", "二次函数", "二次函数顶点坐标求法", "practice"),
        ("u-s1", "应用题", "这道行程应用题不会审题", "diagnose"),
        ("u-s2", "一次函数", "一次函数图像过哪两点", "question_gen"),
        ("u-s2", "二次函数", "二次函数与 x 轴交点", "practice"),
        ("u-s2", "方程", "解二元一次方程组", "practice"),
        ("u-s2", "几何证明", "全等三角形怎么证明", "general"),
        ("u-s1", "有理数", "有理数加减符号老错", "practice"),
    ]
    for sid, tag, text, intent in samples:
        store.add_question_ask(
            student_id=sid,
            module_tag=tag,
            subject="数学",
            intent=intent,
            question_preview=text,
            org_id="org-demo",
            class_id="class-2-3",
        )
