"""Authentication & account administration (in-memory backed for now)."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import uuid4

from aiforec.domain.models.account import AccountRecord, AuthUserView, LoginResult, SessionRecord
from aiforec.domain.models.enums import UserRole
from aiforec.domain.services.memory_store import InMemoryDomainStore, get_store
from aiforec.domain.services.passwords import hash_password, hash_token, new_token, verify_password

_SESSION_HOURS = 24 * 7
_ROLE_PRIORITY = [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT]


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def pick_primary_role(roles: list[UserRole]) -> UserRole:
    for role in _ROLE_PRIORITY:
        if role in roles:
            return role
    if not roles:
        raise ValueError("account has no roles")
    return roles[0]


def to_view(account: AccountRecord, *, role: UserRole | None = None) -> AuthUserView:
    primary = role or pick_primary_role(account.roles)
    return AuthUserView(
        id=account.id,
        email=account.email,
        display_name=account.display_name,
        roles=list(account.roles),
        primary_role=primary,
        status=account.status,
        org_name=account.org_name,
        class_name=account.class_name,
    )


class AuthError(Exception):
    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class AuthService:
    def __init__(self, store: InMemoryDomainStore | None = None) -> None:
        self.store = store or get_store()

    def login(self, email: str, password: str, *, role_hint: UserRole | None = None) -> LoginResult:
        account = self.store.get_account_by_email(email.strip())
        if account is None:
            self.store.add_audit(
                actor_user_id=None,
                action="login_failed",
                resource_type="auth",
                resource_id=email,
                purpose="authentication",
                detail={"reason": "not_found"},
            )
            raise AuthError("账号不存在")
        if account.status != "active":
            self.store.add_audit(
                actor_user_id=account.id,
                action="login_failed",
                resource_type="auth",
                resource_id=account.id,
                purpose="authentication",
                detail={"reason": "disabled"},
            )
            raise AuthError("账号已停用")
        if not verify_password(password, account.password_hash):
            self.store.add_audit(
                actor_user_id=account.id,
                action="login_failed",
                resource_type="auth",
                resource_id=account.id,
                purpose="authentication",
                detail={"reason": "bad_password"},
            )
            raise AuthError("密码错误")

        role = role_hint if role_hint in account.roles else pick_primary_role(account.roles)
        token = new_token()
        expires = _utcnow() + timedelta(hours=_SESSION_HOURS)
        session = SessionRecord(
            id=str(uuid4()),
            user_id=account.id,
            token_hash=hash_token(token),
            role_used=role,
            expires_at=expires,
            created_at=_utcnow(),
        )
        self.store.save_session(session)
        account.last_login_at = _utcnow()
        self.store.upsert_account(account)
        self.store.add_audit(
            actor_user_id=account.id,
            action="login_ok",
            resource_type="auth_session",
            resource_id=session.id,
            purpose="authentication",
            detail={"role_used": role.value},
        )
        return LoginResult(token=token, expires_at=expires, user=to_view(account, role=role))

    def logout(self, token: str) -> None:
        session = self.store.get_session_by_token_hash(hash_token(token))
        if session is None:
            return
        session.revoked_at = _utcnow()
        self.store.save_session(session)
        self.store.add_audit(
            actor_user_id=session.user_id,
            action="logout",
            resource_type="auth_session",
            resource_id=session.id,
            purpose="authentication",
            detail={},
        )

    def resolve(self, token: str) -> tuple[AccountRecord, UserRole]:
        session = self.store.get_session_by_token_hash(hash_token(token))
        if session is None or session.revoked_at is not None:
            raise AuthError("会话无效")
        if session.expires_at <= _utcnow():
            raise AuthError("会话已过期")
        account = self.store.get_account(session.user_id)
        if account is None or account.status != "active":
            raise AuthError("账号不可用")
        return account, session.role_used

    def create_user(
        self,
        *,
        email: str,
        password: str,
        display_name: str,
        roles: list[UserRole],
        org_name: str = "",
        class_name: str | None = None,
        actor_id: str | None = None,
    ) -> AuthUserView:
        if self.store.get_account_by_email(email):
            raise AuthError("邮箱已存在")
        if not roles:
            raise AuthError("至少绑定一个角色")
        account = AccountRecord(
            id=str(uuid4()),
            email=email.strip().lower(),
            display_name=display_name.strip(),
            password_hash=hash_password(password),
            roles=roles,
            status="active",
            org_name=org_name,
            class_name=class_name,
            created_at=_utcnow(),
        )
        self.store.upsert_account(account)
        if UserRole.STUDENT in roles:
            self.store.ensure_profile(account.id)
        self.store.add_audit(
            actor_user_id=actor_id,
            action="user_create",
            resource_type="user",
            resource_id=account.id,
            purpose="account_lifecycle",
            detail={"roles": [r.value for r in roles]},
        )
        return to_view(account)

    def set_status(self, user_id: str, status: str, *, actor_id: str | None = None) -> AuthUserView:
        account = self.store.get_account(user_id)
        if account is None:
            raise AuthError("用户不存在")
        if status not in {"active", "disabled"}:
            raise AuthError("非法状态")
        account.status = status
        self.store.upsert_account(account)
        self.store.add_audit(
            actor_user_id=actor_id,
            action="user_disable" if status == "disabled" else "user_enable",
            resource_type="user",
            resource_id=user_id,
            purpose="account_lifecycle",
            detail={"status": status},
        )
        return to_view(account)

    def list_users(self) -> list[AuthUserView]:
        return [to_view(a) for a in self.store.list_accounts()]
