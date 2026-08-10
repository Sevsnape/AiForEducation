from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from aiforec.domain.models.enums import UserRole


class AccountRecord(BaseModel):
    id: str
    email: str
    display_name: str
    password_hash: str
    roles: list[UserRole] = Field(default_factory=list)
    status: str = "active"
    org_name: str = ""
    class_name: str | None = None
    last_login_at: datetime | None = None
    created_at: datetime | None = None


class SessionRecord(BaseModel):
    id: str
    user_id: str
    token_hash: str
    role_used: UserRole
    expires_at: datetime
    revoked_at: datetime | None = None
    created_at: datetime | None = None


class AuthUserView(BaseModel):
    """Safe user payload for API / CLI (no password)."""

    id: str
    email: str
    display_name: str
    roles: list[UserRole]
    primary_role: UserRole
    status: str
    org_name: str = ""
    class_name: str | None = None


class LoginResult(BaseModel):
    token: str
    expires_at: datetime
    user: AuthUserView
