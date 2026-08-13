import type { ChatMessage, Intent, QuestionItem, SupportSchemeBody } from '../types'
import { PrivateBadge } from './PrivateBadge'

const intentZh: Partial<Record<Intent, string>> = {
  practice: '练习',
  question_gen: '出题',
  counsel: '心情',
  study_plan: '学习计划',
  support_scheme: '学情方案',
  diagnose: '诊断',
  general: '对话',
  safety: '安全',
}

export type PackSaveActions = {
  onSaveToStudio: (questions: QuestionItem[], meta?: { packId?: string; packVersion?: number }) => void
}

export type SchemeSaveActions = {
  onSaveScheme: (
    title: string,
    body: SupportSchemeBody,
    meta?: { schemeId?: string; schemeVersion?: number },
  ) => void
}

export function ChatBubble({
  message,
  packSave,
  schemeSave,
}: {
  message: ChatMessage
  packSave?: PackSaveActions
  schemeSave?: SchemeSaveActions
}) {
  const mine = message.role === 'user'
  const questionSet =
    message.payload?.type === 'question_set' ? message.payload : null
  const questions = questionSet?.questions ?? null
  const schemePayload =
    message.payload?.type === 'support_scheme' ? message.payload : null

  return (
    <article className={`bubble-row ${mine ? 'bubble-row--mine' : 'bubble-row--ai'}`}>
      {!mine ? (
        <span className="bubble-avatar" aria-hidden>
          A
        </span>
      ) : null}
      <div className={`bubble ${mine ? 'bubble--mine' : 'bubble--ai'}`}>
        {!mine ? (
          <header className="bubble__meta">
            <span className="bubble__who">AIFOREC</span>
            {message.private ? <PrivateBadge /> : null}
            {message.intent ? (
              <span className="bubble__intent">{intentZh[message.intent] || message.intent}</span>
            ) : null}
            {questionSet?.packId ? (
              <span className="bubble__intent">题包 v{questionSet.packVersion ?? '?'}</span>
            ) : null}
            {schemePayload?.schemeId ? (
              <span className="bubble__intent">方案 v{schemePayload.schemeVersion ?? '?'}</span>
            ) : null}
          </header>
        ) : null}
        <p className="bubble__text">{message.content}</p>
        {message.attachments?.length ? (
          <ul className="attach-list">
            {message.attachments.map((f) => (
              <li key={f.id} className="attach-chip">
                <span>{f.name}</span>
              </li>
            ))}
          </ul>
        ) : null}
        {questionSet ? (
          <div className="payload">
            {questionSet.questions.map((q, i) => (
              <div key={i} className="payload__item">
                <div className="payload__label">第 {i + 1} 题</div>
                <div>{q.stem}</div>
                <div className="payload__hint">答案：{q.answer}</div>
                <div className="payload__hint">解析：{q.explanation}</div>
              </div>
            ))}
          </div>
        ) : null}
        {schemePayload ? (
          <div className="payload">
            <div className="payload__item">
              <div className="payload__label">{schemePayload.title}</div>
              <div>{schemePayload.body.summary}</div>
              {schemePayload.body.horizon ? (
                <div className="payload__hint">周期：{schemePayload.body.horizon}</div>
              ) : null}
              <div className="payload__hint">目标：{schemePayload.body.goals.join('；')}</div>
              <ol className="payload__list">
                {schemePayload.body.actions.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ol>
              <div className="payload__hint">
                聚焦：{schemePayload.body.focusModules.join('、')}
              </div>
            </div>
          </div>
        ) : null}
        {message.payload?.type === 'practice_set' ? (
          <div className="payload">
            <div className="payload__item">
              <div className="payload__label">
                练习题 · 难度 {message.payload.question.difficulty}/5
              </div>
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

        {!mine && packSave && questions?.length ? (
          <div className="bubble-pack" role="group" aria-label="题包操作">
            <button
              type="button"
              className="pack-btn"
              onClick={() =>
                packSave.onSaveToStudio(questions, {
                  packId: questionSet?.packId,
                  packVersion: questionSet?.packVersion,
                })
              }
            >
              存入出题台
            </button>
          </div>
        ) : null}
        {!mine && schemeSave && schemePayload ? (
          <div className="bubble-pack" role="group" aria-label="方案操作">
            <button
              type="button"
              className="pack-btn"
              onClick={() =>
                schemeSave.onSaveScheme(schemePayload.title, schemePayload.body, {
                  schemeId: schemePayload.schemeId,
                  schemeVersion: schemePayload.schemeVersion,
                })
              }
            >
              存入方案库
            </button>
          </div>
        ) : null}
      </div>
      <style>{`
        .bubble-row {
          display: flex;
          align-items: flex-end;
          gap: 0.5rem;
          max-width: 100%;
          animation: riseIn 0.28s ease both;
        }
        .bubble-row--mine {
          justify-content: flex-end;
        }
        .bubble-row--ai {
          justify-content: flex-start;
        }
        .bubble-avatar {
          width: 1.7rem;
          height: 1.7rem;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          background: var(--ink);
          color: #7dceb8;
          font-size: 0.68rem;
          font-weight: 700;
          margin-bottom: 0.1rem;
        }
        .bubble {
          max-width: min(560px, calc(100% - 2.2rem));
          padding: 0.7rem 0.9rem;
          border-radius: var(--radius);
        }
        .bubble-row--mine .bubble {
          max-width: min(520px, 88%);
        }
        .bubble--mine {
          background: var(--ink);
          color: #f4fffa;
          border-bottom-right-radius: 1px;
        }
        .bubble--ai {
          background: #fff;
          border: 1px solid var(--line);
          box-shadow: 0 1px 0 rgba(20, 28, 25, 0.03);
          border-bottom-left-radius: 1px;
        }
        .bubble__meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
          align-items: center;
          margin-bottom: 0.35rem;
        }
        .bubble__who {
          font-size: 0.7rem;
          font-weight: 650;
          letter-spacing: 0.02em;
          color: var(--ink-muted);
        }
        .bubble__intent {
          font-size: 0.66rem;
          padding: 0.1rem 0.38rem;
          border-radius: var(--radius-sm);
          background: var(--accent-soft);
          color: var(--accent);
          font-weight: 650;
        }
        .bubble__text {
          margin: 0;
          white-space: pre-wrap;
          line-height: 1.58;
          font-size: 0.9rem;
        }
        .attach-list {
          list-style: none;
          margin: 0.5rem 0 0;
          padding: 0;
          display: flex;
          flex-wrap: wrap;
          gap: 0.3rem;
        }
        .attach-chip {
          font-size: 0.72rem;
          padding: 0.2rem 0.45rem;
          border: 1px solid var(--line);
          background: #f4f7f5;
          color: var(--ink-muted);
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .bubble--mine .attach-chip {
          border-color: rgba(255,255,255,0.18);
          background: rgba(255,255,255,0.1);
          color: rgba(244,255,250,0.85);
        }
        .payload {
          margin-top: 0.6rem;
          display: grid;
          gap: 0.4rem;
        }
        .payload__item {
          padding: 0.6rem 0.7rem;
          border-radius: var(--radius-sm);
          background: #f4f7f5;
          border: 1px solid var(--line);
          font-size: 0.84rem;
          line-height: 1.45;
        }
        .bubble--mine .payload__item {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.12);
        }
        .payload__label {
          font-size: 0.72rem;
          font-weight: 650;
          margin-bottom: 0.25rem;
          color: var(--accent);
        }
        .bubble--mine .payload__label { color: #9fe0cb; }
        .payload__hint {
          margin-top: 0.28rem;
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
        .bubble-pack {
          margin-top: 0.55rem;
          display: flex;
          flex-wrap: wrap;
          gap: 0.3rem;
          padding-top: 0.45rem;
          border-top: 1px solid var(--line);
        }
        .pack-btn {
          border: 1px solid var(--line);
          background: #f7faf8;
          color: var(--ink);
          font-size: 0.7rem;
          font-weight: 650;
          padding: 0.22rem 0.5rem;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: background 0.12s ease, border-color 0.12s ease;
        }
        .pack-btn:hover {
          background: var(--accent-soft);
          border-color: var(--accent);
          color: var(--accent);
        }
        @keyframes riseIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: none; }
        }
      `}</style>
    </article>
  )
}
