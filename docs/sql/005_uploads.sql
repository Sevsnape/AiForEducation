-- AIFOREC 005: uploaded_files — 对话/出题台上传材料元数据
-- 对象本体存对象存储；库中仅元数据与可见性。counsel 线程附件不对老师开放。

CREATE TABLE IF NOT EXISTS uploaded_files (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id   UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    thread_id       UUID REFERENCES threads (id) ON DELETE SET NULL,
    message_id      UUID REFERENCES messages (id) ON DELETE SET NULL,
    purpose         TEXT NOT NULL DEFAULT 'chat'
                    CHECK (purpose IN ('chat', 'question_gen', 'practice', 'other')),
    file_name       TEXT NOT NULL,
    mime_type       TEXT NOT NULL DEFAULT 'application/octet-stream',
    byte_size       BIGINT NOT NULL CHECK (byte_size >= 0),
    storage_key     TEXT NOT NULL,
    sha256          TEXT,
    extract_status  TEXT NOT NULL DEFAULT 'pending'
                    CHECK (extract_status IN (
                        'pending', 'ready', 'failed', 'skipped'
                    )),
    extract_text_ref TEXT,
    visibility      TEXT NOT NULL DEFAULT 'owner'
                    CHECK (visibility IN ('owner', 'learning_shareable')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE uploaded_files IS
    '用户上传文件元数据：对话附件、出题台材料；正文在对象存储；extract 文本可引用';
COMMENT ON COLUMN uploaded_files.purpose IS 'chat=对话附件；question_gen=出题材料；practice=练习材料';
COMMENT ON COLUMN uploaded_files.storage_key IS '对象存储键，不落本地路径';
COMMENT ON COLUMN uploaded_files.extract_status IS '文本/OCR 抽取状态';
COMMENT ON COLUMN uploaded_files.extract_text_ref IS '抽取文本存储引用（可另表/对象），勿把全文塞进热路径 State';
COMMENT ON COLUMN uploaded_files.visibility IS
    'owner=仅上传者（counsel 线程强制）；learning_shareable=可随学习产物给授权老师审题场景';

CREATE INDEX IF NOT EXISTS idx_uploaded_files_owner
    ON uploaded_files (owner_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_uploaded_files_thread
    ON uploaded_files (thread_id, created_at DESC);

-- 可选：题包与来源文件关联
CREATE TABLE IF NOT EXISTS artifact_source_files (
    artifact_id     UUID NOT NULL REFERENCES artifacts (id) ON DELETE CASCADE,
    file_id         UUID NOT NULL REFERENCES uploaded_files (id) ON DELETE CASCADE,
    PRIMARY KEY (artifact_id, file_id)
);

COMMENT ON TABLE artifact_source_files IS '题包/练习包与其参考上传文件的多对多关联';
