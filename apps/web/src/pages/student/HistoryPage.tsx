import { useState } from 'react'
import { PrivateBadge } from '../../components/PrivateBadge'
import { useApp } from '../../context/AppContext'

type Tab = 'threads' | 'weekly' | 'memory'

export function HistoryPage() {
  const { threads, weekly, learning, support } = useApp()
  const [tab, setTab] = useState<Tab>('threads')

  return (
    <section className="history">
      <header className="history__head">
        <div>
          <h1 className="page-title">历史</h1>
          <p className="page-desc">回顾对话、成长总结，以及 AI 对你的理解。</p>
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
        <div className="history__grid">
          {threads.map((t) => (
            <article key={t.id} className="history-card surface">
              <div className="history-card__top">
                <h3>{t.title}</h3>
                {t.privateHint ? <PrivateBadge /> : null}
              </div>
              <p className="muted">{t.preview}</p>
              <div className="history-card__meta">
                <span>{t.primaryIntent}</span>
                <span>{t.lastActiveAt}</span>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {tab === 'weekly' ? (
        <div className="weekly-grid">
          <article className="history-card surface">
            <div className="weekly__label">{weekly.weekLabel}</div>
            <h3>本周学习</h3>
            <p>{weekly.learningText}</p>
          </article>
          <article className="history-card surface">
            <h3>
              本周支持 <PrivateBadge />
            </h3>
            <p>{weekly.supportText}</p>
          </article>
          <article className="history-card surface">
            <h3>下一步</h3>
            <ul>
              {weekly.nextSteps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </article>
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
        .history__grid,
        .weekly-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.55rem;
        }
        .history-card {
          padding: 0.75rem 0.85rem;
        }
        .history-card h3 {
          margin: 0;
          font-size: 0.95rem;
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
        .history-card__meta {
          margin-top: 0.55rem;
          display: flex;
          justify-content: space-between;
          font-size: 0.72rem;
          color: var(--ink-faint);
        }
        .weekly__label {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--accent);
          margin-bottom: 0.35rem;
        }
        .history-card ul {
          margin: 0.35rem 0 0;
          padding-left: 1rem;
          font-size: 0.84rem;
          line-height: 1.5;
        }
        @media (max-width: 960px) {
          .history__grid,
          .weekly-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 640px) {
          .history__grid,
          .weekly-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  )
}
