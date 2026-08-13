import { useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext'
import type { PackAssignment } from '../../types'

const statusZh = {
  assigned: '待开始',
  in_progress: '进行中',
  submitted: '已提交',
} as const

export function PracticePage() {
  const { currentUser, assignments, startAssignment, submitAssignment } = useApp()
  const studentId = currentUser?.id || ''
  const mine = useMemo(
    () =>
      assignments
        .map((a) => ({
          assignment: a,
          attempt: a.attempts.find((t) => t.studentId === studentId),
        }))
        .filter((x) => x.attempt),
    [assignments, studentId],
  )

  const [activeId, setActiveId] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<number, string>>({})
  const [showResult, setShowResult] = useState(false)

  const active = useMemo(() => {
    if (!activeId) return null
    const a = assignments.find((x) => x.id === activeId)
    if (!a) return null
    const attempt = a.attempts.find((t) => t.studentId === studentId)
    if (!attempt) return null
    return { assignment: a, attempt }
  }, [activeId, assignments, studentId])

  function openDo(a: PackAssignment) {
    startAssignment(a.id, studentId)
    setActiveId(a.id)
    setDrafts({})
    setShowResult(false)
  }

  function openReview(a: PackAssignment) {
    setActiveId(a.id)
    setShowResult(true)
    setDrafts({})
  }

  function onSubmit() {
    if (!active) return
    const answers = active.assignment.questions.map((_, i) => ({
      questionIndex: i,
      studentAnswer: drafts[i] || '',
    }))
    submitAssignment(active.assignment.id, studentId, answers)
    setShowResult(true)
  }

  if (active) {
    const { assignment, attempt } = active
    const submitted = attempt.status === 'submitted' || showResult
    const latest = assignments
      .find((x) => x.id === assignment.id)
      ?.attempts.find((t) => t.studentId === studentId)

    return (
      <section className="practice">
        <header className="practice-head">
          <div>
            <button type="button" className="btn btn-sm" onClick={() => setActiveId(null)}>
              ← 返回列表
            </button>
            <h1 className="page-title">{assignment.packTitle}</h1>
            <p className="page-desc">
              {assignment.subject} · {assignment.knowledge} · v{assignment.packVersion} ·{' '}
              {assignment.questions.length} 题
              {assignment.dueLabel ? ` · 截止 ${assignment.dueLabel}` : ''}
            </p>
          </div>
        </header>

        {!submitted || !latest?.aiAnalysis ? (
          <div className="practice-do">
            {assignment.questions.map((q, i) => (
              <article key={i} className="surface q-card">
                <strong>
                  第 {i + 1} 题 · 难度 {q.difficulty}
                </strong>
                <p>{q.stem}</p>
                <label className="field-label">
                  你的作答
                  <textarea
                    className="field"
                    rows={2}
                    value={drafts[i] || ''}
                    onChange={(e) => setDrafts((d) => ({ ...d, [i]: e.target.value }))}
                    placeholder="写下答案…"
                  />
                </label>
              </article>
            ))}
            <button type="button" className="btn btn-accent" onClick={onSubmit}>
              提交并查看解析
            </button>
          </div>
        ) : (
          <div className="practice-result">
            <div className="surface score-card">
              <strong>
                得分 {Math.round((latest.score || 0) * 100)}%
                <span className="muted">
                  {' '}
                  · {latest.answers.filter((x) => x.correct).length}/{assignment.questions.length}{' '}
                  正确
                </span>
              </strong>
              <p className="ai-summary">{latest.aiAnalysis.summary}</p>
            </div>

            <aside className="surface ai-panel">
              <h2>AI 分析</h2>
              {latest.aiAnalysis.strengths.length ? (
                <div>
                  <strong>已掌握</strong>
                  <ul>
                    {latest.aiAnalysis.strengths.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {latest.aiAnalysis.weaknesses.length ? (
                <div>
                  <strong>待加强</strong>
                  <ul>
                    {latest.aiAnalysis.weaknesses.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div>
                <strong>下一步</strong>
                <ol>
                  {latest.aiAnalysis.nextSteps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
              </div>
              <p className="muted tiny">
                聚焦：{latest.aiAnalysis.focusModules.join('、') || '—'}
              </p>
            </aside>

            <div className="practice-review">
              {assignment.questions.map((q, i) => {
                const ans = latest.answers.find((x) => x.questionIndex === i)
                return (
                  <article
                    key={i}
                    className={`surface q-card ${ans?.correct ? 'is-ok' : 'is-bad'}`}
                  >
                    <strong>
                      第 {i + 1} 题 · {ans?.correct ? '正确' : '需订正'}
                    </strong>
                    <p>{q.stem}</p>
                    <p className="muted tiny">你的答案：{ans?.studentAnswer || '（未作答）'}</p>
                    <p className="muted tiny">参考答案：{q.answer}</p>
                    <p className="explain">解析：{q.explanation}</p>
                  </article>
                )
              })}
            </div>
          </div>
        )}

        <style>{practiceStyles}</style>
      </section>
    )
  }

  return (
    <section className="practice">
      <header>
        <h1 className="page-title">练习</h1>
        <p className="page-desc">
          完成老师下发的题包：作答 → 看解析 → 看 AI 分析。高压时系统不会在此额外催刷难题。
        </p>
      </header>

      {mine.length === 0 ? (
        <div className="surface empty">
          <p className="muted">暂无下发的题包。老师在出题台归档后可下发给你。</p>
        </div>
      ) : (
        <ul className="asg-list">
          {mine.map(({ assignment, attempt }) => (
            <li key={assignment.id} className="surface asg-item">
              <div>
                <strong>{assignment.packTitle}</strong>
                <p className="muted tiny">
                  {assignment.subject} · {assignment.questions.length} 题 ·{' '}
                  {statusZh[attempt!.status]}
                  {attempt!.score != null
                    ? ` · ${Math.round(attempt!.score * 100)}%`
                    : ''}
                  {assignment.dueLabel ? ` · ${assignment.dueLabel}` : ''}
                </p>
              </div>
              <div className="asg-item__actions">
                {attempt!.status === 'submitted' ? (
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => openReview(assignment)}
                  >
                    看解析与分析
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-sm btn-accent"
                    onClick={() => openDo(assignment)}
                  >
                    {attempt!.status === 'in_progress' ? '继续作答' : '开始练习'}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <style>{practiceStyles}</style>
    </section>
  )
}

const practiceStyles = `
  .practice { display: grid; gap: 0.75rem; }
  .practice-head { display: grid; gap: 0.35rem; }
  .practice-do, .practice-review {
    display: grid;
    gap: 0.55rem;
  }
  .practice-result {
    display: grid;
    gap: 0.55rem;
    grid-template-columns: minmax(0, 1.4fr) minmax(220px, 0.8fr);
  }
  .practice-review { grid-column: 1 / -1; }
  .q-card {
    padding: 0.7rem 0.85rem;
    display: grid;
    gap: 0.4rem;
  }
  .q-card p { margin: 0; font-size: 0.88rem; line-height: 1.45; }
  .q-card.is-ok { border-color: color-mix(in srgb, var(--accent) 35%, var(--line)); }
  .q-card.is-bad { border-color: rgba(163,59,59,0.35); background: #fffafa; }
  .field-label {
    display: grid;
    gap: 0.25rem;
    font-size: 0.78rem;
    color: var(--ink-muted);
  }
  .explain {
    font-size: 0.84rem !important;
    padding: 0.45rem 0.55rem;
    background: #f4f7f5;
    border: 1px solid var(--line);
  }
  .score-card { padding: 0.75rem 0.85rem; display: grid; gap: 0.35rem; }
  .ai-summary { margin: 0; font-size: 0.86rem; line-height: 1.45; }
  .ai-panel {
    padding: 0.75rem 0.85rem;
    display: grid;
    gap: 0.5rem;
    align-content: start;
  }
  .ai-panel h2 { margin: 0; font-size: 0.92rem; }
  .ai-panel ul, .ai-panel ol {
    margin: 0.25rem 0 0;
    padding-left: 1.1rem;
    font-size: 0.82rem;
    line-height: 1.4;
  }
  .tiny { font-size: 0.74rem; margin: 0; }
  .asg-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.45rem;
  }
  .asg-item {
    padding: 0.7rem 0.85rem;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 0.55rem;
    align-items: center;
  }
  .asg-item strong { font-size: 0.92rem; }
  .asg-item__actions { display: flex; gap: 0.35rem; }
  .empty { padding: 1rem; }
  @media (max-width: 800px) {
    .practice-result { grid-template-columns: 1fr; }
  }
`
