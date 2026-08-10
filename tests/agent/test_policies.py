from aiforec.agent.policies.visibility import can_read_support, filter_profile_for_viewer
from aiforec.domain.models.enums import UserRole
from aiforec.domain.models.profile import ConsentFlags, StudentProfile, SupportSnapshot


def test_only_student_self_reads_support() -> None:
    assert can_read_support(viewer_id="s1", viewer_role=UserRole.STUDENT, student_id="s1")
    assert not can_read_support(viewer_id="t1", viewer_role=UserRole.TEACHER, student_id="s1")
    assert not can_read_support(viewer_id="s2", viewer_role=UserRole.STUDENT, student_id="s1")


def test_teacher_filter_strips_support() -> None:
    profile = StudentProfile(
        student_id="s1",
        consent=ConsentFlags(share_learning_with_teacher=True),
        support=SupportSnapshot(safe_summary="secret", stress_themes=["考试"]),
    )
    view = filter_profile_for_viewer(profile, viewer_id="t1", viewer_role=UserRole.TEACHER)
    assert view["support"] is None
    assert view["learning"] is not None
