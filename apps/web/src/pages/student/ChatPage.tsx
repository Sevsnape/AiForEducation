import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ChatBubble } from '../../components/ChatBubble'
import { ModeChips } from '../../components/ModeChips'
import { PrivateBadge } from '../../components/PrivateBadge'
import { useApp } from '../../context/AppContext'
import { mockInvoke } from '../../mock/agent'

export function ChatPage() {
  const { mode, setMode, messages, setMessages, busy, setBusy, role, threads, setStudyPlan } =
    useApp()
  const [text, setText] = useState('')
  const [activeThread, setActiveThread] = useState(threads[0]?.id ?? 'current')
  const endRef = useRef<HTMLDivElement>(null)
  const isTeacher = role === 'teacher'

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || busy || !role) return
    const userMsg = {
      id: `u-${Date.now()}`,
      role: 'user' as const,
      content: trimmed,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setText('')
    setBusy(true)
    try {
      const reply = await mockInvoke({ role, text: trimmed, mode })
      setMessages((prev) => [...prev, reply])
      if (reply.payload?.type === 'study_plan') {
        setStudyPlan(reply.payload.plan)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className={`chat ${isTeacher ? 'chat--solo' : ''}`}>
      {!isTeacher ? (
        <aside className="chat-side surface">
          <div className="chat-side__head">
            <strong>会话</strong>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setActiveThread('current')}>
              新对话
            </button>
          </div>
          <div className="chat-side__list">
            <button
              type="button"
              className={`side-item ${activeThread === 'current' ? 'active' : ''}`}
              onClick={() => setActiveThread('current')}
            >
              <span>当前对话</span>
              <small>进行中</small>
            </button>
            {threads.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`side-item ${activeThread === t.id ? 'active' : ''}`}
                onClick={() => setActiveThread(t.id)}
              >
                <span className="side-item__title">
                  {t.title}
                  {t.privateHint ? <PrivateBadge /> : null}
                </span>
                <small>{t.lastActiveAt}</small>
              </button>
            ))}
          </div>
        </aside>
      ) : null}

      <div className="chat-main">
        <header className="chat__toolbar">
          <div>
            <h1 className="page-title">{isTeacher ? '教学助手' : '对话'}</h1>
            <p className="page-desc">
              {isTeacher ? '出题与教学答疑（不含学生支持侧）。' : '练习、出题或聊聊心情。'}
            </p>
          </div>
          <ModeChips value={mode} onChange={setMode} teacher={isTeacher} />
        </header>

        <div className="chat__stage surface">
          <div className="chat__stream" aria-live="polite">
            {messages.map((m) => (
              <ChatBubble key={m.id} message={m} />
            ))}
            {busy ? (
              <div className="typing">
                <span />
                <span />
                <span />
              </div>
            ) : null}
            <div ref={endRef} />
          </div>

          <form className="chat__composer" onSubmit={onSubmit}>
            <textarea
              className="field chat__input"
              rows={2}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                mode === 'counsel'
                  ? '想聊聊最近的学习压力或心情…'
                  : mode === 'question_gen'
                    ? '例如：二次函数选择题 3 道'
                    : '输入消息，Enter 发送'
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void onSubmit(e)
                }
              }}
            />
            <button className="btn btn-accent" type="submit" disabled={busy || !text.trim()}>
              发送
            </button>
          </form>
        </div>
      </div>

      <style>{`
        .chat {
          display: grid;
          grid-template-columns: var(--sidebar-w) minmax(0, 1fr);
          gap: 0.75rem;
          min-height: calc(100vh - var(--header-h) - 1.7rem);
          align-items: stretch;
        }
        .chat--solo {
          grid-template-columns: 1fr;
        }
        .chat-side {
          display: grid;
          grid-template-rows: auto 1fr;
          min-height: 0;
          overflow: hidden;
        }
        .chat-side__head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.55rem 0.65rem;
          border-bottom: 1px solid var(--line);
          font-size: 0.82rem;
        }
        .chat-side__list {
          overflow: auto;
          padding: 0.35rem;
          display: grid;
          gap: 0.25rem;
          align-content: start;
        }
        .side-item {
          display: grid;
          gap: 0.15rem;
          text-align: left;
          border: 1px solid transparent;
          background: transparent;
          padding: 0.5rem 0.55rem;
          border-radius: var(--radius-sm);
          cursor: pointer;
          color: var(--ink);
        }
        .side-item small {
          color: var(--ink-faint);
          font-size: 0.72rem;
        }
        .side-item:hover {
          background: #f4f7f5;
        }
        .side-item.active {
          background: var(--accent-soft);
          border-color: rgba(15, 107, 92, 0.2);
        }
        .side-item__title {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.82rem;
          font-weight: 550;
        }
        .chat-main {
          display: grid;
          grid-template-rows: auto 1fr;
          gap: 0.55rem;
          min-width: 0;
          min-height: 0;
        }
        .chat__toolbar {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: end;
          gap: 0.55rem;
        }
        .chat__stage {
          display: grid;
          grid-template-rows: 1fr auto;
          min-height: 0;
          height: calc(100vh - var(--header-h) - 6.2rem);
          overflow: hidden;
        }
        .chat__stream {
          overflow: auto;
          display: grid;
          gap: 0.65rem;
          align-content: start;
          padding: 0.85rem 1rem;
        }
        .chat__composer {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 0.5rem;
          align-items: end;
          padding: 0.65rem 0.75rem;
          border-top: 1px solid var(--line);
          background: #fafbfa;
        }
        .chat__input {
          min-height: 56px;
          resize: none;
        }
        .typing {
          display: inline-flex;
          gap: 4px;
          padding: 0.45rem 0.65rem;
          width: fit-content;
          border: 1px solid var(--line);
          background: #fff;
          border-radius: var(--radius-sm);
        }
        .typing span {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--ink-faint);
          animation: bounce 1.1s ease-in-out infinite;
        }
        .typing span:nth-child(2) { animation-delay: 0.15s; }
        .typing span:nth-child(3) { animation-delay: 0.3s; }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-3px); opacity: 1; }
        }
        @media (max-width: 900px) {
          .chat {
            grid-template-columns: 1fr;
          }
          .chat-side {
            max-height: 160px;
          }
          .chat__stage {
            height: calc(100vh - var(--header-h) - 14rem);
          }
        }
        @media (max-width: 640px) {
          .chat__composer { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  )
}
