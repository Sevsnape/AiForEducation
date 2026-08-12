import { useRef } from 'react'
import type { ChatAttachment } from '../types'

const ACCEPT =
  '.pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.webp,.csv'

const MAX_BYTES = 10 * 1024 * 1024
const MAX_COUNT = 5

type Props = {
  files: ChatAttachment[]
  onChange: (files: ChatAttachment[]) => void
  /** Compact bar for chat composer */
  compact?: boolean
  hint?: string
  disabled?: boolean
  showButton?: boolean
  showList?: boolean
}

export function FileAttachControl({
  files,
  onChange,
  compact,
  hint,
  disabled,
  showButton = true,
  showList = true,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  function addFiles(list: FileList | null) {
    if (!list?.length || disabled) return
    const next = [...files]
    for (const file of Array.from(list)) {
      if (next.length >= MAX_COUNT) break
      if (file.size > MAX_BYTES) {
        alert(`「${file.name}」超过 10MB，已跳过`)
        continue
      }
      if (next.some((f) => f.name === file.name && f.size === file.size)) continue
      next.push({
        id: `f-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        size: file.size,
        mime: file.type || guessMime(file.name),
        kind: kindOf(file.name),
      })
    }
    onChange(next)
    if (inputRef.current) inputRef.current.value = ''
  }

  function remove(id: string) {
    onChange(files.filter((f) => f.id !== id))
  }

  return (
    <div className={`file-attach ${compact ? 'file-attach--compact' : ''}`}>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT}
        hidden
        disabled={disabled}
        onChange={(e) => addFiles(e.target.files)}
      />
      {showButton ? (
        <div className="file-attach__actions">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={disabled || files.length >= MAX_COUNT}
            onClick={() => inputRef.current?.click()}
          >
            添加文件
          </button>
          {hint ? <span className="file-attach__hint">{hint}</span> : null}
        </div>
      ) : null}
      {showList && files.length > 0 ? (
        <ul className="file-attach__list">
          {files.map((f) => (
            <li key={f.id} className="file-chip">
              <span className="file-chip__kind">{kindLabel(f.kind)}</span>
              <span className="file-chip__name" title={f.name}>
                {f.name}
              </span>
              <span className="file-chip__size">{formatSize(f.size)}</span>
              <button
                type="button"
                className="file-chip__rm"
                aria-label={`移除 ${f.name}`}
                disabled={disabled}
                onClick={() => remove(f.id)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <style>{`
        .file-attach { display: grid; gap: 0.4rem; }
        .file-attach__actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.45rem;
        }
        .file-attach__hint {
          font-size: 0.72rem;
          color: var(--ink-faint);
        }
        .file-attach__list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
        }
        .file-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          max-width: 100%;
          padding: 0.28rem 0.45rem;
          border: 1px solid var(--line);
          background: #f4f7f5;
          font-size: 0.76rem;
        }
        .file-chip__kind {
          font-size: 0.62rem;
          font-weight: 650;
          color: var(--accent);
          background: var(--accent-soft);
          padding: 0.05rem 0.28rem;
          flex-shrink: 0;
        }
        .file-chip__name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 10rem;
        }
        .file-chip__size { color: var(--ink-faint); flex-shrink: 0; }
        .file-chip__rm {
          border: 0;
          background: transparent;
          cursor: pointer;
          color: var(--ink-muted);
          font-size: 0.95rem;
          line-height: 1;
          padding: 0 0.1rem;
        }
        .file-chip__rm:hover { color: var(--danger); }
        .file-attach--compact .file-attach__hint { display: none; }
      `}</style>
    </div>
  )
}

function kindOf(name: string): ChatAttachment['kind'] {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) return 'image'
  if (['pdf'].includes(ext)) return 'pdf'
  if (['doc', 'docx'].includes(ext)) return 'doc'
  if (['txt', 'md', 'csv'].includes(ext)) return 'text'
  return 'other'
}

function kindLabel(kind: ChatAttachment['kind']) {
  const map = { image: '图', pdf: 'PDF', doc: '文档', text: '文本', other: '文件' }
  return map[kind]
}

function guessMime(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    txt: 'text/plain',
    md: 'text/markdown',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    csv: 'text/csv',
  }
  return map[ext] || 'application/octet-stream'
}

function formatSize(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}
