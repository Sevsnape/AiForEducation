import type { ChatMessage } from '../types'
import { PrivateBadge } from './PrivateBadge'

export function ChatBubble({ message }: { message: ChatMessage }) {
  const mine = message.role === 'user'
  return (
    <article className={`bubble ${mine ? 'bubble--mine' : 'bubble--ai'}`}>
      {!mine ? (
        <header className="bubble__meta">
          <span className="bubble__who">AIFOREC</span>
          {message.private ? <PrivateBadge /> : null}
          {message.intent ? <span className="bubble__intent">{message.intent}</span> : null}
        </header>
      ) : null}
      <p className="bubble__text">{message.content}</p>
      {message.payload?.type === 'question_set' ? (
        <div className="payload">
          {message.payload.questions.map((q, i) => (
            <div key={i} className="payload__item">
              <div className="payload__label">第 {i + 1} 题</div>
              <div>{q.stem}</div>
              <div className="payload__hint">答案：{q.answer}</div>
              <div className="payload__hint">解析：{q.explanation}</div>
            </div>
          ))}
        </div>
      ) : null}
      {message.payload?.type === 'practice_set' ? (
        <div className="payload">
          <div className="payload__item">
            <div className="payload__label">练习题 · 难度 {message.payload.question.difficulty}/5</div>
            <div>{message.payload.question.stem}</div>
          </div>
        </div>
      ) : null}
      {message.payload?.type === 'safety_card' ? (
        <div className="payload payload--safety">
          {message.payload.resources.map((r) => (
            <div key={r.label} className="payload__item">
              {r.label}
            </div>
          ))}
        </div>
      ) : null}
      {message.payload?.type === 'study_plan' ? (
        <div className="payload">
          <div className="payload__item">
            <div className="payload__label">{message.payload.plan.title}</div>
            <div className="payload__hint">{message.payload.plan.horizon}</div>
            <div>目标：{message.payload.plan.goals.join('；')}</div>
            <ol className="payload__list">
              {message.payload.plan.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            <div className="payload__hint">
              聚焦：{message.payload.plan.focusModules.join('、')}
            </div>
          </div>
        </div>
      ) : null}
      <style>{`
        .bubble {
          max-width: min(560px, 85%);
          padding: 0.65rem 0.8rem;
          border-radius: var(--radius);
          animation: riseIn 0.25s ease both;
        }
        .bubble--mine {
          margin-left: auto;
          background: var(--ink);
          color: #f4fffa;
        }
        .bubble--ai {
          background: #fff;
          border: 1px solid var(--line);
        }
        .bubble__meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
          align-items: center;
          margin-bottom: 0.3rem;
        }
        .bubble__who {
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--ink-faint);
        }
        .bubble__intent {
          font-size: 0.66rem;
          padding: 0.08rem 0.35rem;
          border-radius: var(--radius-sm);
          background: var(--accent-soft);
          color: var(--accent);
          font-weight: 600;
        }
        .bubble__text {
          margin: 0;
          white-space: pre-wrap;
          line-height: 1.55;
          font-size: 0.88rem;
        }
        .payload {
          margin-top: 0.55rem;
          display: grid;
          gap: 0.4rem;
        }
        .payload__item {
          padding: 0.55rem 0.65rem;
          border-radius: var(--radius-sm);
          background: rgba(20,28,25,0.035);
          border: 1px solid var(--line);
          font-size: 0.84rem;
        }
        .bubble--mine .payload__item {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.12);
        }
        .payload__label {
          font-size: 0.72rem;
          font-weight: 650;
          margin-bottom: 0.2rem;
          color: var(--accent);
        }
        .bubble--mine .payload__label { color: #9fe0cb; }
        .payload__hint {
          margin-top: 0.25rem;
          font-size: 0.8rem;
          color: var(--ink-muted);
        }
        .payload__list {
          margin: 0.35rem 0 0;
          padding-left: 1.1rem;
          line-height: 1.45;
        }
        .bubble--mine .payload__hint { color: rgba(244,255,250,0.72); }
        .payload--safety .payload__item {
          border-color: rgba(163,59,59,0.2);
          background: var(--danger-soft);
        }
        @keyframes riseIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: none; }
        }
      `}</style>
    </article>
  )
}
