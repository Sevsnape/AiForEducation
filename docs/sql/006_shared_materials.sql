-- AIFOREC 006: shared_materials — 管理员校本共用资料库
-- 与 uploaded_files 区分：校本库由管理员维护，按 audience 对教师/学生可见并引用。

CREATE TABLE IF NOT EXISTS shared_materials (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT NOT NULL DEFAULT '',
    subject         TEXT NOT NULL DEFAULT '',
    tags            TEXT[] NOT NULL DEFAULT '{}',
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
    audience        TEXT NOT NULL DEFAULT 'all'
                    CHECK (audience IN ('all', 'teachers', 'students')),
    status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'published', 'archived')),
    uploaded_by     UUID REFERENCES users (id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE shared_materials IS
    '校本共用资料：管理员发布；教师引用出题；学生引用即时出题/练习';
COMMENT ON COLUMN shared_materials.audience IS
    'all=师生；teachers=仅教师；students=仅学生（均需 status=published）';
COMMENT ON COLUMN shared_materials.storage_key IS '对象存储键；正文不进图 State';

CREATE INDEX IF NOT EXISTS idx_shared_materials_org_status
    ON shared_materials (org_id, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_shared_materials_org_audience
    ON shared_materials (org_id, audience)
    WHERE status = 'published';

-- 可选：引用痕迹（出题/对话使用了哪份校本资料）
CREATE TABLE IF NOT EXISTS shared_material_refs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id     UUID NOT NULL REFERENCES shared_materials (id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    purpose         TEXT NOT NULL DEFAULT 'chat'
                    CHECK (purpose IN ('chat', 'question_gen', 'practice', 'other')),
    artifact_id     UUID REFERENCES artifacts (id) ON DELETE SET NULL,
    thread_id       UUID REFERENCES threads (id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE shared_material_refs IS '校本资料被引用记录，便于审计与热度统计';

CREATE INDEX IF NOT EXISTS idx_shared_material_refs_material
    ON shared_material_refs (material_id, created_at DESC);
