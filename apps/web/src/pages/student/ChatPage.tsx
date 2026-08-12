import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChatBubble, type PackSaveActions } from '../../components/ChatBubble'
import { FileAttachControl } from '../../components/FileAttachControl'
import { ModeChips } from '../../components/ModeChips'
import { PrivateBadge } from '../../components/PrivateBadge'
import { SharedMaterialPicker } from '../../components/SharedMaterialPicker'
import { useApp } from '../../context/AppContext'
import { mockInvoke } from '../../mock/agent'
import type { ChatAttachment, QuestionItem } from '../../types'

export function ChatPage() {
  const {
    mode,
    setMode,
    messages,
    setMessages,
    busy,
    setBusy,
    role,
    threads,
    setStudyPlan,
    questionPacks,
    createQuestionPack,
    appendPackVersion,
    chatPackId,
    clearChatPack,
    attachPackToChat,
  } = useApp()
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const [files, setFiles] = useState<ChatAttachment[]>([])
  const [activeThread, setActiveThread] = useState(threads[0]?.id ?? 'current')
  const [packFlash, setPackFlash] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const isTeacher = role === 'teacher'
  const activeThreads = threads.filter((t) => t.status !== 'archived')
  const activeMeta = activeThreads.find((t) => t.id === activeThread)
  const chatPack = useMemo(
    () => (chatPackId ? questionPacks.find((p) => p.id === chatPackId) ?? null : null),
    [chatPackId, questionPacks],
  )

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, busy])

  const packSave = useMemo<PackSaveActions | undefined>(() => {
    if (!isTeacher) return undefined
    return {
      onSaveToStudio: (questions: QuestionItem[], meta) => {
        const targetId = chatPackId || meta?.packId
        if (targetId && questionPacks.some((p) => p.id === targetId)) {
          const next = appendPackVersion({
            packId: targetId,
            questions,
            source: 'chat_save',
            note: '对话整理后存入',
          })
          if (next) {
            attachPackToChat(next.id)
            setPackFlash(`已写入题包「${next.title}」v${next.currentVersion}`)
          }
        } else {
          const pack = createQuestionPack({
            title: `对话整理 · ${questions.length} 题`,
            subject: '数学',
            knowledge: questions[0]?.knowledgeTags?.[0] || '综合',
            questions,
            source: 'chat_save',
            note: '由助手对话整理新建',
          })
          attachPackToChat(pack.id)
          setPackFlash(`已新建题包「${pack.title}」v1`)
        }
        navigate('/teacher/studio')
      },
    }
  }, [
    isTeacher,
    chatPackId,
    questionPacks,
    appendPackVersion,
    createQuestionPack,
    attachPackToChat,
    navigate,
  ])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    if ((!trimmed && files.length === 0) || busy || !role) return
    const attached = [...files]
    const packHint =
      isTeacher && chatPack
        ? `\n\n（当前关联题包：${chatPack.title} v${chatPack.currentVersion}，请在此基础上改题）`
        : ''
    const userMsg = {
      id: `u-${Date.now()}`,
      role: 'user' as const,
      content:
        (trimmed ||
          (attached.length ? `（已附上 ${attached.length} 个文件，请结合材料回答）` : '')) +
        packHint,
      createdAt: new Date().toISOString(),
      attachments: attached.length ? attached : undefined,
      private: mode === 'counsel',
    }
    setMessages((prev) => [...prev, userMsg])
    setText('')
    setFiles([])
    setBusy(true)
    try {
      const reply = await mockInvoke({
        role,
        text: trimmed || userMsg.content,
        mode,
        attachments: attached,
      })
      // Tag AI question packs with active studio pack for save-as-version
      if (
        isTeacher &&
        chatPack &&
        reply.payload?.type === 'question_set'
      ) {
        reply.payload = {
          ...reply.payload,
          packId: chatPack.id,
          packVersion: chatPack.currentVersion,
        }
      }
      setMessages((prev) => [...prev, reply])
      if (reply.payload?.type === 'study_plan') {
        setStudyPlan(reply.payload.plan)
      }
    } finally {
      setBusy(false)
    }
  }

  function startNew() {
    setActiveThread('current')
    setMessages([])
    setFiles([])
  }

  return (
    <section className={`chat ${isTeacher ? 'chat--solo' : ''}`}>
      {!isTeacher ? (
        <aside className="chat-side">
          <div className="chat-side__head">
            <div>
              <strong>会话</strong>
              <p className="chat-side__sub">继续或新开对话</p>
            </div>
            <button type="button" className="btn btn-accent btn-sm" onClick={startNew}>
              新对话
            </button>
          </div>
          <div className="chat-side__list">
            <button
              type="button"
              className={`side-item ${activeThread === 'current' ? 'active' : ''}`}
              onClick={() => setActiveThread('current')}
            >
              <span className="side-item__title">当前对话</span>
              <small>进行中</small>
            </button>
            {activeThreads.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`side-item ${activeThread === t.id ? 'active' : ''}`}
                onClick={() => setActiveThread(t.id)}
              >
                <span className="side-item__title">
                  {t.pinned ? <span className="side-pin">置顶</span> : null}
                  {t.title}
                  {t.privateHint ? <PrivateBadge /> : null}
                </span>
                <small>
                  {t.lastActiveAt}
                  {t.messageCount ? ` · ${t.messageCount} 条` : ''}
                </small>
              </button>
            ))}
          </div>
        </aside>
      ) : null}

      <div className="chat-main">
        <header className="chat__toolbar">
          <div className="chat__title-block">
            <h1 className="page-title">
              {isTeacher ? '教学助手' : activeMeta?.title || '对话'}
            </h1>
            <p className="page-desc">
              {isTeacher
                ? '讨论后把题包存入出题台；同一题包保留修改历史。不含学生支持侧。'
                : activeMeta
                  ? `续聊 · ${activeMeta.lastActiveAt}`
                  : '练习、出题、学习计划或聊聊心情'}
            </p>
          </div>
          <div className="chat__toolbar-actions">
            {isTeacher ? (
              <Link className="btn btn-sm" to="/teacher/studio">
                打开出题台
              </Link>
            ) : null}
            <ModeChips value={mode} onChange={setMode} teacher={isTeacher} />
          </div>
        </header>

        {isTeacher && chatPack ? (
          <div className="pack-banner" role="status">
            <span>
              当前题包：<strong>{chatPack.title}</strong> · v{chatPack.currentVersion} ·{' '}
              {chatPack.versions[chatPack.versions.length - 1]?.questions.length ?? 0} 题
            </span>
            <Link to="/teacher/studio">管理</Link>
            <button type="button" className="pack-banner__x" onClick={() => clearChatPack()}>
              解除关联
            </button>
          </div>
        ) : null}

        {packFlash ? (
          <div className="pack-banner pack-banner--ok" role="status">
            <span>{packFlash}</span>
            <Link to="/teacher/studio" onClick={() => setPackFlash(null)}>
              查看出题台
            </Link>
            <button type="button" className="pack-banner__x" onClick={() => setPackFlash(null)}>
              关闭
            </button>
          </div>
        ) : null}

        <div className="chat__stage">
          <div className="chat__stream" aria-live="polite">
            {messages.length === 0 && !busy ? (
              <div className="chat-empty">
                <div className="chat-empty__mark" aria-hidden>
                  <span />
                  <span />
                </div>
                {isTeacher ? (
                  <>
                    <h2>和 AI 完善题包</h2>
                    <p>
                      可先在出题台生成题包并「添加到对话」；也可在这里出题，再点「存入出题台」归档与回溯。
                    </p>
                    <div className="chat-empty__hints">
                      {(
                        [
                          ['按这份讲义出 3 道中档题', 'question_gen'],
                          ['把第 2 题改成填空并提高难度', 'question_gen'],
                          ['整理成一套可考试审阅的题包', 'question_gen'],
                        ] as const
                      ).map(([label, m]) => (
                        <button
                          key={label}
                          type="button"
                          className="hint-chip"
                          onClick={() => {
                            setMode(m)
                            setText(label)
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <h2>今天想练什么？</h2>
                    <p>可选校本资料让 AI 出题并带你做，或直接描述知识点。</p>
                    <div className="chat-empty__hints">
                      {(
                        [
                          ['按校本讲义出题并讲解', 'question_gen'],
                          ['练习二次函数选择', 'practice'],
                          ['帮我定两周计划', 'study_plan'],
                        ] as const
                      ).map(([label, m]) => (
                        <button
                          key={label}
                          type="button"
                          className="hint-chip"
                          onClick={() => {
                            setMode(m)
                            setText(label)
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : null}

            {messages.map((m) => (
              <ChatBubble key={m.id} message={m} packSave={packSave} />
            ))}
            {busy ? (
              <div className="typing-row">
                <span className="typing-avatar" aria-hidden>
                  A
                </span>
                <div className="typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            ) : null}
            <div ref={endRef} />
          </div>

          <form className="chat__composer" onSubmit={onSubmit}>
            <div className="composer-shell">
              <div className="composer-lib">
                <SharedMaterialPicker
                  files={files}
                  onChange={setFiles}
                  compact
                  disabled={busy}
                  forRole={isTeacher ? 'teacher' : 'student'}
                />
              </div>
              {files.length > 0 ? (
                <div className="composer-files">
                  <FileAttachControl
                    files={files}
                    onChange={setFiles}
                    compact
                    disabled={busy}
                    showButton={false}
                  />
                </div>
              ) : null}
              <textarea
                className="chat__input"
                rows={2}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  isTeacher
                    ? chatPack
                      ? `继续完善「${chatPack.title}」…例如：第 1 题加提示，整体提高一档难度`
                      : '出题或讨论材料 · 可引用校本资料 · 生成后可「存入出题台」'
                    : mode === 'counsel'
                      ? '想聊聊最近的学习压力或心情…也可附上作业截图（仅你可见）'
                      : mode === 'question_gen' || mode === 'practice'
                        ? '例如：按校本讲义出 3 道题并带我做 · 可点「引用校本资料」'
                        : mode === 'study_plan'
                          ? '例如：两周二次函数巩固，每天 15 分钟'
                          : '输入消息、引用校本资料或添加文件，Enter 发送'
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    void onSubmit(e)
                  }
                }}
              />
              <div className="composer-bar">
                <div className="composer-bar__left">
                  <span className="composer-mode">{modeLabel(mode)}</span>
                  <FileAttachControl
                    files={files}
                    onChange={setFiles}
                    compact
                    disabled={busy}
                    showList={false}
                  />
                </div>
                <button
                  className="btn btn-accent composer-send"
                  type="submit"
                  disabled={busy || (!text.trim() && files.length === 0)}
                >
                  发送
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        .chat {
          display: grid;
          grid-template-columns: 232px minmax(0, 1fr);
          gap: 0;
          height: calc(100vh - var(--header-h) - 1.95rem);
          min-height: 0;
          border: 1px solid var(--line);
          background: #fff;
          overflow: hidden;
        }
        .chat--solo {
          grid-template-columns: 1fr;
        }
        .chat-side {
          display: grid;
          grid-template-rows: auto minmax(0, 1fr);
          min-height: 0;
          overflow: hidden;
          background: linear-gradient(180deg, #f3f7f5 0%, #eef3f0 100%);
          border-right: 1px solid var(--line);
        }
        .chat-side__head {
          display: flex;
          justify-content: space-between;
          align-items: start;
          gap: 0.5rem;
          padding: 0.85rem 0.8rem 0.7rem;
          border-bottom: 1px solid var(--line);
        }
        .chat-side__head strong {
          font-size: 0.88rem;
          font-family: var(--font-display);
        }
        .chat-side__sub {
          margin: 0.15rem 0 0;
          font-size: 0.7rem;
          color: var(--ink-faint);
        }
        .chat-side__list {
          overflow: auto;
          padding: 0.45rem;
          display: grid;
          gap: 0.2rem;
          align-content: start;
          min-height: 0;
        }
        .side-item {
          display: grid;
          gap: 0.18rem;
          text-align: left;
          border: 0;
          border-left: 2px solid transparent;
          background: transparent;
          padding: 0.55rem 0.6rem;
          cursor: pointer;
          color: var(--ink);
          transition: background 0.12s ease, border-color 0.12s ease;
        }
        .side-item small {
          color: var(--ink-faint);
          font-size: 0.7rem;
        }
        .side-item:hover {
          background: rgba(255,255,255,0.65);
        }
        .side-item.active {
          background: #fff;
          border-left-color: var(--accent);
          box-shadow: var(--shadow-sm);
        }
        .side-item__title {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.3rem;
          font-size: 0.82rem;
          font-weight: 550;
          line-height: 1.3;
        }
        .side-pin {
          font-size: 0.62rem;
          font-weight: 650;
          color: var(--accent);
          background: var(--accent-soft);
          padding: 0.05rem 0.28rem;
        }
        .chat-main {
          display: flex;
          flex-direction: column;
          min-width: 0;
          min-height: 0;
          height: 100%;
          background:
            radial-gradient(ellipse 80% 50% at 50% -10%, rgba(15, 107, 92, 0.06), transparent 55%),
            #f7f9f8;
        }
        .chat__toolbar {
          flex-shrink: 0;
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 0.65rem;
          padding: 0.7rem 1rem;
          background: rgba(255,255,255,0.88);
          border-bottom: 1px solid var(--line);
          backdrop-filter: blur(6px);
        }
        .chat__title-block { min-width: 0; }
        .chat__toolbar-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.45rem;
        }
        .pack-banner {
          flex-shrink: 0;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.55rem;
          padding: 0.45rem 1rem;
          font-size: 0.78rem;
          background: #eef4f1;
          border-bottom: 1px solid var(--line);
          color: var(--ink);
        }
        .pack-banner--ok {
          background: var(--accent-soft);
          border-bottom-color: color-mix(in srgb, var(--accent) 25%, var(--line));
        }
        .pack-banner a {
          color: var(--accent);
          font-weight: 650;
          text-decoration: none;
        }
        .pack-banner__x {
          margin-left: auto;
          border: 0;
          background: transparent;
          color: var(--ink-muted);
          cursor: pointer;
          font-size: 0.74rem;
        }
        .chat__stage {
          flex: 1;
          min-height: 0;
          display: grid;
          grid-template-rows: minmax(0, 1fr) auto;
          overflow: hidden;
        }
        .chat__stream {
          min-height: 0;
          overflow: auto;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          padding: 1.1rem 1.15rem 1.25rem;
          max-width: 820px;
          width: 100%;
          margin: 0 auto;
        }
        .chat-empty {
          margin: auto;
          text-align: center;
          padding: 2rem 1rem;
          max-width: 22rem;
          animation: riseIn 0.35s ease both;
        }
        .chat-empty__mark {
          width: 2.6rem;
          height: 2.6rem;
          margin: 0 auto 0.85rem;
          background: var(--ink);
          position: relative;
          display: grid;
          place-items: center;
        }
        .chat-empty__mark span {
          position: absolute;
          width: 52%;
          height: 2px;
          background: #7dceb8;
          transform-origin: left center;
        }
        .chat-empty__mark span:first-child {
          transform: translate(-8%, -3px) rotate(28deg);
        }
        .chat-empty__mark span:last-child {
          transform: translate(-8%, 5px) rotate(-28deg);
          opacity: 0.65;
        }
        .chat-empty h2 {
          margin: 0;
          font-size: 1.15rem;
        }
        .chat-empty p {
          margin: 0.4rem 0 0.9rem;
          color: var(--ink-muted);
          font-size: 0.84rem;
          line-height: 1.45;
        }
        .chat-empty__hints {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.35rem;
        }
        .hint-chip {
          border: 1px solid var(--line-strong);
          background: #fff;
          padding: 0.35rem 0.65rem;
          font-size: 0.78rem;
          color: var(--ink-muted);
          cursor: pointer;
          transition: 0.12s ease;
        }
        .hint-chip:hover {
          color: var(--accent);
          border-color: var(--accent);
          background: var(--accent-soft);
        }
        .chat__composer {
          flex-shrink: 0;
          padding: 0.65rem 1rem 0.85rem;
          background: linear-gradient(180deg, transparent, rgba(247,249,248,0.95) 30%);
          max-width: 820px;
          width: 100%;
          margin: 0 auto;
        }
        .composer-shell {
          border: 1px solid var(--line-strong);
          background: #fff;
          box-shadow: 0 8px 24px rgba(20, 28, 25, 0.05);
          display: grid;
          transition: border-color 0.12s ease, box-shadow 0.12s ease;
        }
        .composer-lib {
          padding: 0.45rem 0.55rem 0;
        }
        .composer-shell:focus-within {
          border-color: var(--accent);
          box-shadow: 0 0 0 2px rgba(15, 107, 92, 0.12), 0 8px 24px rgba(20, 28, 25, 0.05);
        }
        .chat__input {
          width: 100%;
          border: 0;
          outline: none;
          resize: none;
          min-height: 52px;
          max-height: 140px;
          padding: 0.75rem 0.85rem 0.35rem;
          background: transparent;
          font-size: 0.9rem;
          line-height: 1.45;
          color: var(--ink);
        }
        .composer-files {
          padding: 0.55rem 0.75rem 0;
          border-bottom: 1px solid #eef2f0;
        }
        .composer-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.5rem;
          padding: 0.35rem 0.55rem 0.55rem 0.65rem;
          border-top: 1px solid #eef2f0;
        }
        .composer-bar__left {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.35rem;
          min-width: 0;
        }
        .composer-mode {
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--accent);
          background: var(--accent-soft);
          padding: 0.18rem 0.45rem;
        }
        .composer-send {
          min-width: 4.5rem;
        }
        .typing-row {
          display: flex;
          align-items: flex-end;
          gap: 0.5rem;
        }
        .typing-avatar {
          width: 1.7rem;
          height: 1.7rem;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          background: var(--ink);
          color: #7dceb8;
          font-size: 0.68rem;
          font-weight: 700;
        }
        .typing {
          display: inline-flex;
          gap: 4px;
          padding: 0.65rem 0.8rem;
          width: fit-content;
          border: 1px solid var(--line);
          background: #fff;
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
        @keyframes riseIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: none; }
        }
        @media (max-width: 900px) {
          .chat {
            grid-template-columns: 1fr;
            grid-template-rows: auto minmax(0, 1fr);
            height: calc(100vh - var(--header-h) - 1.6rem);
          }
          .chat-side {
            max-height: 132px;
            border-right: 0;
            border-bottom: 1px solid var(--line);
          }
        }
      `}</style>
    </section>
  )
}

function modeLabel(mode: string) {
  const map: Record<string, string> = {
    auto: '自动',
    practice: '练习',
    question_gen: '出题',
    study_plan: '学习计划',
    counsel: '心情',
  }
  return map[mode] || mode
}
