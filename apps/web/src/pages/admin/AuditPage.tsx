import { mockAudits } from '../../mock/data'

export function AuditPage() {
  return (
    <section className="audit">
      <header>
        <h1 className="page-title">审计日志</h1>
        <p className="page-desc">门禁拒绝、危机短路、账号启停等。不展示心理原文。</p>
      </header>
      <div className="surface table-wrap">
        <table>
          <thead>
            <tr>
              <th>时间</th>
              <th>操作者</th>
              <th>动作</th>
              <th>资源</th>
              <th>目的</th>
            </tr>
          </thead>
          <tbody>
            {mockAudits.map((a) => (
              <tr key={a.id}>
                <td>{a.at}</td>
                <td>{a.actor}</td>
                <td>
                  <code>{a.action}</code>
                </td>
                <td>{a.resource}</td>
                <td className="muted">{a.purpose}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <style>{`
        .audit { display: grid; gap: 0.75rem; }
        .table-wrap { overflow: auto; }
        table { width: 100%; border-collapse: collapse; font-size: 0.84rem; }
        th, td {
          text-align: left;
          padding: 0.55rem 0.75rem;
          border-bottom: 1px solid var(--line);
        }
        th {
          background: #f7f9f8;
          color: var(--ink-muted);
          font-size: 0.75rem;
        }
        tr:last-child td { border-bottom: 0; }
        code {
          font-size: 0.75rem;
          background: var(--accent-soft);
          color: var(--accent);
          padding: 0.1rem 0.3rem;
          border-radius: var(--radius-sm);
        }
      `}</style>
    </section>
  )
}
