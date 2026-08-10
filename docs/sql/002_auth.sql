-- AIFOREC auth upgrade (for databases already created from early 001)
-- New installs should prefer docs/sql/001_init.sql which already includes these fields.

BEGIN;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS password_hash TEXT,
    ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Make email unique when present (ignore if constraint already exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_email_key'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
    END IF;
END $$;

COMMENT ON COLUMN users.email IS '登录邮箱，唯一；本地账密登录主标识';
COMMENT ON COLUMN users.password_hash IS '密码哈希（PBKDF2 等）；SSO-only 账号可空';
COMMENT ON COLUMN users.last_login_at IS '最近成功登录时间';

CREATE TABLE IF NOT EXISTS auth_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash      TEXT NOT NULL UNIQUE,
    role_used       TEXT NOT NULL
                    CHECK (role_used IN ('student', 'teacher', 'admin')),
    user_agent      TEXT,
    ip_address      TEXT,
    expires_at      TIMESTAMPTZ NOT NULL,
    revoked_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE auth_sessions IS '登录会话：存 token 哈希而非明文；登出或过期后不可再用';

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user
    ON auth_sessions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_active
    ON auth_sessions (token_hash)
    WHERE revoked_at IS NULL;

COMMIT;
