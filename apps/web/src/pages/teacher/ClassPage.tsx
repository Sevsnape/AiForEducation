import { mockClassStudents, mockModuleHotspots } from '../../mock/data'

export function ClassPage() {
  const shared = mockClassStudents.filter((s) => s.shared)
  const avg =
    shared.length === 0
      ? 0
      : Math.round((shared.reduce((a, s) => a + s.accuracy, 0) / shared.length) * 100)
  const classHot = mockModuleHotspots.slice(0, 4)
  const maxAsk = Math.max(...classHot.map((h) => h.askCount), 1)

  return (
    <section className="class">
      <header className="class__head">
        <div>
          <h1 className="page-title">班级学情</h1>
          <p className="page-desc">仅展示已同意共享的学习侧指标与模块提问热点，不含心情内容。</p>
        </div>
        <div className="class__stats">
          <div>
            <span className="stat-n">{mockClassStudents.length}</span>
            <span className="stat-l">班级人数</span>
          </div>
          <div>
            <span className="stat-n">{shared.length}</span>
            <span className="stat-l">已授权</span>
          </div>
          <div>
            <span className="stat-n">{avg}%</span>
            <span className="stat-l">共享均正确率</span>
          </div>
        </div>
      </header>

      <div className="class__body">
        <div className="surface table-wrap">
          <table>
            <thead>
              <tr>
                <th>学生</th>
                <th>正确率</th>
                <th>薄弱点</th>
                <th>共享状态</th>
              </tr>
            </thead>
            <tbody>
              {mockClassStudents.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.shared ? `${Math.round(s.accuracy * 100)}%` : '—'}</td>
                  <td>{s.shared ? s.weakTags.join('、') || '—' : '—'}</td>
                  <td>
                    {s.shared ? (
                      <span className="ok">已授权</span>
                    ) : (
                      <span className="no">未授权</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <aside className="surface hot-panel">
          <h2>班级提问模块热点</h2>
          <p className="muted tiny">聚合学习侧提问；管理员后台有全校视图。</p>
          <ul>
            {classHot.map((h) => (
              <li key={h.moduleTag}>
                <div className="hot-line">
                  <strong>{h.moduleTag}</strong>
                  <span className="muted">
                    {h.askCount} 次 · {h.uniqueStudents} 人
                  </span>
                </div>
                <div className="hot-bar">
                  <i style={{ width: `${(h.askCount / maxAsk) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <style>{`
        .class { display: grid; gap: 0.75rem; }
        .class__head {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: end;
          gap: 0.75rem;
        }
        .class__stats {
          display: flex;
          gap: 0;
          border: 1px solid var(--line);
          background: #fff;
        }
        .class__stats > div {
          display: grid;
          gap: 0.1rem;
          padding: 0.45rem 0.85rem;
          border-right: 1px solid var(--line);
          min-width: 5.5rem;
        }
        .class__stats > div:last-child { border-right: 0; }
        .stat-n {
          font-family: var(--font-display);
          font-size: 1.05rem;
          font-weight: 650;
          line-height: 1.1;
        }
        .stat-l {
          font-size: 0.7rem;
          color: var(--ink-faint);
        }
        .class__body {
          display: grid;
          grid-template-columns: minmax(0, 1.6fr) minmax(220px, 0.9fr);
          gap: 0.55rem;
        }
        .table-wrap { overflow: auto; }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.84rem;
        }
        th, td {
          text-align: left;
          padding: 0.55rem 0.75rem;
          border-bottom: 1px solid var(--line);
        }
        th {
          color: var(--ink-muted);
          font-weight: 600;
          font-size: 0.75rem;
          background: #f7f9f8;
        }
        tr:last-child td { border-bottom: 0; }
        .ok { color: var(--accent); font-weight: 600; }
        .no { color: var(--ink-faint); }
        .hot-panel { padding: 0.75rem 0.85rem; }
        .hot-panel h2 { margin: 0; font-size: 0.92rem; }
        .tiny { margin: 0.2rem 0 0.55rem; font-size: 0.74rem; }
        .hot-panel ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.5rem; }
        .hot-line {
          display: flex;
          justify-content: space-between;
          gap: 0.4rem;
          font-size: 0.82rem;
        }
        .hot-bar {
          margin-top: 0.25rem;
          height: 6px;
          background: #e8eeeb;
          overflow: hidden;
        }
        .hot-bar i {
          display: block;
          height: 100%;
          background: var(--accent);
        }
        @media (max-width: 800px) {
          .class__body { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  )
}
