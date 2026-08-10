from aiforec.domain.services.analytics_service import AnalyticsService
from aiforec.domain.services.memory_store import reset_store
from aiforec.domain.services.module_tags import extract_module_tags


def test_extract_module_tags():
    assert "二次函数" in extract_module_tags("二次函数顶点怎么求")
    assert extract_module_tags("今天天气真好") == ["未归类"]


def test_analytics_hotspots_and_student():
    store = reset_store()
    svc = AnalyticsService(store)
    overview = svc.overview()
    assert overview["total_asks"] >= 5
    assert overview["hotspots"][0]["module_tag"] == "二次函数"
    assert overview["hotspots"][0]["ask_count"] >= 3

    profiles = svc.student_profiles(student_id="u-s1")
    assert len(profiles) == 1
    assert profiles[0].total_asks >= 3
    assert profiles[0].modules[0].module_tag == "二次函数"


def test_record_ask_skips_counsel():
    store = reset_store()
    svc = AnalyticsService(store)
    before = len(store.list_question_asks())
    rows = svc.record_ask_from_turn(
        student_id="u-s1",
        user_text="我好焦虑想哭",
        intent="counsel",
    )
    assert rows == []
    assert len(store.list_question_asks()) == before

    rows = svc.record_ask_from_turn(
        student_id="u-s1",
        user_text="二次函数练习巩固一下",
        intent="practice",
    )
    assert len(rows) == 1
    assert rows[0].module_tag == "二次函数"
