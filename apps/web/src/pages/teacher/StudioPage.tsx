import { useRef, useState, type FormEvent } from 'react'
import { FileAttachControl } from '../../components/FileAttachControl'
import type { ChatAttachment, QuestionItem } from '../../types'

export function StudioPage() {
  const [subject, setSubject] = useState('数学')
  const [knowledge, setKnowledge] = useState('二次函数')
  const [count, setCount] = useState(3)
  const [difficulty, setDifficulty] = useState(3)
  const [sourceMode, setSourceMode] = useState<'knowledge' | 'file' | 'mixed'>('knowledge')
  const [files, setFiles] = useState<ChatAttachment[]>([])
  const [questions, setQuestions] = useState<QuestionItem[]>([])
  const [loading, setLoading] = useState(false)
  const [sourceNote, setSourceNote] = useState('')
  const dropRef = useRef<HTMLDivElement>(null)

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
    setQuestions(list)
    setSourceNote(
      fromFile
        ? `已基于 ${files.length} 个文件${sourceMode === 'mixed' ? ' + 知识点' : ''} 生成（Mock）`
        : '已按知识点参数生成（Mock）',
    )
    setLoading(false)
  }

  return (
    <section className="studio">
      <header>
        <h1 className="page-title">出题台</h1>
        <p className="page-desc">
          按知识点组卷，或上传讲义/试卷文件出题。不会读取学生心情或支持侧画像。
        </p>
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
            {loading ? '生成中…' : '生成题包'}
          </button>
        </div>
      </form>

      {sourceNote ? <p className="muted studio-note">{sourceNote}</p> : null}

      <div className="studio-result">
        {questions.length === 0 ? (
          <div className="studio-empty surface">
            <div className="studio-empty__item">
              <strong>知识点出题</strong>
              <p className="muted">学科 + 知识点 + 数量/难度，适合按课标组卷。</p>
            </div>
            <div className="studio-empty__item">
              <strong>文件出题</strong>
              <p className="muted">上传讲义、试卷或习题扫描件，按材料变式/仿写出题。</p>
            </div>
            <div className="studio-empty__item">
              <strong>数据边界</strong>
              <p className="muted">仅教学材料；不读学生 support 画像。重要用途请人工审题。</p>
            </div>
          </div>
        ) : (
          questions.map((q, i) => (
            <article key={i} className="surface q">
              <strong>
                第 {i + 1} 题 · 难度 {q.difficulty}
              </strong>
              <p>{q.stem}</p>
              <p className="muted">答案：{q.answer}</p>
              <p className="muted">解析：{q.explanation}</p>
            </article>
          ))
        )}
      </div>
      <style>{`
        .studio { display: grid; gap: 0.75rem; }
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
        .studio-result {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.55rem;
        }
        .studio-empty {
          grid-column: 1 / -1;
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
