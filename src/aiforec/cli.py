from __future__ import annotations

import json
from typing import Optional

import typer

from aiforec.agent.graph.summary import build_summary_graph
from aiforec.agent.service import invoke_agent, invoke_agent_with_token
from aiforec.domain.models.enums import UserRole
from aiforec.domain.services.auth_service import AuthError, AuthService
from aiforec.domain.services.memory_store import get_store, reset_store

app = typer.Typer(help="AIFOREC agent CLI")


def _echo_json(data: object) -> None:
    """Print JSON safely on Windows GBK consoles."""
    text = json.dumps(data, ensure_ascii=False, indent=2, default=str)
    try:
        typer.echo(text)
    except UnicodeEncodeError:
        typer.echo(json.dumps(data, ensure_ascii=True, indent=2, default=str))


@app.command("login")
def login(
    email: str = typer.Option(..., help="登录邮箱"),
    password: str = typer.Option(..., help="密码"),
) -> None:
    """Authenticate and print session token + user view."""
    auth = AuthService()
    try:
        result = auth.login(email, password)
    except AuthError as exc:
        typer.secho(exc.message, err=True)
        raise typer.Exit(code=1) from exc
    _echo_json(result.model_dump(mode="json"))


@app.command("users")
def users() -> None:
    """List accounts (admin-facing, no password hashes)."""
    auth = AuthService()
    _echo_json([u.model_dump(mode="json") for u in auth.list_users()])


@app.command("user-set-status")
def user_set_status(
    user_id: str = typer.Option(...),
    status: str = typer.Option(..., help="active|disabled"),
) -> None:
    auth = AuthService()
    try:
        view = auth.set_status(user_id, status)
    except AuthError as exc:
        typer.secho(exc.message, err=True)
        raise typer.Exit(code=1) from exc
    _echo_json(view.model_dump(mode="json"))


@app.command("chat")
def chat(
    text: str = typer.Argument(..., help="用户输入"),
    user_id: str = typer.Option("u-s1", help="用户 ID（无 token 时）"),
    role: str = typer.Option("student", help="student|teacher|admin"),
    token: Optional[str] = typer.Option(None, help="登录后的 session token（优先）"),
    thread_id: Optional[str] = typer.Option(None, help="会话 ID"),
    mode: str = typer.Option("auto", help="auto|question_gen|practice|counsel"),
) -> None:
    """Invoke main LangGraph once and print JSON response."""
    try:
        if token:
            out = invoke_agent_with_token(
                token=token,
                user_text=text,
                thread_id=thread_id,
                client_mode=mode,
            )
        else:
            out = invoke_agent(
                user_id=user_id,
                role=role,
                user_text=text,
                thread_id=thread_id,
                client_mode=mode,
            )
    except PermissionError as exc:
        typer.secho(str(exc), err=True)
        raise typer.Exit(code=1) from exc
    _echo_json(out)


@app.command("summary")
def summary(
    student_id: str = typer.Option("u-s1"),
    thread_id: Optional[str] = typer.Option(None),
) -> None:
    """Run async summary graph stub."""
    g = build_summary_graph()
    out = g.invoke({"student_id": student_id, "thread_id": thread_id})
    _echo_json(out)


@app.command("reset-memory")
def reset_memory() -> None:
    """Clear in-memory domain store (dev only)."""
    reset_store()
    typer.echo("ok")


@app.command("show-profile")
def show_profile(student_id: str = typer.Option("u-s1")) -> None:
    store = get_store()
    profile = store.ensure_profile(student_id)
    typer.echo(profile.model_dump_json(indent=2))


@app.command("analytics")
def analytics(
    class_id: Optional[str] = typer.Option(None, help="按班级过滤"),
    org_id: Optional[str] = typer.Option(None, help="按组织过滤"),
    student_id: Optional[str] = typer.Option(None, help="只看某学生"),
) -> None:
    """学情分析：模块热点 + 学生提问分布（仅学习侧）。"""
    from dataclasses import asdict

from aiforec.domain.services.analytics_service import AnalyticsService

    svc = AnalyticsService()
    if student_id:
        profiles = svc.student_profiles(student_id=student_id, class_id=class_id, org_id=org_id)
        _echo_json([asdict(p) for p in profiles])
        return
    _echo_json(svc.overview(class_id=class_id, org_id=org_id))


@app.command("create-user")
def create_user(
    email: str = typer.Option(...),
    password: str = typer.Option(...),
    name: str = typer.Option(..., help="显示名"),
    role: str = typer.Option("student", help="student|teacher|admin"),
) -> None:
    auth = AuthService()
    try:
        view = auth.create_user(
            email=email,
            password=password,
            display_name=name,
            roles=[UserRole(role)],
        )
    except AuthError as exc:
        typer.secho(exc.message, err=True)
        raise typer.Exit(code=1) from exc
    _echo_json(view.model_dump(mode="json"))


if __name__ == "__main__":
    app()
