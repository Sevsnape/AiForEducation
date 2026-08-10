-- AIFOREC initial schema (PostgreSQL dialect)
-- Source of truth for table definitions; keep in sync with docs/数据库表结构.md
-- Field-level explanations: docs/数据库表结构解析.md
-- Compatible notes: use UUID/TEXT as needed; SQLite can adapt types for local smoke.

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Identity & tenancy
-- ---------------------------------------------------------------------------

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id     TEXT UNIQUE,
    display_name    TEXT NOT NULL DEFAULT '',
    email           TEXT,
    status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'disabled', 'deleted')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE users IS '系统用户主体：学生/老师/管理员共用一张用户表，具体身份看 role_bindings / memberships';
COMMENT ON COLUMN users.id IS '用户主键 UUID';
COMMENT ON COLUMN users.external_id IS '外部登录体系 ID（如学校 SSO、OAuth sub），可空';
COMMENT ON COLUMN users.display_name IS '展示名';
COMMENT ON COLUMN users.email IS '邮箱，可空';
COMMENT ON COLUMN users.status IS '账号状态：active=正常，disabled=停用，deleted=逻辑删除';
COMMENT ON COLUMN users.created_at IS '创建时间';
COMMENT ON COLUMN users.updated_at IS '最近更新时间';

CREATE TABLE organizations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'disabled')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE organizations IS '学校或机构租户；个人版用户可以没有组织';
COMMENT ON COLUMN organizations.id IS '组织主键';
COMMENT ON COLUMN organizations.name IS '组织名称';
COMMENT ON COLUMN organizations.status IS 'active=启用，disabled=停用';
COMMENT ON COLUMN organizations.created_at IS '创建时间';
COMMENT ON COLUMN organizations.updated_at IS '最近更新时间';

CREATE TABLE class_groups (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID REFERENCES organizations (id) ON DELETE SET NULL,
    name            TEXT NOT NULL,
    grade           TEXT,
    subject         TEXT,
    status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'archived')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE class_groups IS '班级/教学班；老师查看学情时的关系边界之一';
COMMENT ON COLUMN class_groups.id IS '班级主键';
COMMENT ON COLUMN class_groups.org_id IS '所属组织；组织删除时置空而非级联删班';
COMMENT ON COLUMN class_groups.name IS '班级名称';
COMMENT ON COLUMN class_groups.grade IS '年级，如初二';
COMMENT ON COLUMN class_groups.subject IS '主学科（可选），如数学';
COMMENT ON COLUMN class_groups.status IS 'active=在用，archived=已归档';
COMMENT ON COLUMN class_groups.created_at IS '创建时间';
COMMENT ON COLUMN class_groups.updated_at IS '最近更新时间';

CREATE TABLE role_bindings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    role            TEXT NOT NULL
                    CHECK (role IN ('student', 'teacher', 'admin')),
    org_id          UUID REFERENCES organizations (id) ON DELETE CASCADE,
    class_id        UUID REFERENCES class_groups (id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, role, org_id, class_id)
);

COMMENT ON TABLE role_bindings IS '用户角色绑定：同一人可在不同组织/班级拥有不同角色';
COMMENT ON COLUMN role_bindings.id IS '绑定主键';
COMMENT ON COLUMN role_bindings.user_id IS '用户 ID';
COMMENT ON COLUMN role_bindings.role IS '角色：student / teacher / admin';
COMMENT ON COLUMN role_bindings.org_id IS '角色作用的组织范围；空表示全局或个人场景';
COMMENT ON COLUMN role_bindings.class_id IS '角色作用的班级范围；可空';
COMMENT ON COLUMN role_bindings.created_at IS '创建时间';

CREATE TABLE memberships (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id        UUID NOT NULL REFERENCES class_groups (id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    member_role     TEXT NOT NULL
                    CHECK (member_role IN ('student', 'teacher')),
    status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'left')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (class_id, user_id, member_role)
);

COMMENT ON TABLE memberships IS '班级成员关系：判定老师能否看某学生学情的关系条件';
COMMENT ON COLUMN memberships.id IS '成员关系主键';
COMMENT ON COLUMN memberships.class_id IS '班级 ID';
COMMENT ON COLUMN memberships.user_id IS '成员用户 ID';
COMMENT ON COLUMN memberships.member_role IS '在班角色：student 或 teacher';
COMMENT ON COLUMN memberships.status IS 'active=在班，left=已离班（离班后老师失去学情读取关系）';
COMMENT ON COLUMN memberships.created_at IS '加入时间';

CREATE TABLE consents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    org_id          UUID REFERENCES organizations (id) ON DELETE CASCADE,
    learning_personalize          BOOLEAN NOT NULL DEFAULT TRUE,
    history_retain                BOOLEAN NOT NULL DEFAULT TRUE,
    share_learning_with_teacher   BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, org_id)
);

