import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'

export function MePage() {
  const {
    learning,
    setLearning,
    support,
    setSupport,
    logout,
    currentUser,
    studyPlan,
    setMode,
    consent,
  } = useApp()
  const navigate = useNavigate()

  const openToTeacher = consent.shareLearningWithTeacher
    ? [
        {
          label: '练习正确率摘要',
          example: `例如：最近约 ${Math.round(learning.lastPracticeSnapshot.accuracy * 100)}%（${learning.lastPracticeSnapshot.n} 题）`,
        },
        {
          label: '薄弱知识点标签',
          example:
            learning.weakKnowledge.map((w) => w.tag).join('、') || '（暂无标签）',
        },
        {
          label: '提问模块热点',
          example: '班级/个人常问模块的聚合次数（不含聊天原文）',
        },
        {
          label: '学习计划焦点（若已共享）',
          example: studyPlan
            ? `当前计划聚焦：${studyPlan.focusModules.join('、')}`
            : '你还没有学习计划',
        },
        {
          label: '老师据此制定的辅导方案依据',
          example: '仅使用上述学情摘要，不会引用心情对话',
        },
      ]
    : []

  const neverToTeacher = [
    '「心情」模式对话原文',
    '支持印象（压力主题、有效支持方式等）',
    '成长总结里的心情相关文字',
    '心情会话附件（仅你可见）',
    '危机求助相关细节',
  ]

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
          <p className="muted tiny">可与 AI 在对话中一起制定与调整；计划只含学习安排，老师需授权才可见摘要。</p>
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
          <h2>老师能看到什么</h2>
          <p className="muted tiny">
            由学校管理员配置；你这边只读查看。如需调整请联系管理员。
          </p>

          <div className={`share-summary ${consent.shareLearningWithTeacher ? 'is-on' : 'is-off'}`}>
            <strong>
              学情共享：{consent.shareLearningWithTeacher ? '已开启' : '未开启'}
            </strong>
            <span>
              {consent.shareLearningWithTeacher
                ? '老师可看下列已开放的学情摘要，用于辅导与方案，不会看到心情原文。'
                : '老师当前看不到你的学情摘要；下列内容对老师关闭。'}
            </span>
          </div>

          <div className="share-cols">
            <div className="share-col">
              <h3>对老师已开放的内容</h3>
              {consent.shareLearningWithTeacher ? (
                <ul className="share-items">
                  {openToTeacher.map((item) => (
                    <li key={item.label}>
                      <strong>{item.label}</strong>
                      <span>{item.example}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted tiny share-empty">
                  当前未向老师开放学情。开启后，老师才能看到正确率、薄弱点等摘要。
                </p>
              )}
              <ul className="share-items share-items--soft">
                <li>
                  <strong>个性化练习开关</strong>
                  <span>
                    {consent.learningPersonalize ? '已开 · 主要影响你自己的练习体验' : '未开'}
                  </span>
                </li>
                <li>
                  <strong>会话历史留存</strong>
                  <span>
                    {consent.historyRetain
                      ? '已开 · 便于你回顾；老师仍看不到心情原文'
                      : '未开 · 长期记忆会受限'}
                  </span>
                </li>
              </ul>
            </div>

            <div className="share-col share-col--safe">
              <h3>永不对老师开放</h3>
              <ul className="share-items">
                {neverToTeacher.map((item) => (
                  <li key={item}>
                    <strong>{item}</strong>
                    <span>仅你可见</span>
                  </li>
                ))}
              </ul>
              <p className="muted tiny">
                无论学情是否共享，上列内容都不会出现在老师的班级学情或方案里。
              </p>
            </div>
          </div>

          <p className="muted tiny">
            可在 <Link to="/student/history">历史</Link> 查看自己的对话与成长总结（含仅你可见的心情相关内容）。
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
        .share-summary {
          display: grid;
          gap: 0.2rem;
          padding: 0.6rem 0.7rem;
          border: 1px solid var(--line);
          background: #f4f4f4;
          font-size: 0.8rem;
          line-height: 1.4;
        }
        .share-summary.is-on {
          background: var(--accent-soft);
          border-color: color-mix(in srgb, var(--accent) 28%, var(--line));
        }
        .share-summary strong { font-size: 0.86rem; }
        .share-cols {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.55rem;
        }
        .share-col {
          border: 1px solid var(--line);
          background: #fafbfa;
          padding: 0.65rem 0.7rem;
          display: grid;
          gap: 0.45rem;
          align-content: start;
        }
        .share-col--safe {
          background: #f3f3f3;
        }
        .share-col h3 {
          margin: 0;
          font-size: 0.82rem;
        }
        .share-empty { margin: 0; }
        .share-items {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 0.35rem;
        }
        .share-items li {
          display: grid;
          gap: 0.1rem;
          padding: 0.4rem 0.45rem;
          background: #fff;
          border: 1px solid var(--line);
        }
        .share-items--soft li {
          background: #f7f9f8;
        }
        .share-items strong { font-size: 0.8rem; }
        .share-items span {
          font-size: 0.74rem;
          color: var(--ink-muted);
          line-height: 1.35;
        }
        .me-block .btn { justify-self: start; }
        @media (max-width: 720px) {
          .me__grid { grid-template-columns: 1fr; }
          .share-cols { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  )
}
