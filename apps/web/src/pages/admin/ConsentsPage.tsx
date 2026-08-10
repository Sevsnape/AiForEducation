import { useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext'
import type { ConsentFlags, ManagedUser } from '../../types'

const flagLabels: { key: keyof ConsentFlags; label: string }[] = [
  { key: 'learningPersonalize', label: '画像个性化练习' },
  { key: 'historyRetain', label: '留存会话历史' },
  { key: 'shareLearningWithTeacher', label: '学情共享给老师' },
]

export function ConsentsPage() {
  const { users, userConsents, setUserConsent, orgConsentDefaults, setOrgConsentDefaults } =
    useApp()
  const [q, setQ] = useState('')

  const students = useMemo(
    () =>
      users.filter(
        (u) =>
          u.roles.includes('student') &&
          (!q.trim() ||
            u.displayName.includes(q.trim()) ||
            u.email.includes(q.trim()) ||
            u.id.includes(q.trim())),
      ),
    [users, q],
  )

  function flagsFor(u: ManagedUser): ConsentFlags {
    return userConsents[u.id] ?? orgConsentDefaults
  }

  return (
    <section className="consents">
      <header>
        <h1 className="page-title">同意设置</h1>
        <p className="page-desc">
          由管理员配置校级默认策略与学生覆盖项。学生端暂不开放自行修改；变更建议记入审计。
        </p>
      </header>

      <article className="surface panel">
        <h2>校级默认策略</h2>
        <p className="muted tiny">新建学生或未单独覆盖时使用以下默认值。</p>
        <div className="flag-grid">
          {flagLabels.map(({ key, label }) => (
            <label key={key} className="switch-row">
              <span>{label}</span>
              <input
                type="checkbox"
                checked={orgConsentDefaults[key]}
                onChange={(e) =>
                  setOrgConsentDefaults((c) => ({ ...c, [key]: e.target.checked }))
                }
              />
            </label>
          ))}
        </div>
      </article>

      <article className="surface panel">
        <div className="panel__head">
          <h2>学生覆盖</h2>
          <input
            className="field"
            placeholder="搜索学生"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>学生</th>
                <th>班级</th>
                {flagLabels.map((f) => (
                  <th key={f.key}>{f.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((u) => {
                const flags = flagsFor(u)
                return (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.displayName}</strong>
                      <div className="tiny muted">{u.email}</div>
                    </td>
                    <td>{u.className || '—'}</td>
                    {flagLabels.map(({ key }) => (
                      <td key={key}>
                        <input
                          type="checkbox"
                          checked={flags[key]}
                          onChange={(e) =>
                            setUserConsent(u.id, { ...flags, [key]: e.target.checked })
                          }
                          aria-label={`${u.displayName}-${key}`}
                        />
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </article>

      <style>{`
        .consents { display: grid; gap: 0.75rem; }
        .panel { padding: 0.75rem 0.85rem; display: grid; gap: 0.45rem; }
        .panel h2 { margin: 0; font-size: 0.95rem; }
        .tiny { font-size: 0.74rem; margin: 0; }
        .flag-grid { display: grid; gap: 0.2rem; max-width: 420px; }
        .switch-row {
          display: flex;
          justify-content: space-between;
          gap: 0.75rem;
          align-items: center;
          font-size: 0.84rem;
          padding: 0.35rem 0;
          border-bottom: 1px solid var(--line);
        }
        .switch-row:last-child { border-bottom: 0; }
        .panel__head {
          display: grid;
          grid-template-columns: 1fr minmax(140px, 200px);
          gap: 0.5rem;
          align-items: center;
        }
        .table-wrap { overflow: auto; }
        table { width: 100%; border-collapse: collapse; font-size: 0.84rem; }
        th, td {
          text-align: left;
          padding: 0.5rem 0.65rem;
          border-bottom: 1px solid var(--line);
          vertical-align: middle;
        }
        th {
          background: #f7f9f8;
          color: var(--ink-muted);
          font-size: 0.72rem;
          font-weight: 600;
        }
        tr:last-child td { border-bottom: 0; }
      `}</style>
    </section>
  )
}