COMMENT ON TABLE consents IS '用户同意开关；可按组织作用域配置，无组织时 org_id 为空表示个人默认';
COMMENT ON COLUMN consents.id IS '同意记录主键';
COMMENT ON COLUMN consents.user_id IS '用户 ID';
COMMENT ON COLUMN consents.org_id IS '同意作用的组织；空=个人默认策略';
COMMENT ON COLUMN consents.learning_personalize IS '是否允许用学情画像做个性化练习/出题';
COMMENT ON COLUMN consents.history_retain IS '是否留存会话历史；关闭则弱化跨会话记忆';
COMMENT ON COLUMN consents.share_learning_with_teacher IS '是否将学习侧学情共享给授权老师；不影响 support 域（老师永不可见）';
COMMENT ON COLUMN consents.updated_at IS '最近变更时间';

-- ---------------------------------------------------------------------------
-- Conversation history
-- ---------------------------------------------------------------------------

CREATE TABLE threads (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id   UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    title           TEXT NOT NULL DEFAULT '',
    primary_intent  TEXT
                    CHECK (primary_intent IS NULL OR primary_intent IN (
                        'practice', 'question_help', 'counsel', 'mixed', 'general', 'safety'
                    )),
    client_mode     TEXT,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_active_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);

COMMENT ON TABLE threads IS '对话线程（一次连续会话）；历史页列表的数据源；仅 owner 可见';
COMMENT ON COLUMN threads.id IS '会话 ID；也常作为 LangGraph checkpointer 的 thread_id';
COMMENT ON COLUMN threads.owner_user_id IS '会话归属用户（学生本人）';
COMMENT ON COLUMN threads.title IS '会话标题（可自动生成，用户可改）';
COMMENT ON COLUMN threads.primary_intent IS '主意图标签：practice/question_help/counsel/mixed/general/safety';
COMMENT ON COLUMN threads.client_mode IS '前端显式模式（如 counsel/practice），可空表示 auto';
COMMENT ON COLUMN threads.started_at IS '会话开始时间';
COMMENT ON COLUMN threads.last_active_at IS '最近活跃时间，用于列表排序';
COMMENT ON COLUMN threads.deleted_at IS '软删除时间；非空表示学生已删除该会话';

CREATE INDEX idx_threads_owner_active
    ON threads (owner_user_id, last_active_at DESC)
    WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_threads_owner_active IS '加速「某用户未删除会话按活跃时间倒序」查询';

CREATE TABLE messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id       UUID NOT NULL REFERENCES threads (id) ON DELETE CASCADE,
    turn_id         UUID,
    role            TEXT NOT NULL
                    CHECK (role IN ('user', 'assistant', 'system', 'tool')),
    content         TEXT NOT NULL,
    intent          TEXT,
    agent_name      TEXT,
    risk_level      TEXT
                    CHECK (risk_level IS NULL OR risk_level IN ('none', 'watch', 'high')),
    trace_id        TEXT,
    metadata_json   JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE messages IS '会话原文消息（含心理支持对话）；仅学生本人可读，老师 API 不得查询';
COMMENT ON COLUMN messages.id IS '消息主键';
COMMENT ON COLUMN messages.thread_id IS '所属会话';
COMMENT ON COLUMN messages.turn_id IS '同一回合的关联 ID（用户消息与助手回复可同 turn）';
COMMENT ON COLUMN messages.role IS '消息角色：user/assistant/system/tool';
COMMENT ON COLUMN messages.content IS '消息正文';
COMMENT ON COLUMN messages.intent IS '该回合识别到的意图';
COMMENT ON COLUMN messages.agent_name IS '处理该回合的专家名，如 question_gen/practice/counsel';
COMMENT ON COLUMN messages.risk_level IS '风险等级：none/watch/high';
COMMENT ON COLUMN messages.trace_id IS '链路追踪 ID，便于日志与审计对齐';
COMMENT ON COLUMN messages.metadata_json IS '扩展元数据（ui_hints、payload 类型等），勿放大对象';
COMMENT ON COLUMN messages.created_at IS '写入时间';

CREATE INDEX idx_messages_thread_created
    ON messages (thread_id, created_at);

COMMENT ON INDEX idx_messages_thread_created IS '加速按会话拉取消息时间线';

CREATE TABLE session_summaries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id       UUID NOT NULL REFERENCES threads (id) ON DELETE CASCADE,
    summary_text    TEXT NOT NULL,
    learning_tags   JSONB NOT NULL DEFAULT '[]'::jsonb,
    support_tags    JSONB NOT NULL DEFAULT '[]'::jsonb,
    model_name      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (thread_id, created_at)
);

