from aiforec.agent.service import invoke_agent_with_token
from aiforec.domain.models.enums import UserRole
from aiforec.domain.services.auth_service import AuthError, AuthService
from aiforec.domain.services.memory_store import reset_store


def setup_function() -> None:
    reset_store()


def test_login_student_ok() -> None:
    auth = AuthService()
    result = auth.login("linxiao@student.demo", "student123")
    assert result.user.primary_role.value == "student"
    assert result.token


def test_login_disabled_fails() -> None:
    auth = AuthService()
    try:
        auth.login("disabled@student.demo", "student123")
        assert False, "expected AuthError"
    except AuthError as exc:
        assert "停用" in exc.message


def test_login_bad_password() -> None:
    auth = AuthService()
    try:
        auth.login("wang@school.demo", "wrong")
        assert False
    except AuthError as exc:
        assert "密码" in exc.message


def test_resolve_and_chat_with_token() -> None:
    auth = AuthService()
    result = auth.login("linxiao@student.demo", "student123")
    out = invoke_agent_with_token(token=result.token, user_text="你好")
    assert out["role"] == "student"
    assert out["user_id"] == result.user.id
    assert out["intent"] == "general"


def test_logout_invalidates_token() -> None:
    auth = AuthService()
    result = auth.login("admin@school.demo", "admin123")
    auth.logout(result.token)
    try:
        auth.resolve(result.token)
        assert False
    except AuthError:
        pass


def test_create_and_list_users() -> None:
    auth = AuthService()
    view = auth.create_user(
        email="new@school.demo",
        password="Pass1234",
        display_name="新同学",
        roles=[UserRole.STUDENT],
    )
    assert view.email == "new@school.demo"
    emails = {u.email for u in auth.list_users()}
    assert "new@school.demo" in emails
