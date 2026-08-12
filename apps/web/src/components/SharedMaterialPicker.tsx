import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import {
  formatBytes,
  materialToAttachment,
  visibleSharedMaterials,
} from '../lib/sharedMaterials'
import type { ChatAttachment, Role } from '../types'

const audienceZh = {
  all: '师生可见',
  teachers: '仅教师',
  students: '仅学生',
} as const

type Props = {
  /** Selected library attachment ids already in composer/studio files */
  files: ChatAttachment[]
  onChange: (files: ChatAttachment[]) => void
  /** Override role filter; defaults to current session role */
  forRole?: Role
  compact?: boolean
  disabled?: boolean
  max?: number
}

export function SharedMaterialPicker({
  files,
  onChange,
  forRole,
  compact,
  disabled,
  max = 5,
}: Props) {
  const { sharedMaterials, role } = useApp()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const viewRole = forRole ?? role
  const list = useMemo(
    () => visibleSharedMaterials(sharedMaterials, viewRole),
    [sharedMaterials, viewRole],
  )
  const filtered = useMemo(() => {
    const key = q.trim().toLowerCase()
    if (!key) return list
    return list.filter(
      (m) =>
        m.title.toLowerCase().includes(key) ||
        m.subject.toLowerCase().includes(key) ||
        m.tags.some((t) => t.toLowerCase().includes(key)) ||
        m.fileName.toLowerCase().includes(key),
    )
  }, [list, q])

  const selectedLibIds = useMemo(() => {
    const set = new Set<string>()
    for (const f of files) {
      if (f.id.startsWith('lib-')) set.add(f.id.slice(4))
    }
    return set
  }, [files])

  function toggle(id: string) {
    if (disabled) return
    const material = list.find((m) => m.id === id)
    if (!material) return
    if (selectedLibIds.has(id)) {
      onChange(files.filter((f) => f.id !== `lib-${id}`))
      return
    }
    if (files.length >= max) {
      alert(`最多引用 ${max} 个文件`)
      return
    }
    onChange([...files, materialToAttachment(material)])
  }

  if (!list.length) {
    return compact ? null : (
      <p className="muted lib-empty">暂无对你可见的校本资料（由管理员发布）。</p>
    )
  }

  return (
    <div className={`lib-picker ${compact ? 'lib-picker--compact' : ''}`}>
      <div className="lib-picker__bar">
        <button
          type="button"
          className="btn btn-sm"
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? '收起校本资料' : '引用校本资料'}
          {selectedLibIds.size ? ` · ${selectedLibIds.size}` : ''}
        </button>
        {!compact ? (
          <span className="muted lib-picker__hint">管理员发布的共用材料，可引用出题 / 练习</span>
        ) : null}
      </div>

      {open ? (
        <div className="lib-picker__panel surface">
          <input
            className="field"
            placeholder="搜索标题 / 学科 / 标签"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            disabled={disabled}
          />
          <ul className="lib-picker__list">
            {filtered.map((m) => {
              const on = selectedLibIds.has(m.id)
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    className={`lib-row ${on ? 'is-on' : ''}`}
                    disabled={disabled}
                    onClick={() => toggle(m.id)}
                  >
                    <span className="lib-row__check" aria-hidden>
                      {on ? '✓' : ''}
                    </span>
                    <span className="lib-row__body">
                      <strong>{m.title}</strong>
                      <small>
                        {m.subject} · {audienceZh[m.audience]} · {formatBytes(m.byteSize)} ·{' '}
                        {m.fileName}
                      </small>
                      {m.description ? <em>{m.description}</em> : null}
                    </span>
                  </button>
                </li>
              )
            })}
            {filtered.length === 0 ? (
              <li className="muted lib-picker__none">无匹配资料</li>
            ) : null}
          </ul>
        </div>
      ) : null}

      <style>{`
        .lib-picker { display: grid; gap: 0.4rem; }
        .lib-picker__bar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.5rem;
        }
        .lib-picker__hint { font-size: 0.72rem; }
        .lib-empty { margin: 0; font-size: 0.78rem; }
        .lib-picker__panel {
          padding: 0.55rem;
          display: grid;
          gap: 0.45rem;
        }
        .lib-picker__list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 0.25rem;
          max-height: 12rem;
          overflow: auto;
        }
        .lib-picker__none {
          padding: 0.5rem;
          font-size: 0.78rem;
        }
        .lib-row {
          width: 100%;
          display: flex;
          gap: 0.45rem;
          align-items: flex-start;
          text-align: left;
          border: 1px solid transparent;
          background: #f7f9f8;
          padding: 0.45rem 0.5rem;
          cursor: pointer;
          color: var(--ink);
        }
        .lib-row:hover { border-color: var(--line); }
        .lib-row.is-on {
          background: var(--accent-soft);
          border-color: color-mix(in srgb, var(--accent) 30%, var(--line));
        }
        .lib-row__check {
          width: 1.1rem;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--accent);
          line-height: 1.4;
        }
        .lib-row__body {
          display: grid;
          gap: 0.12rem;
          min-width: 0;
        }
        .lib-row__body strong {
          font-size: 0.82rem;
          font-weight: 650;
        }
        .lib-row__body small {
          font-size: 0.7rem;
          color: var(--ink-faint);
        }
        .lib-row__body em {
          font-style: normal;
          font-size: 0.72rem;
          color: var(--ink-muted);
          line-height: 1.35;
        }
      `}</style>
    </div>
  )
}
