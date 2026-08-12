import { useMemo, useState, type FormEvent } from 'react'
import { useApp } from '../../context/AppContext'
import { formatBytes } from '../../lib/sharedMaterials'
import type {
  ChatAttachment,
  SharedMaterial,
  SharedMaterialAudience,
  SharedMaterialStatus,
} from '../../types'

const audienceOptions: { id: SharedMaterialAudience; label: string }[] = [
  { id: 'all', label: '师生可见' },
  { id: 'teachers', label: '仅教师' },
  { id: 'students', label: '仅学生' },
]

const statusZh: Record<SharedMaterialStatus, string> = {
  published: '已发布',
  draft: '草稿',
  archived: '已归档',
}

const emptyForm = {
  title: '',
  description: '',
  subject: '数学',
  tags: '',
  fileName: '',
  audience: 'all' as SharedMaterialAudience,
  status: 'draft' as SharedMaterialStatus,
}

function guessKind(name: string): ChatAttachment['kind'] {
  if (/\.(png|jpe?g|webp)$/i.test(name)) return 'image'
  if (/\.pdf$/i.test(name)) return 'pdf'
  if (/\.(docx?)$/i.test(name)) return 'doc'
  if (/\.(txt|md|csv)$/i.test(name)) return 'text'
  return 'other'
}

