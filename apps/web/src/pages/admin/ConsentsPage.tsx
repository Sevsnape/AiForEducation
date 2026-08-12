import { useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext'
import type { ConsentFlags, ManagedUser } from '../../types'

const flagLabels: { key: keyof ConsentFlags; label: string }[] = [
  { key: 'learningPersonalize', label: '画像个性化练习' },
  { key: 'historyRetain', label: '留存会话历史' },
  { key: 'shareLearningWithTeacher', label: '学情共享给老师' },
]

const UNCLASSIFIED = '未分班'

export function ConsentsPage() {
  const { users, userConsents, setUserConsent, orgConsentDefaults, setOrgConsentDefaults } =
    useApp()
  const [q, setQ] = useState('')
  const [classFilter, setClassFilter] = useState<string>('all')
  const [classDefaults, setClassDefaults] = useState<Record<string, ConsentFlags>>({})
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const allStudents = useMemo(
    () => users.filter((u) => u.roles.includes('student')),
    [users],
  )

  const classNames = useMemo(() => {
    const set = new Set<string>()
    for (const u of allStudents) set.add(u.className || UNCLASSIFIED)
    return [...set].sort((a, b) => {
      if (a === UNCLASSIFIED) return 1
      if (b === UNCLASSIFIED) return -1
      return a.localeCompare(b, 'zh')
    })
  }, [allStudents])

  const students = useMemo(() => {
    const key = q.trim()
    return allStudents.filter((u) => {
      const clazz = u.className || UNCLASSIFIED
      if (classFilter !== 'all' && clazz !== classFilter) return false
      if (
        key &&
        !u.displayName.includes(key) &&
        !u.email.includes(key) &&
        !u.id.includes(key) &&
        !clazz.includes(key)
      ) {
        return false
      }
      return true
    })
  }, [allStudents, q, classFilter])

  const grouped = useMemo(() => {
    const map = new Map<string, ManagedUser[]>()
    for (const name of classNames) map.set(name, [])
    for (const u of students) {
      const clazz = u.className || UNCLASSIFIED
      if (!map.has(clazz)) map.set(clazz, [])
      map.get(clazz)!.push(u)
    }
    return classNames
      .map((name) => ({ name, students: map.get(name) || [] }))
      .filter((g) => g.students.length > 0 || classFilter === g.name)
  }, [students, classNames, classFilter])

  function flagsFor(u: ManagedUser): ConsentFlags {
    return userConsents[u.id] ?? orgConsentDefaults
  }

  function defaultsForClass(className: string): ConsentFlags {
    return classDefaults[className] ?? { ...orgConsentDefaults }
  }

  function setClassDefault(className: string, next: ConsentFlags) {
    setClassDefaults((prev) => ({ ...prev, [className]: next }))
  }

  function applyClassToAll(className: string) {
    const flags = defaultsForClass(className)
    const targets = allStudents.filter((u) => (u.className || UNCLASSIFIED) === className)
    if (!targets.length) return
    if (!confirm(`将「${className}」班策略应用到 ${targets.length} 名学生？`)) return
    for (const u of targets) setUserConsent(u.id, { ...flags })
  }

  function toggleCollapse(name: string) {
    setCollapsed((prev) => ({ ...prev, [name]: !prev[name] }))
  }

  return (
    <section className="consents">
      <header>
        <h1 className="page-title">同意设置</h1>
        <p className="page-desc">
          按班级管理同意策略：校级默认 → 班级模板 → 学生覆盖。学生端暂不开放自助修改。
        </p>
      </header>

      <article className="surface panel">
        <h2>校级默认策略</h2>
        <p className="muted tiny">新建学生、未单独覆盖，且班级未另设模板时使用。</p>
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

      <div className="consents__filter">
        <div className="chip-row" role="tablist" aria-label="按班级筛选">
          <button
            type="button"
            className={`chip ${classFilter === 'all' ? 'active' : ''}`}
            onClick={() => setClassFilter('all')}
          >
            全部班级 ({allStudents.length})
          </button>
          {classNames.map((name) => {
            const n = allStudents.filter((u) => (u.className || UNCLASSIFIED) === name).length
            return (
              <button
                key={name}
                type="button"
                className={`chip ${classFilter === name ? 'active' : ''}`}
                onClick={() => setClassFilter(name)}
              >
                {name} ({n})
              </button>
            )
          })}
        </div>
        <input
          className="field"
          placeholder="搜索学生 / 班级"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {grouped.length === 0 ? (
        <p className="muted">没有符合条件的学生。</p>
      ) : (
        grouped.map(({ name, students: list }) => {
          const isOpen = !collapsed[name]
          const classFlags = defaultsForClass(name)
          return (
            <article key={name} className="surface class-block">
              <header className="class-block__head">
                <button
                  type="button"
                  className="class-block__toggle"
                  onClick={() => toggleCollapse(name)}
                  aria-expanded={isOpen}
                >
                  <span className="class-block__chevron">{isOpen ? '▾' : '▸'}</span>
                  <h2>{name}</h2>
                  <span className="muted tiny">{list.length} 人</span>
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => applyClassToAll(name)}
                >
                  应用到本班
                </button>
              </header>

              {isOpen ? (
                <>
                  <div className="class-template">
                    <strong>班级模板</strong>
                    <p className="muted tiny">调整后点「应用到本班」写入该班全体学生覆盖项。</p>
                    <div className="class-template__flags">
                      {flagLabels.map(({ key, label }) => (
                        <label key={key} className="flag-mini">
                          <input
                            type="checkbox"
                            checked={classFlags[key]}
                            onChange={(e) =>
                              setClassDefault(name, { ...classFlags, [key]: e.target.checked })
                            }
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>学生</th>
                          {flagLabels.map((f) => (
                            <th key={f.key}>{f.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {list.map((u) => {
                          const flags = flagsFor(u)
                          return (
                            <tr key={u.id}>
                              <td>
                                <strong>{u.displayName}</strong>
                                <div className="tiny muted">{u.email}</div>
                              </td>
                              {flagLabels.map(({ key }) => (
                                <td key={key}>
                                  <input
                                    type="checkbox"
                                    checked={flags[key]}
                                    onChange={(e) =>
                                      setUserConsent(u.id, {
                                        ...flags,
                                        [key]: e.target.checked,
                                      })
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
                </>
              ) : null}
            </article>
          )
        })
      )}

      <style>{`
        .consents { display: grid; gap: 0.75rem; }
        .panel { padding: 0.75rem 0.85rem; display: grid; gap: 0.45rem; }
        .panel h2, .class-block h2 { margin: 0; font-size: 0.95rem; }
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
        .consents__filter {
          display: grid;
          grid-template-columns: 1fr minmax(140px, 200px);
          gap: 0.5rem;
          align-items: start;
        }
        .class-block {
          padding: 0;
          overflow: hidden;
        }
        .class-block__head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.5rem;
          padding: 0.55rem 0.75rem;
          background: #f7f9f8;
          border-bottom: 1px solid var(--line);
        }
        .class-block__toggle {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          border: 0;
          background: transparent;
          cursor: pointer;
          padding: 0;
          color: inherit;
          text-align: left;
          min-width: 0;
        }
        .class-block__chevron {
          color: var(--ink-faint);
          font-size: 0.75rem;
          width: 0.8rem;
        }
        .class-template {
          padding: 0.55rem 0.75rem;
          border-bottom: 1px solid var(--line);
          display: grid;
          gap: 0.25rem;
          background: #fafbfa;
        }
        .class-template strong { font-size: 0.82rem; }
        .class-template__flags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.55rem 1rem;
          margin-top: 0.25rem;
        }
        .flag-mini {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.78rem;
          color: var(--ink-muted);
          cursor: pointer;
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
        @media (max-width: 720px) {
          .consents__filter { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  )
}
