import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FileAttachControl } from '../../components/FileAttachControl'
import { useApp } from '../../context/AppContext'
import type { ChatAttachment, QuestionItem, QuestionPack } from '../../types'

const sourceZh = {
  studio_gen: '出题台生成',
  chat_save: '对话整理存入',
  manual_edit: '手动编辑',
} as const

function currentQuestions(pack: QuestionPack): QuestionItem[] {
  const v = pack.versions.find((x) => x.version === pack.currentVersion)
  return v?.questions ?? pack.versions[pack.versions.length - 1]?.questions ?? []
}

export function StudioPage() {
  const {
    questionPacks,
    createQuestionPack,
    appendPackVersion,
    attachPackToChat,
    chatPackId,
    setMessages,
    setMode,
  } = useApp()
  const navigate = useNavigate()
  const [subject, setSubject] = useState('数学')
  const [knowledge, setKnowledge] = useState('二次函数')
  const [count, setCount] = useState(3)
  const [difficulty, setDifficulty] = useState(3)
  const [sourceMode, setSourceMode] = useState<'knowledge' | 'file' | 'mixed'>('knowledge')
  const [files, setFiles] = useState<ChatAttachment[]>([])
  const [loading, setLoading] = useState(false)
  const [sourceNote, setSourceNote] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(
    chatPackId ?? questionPacks[0]?.id ?? null,
  )
  const [historyVersion, setHistoryVersion] = useState<number | null>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatPackId) {
      setSelectedId(chatPackId)
      setHistoryVersion(null)
    }
  }, [chatPackId])

  const selected = useMemo(
    () => questionPacks.find((p) => p.id === selectedId) ?? null,
    [questionPacks, selectedId],
  )

  const viewingQuestions = useMemo(() => {
    if (!selected) return []
    if (historyVersion == null) return currentQuestions(selected)
    return selected.versions.find((v) => v.version === historyVersion)?.questions ?? []
  }, [selected, historyVersion])

  async function onGenerate(e: FormEvent) {
    e.preventDefault()
    if ((sourceMode === 'file' || sourceMode === 'mixed') && files.length === 0) {
      alert('请先添加教材 / 试卷 / 讲义等文件')
      return
    }
    setLoading(true)
    await new Promise((r) => setTimeout(r, 550))
    const fromFile = files.length > 0
    const tag = fromFile ? `${knowledge || '材料要点'}` : knowledge
    const fileHint = fromFile ? `（参考：${files.map((f) => f.name).join('、')}）` : ''
    const list: QuestionItem[] = Array.from({ length: count }, (_, i) => ({
      stem: `【${subject}·${tag}】示例题 ${i + 1}${fileHint}：请写出一个与材料/知识点相关的关键结论或计算步骤。`,
      type: 'short_answer',
      answer: '（Mock 答案占位）',
      explanation: fromFile
        ? '前端 Mock：接入后端后将解析上传文件并经出题 Agent + review 生成。'
        : '前端 Mock 题包，接入后端后由出题 Agent + review 生成。',
      knowledgeTags: [tag],
      difficulty,
    }))
    const pack = createQuestionPack({
      title: `${subject} · ${tag}`,
      subject,
      knowledge: tag,
      questions: list,
      source: 'studio_gen',
      note: fromFile
        ? `按${sourceMode === 'mixed' ? '文件+知识点' : '文件'}生成`
        : '按知识点生成',
    })
    setSelectedId(pack.id)
    setHistoryVersion(null)
    setSourceNote(`已存为题包「${pack.title}」v1，可添加至对话继续完善`)
    setLoading(false)
  }

  function addPackToChat(pack: QuestionPack) {
    const qs = currentQuestions(pack)
    attachPackToChat(pack.id)
    setMode('question_gen')
    setMessages((prev) => [
      ...prev,
      {
        id: `sys-pack-${Date.now()}`,
        role: 'assistant',
        content: `已添加题包「${pack.title}」v${pack.currentVersion}（${qs.length} 题）到本对话。你可以直接说要改哪一题、加难度或换题型；整理满意后点「存入出题台」会写入该题包的新版本。`,
        intent: 'question_gen',
        createdAt: new Date().toISOString(),
        payload: {
          type: 'question_set',
          questions: qs,
          packId: pack.id,
          packVersion: pack.currentVersion,
        },
      },
    ])
    navigate('/teacher/chat')
  }

  function restoreVersion(pack: QuestionPack, version: number) {
    const snap = pack.versions.find((v) => v.version === version)
    if (!snap) return
    const next = appendPackVersion({
      packId: pack.id,
      questions: snap.questions,
      source: 'manual_edit',
      note: `从 v${version} 恢复为当前`,
      subject: snap.subject,
      knowledge: snap.knowledge,
    })
    if (next) {
      setHistoryVersion(null)
      setSourceNote(`已从 v${version} 恢复，当前为 v${next.currentVersion}`)
    }
  }

  return (
    <section className="studio">
      <header className="studio-head">
        <div>
          <h1 className="page-title">出题台</h1>
          <p className="page-desc">
            题包可追溯、可版本管理：生成后「添加到对话」与 AI 完善，再存回同一题包留下修改历史。
          </p>
        </div>
        <Link className="btn btn-sm" to="/teacher/chat">
          打开助手
        </Link>
      </header>

      <form className="surface studio-form" onSubmit={onGenerate}>
        <div className="studio-mode">
          <span className="studio-mode__label">出题来源</span>
          <div className="chip-row" role="group" aria-label="出题来源">
            {(
              [
                ['knowledge', '按知识点'],
                ['file', '按文件'],
                ['mixed', '文件 + 知识点'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`chip ${sourceMode === id ? 'active' : ''}`}
                onClick={() => setSourceMode(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {(sourceMode === 'file' || sourceMode === 'mixed') && (
          <div
            className="studio-files"
            ref={dropRef}
            onDragOver={(e) => {
              e.preventDefault()
              dropRef.current?.classList.add('is-drag')
            }}
            onDragLeave={() => dropRef.current?.classList.remove('is-drag')}
            onDrop={(e) => {
              e.preventDefault()
              dropRef.current?.classList.remove('is-drag')
              const list = e.dataTransfer.files
              if (!list?.length) return
              const next = [...files]
              for (const file of Array.from(list)) {
                if (next.length >= 5) break
                if (file.size > 10 * 1024 * 1024) continue
                next.push({
                  id: `f-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                  name: file.name,
                  size: file.size,
                  mime: file.type || 'application/octet-stream',
                  kind: /\.(png|jpe?g|webp)$/i.test(file.name)
                    ? 'image'
                    : /\.pdf$/i.test(file.name)
                      ? 'pdf'
                      : /\.(docx?)$/i.test(file.name)
                        ? 'doc'
                        : /\.(txt|md|csv)$/i.test(file.name)
                          ? 'text'
                          : 'other',
                })
              }
              setFiles(next)
            }}
          >
            <FileAttachControl
              files={files}
              onChange={setFiles}
              hint="支持 PDF / Word / 图片 / 文本，单文件 ≤10MB，最多 5 个"
            />
          </div>
        )}

        <div className="studio-params">
          <label>
            学科
            <input className="field" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </label>
          {sourceMode !== 'file' ? (
            <label>
              知识点
              <input
                className="field"
                value={knowledge}
                onChange={(e) => setKnowledge(e.target.value)}
              />
            </label>
          ) : (
            <label>
              侧重（可选）
              <input
                className="field"
                placeholder="如：综合应用 / 选择填空"
                value={knowledge}
                onChange={(e) => setKnowledge(e.target.value)}
              />
            </label>
          )}
          <label>
            数量
            <input
              className="field"
              type="number"
              min={1}
              max={10}
              value={count}
              onChange={(e) => setCount(Number(e.target.value) || 1)}
            />
          </label>
          <label>
            难度
            <input
              className="field"
              type="number"
              min={1}
              max={5}
              value={difficulty}
              onChange={(e) => setDifficulty(Number(e.target.value) || 3)}
            />
          </label>
          <button className="btn btn-accent" type="submit" disabled={loading}>
            {loading ? '生成中…' : '生成并归档题包'}
          </button>
        </div>
      </form>

      {sourceNote ? <p className="muted studio-note">{sourceNote}</p> : null}

      <div className="studio-board">
        <aside className="surface studio-packs">
          <div className="studio-packs__head">
            <strong>题包库</strong>
            <span className="muted">{questionPacks.length}</span>
          </div>
          {questionPacks.length === 0 ? (
            <p className="muted studio-packs__empty">生成后会出现在这里，可追溯管理。</p>
          ) : (
            <ul className="studio-packs__list">
              {questionPacks.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className={`pack-item ${selectedId === p.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedId(p.id)
                      setHistoryVersion(null)
                    }}
                  >
                    <span className="pack-item__title">{p.title}</span>
                    <small>
                      v{p.currentVersion} · {p.versions.length} 版 ·{' '}
                      {new Date(p.updatedAt).toLocaleDateString('zh-CN')}
                    </small>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <div className="studio-detail">
          {!selected ? (
            <div className="studio-empty surface">
              <div className="studio-empty__item">
                <strong>生成并归档</strong>
                <p className="muted">每次生成都会写入题包库，而不是一次性气泡。</p>
              </div>
              <div className="studio-empty__item">
                <strong>添加到对话</strong>
                <p className="muted">把题包带到助手里继续改题型、难度与解析。</p>
              </div>
              <div className="studio-empty__item">
                <strong>版本历史</strong>
                <p className="muted">同一题包可多次存回；可查看、对比、恢复某一版。</p>
              </div>
            </div>
          ) : (
            <>
              <div className="surface studio-detail__bar">
                <div>
                  <h2 className="studio-detail__title">{selected.title}</h2>
                  <p className="muted">
                    {selected.subject} · {selected.knowledge} · 当前 v
                    {historyVersion ?? selected.currentVersion}
                    {historyVersion != null && historyVersion !== selected.currentVersion
                      ? '（历史预览）'
                      : ''}
                  </p>
                </div>
                <div className="studio-detail__actions">
                  <button
                    type="button"
                    className="btn btn-sm btn-accent"
                    onClick={() => addPackToChat(selected)}
                  >
                    添加到对话
                  </button>
                </div>
              </div>

              <div className="studio-history surface">
                <strong className="studio-history__label">修改历史</strong>
                <ol className="studio-history__list">
                  {[...selected.versions].reverse().map((v) => (
                    <li key={v.id} className={historyVersion === v.version || (historyVersion == null && v.version === selected.currentVersion) ? 'is-on' : ''}>
                      <button
                        type="button"
                        className="hist-btn"
                        onClick={() =>
                          setHistoryVersion(
                            v.version === selected.currentVersion ? null : v.version,
                          )
                        }
                      >
                        <span>
                          v{v.version} · {sourceZh[v.source]}
                        </span>
                        <small>
                          {new Date(v.createdAt).toLocaleString('zh-CN')}
                          {v.note ? ` · ${v.note}` : ''}
                        </small>
                      </button>
                      {v.version !== selected.currentVersion ? (
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => restoreVersion(selected, v.version)}
                        >
                          恢复为此版
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="studio-result">
                {viewingQuestions.map((q, i) => (
                  <article key={i} className="surface q">
                    <strong>
                      第 {i + 1} 题 · 难度 {q.difficulty}
                    </strong>
                    <p>{q.stem}</p>
                    <p className="muted">答案：{q.answer}</p>
                    <p className="muted">解析：{q.explanation}</p>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        .studio { display: grid; gap: 0.75rem; }
        .studio-head {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: flex-start;
          gap: 0.75rem;
        }
        .studio-form {
          display: grid;
          gap: 0.75rem;
          padding: 0.75rem 0.85rem;
        }
        .studio-mode {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.55rem;
        }
        .studio-mode__label {
          font-size: 0.8rem;
          color: var(--ink-muted);
        }
        .studio-files {
          padding: 0.65rem 0.75rem;
          border: 1px dashed var(--line-strong);
          background: #fafbfa;
          transition: border-color 0.12s ease, background 0.12s ease;
        }
        .studio-files.is-drag {
          border-color: var(--accent);
          background: var(--accent-soft);
        }
        .studio-params {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr)) auto;
          gap: 0.55rem;
          align-items: end;
        }
        .studio-params label {
          display: grid;
          gap: 0.25rem;
          font-size: 0.8rem;
          color: var(--ink-muted);
        }
        .studio-params .btn { align-self: end; white-space: nowrap; }
        .studio-note { margin: 0; font-size: 0.78rem; }
        .studio-board {
          display: grid;
          grid-template-columns: 220px minmax(0, 1fr);
          gap: 0.65rem;
          align-items: start;
        }
        .studio-packs { padding: 0; overflow: hidden; }
        .studio-packs__head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.65rem 0.75rem;
          border-bottom: 1px solid var(--line);
          font-size: 0.86rem;
        }
        .studio-packs__empty {
          margin: 0;
          padding: 0.85rem;
          font-size: 0.8rem;
        }
        .studio-packs__list {
          list-style: none;
          margin: 0;
          padding: 0.35rem;
          display: grid;
          gap: 0.2rem;
          max-height: 28rem;
          overflow: auto;
        }
        .pack-item {
          width: 100%;
          text-align: left;
          border: 0;
          background: transparent;
          padding: 0.5rem 0.55rem;
          cursor: pointer;
          color: var(--ink);
          display: grid;
          gap: 0.15rem;
          border-left: 2px solid transparent;
        }
        .pack-item small { color: var(--ink-faint); font-size: 0.7rem; }
        .pack-item:hover { background: #f4f7f5; }
        .pack-item.active {
          background: #fff;
          border-left-color: var(--accent);
          box-shadow: var(--shadow-sm);
        }
        .pack-item__title {
          font-size: 0.82rem;
          font-weight: 650;
          line-height: 1.3;
        }
        .studio-detail { display: grid; gap: 0.55rem; min-width: 0; }
        .studio-detail__bar {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 0.55rem;
          padding: 0.7rem 0.85rem;
          align-items: center;
        }
        .studio-detail__title {
          margin: 0;
          font-size: 1rem;
          font-family: var(--font-display);
        }
        .studio-detail__actions { display: flex; gap: 0.35rem; }
        .studio-history { padding: 0.65rem 0.75rem; }
        .studio-history__label {
          display: block;
          font-size: 0.78rem;
          margin-bottom: 0.4rem;
          color: var(--ink-muted);
        }
        .studio-history__list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 0.3rem;
        }
        .studio-history__list li {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.4rem;
          padding: 0.35rem 0.45rem;
          border: 1px solid transparent;
        }
        .studio-history__list li.is-on {
          background: var(--accent-soft);
          border-color: color-mix(in srgb, var(--accent) 25%, var(--line));
        }
        .hist-btn {
          flex: 1;
          min-width: 12rem;
          text-align: left;
          border: 0;
          background: transparent;
          cursor: pointer;
          display: grid;
          gap: 0.1rem;
          color: var(--ink);
          font-size: 0.8rem;
          font-weight: 650;
          padding: 0;
        }
        .hist-btn small {
          font-weight: 400;
          color: var(--ink-faint);
          font-size: 0.7rem;
        }
        .studio-result {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.55rem;
        }
        .studio-empty {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0;
        }
        .studio-empty__item {
          padding: 0.75rem 0.85rem;
          border-right: 1px solid var(--line);
        }
        .studio-empty__item:last-child { border-right: 0; }
        .studio-empty__item strong { font-size: 0.86rem; }
        .studio-empty__item p { margin: 0.3rem 0 0; font-size: 0.8rem; line-height: 1.4; }
        .q { padding: 0.7rem 0.85rem; }
        .q strong { font-size: 0.86rem; }
        .q p { margin: 0.35rem 0 0; line-height: 1.45; font-size: 0.84rem; }
        @media (max-width: 900px) {
          .studio-params { grid-template-columns: 1fr 1fr; }
          .studio-params .btn { grid-column: 1 / -1; justify-self: start; }
          .studio-board { grid-template-columns: 1fr; }
          .studio-empty { grid-template-columns: 1fr; }
          .studio-empty__item { border-right: 0; border-bottom: 1px solid var(--line); }
          .studio-empty__item:last-child { border-bottom: 0; }
        }
        @media (max-width: 640px) {
          .studio-params { grid-template-columns: 1fr; }
          .studio-result { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  )
}
