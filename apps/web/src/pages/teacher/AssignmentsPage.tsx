import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { classAggregateNote } from '../../lib/practice'
import { mockClassStudents } from '../../mock/data'
import type { PackAssignment } from '../../types'

export function AssignmentsPage() {
  const { assignments, questionPacks, assignPack, currentUser } = useApp()
  const [selectedId, setSelectedId] = useState<string | null>(assignments[0]?.id ?? null)
  const [packId, setPackId] = useState(questionPacks[0]?.id ?? '')
  const [flash, setFlash] = useState<string | null>(null)

  const sharedStudents = useMemo(
    () =>
      mockClassStudents
        .filter((s) => s.shared)
        .map((s) => ({
          id: s.id === 's-1' ? 'u-s1' : s.id === 's-2' ? 'u-s2' : s.id,
          name: s.name,
        })),
    [],
  )

  const selected = useMemo(
    () => assignments.find((a) => a.id === selectedId) ?? null,
    [assignments, selectedId],
  )

  const stats = useMemo(() => {
    if (!selected) return null
    const total = selected.attempts.length
    const submitted = selected.attempts.filter((t) => t.status === 'submitted')
    const avg =
      submitted.length === 0
        ? 0
        : Math.round(
            (submitted.reduce((s, t) => s + (t.score || 0), 0) / submitted.length) * 100,
          )
    const note = classAggregateNote(
      submitted.map((t) => t.aiAnalysis!).filter(Boolean),
      submitted.length,
      total,
    )
    return { total, submitted: submitted.length, avg, note }
  }, [selected])

  function onAssign() {
    if (!packId) {
      alert('请选择题包')
      return
    }
    if (!sharedStudents.length) {
      alert('暂无已授权学情的学生可下发')
      return
    }
    const created = assignPack({
      packId,
      students: sharedStudents,
      dueLabel: '本周五前',
      assignedByName: currentUser?.displayName || '老师',
    })
    if (created) {
      setSelectedId(created.id)
      setFlash(`已下发「${created.packTitle}」给 ${sharedStudents.length} 名学生`)
    }
  }

  return (
    <section className="asg">
      <header className="asg-head">
        <div>
          <h1 className="page-title">作业下发</h1>
          <p className="page-desc">
            将出题台题包下发给已授权学生；查看完成率、得分与每人 AI 分析（仅学习侧）。
          </p>
        </div>
        <Link className="btn btn-sm" to="/teacher/studio">
          出题台
        </Link>
      </header>

      <div className="surface asg-create">
        <strong>下发题包</strong>
        <div className="asg-create__row">
          <label>
            题包
            <select
              className="field"
              value={packId}
              onChange={(e) => setPackId(e.target.value)}
            >
              {questionPacks.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} · v{p.currentVersion}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="btn btn-accent" onClick={onAssign}>
            下发给班级
          </button>
        </div>
      </div>

      {flash ? (
        <div className="asg-flash" role="status">
          <span>{flash}</span>
          <button type="button" onClick={() => setFlash(null)}>
            关闭
          </button>
        </div>
      ) : null}

      <div className="asg-board">
        <aside className="surface asg-list">
          <div className="asg-list__head">
            <strong>已下发</strong>
            <span className="muted">{assignments.length}</span>
          </div>
          <ul>
            {assignments.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  className={`asg-item ${selectedId === a.id ? 'active' : ''}`}
                  onClick={() => setSelectedId(a.id)}
                >
                  <span>{a.packTitle}</span>
                  <small>
                    {a.attempts.filter((t) => t.status === 'submitted').length}/
                    {a.attempts.length} 已交 ·{' '}
                    {new Date(a.assignedAt).toLocaleDateString('zh-CN')}
                  </small>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="asg-detail">
          {!selected || !stats ? (
            <div className="surface empty">
              <p className="muted">选择题包下发，或从左侧查看已下发作业。</p>
            </div>
          ) : (
            <>
              <div className="surface asg-detail__bar">
                <div>
                  <h2>{selected.packTitle}</h2>
                  <p className="muted tiny">
                    v{selected.packVersion} · {selected.questions.length} 题 ·{' '}
                    {selected.dueLabel || '无截止'} · 由 {selected.assignedByName} 下发
                  </p>
                </div>
                <div className="asg-stats">
                  <div>
                    <span className="n">{stats.submitted}/{stats.total}</span>
                    <span className="l">提交</span>
                  </div>
                  <div>
                    <span className="n">{stats.avg}%</span>
                    <span className="l">已交均分</span>
                  </div>
                </div>
              </div>

              <div className="surface class-ai">
                <strong>班级 AI 分析</strong>
                <p>{stats.note}</p>
              </div>

              <div className="surface table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>学生</th>
                      <th>状态</th>
                      <th>得分</th>
                      <th>AI 分析摘要</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.attempts.map((t) => (
                      <tr key={t.studentId}>
                        <td>{t.studentName}</td>
                        <td>
                          {t.status === 'submitted'
                            ? '已提交'
                            : t.status === 'in_progress'
                              ? '进行中'
                              : '未开始'}
                        </td>
                        <td>
                          {t.score != null ? `${Math.round(t.score * 100)}%` : '—'}
                        </td>
                        <td className="ai-cell">
                          {t.aiAnalysis ? (
                            <details>
                              <summary>{t.aiAnalysis.summary}</summary>
                              <div className="ai-more">
                                <p>
                                  <strong>待加强：</strong>
                                  {t.aiAnalysis.weaknesses.join('；') || '—'}
                                </p>
                                <p>
                                  <strong>下一步：</strong>
                                  {t.aiAnalysis.nextSteps.join('；')}
                                </p>
                              </div>
                            </details>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <AssignmentQuestionPreview assignment={selected} />
            </>
          )}
        </div>
      </div>

      <style>{`
        .asg { display: grid; gap: 0.75rem; }
        .asg-head {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 0.75rem;
          align-items: flex-start;
        }
        .asg-create {
          padding: 0.7rem 0.85rem;
          display: grid;
          gap: 0.45rem;
        }
        .asg-create__row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.55rem;
          align-items: end;
        }
        .asg-create label {
          display: grid;
          gap: 0.25rem;
          font-size: 0.78rem;
          color: var(--ink-muted);
          min-width: 16rem;
        }
        .tiny { font-size: 0.74rem; margin: 0; align-self: center; }
        .asg-flash {
          display: flex;
          gap: 0.55rem;
          align-items: center;
          padding: 0.45rem 0.75rem;
          font-size: 0.78rem;
          background: var(--accent-soft);
          border: 1px solid color-mix(in srgb, var(--accent) 25%, var(--line));
        }
        .asg-flash button {
          margin-left: auto;
          border: 0;
          background: transparent;
          cursor: pointer;
          color: var(--ink-muted);
        }
        .asg-board {
          display: grid;
          grid-template-columns: 220px minmax(0, 1fr);
          gap: 0.65rem;
          align-items: start;
        }
        .asg-list { padding: 0; overflow: hidden; }
        .asg-list__head {
          display: flex;
          justify-content: space-between;
          padding: 0.65rem 0.75rem;
          border-bottom: 1px solid var(--line);
          font-size: 0.86rem;
        }
        .asg-list ul {
          list-style: none;
          margin: 0;
          padding: 0.35rem;
          display: grid;
          gap: 0.2rem;
          max-height: 28rem;
          overflow: auto;
        }
        .asg-item {
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
        .asg-item small { color: var(--ink-faint); font-size: 0.7rem; }
        .asg-item:hover { background: #f4f7f5; }
        .asg-item.active {
          background: #fff;
          border-left-color: var(--accent);
          box-shadow: var(--shadow-sm);
        }
        .asg-detail { display: grid; gap: 0.55rem; min-width: 0; }
        .asg-detail__bar {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 0.55rem;
          padding: 0.7rem 0.85rem;
          align-items: center;
        }
        .asg-detail__bar h2 {
          margin: 0;
          font-size: 1rem;
          font-family: var(--font-display);
        }
        .asg-stats {
          display: flex;
          border: 1px solid var(--line);
        }
        .asg-stats > div {
          padding: 0.35rem 0.7rem;
          border-right: 1px solid var(--line);
          display: grid;
          gap: 0.05rem;
        }
        .asg-stats > div:last-child { border-right: 0; }
        .asg-stats .n {
          font-family: var(--font-display);
          font-weight: 650;
          font-size: 1rem;
        }
        .asg-stats .l { font-size: 0.68rem; color: var(--ink-faint); }
        .class-ai {
          padding: 0.7rem 0.85rem;
          display: grid;
          gap: 0.3rem;
        }
        .class-ai p { margin: 0; font-size: 0.86rem; line-height: 1.45; }
        .table-wrap { overflow: auto; }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.84rem;
        }
        th, td {
          text-align: left;
          padding: 0.55rem 0.7rem;
          border-bottom: 1px solid var(--line);
          vertical-align: top;
        }
        th {
          font-size: 0.72rem;
          color: var(--ink-muted);
          background: #f7f9f8;
        }
        .ai-cell { max-width: 22rem; }
        .ai-cell summary {
          cursor: pointer;
          font-size: 0.8rem;
          line-height: 1.4;
        }
        .ai-more {
          margin-top: 0.35rem;
          font-size: 0.76rem;
          color: var(--ink-muted);
          display: grid;
          gap: 0.2rem;
        }
        .ai-more p { margin: 0; }
        .empty { padding: 1rem; }
        .q-prev {
          padding: 0.7rem 0.85rem;
          display: grid;
          gap: 0.4rem;
        }
        .q-prev h3 { margin: 0; font-size: 0.86rem; }
        .q-prev ol {
          margin: 0;
          padding-left: 1.15rem;
          font-size: 0.82rem;
          line-height: 1.4;
        }
        @media (max-width: 900px) {
          .asg-board { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  )
}

function AssignmentQuestionPreview({ assignment }: { assignment: PackAssignment }) {
  return (
    <div className="surface q-prev">
      <h3>题包快览（下发快照）</h3>
      <ol>
        {assignment.questions.map((q, i) => (
          <li key={i}>
            {q.stem}
            <span className="muted"> · 难度 {q.difficulty}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
