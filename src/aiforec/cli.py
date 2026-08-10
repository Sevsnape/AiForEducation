from __future__ import annotations

import json
from typing import Optional

import typer

from aiforec.agent.graph.summary import build_summary_graph
from aiforec.agent.service import invoke_agent
from aiforec.domain.services.memory_store import get_store, reset_store

app = typer.Typer(help="AIFOREC agent CLI")


def _echo_json(data: object) -> None:
    """Print JSON safely on Windows GBK consoles."""
    text = json.dumps(data, ensure_ascii=False, indent=2)
    try:
        typer.echo(text)
    except UnicodeEncodeError:
        typer.echo(json.dumps(data, ensure_ascii=True, indent=2))


@app.command("chat")
def chat(
    text: str = typer.Argument(..., help="用户输入"),
    user_id: str = typer.Option("student-demo", help="用户 ID"),
    role: str = typer.Option("student", help="student|teacher|admin"),
    thread_id: Optional[str] = typer.Option(None, help="会话 ID"),
    mode: str = typer.Option("auto", help="auto|question_gen|practice|counsel"),
) -> None:
    """Invoke main LangGraph once and print JSON response."""
    out = invoke_agent(
        user_id=user_id,
        role=role,
        user_text=text,
        thread_id=thread_id,
        client_mode=mode,
    )
    _echo_json(out)


@app.command("summary")
def summary(
    student_id: str = typer.Option("student-demo"),
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
def show_profile(student_id: str = typer.Option("student-demo")) -> None:
    store = get_store()
    profile = store.ensure_profile(student_id)
    typer.echo(profile.model_dump_json(indent=2))


if __name__ == "__main__":
    app()
