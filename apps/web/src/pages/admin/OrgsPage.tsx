export function OrgsPage() {
  const orgs = [
    {
      id: 'org-1',
      name: '示例中学',
      classes: [
        { id: 'c-1', name: '初二(3)班', teachers: ['王老师'], students: 42 },
        { id: 'c-2', name: '初二(1)班', teachers: ['李老师'], students: 40 },
      ],
    },
  ]

  return (
    <section className="orgs">
      <header>
        <h1 className="page-title">组织与班级</h1>
        <p className="page-desc">学校租户与班级成员关系是老师查看学情的边界。</p>
      </header>
      {orgs.map((org) => (
        <article key={org.id} className="org">
          <h2>{org.name}</h2>
          <div className="class-list">
            {org.classes.map((c) => (
              <div key={c.id} className="surface class-card">
                <strong>{c.name}</strong>
                <div className="muted">任课：{c.teachers.join('、')}</div>
                <div className="muted">学生数：{c.students}</div>
              </div>
            ))}
          </div>
        </article>
      ))}
      <style>{`
        .orgs { display: grid; gap: 0.75rem; }
        .org h2 { margin: 0 0 0.5rem; font-size: 1rem; }
        .class-list {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.55rem;
        }
        .class-card {
          padding: 0.7rem 0.85rem;
          display: grid;
          gap: 0.2rem;
          font-size: 0.84rem;
        }
        @media (max-width: 800px) {
          .class-list { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 520px) {
          .class-list { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  )
}
