import { useState, type FormEvent } from 'react'
import type { QuestionItem } from '../../types'

export function StudioPage() {
  const [subject, setSubject] = useState('数学')
  const [knowledge, setKnowledge] = useState('二次函数')
  const [count, setCount] = useState(3)
  const [difficulty, setDifficulty] = useState(3)
  const [questions, setQuestions] = useState<QuestionItem[]>([])
  const [loading, setLoading] = useState(false)

  async function onGenerate(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    await new Promise((r) => setTimeout(r, 500))
    const list: QuestionItem[] = Array.from({ length: count }, (_, i) => ({
      stem: `【${subject}·${knowledge}】示例题 ${i + 1}：请写出一个与「${knowledge}」相关的关键结论或计算步骤。`,
      type: 'short_answer',
      answer: '（Mock 答案占位）',
      explanation: '前端 Mock 题包，接入后端后由出题 Agent + review 生成。',
      knowledgeTags: [knowledge],
      difficulty,
    }))
    setQuestions(list)
    setLoading(false)
  }

  return (
    <section className="studio">
      <header>
        <h1 className="page-title">出题台</h1>
        <p className="page-desc">结构化组卷。不会读取学生心情或支持侧画像。</p>
      </header>
      <form className="surface studio-form" onSubmit={onGenerate}>
        <label>
          学科
          <input className="field" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </label>
        <label>
          知识点
          <input
            className="field"
            value={knowledge}
            onChange={(e) => setKnowledge(e.target.value)}
          />
        </label>
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
      </form>
      <div className="studio-result">
        {questions.length === 0 ? (
          <div className="studio-empty surface">
            <div className="studio-empty__item">
              <strong>出题范围</strong>
              <p className="muted">按学科 + 知识点生成短答题，可调数量与难度。</p>
            </div>
            <div className="studio-empty__item">
              <strong>数据边界</strong>
              <p className="muted">仅使用教学侧参数，不会读取学生支持画像。</p>
            </div>
            <div className="studio-empty__item">
              <strong>后续接入</strong>
              <p className="muted">后端出题 Agent + review 通过后，结果会直接替换本 Mock。</p>
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
          grid-template-columns: repeat(4, minmax(0, 1fr)) auto;
          gap: 0.55rem;
          align-items: end;
          padding: 0.75rem 0.85rem;
        }
        .studio-form label {
          display: grid;
          gap: 0.25rem;
          font-size: 0.8rem;
          color: var(--ink-muted);
        }
        .studio-form .btn { align-self: end; white-space: nowrap; }
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
          .studio-form { grid-template-columns: 1fr 1fr; }
          .studio-form .btn { grid-column: 1 / -1; justify-self: start; }
          .studio-empty { grid-template-columns: 1fr; }
          .studio-empty__item { border-right: 0; border-bottom: 1px solid var(--line); }
          .studio-empty__item:last-child { border-bottom: 0; }
        }
        @media (max-width: 640px) {
          .studio-form { grid-template-columns: 1fr; }
          .studio-result { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  )
}