COMMENT ON TABLE session_summaries IS '单次会话摘要；由 summary_graph 异步生成，用于滚动更新画像';
COMMENT ON COLUMN session_summaries.id IS '摘要主键';
COMMENT ON COLUMN session_summaries.thread_id IS '对应会话';
COMMENT ON COLUMN session_summaries.summary_text IS '自然语言短摘要';
COMMENT ON COLUMN session_summaries.learning_tags IS '学习侧标签 JSON 数组';
COMMENT ON COLUMN session_summaries.support_tags IS '支持侧标签 JSON 数组；不对老师开放';
COMMENT ON COLUMN session_summaries.model_name IS '生成该摘要使用的模型名（可空=规则占位）';
COMMENT ON COLUMN session_summaries.created_at IS '生成时间';

CREATE INDEX idx_session_summaries_thread
    ON session_summaries (thread_id, created_at DESC);

COMMENT ON INDEX idx_session_summaries_thread IS '加速取某会话最新摘要';

-- ---------------------------------------------------------------------------
-- Student profile (long-term memory)
-- ---------------------------------------------------------------------------

CREATE TABLE student_profiles (
    student_id      UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    profile_version INT NOT NULL DEFAULT 1,
    learning_json   JSONB NOT NULL DEFAULT '{}'::jsonb,
    support_json    JSONB NOT NULL DEFAULT '{}'::jsonb,
    source          TEXT NOT NULL DEFAULT 'auto_summary'
                    CHECK (source IN ('auto_summary', 'student_correction', 'hybrid')),
    needs_resummary BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE student_profiles IS '学生长期画像（一人一行）；learning 可授权给老师，support 仅学生域';
COMMENT ON COLUMN student_profiles.student_id IS '学生用户 ID（即 users.id）';
COMMENT ON COLUMN student_profiles.profile_version IS '画像版本号，每次合并/纠正递增';
COMMENT ON COLUMN student_profiles.learning_json IS '学习侧画像 JSON（薄弱点、难度、目标等），结构见设计草案';
COMMENT ON COLUMN student_profiles.support_json IS '支持侧画像 JSON（情绪主题、风险、safe_summary 等）；老师查询路径禁止 SELECT';
COMMENT ON COLUMN student_profiles.source IS '最近更新来源：auto_summary/student_correction/hybrid';
COMMENT ON COLUMN student_profiles.needs_resummary IS '是否需要后台重摘要（如删除历史后）';
COMMENT ON COLUMN student_profiles.updated_at IS '最近更新时间';

CREATE TABLE profile_corrections (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    domain          TEXT NOT NULL CHECK (domain IN ('learning', 'support')),
    patch_json      JSONB NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE profile_corrections IS '学生对「AI 记得你」的纠正记录，便于审计与回放';
COMMENT ON COLUMN profile_corrections.id IS '纠正记录主键';
COMMENT ON COLUMN profile_corrections.student_id IS '学生 ID';
COMMENT ON COLUMN profile_corrections.domain IS '纠正域：learning 或 support';
COMMENT ON COLUMN profile_corrections.patch_json IS '结构化补丁 JSON';
COMMENT ON COLUMN profile_corrections.created_at IS '纠正时间';

CREATE INDEX idx_profile_corrections_student
    ON profile_corrections (student_id, created_at DESC);

COMMENT ON INDEX idx_profile_corrections_student IS '加速查询某学生纠正历史';

-- ---------------------------------------------------------------------------
-- Learning artifacts & events
-- ---------------------------------------------------------------------------

CREATE TABLE artifacts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id   UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    thread_id       UUID REFERENCES threads (id) ON DELETE SET NULL,
    artifact_type   TEXT NOT NULL
                    CHECK (artifact_type IN (
                        'question_set', 'practice_set', 'explanation', 'export'
                    )),
    title           TEXT NOT NULL DEFAULT '',
    content_json    JSONB NOT NULL,
    status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'reviewed', 'published', 'archived')),
    version         INT NOT NULL DEFAULT 1,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE artifacts IS '结构化产物：题包/练习包/解析/导出；与对话原文分离，便于老师审题';
COMMENT ON COLUMN artifacts.id IS '产物主键';
COMMENT ON COLUMN artifacts.owner_user_id IS '创建者（学生或老师）';
COMMENT ON COLUMN artifacts.thread_id IS '来源会话；会话删除时置空，产物可保留';
COMMENT ON COLUMN artifacts.artifact_type IS '类型：question_set/practice_set/explanation/export';
COMMENT ON COLUMN artifacts.title IS '标题';
COMMENT ON COLUMN artifacts.content_json IS '题目或练习等结构化正文 JSON';
COMMENT ON COLUMN artifacts.status IS 'draft/reviewed/published/archived';
COMMENT ON COLUMN artifacts.version IS '版本号，支持修订';
COMMENT ON COLUMN artifacts.created_at IS '创建时间';
COMMENT ON COLUMN artifacts.updated_at IS '最近更新时间';

