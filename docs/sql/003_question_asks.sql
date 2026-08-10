-- AIFOREC 003: question_asks — 学习侧提问模块记录（学情分析）
-- 已有库执行本文件；新库可直接执行后与 ORM QuestionAsk 对齐。

CREATE TABLE IF NOT EXISTS question_asks (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id          UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    thread_id           UUID REFERENCES threads (id) ON DELETE SET NULL,
    message_id          UUID REFERENCES messages (id) ON DELETE SET NULL,
    subject             TEXT NOT NULL DEFAULT '数学',
    module_tag          TEXT NOT NULL,
    intent              TEXT
                        CHECK (intent IS NULL OR intent IN (
                            'general', 'practice', 'question_gen', 'diagnose'
                        )),
    question_preview    TEXT NOT NULL DEFAULT '',
    org_id              UUID REFERENCES organizations (id) ON DELETE SET NULL,
    class_id            UUID REFERENCES class_groups (id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE question_asks IS
    '学生学业提问→知识点/模块打标事件；用于模块热点与个人提问分布；禁止写入 counsel/safety 内容';
COMMENT ON COLUMN question_asks.id IS '主键';
COMMENT ON COLUMN question_asks.student_id IS '提问学生';
COMMENT ON COLUMN question_asks.thread_id IS '来源会话，可空';
COMMENT ON COLUMN question_asks.message_id IS '对应用户消息，可空';
COMMENT ON COLUMN question_asks.subject IS '学科';
COMMENT ON COLUMN question_asks.module_tag IS '知识点/模块标签（如二次函数）';
COMMENT ON COLUMN question_asks.intent IS '学习意图：practice/question_gen/diagnose/general';
COMMENT ON COLUMN question_asks.question_preview IS
    '脱敏短摘要（截断），非心理原文；生产可改为哈希或进一步脱敏';
COMMENT ON COLUMN question_asks.org_id IS '组织作用域，便于校级聚合';
COMMENT ON COLUMN question_asks.class_id IS '班级作用域，便于班内热点';
COMMENT ON COLUMN question_asks.created_at IS '提问时间';

CREATE INDEX IF NOT EXISTS idx_question_asks_module
    ON question_asks (module_tag, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_question_asks_student
    ON question_asks (student_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_question_asks_class_module
    ON question_asks (class_id, module_tag);

COMMENT ON INDEX idx_question_asks_module IS '整体模块热点排序';
COMMENT ON INDEX idx_question_asks_student IS '单学生提问分布';
COMMENT ON INDEX idx_question_asks_class_module IS '班级维度模块聚合';