export function MaterialsPage() {
  const {
    sharedMaterials,
    upsertSharedMaterial,
    setSharedMaterialStatus,
    removeSharedMaterial,
    currentUser,
  } = useApp()
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | SharedMaterialStatus>('all')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)

  const list = useMemo(() => {
    const key = q.trim().toLowerCase()
    return sharedMaterials.filter((m) => {
      if (statusFilter !== 'all' && m.status !== statusFilter) return false
      if (!key) return true
      return (
        m.title.toLowerCase().includes(key) ||
        m.subject.toLowerCase().includes(key) ||
        m.fileName.toLowerCase().includes(key) ||
        m.tags.some((t) => t.toLowerCase().includes(key))
      )
    })
  }, [sharedMaterials, q, statusFilter])

  function startEdit(m: SharedMaterial) {
    setEditingId(m.id)
    setForm({
      title: m.title,
      description: m.description,
      subject: m.subject,
      tags: m.tags.join('、'),
      fileName: m.fileName,
      audience: m.audience,
      status: m.status,
    })
  }

  function resetForm() {
    setEditingId(null)
    setForm(emptyForm)
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const title = form.title.trim()
    const fileName = form.fileName.trim() || `${title || '资料'}.pdf`
    if (!title) {
      alert('请填写标题')
      return
    }
    const tags = form.tags
      .split(/[,，、\s]+/)
      .map((t) => t.trim())
      .filter(Boolean)
    const kind = guessKind(fileName)
    upsertSharedMaterial({
      id: editingId || undefined,
      title,
      description: form.description.trim(),
      subject: form.subject.trim() || '综合',
      tags,
      fileName,
      mime:
        kind === 'pdf'
          ? 'application/pdf'
          : kind === 'doc'
            ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            : kind === 'text'
              ? 'text/plain'
              : kind === 'image'
                ? 'image/jpeg'
                : 'application/octet-stream',
      byteSize: editingId
        ? sharedMaterials.find((m) => m.id === editingId)?.byteSize || 100_000
        : 100_000 + Math.floor(Math.random() * 500_000),
      kind,
      audience: form.audience,
      status: form.status,
      uploadedByName: currentUser?.displayName || '校管理员',
    })
    resetForm()
  }

  return (
    <section className="materials">
      <header>
        <h1 className="page-title">资料管理</h1>
        <p className="page-desc">
          上传并发布校本共用材料。教师可引用出题，学生可引用让 AI 即时出题与做题（按可见范围）。
        </p>
      </header>

      <form className="surface materials-form" onSubmit={onSubmit}>
        <div className="materials-form__head">
          <strong>{editingId ? '编辑资料' : '新增资料'}</strong>
          {editingId ? (
            <button type="button" className="btn btn-sm" onClick={resetForm}>
              取消编辑
            </button>
          ) : null}
        </div>
        <div className="materials-grid">
          <label>
            标题
            <input
              className="field"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="如：二次函数单元讲义"
            />
          </label>
          <label>
            学科
            <input
              className="field"
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
            />
          </label>
          <label>
            可见范围
            <select
              className="field"
              value={form.audience}
              onChange={(e) =>
                setForm((f) => ({ ...f, audience: e.target.value as SharedMaterialAudience }))
              }
            >
              {audienceOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            状态
            <select
              className="field"
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value as SharedMaterialStatus }))
              }
            >
              <option value="draft">草稿</option>
              <option value="published">发布</option>
              <option value="archived">归档</option>
            </select>
          </label>
          <label className="span-2">
            文件名（Mock：不实际上传）
            <input
              className="field"
              value={form.fileName}
              onChange={(e) => setForm((f) => ({ ...f, fileName: e.target.value }))}
              placeholder="讲义.pdf"
            />
          </label>
          <label className="span-2">
            标签（顿号/逗号分隔）
            <input
              className="field"
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              placeholder="二次函数、课标"
            />
          </label>
          <label className="span-2">
            说明
            <textarea
              className="field"
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </label>
        </div>
        <button className="btn btn-accent" type="submit">
          {editingId ? '保存修改' : '创建资料'}
        </button>
      </form>

      <div className="materials-toolbar">
        <input
          className="field"
          placeholder="搜索资料…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="chip-row" role="group" aria-label="状态筛选">
          {(
            [
              ['all', '全部'],
              ['published', '已发布'],
              ['draft', '草稿'],
              ['archived', '已归档'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`chip ${statusFilter === id ? 'active' : ''}`}
              onClick={() => setStatusFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="materials-table surface">
        <table>
          <thead>
            <tr>
              <th>标题</th>
              <th>范围</th>
              <th>状态</th>
              <th>文件</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map((m) => (
              <tr key={m.id}>
                <td>
                  <strong>{m.title}</strong>
                  <div className="muted meta">
                    {m.subject}
                    {m.tags.length ? ` · ${m.tags.join('、')}` : ''}
                  </div>
                </td>
                <td>{audienceOptions.find((a) => a.id === m.audience)?.label}</td>
                <td>
                  <span className={`st st--${m.status}`}>{statusZh[m.status]}</span>
                </td>
                <td>
                  <div>{m.fileName}</div>
                  <div className="muted meta">{formatBytes(m.byteSize)}</div>
                </td>
                <td className="actions">
                  <button type="button" className="btn btn-sm" onClick={() => startEdit(m)}>
                    编辑
                  </button>
                  {m.status !== 'published' ? (
                    <button
                      type="button"
                      className="btn btn-sm btn-accent"
                      onClick={() => setSharedMaterialStatus(m.id, 'published')}
                    >
                      发布
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => setSharedMaterialStatus(m.id, 'archived')}
                    >
                      归档
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => {
                      if (confirm(`删除「${m.title}」？`)) removeSharedMaterial(m.id)
                    }}
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
            {list.length === 0 ? (
              <tr>
                <td colSpan={5} className="muted empty">
                  无匹配资料
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <style>{`
        .materials { display: grid; gap: 0.85rem; }
        .materials-form {
          display: grid;
          gap: 0.65rem;
          padding: 0.75rem 0.85rem;
        }
        .materials-form__head {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .materials-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.55rem;
        }
        .materials-grid label {
          display: grid;
          gap: 0.25rem;
          font-size: 0.78rem;
          color: var(--ink-muted);
        }
        .materials-grid .span-2 { grid-column: span 2; }
        .materials-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 0.55rem;
          align-items: center;
        }
        .materials-toolbar .field { max-width: 16rem; }
        .materials-table { padding: 0; overflow: auto; }
        .materials-table table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.84rem;
        }
        .materials-table th,
        .materials-table td {
          text-align: left;
          padding: 0.65rem 0.75rem;
          border-bottom: 1px solid var(--line);
          vertical-align: top;
        }
        .materials-table th {
          font-size: 0.72rem;
          color: var(--ink-muted);
          font-weight: 650;
          background: #f7f9f8;
        }
        .meta { font-size: 0.72rem; margin-top: 0.15rem; }
        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.3rem;
        }
        .st {
          font-size: 0.72rem;
          font-weight: 650;
          padding: 0.12rem 0.4rem;
        }
        .st--published { background: var(--accent-soft); color: var(--accent); }
        .st--draft { background: #f0f0f0; color: var(--ink-muted); }
        .st--archived { background: #eee; color: var(--ink-faint); }
        .empty { text-align: center; padding: 1.2rem !important; }
        @media (max-width: 900px) {
          .materials-grid { grid-template-columns: 1fr 1fr; }
          .materials-grid .span-2 { grid-column: 1 / -1; }
        }
        @media (max-width: 640px) {
          .materials-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  )
}