CREATE INDEX idx_artifacts_owner
    ON artifacts (owner_user_id, created_at DESC);

COMMENT ON INDEX idx_artifacts_owner IS '加速按创建者列出产物';

CREATE TABLE learning_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    thread_id       UUID REFERENCES threads (id) ON DELETE SET NULL,
    artifact_id     UUID REFERENCES artifacts (id) ON DELETE SET NULL,
    event_type      TEXT NOT NULL
                    CHECK (event_type IN (
                        'answer', 'hint', 'complete_set', 'retest'
                    )),
    knowledge_tags  JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_correct      BOOLEAN,
    difficulty      INT CHECK (difficulty IS NULL OR difficulty BETWEEN 1 AND 5),
    payload_json    JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE learning_events IS '学习行为事件流：答题、提示、完成练习、再测；驱动学情统计';
COMMENT ON COLUMN learning_events.id IS '事件主键';
COMMENT ON COLUMN learning_events.student_id IS '学生 ID';
COMMENT ON COLUMN learning_events.thread_id IS '关联会话，可空';
COMMENT ON COLUMN learning_events.artifact_id IS '关联题包/练习包，可空';
COMMENT ON COLUMN learning_events.event_type IS 'answer/hint/complete_set/retest';
COMMENT ON COLUMN learning_events.knowledge_tags IS '涉及知识点标签数组';
COMMENT ON COLUMN learning_events.is_correct IS '答题是否正确；非答题事件可空';
COMMENT ON COLUMN learning_events.difficulty IS '题目难度 1-5';
COMMENT ON COLUMN learning_events.payload_json IS '事件详情（作答内容、耗时等）';
COMMENT ON COLUMN learning_events.created_at IS '事件时间';

CREATE INDEX idx_learning_events_student
    ON learning_events (student_id, created_at DESC);

COMMENT ON INDEX idx_learning_events_student IS '加速按学生拉取近期学习事件';

-- ---------------------------------------------------------------------------
-- Weekly growth summary (student-facing)
-- ---------------------------------------------------------------------------

CREATE TABLE weekly_summaries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    week_start      DATE NOT NULL,
    learning_text   TEXT NOT NULL DEFAULT '',
    support_text    TEXT NOT NULL DEFAULT '',
    next_steps_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (student_id, week_start)
);

COMMENT ON TABLE weekly_summaries IS '学生成长周报；learning 可部分共享，support_text 仅学生可见';
COMMENT ON COLUMN weekly_summaries.id IS '周报主键';
COMMENT ON COLUMN weekly_summaries.student_id IS '学生 ID';
COMMENT ON COLUMN weekly_summaries.week_start IS '周起始日（通常周一）';
COMMENT ON COLUMN weekly_summaries.learning_text IS '本周学习总结文案';
COMMENT ON COLUMN weekly_summaries.support_text IS '本周支持侧总结；老师不可见';
COMMENT ON COLUMN weekly_summaries.next_steps_json IS '下一步建议列表 JSON';
COMMENT ON COLUMN weekly_summaries.created_at IS '生成时间';

-- ---------------------------------------------------------------------------
-- Audit
-- ---------------------------------------------------------------------------

CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id   UUID REFERENCES users (id) ON DELETE SET NULL,
    action          TEXT NOT NULL,
    resource_type   TEXT NOT NULL,
    resource_id     TEXT,
    purpose         TEXT,
    detail_json     JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE audit_logs IS '权责审计日志：门禁拒绝、危机短路、导出、管理员访问等；宜只追加';
COMMENT ON COLUMN audit_logs.id IS '审计主键';
COMMENT ON COLUMN audit_logs.actor_user_id IS '操作者；用户删除后置空仍保留日志';
COMMENT ON COLUMN audit_logs.action IS '动作名，如 guard_deny / safety_reply / export';
COMMENT ON COLUMN audit_logs.resource_type IS '资源类型，如 thread / profile / counsel';
COMMENT ON COLUMN audit_logs.resource_id IS '资源 ID（文本，兼容 UUID 与外部键）';
COMMENT ON COLUMN audit_logs.purpose IS '访问或操作目的，如 teaching / safety / compliance';
COMMENT ON COLUMN audit_logs.detail_json IS '细节 JSON（注意脱敏，避免写入心理原文）';
COMMENT ON COLUMN audit_logs.created_at IS '记录时间';

CREATE INDEX idx_audit_logs_created
    ON audit_logs (created_at DESC);

COMMENT ON INDEX idx_audit_logs_created IS '按时间倒序浏览审计';

CREATE INDEX idx_audit_logs_actor
    ON audit_logs (actor_user_id, created_at DESC);

COMMENT ON INDEX idx_audit_logs_actor IS '按操作者查询审计';

COMMIT;
