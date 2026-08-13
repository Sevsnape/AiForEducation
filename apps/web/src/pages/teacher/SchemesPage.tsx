import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import type { SupportScheme, SupportSchemeBody } from '../../types'

const sourceZh = {
  class_gen: '学情生成',
  chat_save: '对话整理存入',
  manual_edit: '手动编辑',
} as const

const scopeZh = {
  student: '个人',
  class: '班级',
  group: '小组',
} as const

function currentBody(scheme: SupportScheme): SupportSchemeBody {
  const v = scheme.versions.find((x) => x.version === scheme.currentVersion)
  return (
    v?.body ??
    scheme.versions[scheme.versions.length - 1]?.body ?? {
      summary: '',
      goals: [],
      actions: [],
      focusModules: [],
    }
  )
}

export function SchemesPage() {
  const {
    supportSchemes,
    appendSchemeVersion,
    attachSchemeToChat,
    chatSchemeId,
    setMessages,
    setMode,
  } = useApp()
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState<string | null>(
    chatSchemeId ?? supportSchemes[0]?.id ?? null,
  )
  const [historyVersion, setHistoryVersion] = useState<number | null>(null)
  const [note, setNote] = useState('')

  useEffect(() => {
    if (chatSchemeId) {
      setSelectedId(chatSchemeId)
      setHistoryVersion(null)
    }
  }, [chatSchemeId])

  const selected = useMemo(
    () => supportSchemes.find((s) => s.id === selectedId) ?? null,
    [supportSchemes, selectedId],
  )

  const viewing = useMemo(() => {
    if (!selected) return null
    if (historyVersion == null) return currentBody(selected)
    return selected.versions.find((v) => v.version === historyVersion)?.body ?? null
  }, [selected, historyVersion])

  function addToChat(scheme: SupportScheme) {
    const body = currentBody(scheme)
    attachSchemeToChat(scheme.id)
    setMode('auto')
    setMessages((prev) => [
      ...prev,
      {
        id: `sys-scheme-${Date.now()}`,
        role: 'assistant',
        content: `已添加学情方案「${scheme.title}」v${scheme.currentVersion} 到本对话。可继续改目标/动作；满意后点「存入方案库」写入新版本。`,
        intent: 'support_scheme',
        createdAt: new Date().toISOString(),
        payload: {
          type: 'support_scheme',
          title: scheme.title,
          body,
          schemeId: scheme.id,
          schemeVersion: scheme.currentVersion,
        },
      },
    ])
    navigate('/teacher/chat')
  }

  function restoreVersion(scheme: SupportScheme, version: number) {
    const snap = scheme.versions.find((v) => v.version === version)
    if (!snap) return
    const next = appendSchemeVersion({
      schemeId: scheme.id,
      body: snap.body,
      source: 'manual_edit',
      note: `从 v${version} 恢复为当前`,
    })
    if (next) {
      setHistoryVersion(null)
      setNote(`已从 v${version} 恢复，当前为 v${next.currentVersion}`)
    }
  }

  return (
    <section className="schemes">
      <header className="schemes-head">
        <div>
          <h1 className="page-title">学情方案库</h1>
          <p className="page-desc">
            基于授权学情生成补差/分层方案；可「添加到对话」与 AI 完善，再存回同一方案留下版本历史。
          </p>
        </div>
        <div className="schemes-head__actions">
          <Link className="btn btn-sm" to="/teacher/class">
            班级学情
          </Link>
          <Link className="btn btn-sm" to="/teacher/chat">
            打开助手
          </Link>
        </div>
      </header>

      {note ? <p className="muted schemes-note">{note}</p> : null}

      <div className="schemes-board">
        <aside className="surface schemes-list">
          <div className="schemes-list__head">
            <strong>方案</strong>
            <span className="muted">{supportSchemes.length}</span>
          </div>
          {supportSchemes.length === 0 ? (
            <p className="muted schemes-list__empty">
              暂无方案。可在「班级学情」对已授权学生一键生成。
            </p>
          ) : (
            <ul>
              {supportSchemes.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className={`scheme-item ${selectedId === s.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedId(s.id)
                      setHistoryVersion(null)
                    }}
                  >
                    <span className="scheme-item__title">{s.title}</span>
                    <small>
                      {scopeZh[s.scope]} · v{s.currentVersion} ·{' '}
                      {new Date(s.updatedAt).toLocaleDateString('zh-CN')}
                    </small>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <div className="schemes-detail">
          {!selected || !viewing ? (
            <div className="surface schemes-empty">
              <p className="muted">从左侧选择方案，或去班级学情为已授权学生生成。</p>
            </div>
          ) : (
            <>
              <div className="surface schemes-detail__bar">
                <div>
                  <h2>{selected.title}</h2>
                  <p className="muted">
                    {selected.studentNames.join('、') || '班级'} · 当前 v
                    {historyVersion ?? selected.currentVersion}
                    {historyVersion != null && historyVersion !== selected.currentVersion
                      ? '（历史预览）'
                      : ''}
                  </p>
                  <p className="muted tiny">
                    依据：
                    {selected.basedOn.accuracy != null
                      ? `正确率 ${Math.round(selected.basedOn.accuracy * 100)}% · `
                      : ''}
                    薄弱 {selected.basedOn.weakTags.join('、') || '—'}
                    {selected.basedOn.hotspotModules?.length
                      ? ` · 热点 ${selected.basedOn.hotspotModules.join('、')}`
                      : ''}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-accent"
                  onClick={() => addToChat(selected)}
                >
                  添加到对话
                </button>
              </div>

              <div className="surface schemes-history">
                <strong>修改历史</strong>
                <ol>
                  {[...selected.versions].reverse().map((v) => (
                    <li
                      key={v.id}
                      className={
                        historyVersion === v.version ||
                        (historyVersion == null && v.version === selected.currentVersion)
                          ? 'is-on'
                          : ''
                      }
                    >
                      <button
                        type="button"
                        className="hist-btn"
                        onClick={() =>
                          setHistoryVersion(
                            v.version === selected.currentVersion ? null : v.version,
                          )
                        }
                      >
                        <span>
                          v{v.version} · {sourceZh[v.source]}
                        </span>
                        <small>
                          {new Date(v.createdAt).toLocaleString('zh-CN')}
                          {v.note ? ` · ${v.note}` : ''}
                        </small>
                      </button>
                      {v.version !== selected.currentVersion ? (
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => restoreVersion(selected, v.version)}
                        >
                          恢复为此版
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </div>

              <article className="surface scheme-body">
                <p>
                  <strong>摘要</strong>
                  <br />
                  {viewing.summary}
                </p>
                {viewing.horizon ? (
                  <p className="muted tiny">周期：{viewing.horizon}</p>
                ) : null}
                <div>
                  <strong>目标</strong>
                  <ul>
                    {viewing.goals.map((g) => (
                      <li key={g}>{g}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <strong>行动</strong>
                  <ol>
                    {viewing.actions.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ol>
                </div>
                <p className="muted tiny">聚焦：{viewing.focusModules.join('、') || '—'}</p>
              </article>
            </>
          )}
        </div>
      </div>

      <style>{`
        .schemes { display: grid; gap: 0.75rem; }
        .schemes-head {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 0.75rem;
          align-items: flex-start;
        }
        .schemes-head__actions { display: flex; gap: 0.4rem; flex-wrap: wrap; }
        .schemes-note { margin: 0; font-size: 0.78rem; }
        .schemes-board {
          display: grid;
          grid-template-columns: 220px minmax(0, 1fr);
          gap: 0.65rem;
          align-items: start;
        }
        .schemes-list { padding: 0; overflow: hidden; }
        .schemes-list__head {
          display: flex;
          justify-content: space-between;
          padding: 0.65rem 0.75rem;
          border-bottom: 1px solid var(--line);
          font-size: 0.86rem;
        }
        .schemes-list__empty { margin: 0; padding: 0.85rem; font-size: 0.8rem; }
        .schemes-list ul {
          list-style: none;
          margin: 0;
          padding: 0.35rem;
          display: grid;
          gap: 0.2rem;
          max-height: 28rem;
          overflow: auto;
        }
        .scheme-item {
          width: 100%;
          text-align: left;
          border: 0;
          background: transparent;
          padding: 0.5rem 0.55rem;
          cursor: pointer;
          display: grid;
          gap: 0.15rem;
          border-left: 2px solid transparent;
          color: var(--ink);
        }
        .scheme-item small { color: var(--ink-faint); font-size: 0.7rem; }
        .scheme-item:hover { background: #f4f7f5; }
        .scheme-item.active {
          background: #fff;
          border-left-color: var(--accent);
          box-shadow: var(--shadow-sm);
        }
        .scheme-item__title { font-size: 0.82rem; font-weight: 650; }
        .schemes-detail { display: grid; gap: 0.55rem; min-width: 0; }
        .schemes-detail__bar {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 0.55rem;
          padding: 0.7rem 0.85rem;
          align-items: center;
        }
        .schemes-detail__bar h2 {
          margin: 0;
          font-size: 1rem;
          font-family: var(--font-display);
        }
        .tiny { font-size: 0.74rem; margin: 0.2rem 0 0; }
        .schemes-empty { padding: 1rem; }
        .schemes-history { padding: 0.65rem 0.75rem; }
        .schemes-history strong {
          display: block;
          font-size: 0.78rem;
          color: var(--ink-muted);
          margin-bottom: 0.4rem;
        }
        .schemes-history ol {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 0.3rem;
        }
        .schemes-history li {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.4rem;
          padding: 0.35rem 0.45rem;
          border: 1px solid transparent;
        }
        .schemes-history li.is-on {
          background: var(--accent-soft);
          border-color: color-mix(in srgb, var(--accent) 25%, var(--line));
        }
        .hist-btn {
          flex: 1;
          min-width: 12rem;
          text-align: left;
          border: 0;
          background: transparent;
          cursor: pointer;
          display: grid;
          gap: 0.1rem;
          color: var(--ink);
          font-size: 0.8rem;
          font-weight: 650;
          padding: 0;
        }
        .hist-btn small {
          font-weight: 400;
          color: var(--ink-faint);
          font-size: 0.7rem;
        }
        .scheme-body {
          padding: 0.75rem 0.85rem;
          display: grid;
          gap: 0.55rem;
          font-size: 0.86rem;
          line-height: 1.45;
        }
        .scheme-body ul, .scheme-body ol {
          margin: 0.3rem 0 0;
          padding-left: 1.15rem;
        }
        @media (max-width: 900px) {
          .schemes-board { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  )
}
