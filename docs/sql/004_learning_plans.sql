-- AIFOREC 004: learning_plans — 学生与 AI 共创学习计划（仅学习侧）

CREATE TABLE IF NOT EXISTS learning_plans (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    thread_id       UUID REFERENCES threads (id) ON DELETE SET NULL,
    title           TEXT NOT NULL DEFAULT '',
    horizon_days    INT NOT NULL DEFAULT 14 CHECK (horizon_days BETWEEN 1 AND 180),
    status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'active', 'completed', 'archived')),
    content_json    JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE learning_plans IS
    '学生与 AI 对话共创的学习计划；仅含学业目标/步骤/模块，不含 support 内容';
COMMENT ON COLUMN learning_plans.id IS '计划主键';
COMMENT ON COLUMN learning_plans.student_id IS '学生用户';
COMMENT ON COLUMN learning_plans.thread_id IS '共创来源会话，可空';
COMMENT ON COLUMN learning_plans.title IS '计划标题';
COMMENT ON COLUMN learning_plans.horizon_days IS '计划跨度（天）';
COMMENT ON COLUMN learning_plans.status IS 'draft/active/completed/archived';
COMMENT ON COLUMN learning_plans.content_json IS
    '结构化内容：goals[]、steps[]、focus_modules[]、notes 等';
COMMENT ON COLUMN learning_plans.created_at IS '创建时间';
COMMENT ON COLUMN learning_plans.updated_at IS '最近更新（对话修订后刷新）';

CREATE INDEX IF NOT EXISTS idx_learning_plans_student
    ON learning_plans (student_id, updated_at DESC);

COMMENT ON INDEX idx_learning_plans_student IS '按学生拉取当前/历史计划';

-- MVP 约定：同意策略由管理员配置；学生端不开放自助改 consent。
-- 可选：记录谁改了同意（审计仍走 audit_logs）。
COMMENT ON TABLE consents IS
    '用户同意开关；可按组织作用域配置。MVP 由管理员维护，学生端暂不开放自助修改';
