import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PrivateBadge } from '../../components/PrivateBadge'
import { useApp } from '../../context/AppContext'
import type { GrowthStage, Intent, ThreadStatus, ThreadSummary } from '../../types'

type Tab = 'threads' | 'weekly' | 'memory'
type IntentFilter = 'all' | Intent | 'mixed'
type ThreadView = 'active' | 'archived' | 'all'
type StageView = 'open' | 'archived' | 'all'

const intentLabel: Record<string, string> = {
  practice: '练习',
  question_gen: '出题',
  counsel: '心情',
  study_plan: '学习计划',
  diagnose: '诊断',
  general: '闲聊',
  safety: '安全',
  mixed: '混合',
}

export function HistoryPage() {
  const {
    threads,
    setThreads,
    growthStages,
    setGrowthStages,
    learning,
    support,
    setMessages,
  } = useApp()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('threads')

  // —— 对话管理 ——
  const [threadQ, setThreadQ] = useState('')
  const [intentFilter, setIntentFilter] = useState<IntentFilter>('all')
  const [threadView, setThreadView] = useState<ThreadView>('active')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameDraft, setRenameDraft] = useState('')

  // —— 成长阶段 ——
  const [stageView, setStageView] = useState<StageView>('open')
  const [selectedStageId, setSelectedStageId] = useState(
    () => growthStages.find((g) => g.status === 'current')?.id ?? growthStages[0]?.id ?? '',
  )

  const filteredThreads = useMemo(() => {
    const q = threadQ.trim().toLowerCase()
    return threads
      .filter((t) => {
        if (threadView === 'active' && t.status !== 'active') return false
        if (threadView === 'archived' && t.status !== 'archived') return false
        if (intentFilter !== 'all' && t.primaryIntent !== intentFilter) return false
        if (
          q &&
          !t.title.toLowerCase().includes(q) &&
          !t.preview.toLowerCase().includes(q)
        ) {
          return false
        }
        return true
      })
      .sort((a, b) => {
        if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1
        return b.lastActiveDate.localeCompare(a.lastActiveDate)
      })
  }, [threads, threadQ, intentFilter, threadView])

  const stageList = useMemo(() => {
    return growthStages
      .filter((g) => {
        if (stageView === 'open') return g.status !== 'archived'
        if (stageView === 'archived') return g.status === 'archived'
        return true
      })
      .sort((a, b) => b.weekStart.localeCompare(a.weekStart))
  }, [growthStages, stageView])

  const selectedStage =
    stageList.find((g) => g.id === selectedStageId) || stageList[0] || null

  const threadStats = useMemo(() => {
    const active = threads.filter((t) => t.status === 'active').length
    const archived = threads.filter((t) => t.status === 'archived').length
    const privateN = threads.filter((t) => t.privateHint && t.status === 'active').length
    return { active, archived, privateN, total: threads.length }
  }, [threads])

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function patchThread(id: string, patch: Partial<ThreadSummary>) {
    setThreads((list) => list.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }

  function setStatusMany(ids: string[], status: ThreadStatus) {
    setThreads((list) => list.map((t) => (ids.includes(t.id) ? { ...t, status } : t)))
    setSelectedIds(new Set())
  }

  function deleteMany(ids: string[]) {
    if (!ids.length) return
    if (!confirm(`确定删除 ${ids.length} 条对话？删除后可能触发画像重摘要。`)) return
    setThreads((list) => list.filter((t) => !ids.includes(t.id)))
    setSelectedIds(new Set())
  }

  function openThread(t: ThreadSummary) {
    setMessages([
      {
        id: `hist-${t.id}`,
        role: 'assistant',
        content: `已打开历史会话「${t.title}」。后续接入后端后将加载完整消息；当前为 Mock 续聊入口。`,
        intent: t.primaryIntent === 'mixed' ? 'general' : t.primaryIntent,
        private: t.privateHint,
        createdAt: new Date().toISOString(),
      },
    ])
    navigate('/student/chat')
  }

  function startRename(t: ThreadSummary) {
    setRenamingId(t.id)
    setRenameDraft(t.title)
  }

  function commitRename() {
    if (!renamingId) return
    const title = renameDraft.trim()
    if (title) patchThread(renamingId, { title })
    setRenamingId(null)
  }

  function patchStage(id: string, patch: Partial<GrowthStage>) {
    setGrowthStages((list) => list.map((g) => (g.id === id ? { ...g, ...patch } : g)))
  }

  function archiveStage(id: string) {
    patchStage(id, { status: 'archived' })
  }

  function restoreStage(id: string) {
    const isLatest =
      [...growthStages].sort((a, b) => b.weekStart.localeCompare(a.weekStart))[0]?.id === id
    patchStage(id, { status: isLatest ? 'current' : 'past' })
  }

  return (
    <section className="history">
      <header className="history__head">
        <div>
          <h1 className="page-title">历史</h1>
          <p className="page-desc">管理对话与分阶段成长总结，并查看 AI 对你的理解。</p>
        </div>
        <div className="chip-row" role="tablist">
          {(
            [
              ['threads', '对话'],
              ['weekly', '成长总结'],
              ['memory', 'AI 记得你'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              className={`chip ${tab === id ? 'active' : ''}`}
              aria-selected={tab === id}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {tab === 'threads' ? (
        <div className="hist-panel">
          <div className="hist-toolbar">
            <input
              className="field"
              placeholder="搜索标题 / 预览"
              value={threadQ}
              onChange={(e) => setThreadQ(e.target.value)}
            />
            <select
              className="field"
              value={intentFilter}
              onChange={(e) => setIntentFilter(e.target.value as IntentFilter)}
            >
              <option value="all">全部类型</option>
              <option value="practice">练习</option>
              <option value="question_gen">出题</option>
              <option value="study_plan">学习计划</option>
              <option value="counsel">心情</option>
              <option value="diagnose">诊断</option>
              <option value="mixed">混合</option>
            </select>
            <select
              className="field"
              value={threadView}
              onChange={(e) => setThreadView(e.target.value as ThreadView)}
            >
              <option value="active">进行中</option>
              <option value="archived">已归档</option>
              <option value="all">全部</option>
            </select>
          </div>

          <div className="hist-kpis">
            <span>进行中 {threadStats.active}</span>
            <span>归档 {threadStats.archived}</span>
            <span>仅你可见 {threadStats.privateN}</span>
          </div>

          {selectedIds.size > 0 ? (
            <div className="bulk-bar">
              <span>已选 {selectedIds.size}</span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setStatusMany([...selectedIds], 'archived')}
              >
                归档
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setStatusMany([...selectedIds], 'active')}
              >
                恢复
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => deleteMany([...selectedIds])}
              >
                删除
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setSelectedIds(new Set())}
              >
                取消选择
              </button>
            </div>
          ) : null}

          <div className="history__grid">
            {filteredThreads.length === 0 ? (
              <p className="muted empty">没有符合条件的对话。</p>
            ) : (
              filteredThreads.map((t) => (
                <article
                  key={t.id}
                  className={`history-card surface ${t.status === 'archived' ? 'is-archived' : ''}`}
                >
                  <div className="history-card__top">
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(t.id)}
                        onChange={() => toggleSelect(t.id)}
                        aria-label={`选择 ${t.title}`}
                      />
                    </label>
                    {renamingId === t.id ? (
                      <input
                        className="field rename-field"
                        value={renameDraft}
                        autoFocus
                        onChange={(e) => setRenameDraft(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitRename()
                          if (e.key === 'Escape') setRenamingId(null)
                        }}
                      />
                    ) : (
                      <h3>
                        {t.pinned ? <span className="pin" title="已置顶">📌 </span> : null}
                        {t.title}
                      </h3>
                    )}
                    {t.privateHint ? <PrivateBadge /> : null}
                  </div>
                  <p className="muted">{t.preview}</p>
                  <div className="history-card__meta">
                    <span>
                      {intentLabel[t.primaryIntent] || t.primaryIntent} · {t.messageCount} 条
                    </span>
                    <span>{t.lastActiveAt}</span>
                  </div>
                  <div className="card-actions">
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => openThread(t)}>
                      打开
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => startRename(t)}>
                      重命名
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => patchThread(t.id, { pinned: !t.pinned })}
                    >
                      {t.pinned ? '取消置顶' : '置顶'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() =>
                        patchThread(t.id, {
                          status: t.status === 'archived' ? 'active' : 'archived',
                        })
                      }
                    >
                      {t.status === 'archived' ? '恢复' : '归档'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => deleteMany([t.id])}
                    >
                      删除
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      ) : null}

      {tab === 'weekly' ? (
        <div className="growth">
          <div className="growth__side surface">
            <div className="growth__side-head">
              <h2>成长阶段</h2>
              <select
                className="field"
                value={stageView}
                onChange={(e) => setStageView(e.target.value as StageView)}
              >
                <option value="open">当前与过往</option>
                <option value="archived">已归档</option>
                <option value="all">全部</option>
              </select>
            </div>
            <p className="muted tiny">成长按阶段滚动生成（如每周），可逐段查看与归档。</p>
            <ul className="stage-list">
              {stageList.map((g) => (
                <li key={g.id}>
                  <button
                    type="button"
                    className={`stage-item ${selectedStage?.id === g.id ? 'active' : ''}`}
                    onClick={() => setSelectedStageId(g.id)}
                  >
                    <strong>{g.weekLabel}</strong>
                    <span className="muted">
                      {g.status === 'current'
                        ? '当前'
                        : g.status === 'archived'
                          ? '已归档'
                          : '过往'}
                      {g.accuracy != null ? ` · 正确率 ${Math.round(g.accuracy * 100)}%` : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="growth__main">
            {selectedStage ? (
              <>
                <div className="growth__toolbar">
                  <div>
                    <h2 className="stage-title">{selectedStage.weekLabel}</h2>
                    <p className="muted tiny">
                      {selectedStage.weekStart} → {selectedStage.weekEnd}
                      {selectedStage.focusModules?.length
                        ? ` · 聚焦 ${selectedStage.focusModules.join('、')}`
                        : ''}
                    </p>
                  </div>
                  <div className="card-actions">
                    {selectedStage.status === 'archived' ? (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => restoreStage(selectedStage.id)}
                      >
                        取消归档
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => archiveStage(selectedStage.id)}
                      >
                        归档本阶段
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() =>
                        alert('Mock：将请求后端重新生成本阶段总结（summary_graph）。')
                      }
                    >
                      重新生成
                    </button>
                  </div>
                </div>

                <div className="weekly-grid">
                  <article className="history-card surface">
                    <div className="weekly__label">学习侧</div>
                    <h3>本阶段学习</h3>
                    <p>{selectedStage.learningText}</p>
                    {selectedStage.practiceCount != null ? (
                      <p className="muted">
                        练习 {selectedStage.practiceCount} 题
                        {selectedStage.accuracy != null
                          ? ` · 正确率 ${Math.round(selectedStage.accuracy * 100)}%`
                          : ''}
                      </p>
                    ) : null}
                  </article>
                  <article className="history-card surface">
                    <div className="weekly__label">仅你可见</div>
                    <h3>
                      本阶段支持 <PrivateBadge />
                    </h3>
                    <p>{selectedStage.supportText}</p>
                  </article>
                  <article className="history-card surface">
                    <div className="weekly__label">行动</div>
                    <h3>下一步</h3>
                    <ul>
                      {selectedStage.nextSteps.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </article>
                </div>

                {stageList.filter((g) => g.status !== 'archived').length >= 2 ? (
                  <div className="compare surface">
                    <h3>与相邻阶段对比（学习侧）</h3>
                    <p className="muted tiny">帮助看清正确率与题量变化；不含支持原文。</p>
                    <table>
                      <thead>
                        <tr>
                          <th>阶段</th>
                          <th>练习题</th>
                          <th>正确率</th>
                          <th>聚焦模块</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stageList
                          .filter((g) => g.status !== 'archived')
                          .slice(0, 4)
                          .map((g) => (
                            <tr key={g.id} className={g.id === selectedStage.id ? 'is-cur' : ''}>
                              <td>{g.weekLabel}</td>
                              <td>{g.practiceCount ?? '—'}</td>
                              <td>
                                {g.accuracy != null ? `${Math.round(g.accuracy * 100)}%` : '—'}
                              </td>
                              <td>{g.focusModules?.join('、') || '—'}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="muted">暂无成长阶段。系统会按周期自动生成，也可在对话后触发总结。</p>
            )}
          </div>
        </div>
      ) : null}

      {tab === 'memory' ? (
        <div className="history__grid">
          <article className="history-card surface">
            <h3>学习印象</h3>
            <p>
              主攻 {learning.subjectsFocus.join('、')}；合适难度约 {learning.difficultySweetSpot}/5。
            </p>
            <p className="muted">目标：{learning.nearTermGoal}</p>
            <p className="muted">
              薄弱点：{learning.weakKnowledge.map((w) => w.tag).join('、') || '暂无'}
            </p>
            <p className="muted tiny">删除或归档大量对话后，系统可能重算本印象。</p>
          </article>
          <article className="history-card surface">
            <h3>
              支持印象 <PrivateBadge />
            </h3>
            <p>{support.safeSummary}</p>
            <p className="muted">压力主题：{support.stressThemes.join('、')}</p>
            <p className="muted">老师端不会展示本块内容。</p>
          </article>
        </div>
      ) : null}

      <style>{`
        .history { display: grid; gap: 0.75rem; }
        .history__head {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: end;
          gap: 0.55rem;
        }
        .hist-panel { display: grid; gap: 0.55rem; }
        .hist-toolbar {
          display: grid;
          grid-template-columns: 1fr 140px 120px;
          gap: 0.45rem;
        }
        .hist-kpis {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          font-size: 0.74rem;
          color: var(--ink-faint);
        }
        .bulk-bar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.35rem;
          padding: 0.4rem 0.55rem;
          border: 1px solid var(--line);
          background: #fff;
          font-size: 0.8rem;
        }
        .history__grid,
        .weekly-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.55rem;
        }
        .history-card {
          padding: 0.75rem 0.85rem;
          display: grid;
          gap: 0.15rem;
          align-content: start;
        }
        .history-card.is-archived { opacity: 0.72; }
        .history-card h3 {
          margin: 0;
          font-size: 0.95rem;
          flex: 1;
          min-width: 0;
        }
        .history-card p {
          margin: 0.35rem 0 0;
          line-height: 1.45;
          font-size: 0.84rem;
        }
        .history-card__top {
          display: flex;
          justify-content: space-between;
          gap: 0.4rem;
          align-items: center;
        }
        .check { display: grid; place-items: center; }
        .rename-field { font-size: 0.9rem; padding: 0.25rem 0.4rem; }
        .pin { font-size: 0.75rem; }
        .history-card__meta {
          margin-top: 0.45rem;
          display: flex;
          justify-content: space-between;
          font-size: 0.72rem;
          color: var(--ink-faint);
        }
        .card-actions {
          margin-top: 0.5rem;
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
        }
        .weekly__label {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--accent);
          margin-bottom: 0.15rem;
        }
        .history-card ul {
          margin: 0.35rem 0 0;
          padding-left: 1rem;
          font-size: 0.84rem;
          line-height: 1.5;
        }
        .empty { grid-column: 1 / -1; margin: 0.5rem 0; }
        .tiny { font-size: 0.74rem; margin: 0.2rem 0 0; }
        .growth {
          display: grid;
          grid-template-columns: 220px minmax(0, 1fr);
          gap: 0.55rem;
          align-items: start;
        }
        .growth__side {
          padding: 0.7rem 0.75rem;
          display: grid;
          gap: 0.4rem;
        }
        .growth__side-head {
          display: grid;
          gap: 0.35rem;
        }
        .growth__side h2,
        .stage-title {
          margin: 0;
          font-size: 0.95rem;
        }
        .stage-list {
          list-style: none;
          margin: 0.25rem 0 0;
          padding: 0;
          display: grid;
          gap: 0.2rem;
          max-height: 420px;
          overflow: auto;
        }
        .stage-item {
          width: 100%;
          text-align: left;
          border: 0;
          background: transparent;
          padding: 0.45rem 0.5rem;
          cursor: pointer;
          display: grid;
          gap: 0.1rem;
          border-radius: var(--radius-sm);
          font-size: 0.82rem;
        }
        .stage-item.active {
          background: var(--accent-soft);
          color: var(--accent);
        }
        .growth__main { display: grid; gap: 0.55rem; min-width: 0; }
        .growth__toolbar {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: end;
          gap: 0.5rem;
        }
        .compare {
          padding: 0.7rem 0.85rem;
        }
        .compare h3 { margin: 0; font-size: 0.9rem; }
        .compare table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.82rem;
          margin-top: 0.45rem;
        }
        .compare th, .compare td {
          text-align: left;
          padding: 0.4rem 0.5rem;
          border-bottom: 1px solid var(--line);
        }
        .compare th {
          font-size: 0.72rem;
          color: var(--ink-muted);
          background: #f7f9f8;
        }
        .compare tr.is-cur td { background: var(--accent-soft); }
        @media (max-width: 960px) {
          .history__grid,
          .weekly-grid {
            grid-template-columns: 1fr 1fr;
          }
          .hist-toolbar { grid-template-columns: 1fr 1fr; }
          .growth { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .history__grid,
          .weekly-grid {
            grid-template-columns: 1fr;
          }
          .hist-toolbar { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  )
}
