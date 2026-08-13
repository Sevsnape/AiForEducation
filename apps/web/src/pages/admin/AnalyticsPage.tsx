import { useMemo, useState } from 'react'
import { mockModuleHotspots, mockStudentAskProfiles } from '../../mock/data'

export function AnalyticsPage() {
  const [q, setQ] = useState('')
  const [selectedId, setSelectedId] = useState(mockStudentAskProfiles[0]?.studentId ?? '')

  const filteredStudents = useMemo(() => {
    const key = q.trim()
    if (!key) return mockStudentAskProfiles
    return mockStudentAskProfiles.filter(
      (s) => s.displayName.includes(key) || s.studentId.includes(key),
    )
  }, [q])

  const selected =
    filteredStudents.find((s) => s.studentId === selectedId) || filteredStudents[0] || null

  const maxAsk = Math.max(...mockModuleHotspots.map((h) => h.askCount), 1)
  const totalAsks = mockModuleHotspots.reduce((a, h) => a + h.askCount, 0)
  const studentCount = mockStudentAskProfiles.length

  return (
    <section className="analytics">
      <header className="analytics__head">
        <div>
          <h1 className="page-title">学情分析</h1>
          <p className="page-desc">
            记录学生学业提问并聚合模块热点。
          </p>
        </div>
        <div className="analytics__kpis">
          <div>
            <span className="kpi-n">{totalAsks}</span>
            <span className="kpi-l">提问次数</span>
          </div>
          <div>
            <span className="kpi-n">{mockModuleHotspots.length}</span>
            <span className="kpi-l">活跃模块</span>
          </div>
          <div>
            <span className="kpi-n">{studentCount}</span>
            <span className="kpi-l">覆盖学生</span>
          </div>
        </div>
      </header>

      <div className="analytics__grid">
        <article className="surface panel">
          <h2>整体模块热点</h2>
          <p className="muted tiny">哪些知识点被问得最多、覆盖多少学生</p>
          <ul className="hot-list">
            {mockModuleHotspots.map((h, i) => (
              <li key={h.moduleTag}>
                <div className="hot-row">
                  <span className="hot-rank">{i + 1}</span>
                  <div className="hot-main">
                    <div className="hot-top">
                      <strong>{h.moduleTag}</strong>
                      <span className="muted">
                        {h.askCount} 次 · {h.uniqueStudents} 人
                      </span>
                    </div>
                    <div className="hot-bar" aria-hidden>
                      <i style={{ width: `${(h.askCount / maxAsk) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className="surface panel">
          <div className="panel__head">
            <div>
              <h2>学生提问分布</h2>
              <p className="muted tiny">每人常问哪些模块</p>
            </div>
            <input
              className="field"
              placeholder="搜索学生"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="student-split">
            <ul className="student-list">
              {filteredStudents.map((s) => (
                <li key={s.studentId}>
                  <button
                    type="button"
                    className={`student-item ${selected?.studentId === s.studentId ? 'active' : ''}`}
                    onClick={() => setSelectedId(s.studentId)}
                  >
                    <strong>{s.displayName}</strong>
                    <span className="muted">{s.totalAsks} 次</span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="student-detail">
              {selected ? (
                <>
                  <h3>
                    {selected.displayName}
                    <span className="muted"> · 共 {selected.totalAsks} 次</span>
                  </h3>
                  <table>
                    <thead>
                      <tr>
                        <th>模块</th>
                        <th>提问次数</th>
                        <th>占比</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.modules.map((m) => (
                        <tr key={m.moduleTag}>
                          <td>{m.moduleTag}</td>
                          <td>{m.askCount}</td>
                          <td>{Math.round((m.askCount / selected.totalAsks) * 100)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <p className="muted">暂无学生数据</p>
              )}
            </div>
          </div>
        </article>
      </div>

      <style>{`
        .analytics { display: grid; gap: 0.75rem; }
        .analytics__head {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: end;
          gap: 0.75rem;
        }
        .analytics__kpis {
          display: flex;
          border: 1px solid var(--line);
          background: #fff;
        }
        .analytics__kpis > div {
          display: grid;
          gap: 0.08rem;
          padding: 0.45rem 0.85rem;
          border-right: 1px solid var(--line);
          min-width: 5.2rem;
        }
        .analytics__kpis > div:last-child { border-right: 0; }
        .kpi-n {
          font-family: var(--font-display);
          font-size: 1.05rem;
          font-weight: 650;
        }
        .kpi-l { font-size: 0.7rem; color: var(--ink-faint); }
        .analytics__grid {
          display: grid;
          grid-template-columns: 1fr 1.35fr;
          gap: 0.55rem;
        }
        .panel { padding: 0.75rem 0.85rem; }
        .panel h2 { margin: 0; font-size: 0.95rem; }
        .panel h3 { margin: 0 0 0.45rem; font-size: 0.9rem; }
        .tiny { font-size: 0.74rem; margin: 0.2rem 0 0.55rem; }
        .hot-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.45rem; }
        .hot-row { display: flex; gap: 0.45rem; align-items: center; }
        .hot-rank {
          width: 1.35rem;
          height: 1.35rem;
          display: grid;
          place-items: center;
          font-size: 0.72rem;
          font-weight: 650;
          background: var(--accent-soft);
          color: var(--accent);
          border-radius: var(--radius-sm);
          flex-shrink: 0;
        }
        .hot-main { flex: 1; min-width: 0; }
        .hot-top {
          display: flex;
          justify-content: space-between;
          gap: 0.5rem;
          font-size: 0.82rem;
        }
        .hot-bar {
          margin-top: 0.28rem;
          height: 6px;
          background: #e8eeeb;
          border-radius: 1px;
          overflow: hidden;
        }
        .hot-bar i {
          display: block;
          height: 100%;
          background: var(--accent);
        }
        .panel__head {
          display: grid;
          grid-template-columns: 1fr minmax(120px, 180px);
          gap: 0.5rem;
          align-items: end;
          margin-bottom: 0.55rem;
        }
        .student-split {
          display: grid;
          grid-template-columns: 140px minmax(0, 1fr);
          gap: 0.55rem;
          min-height: 220px;
        }
        .student-list {
          list-style: none;
          margin: 0;
          padding: 0;
          border-right: 1px solid var(--line);
          display: grid;
          gap: 0.15rem;
          align-content: start;
        }
        .student-item {
          width: 100%;
          text-align: left;
          border: 0;
          background: transparent;
          padding: 0.4rem 0.45rem;
          cursor: pointer;
          display: grid;
          gap: 0.08rem;
          border-radius: var(--radius-sm);
          font-size: 0.82rem;
        }
        .student-item.active {
          background: var(--accent-soft);
          color: var(--accent);
        }
        .student-detail table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.82rem;
        }
        .student-detail th, .student-detail td {
          text-align: left;
          padding: 0.4rem 0.5rem;
          border-bottom: 1px solid var(--line);
        }
        .student-detail th {
          font-size: 0.72rem;
          color: var(--ink-muted);
          background: #f7f9f8;
        }
        @media (max-width: 900px) {
          .analytics__grid { grid-template-columns: 1fr; }
          .student-split { grid-template-columns: 1fr; }
          .student-list { border-right: 0; border-bottom: 1px solid var(--line); padding-bottom: 0.4rem; }
        }
      `}</style>
    </section>
  )
}
