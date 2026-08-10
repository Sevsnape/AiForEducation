import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'

export function MePage() {
  const { learning, setLearning, support, setSupport, logout, currentUser, studyPlan, setMode } =
    useApp()
  const navigate = useNavigate()

  return (
    <section className="me">
      <header>
        <h1 className="page-title">我的</h1>
        <p className="page-desc">
          {currentUser?.displayName} · {currentUser?.email}
        </p>
      </header>

      <div className="me__grid">
        <section className="surface me-block me-block--wide">
          <h2>学习计划</h2>
          <p className="muted tiny">可与 AI 在对话中一起制定与调整；计划仅学习侧，老师需授权才可见摘要。</p>
          {studyPlan ? (
            <div className="plan-card">
              <strong>{studyPlan.title}</strong>
              <p className="muted tiny">
                {studyPlan.horizon} · 更新于 {studyPlan.updatedAt}
              </p>
              <ul>
                {studyPlan.goals.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
              <ol>
                {studyPlan.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </div>
          ) : (
            <p className="muted">还没有学习计划。</p>
          )}
          <button
            type="button"
            className="btn btn-accent btn-sm"
            onClick={() => {
              setMode('study_plan')
              navigate('/student/chat')
            }}
          >
            和 AI 一起定计划
          </button>
        </section>

        <section className="surface me-block me-block--wide">
          <h2>隐私与同意</h2>
          <p className="muted tiny">
            同意策略（个性化、历史留存、学情共享等）由<strong>学校管理员</strong>统一配置，学生端暂不开放修改。
            如需调整，请联系管理员。可在{' '}
            <Link to="/student/history">历史</Link> 中查看你自己的对话与成长总结。
          </p>
        </section>

        <section className="surface me-block">
          <h2>纠正学习印象</h2>
          <label className="field-label">
            近期目标
            <input
              className="field"
              value={learning.nearTermGoal}
              onChange={(e) => setLearning((l) => ({ ...l, nearTermGoal: e.target.value }))}
            />
          </label>
          <label className="field-label">
            合适难度（1-5）
            <input
              className="field"
              type="number"
              min={1}
              max={5}
              value={learning.difficultySweetSpot}
              onChange={(e) =>
                setLearning((l) => ({
                  ...l,
                  difficultySweetSpot: Number(e.target.value) || 3,
                }))
              }
            />
          </label>
        </section>

        <section className="surface me-block">
          <h2>纠正支持印象</h2>
          <p className="muted tiny">仅你可见，老师看不到。</p>
          <label className="field-label">
            有效支持方式（逗号分隔）
            <input
              className="field"
              value={support.whatHelps.join('，')}
              onChange={(e) =>
                setSupport((s) => ({
                  ...s,
                  whatHelps: e.target.value
                    .split(/[,，]/)
                    .map((x) => x.trim())
                    .filter(Boolean),
                }))
              }
            />
          </label>
        </section>
      </div>

      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => {
          logout()
          navigate('/')
        }}
      >
        退出登录
      </button>

      <style>{`
        .me { display: grid; gap: 0.75rem; }
        .me__grid {
          display: grid;
          gap: 0.55rem;
          grid-template-columns: 1fr 1fr;
        }
        .me-block {
          padding: 0.8rem 0.9rem;
          display: grid;
          gap: 0.55rem;
          align-content: start;
        }
        .me-block--wide { grid-column: 1 / -1; }
        .me-block h2 {
          margin: 0;
          font-size: 0.95rem;
        }
        .field-label {
          display: grid;
          gap: 0.25rem;
          font-size: 0.8rem;
          color: var(--ink-muted);
        }
        .tiny { font-size: 0.78rem; margin: 0; }
        .plan-card {
          padding: 0.55rem 0.65rem;
          border: 1px solid var(--line);
          background: #fafbfa;
          display: grid;
          gap: 0.25rem;
        }
        .plan-card ul, .plan-card ol {
          margin: 0.2rem 0 0;
          padding-left: 1.1rem;
          font-size: 0.84rem;
          line-height: 1.45;
        }
        .me-block .btn { justify-self: start; }
        @media (max-width: 720px) {
          .me__grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  )
}
