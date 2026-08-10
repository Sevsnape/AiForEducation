"""Engine helpers — optional; runtime Phase 1 uses InMemoryDomainStore."""

from __future__ import annotations

from collections.abc import Iterator
from contextlib import contextmanager

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from aiforec.config import get_settings
from aiforec.infra.db.models import Base


def make_engine(url: str | None = None):
    settings = get_settings()
    db_url = url or settings.database_url
    connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}
    return create_engine(db_url, future=True, connect_args=connect_args)


def init_db(url: str | None = None) -> None:
    engine = make_engine(url)
    Base.metadata.create_all(engine)


@contextmanager
def session_scope(url: str | None = None) -> Iterator[Session]:
    engine = make_engine(url)
    factory = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
    session = factory()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
