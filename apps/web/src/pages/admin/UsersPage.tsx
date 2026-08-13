import { useMemo, useState, type FormEvent } from 'react'
import { useApp } from '../../context/AppContext'
import type { ManagedUser, Role, UserStatus } from '../../types'

const roleLabel: Record<Role, string> = {
  admin: '管理员',
  teacher: '老师',
  student: '学生',
}

export function UsersPage() {
  const { users, setUsers } = useApp()
  const [q, setQ] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | Role>('all')
  const [draft, setDraft] = useState({
    displayName: '',
    email: '',
    password: 'Pass1234',
    role: 'student' as Role,
    orgName: '育才中学',
    className: '初二(3)班',
  })

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const hit =
        !q ||
        u.displayName.includes(q) ||
        u.email.includes(q) ||
        u.id.includes(q)
      const roleOk = roleFilter === 'all' || u.roles.includes(roleFilter)
      return hit && roleOk
    })
  }, [users, q, roleFilter])

  function toggleStatus(user: ManagedUser) {
    const next: UserStatus = user.status === 'active' ? 'disabled' : 'active'
    setUsers((list) => list.map((u) => (u.id === user.id ? { ...u, status: next } : u)))
  }

  function onCreate(e: FormEvent) {
    e.preventDefault()
    if (!draft.displayName.trim() || !draft.email.trim() || !draft.password.trim()) return
    const row: ManagedUser = {
      id: `u-${Date.now()}`,
      displayName: draft.displayName.trim(),
      email: draft.email.trim(),
      password: draft.password,
      roles: [draft.role],
      orgName: draft.orgName,
      className: draft.role === 'admin' ? undefined : draft.className,
      status: 'active',
      createdAt: new Date().toISOString().slice(0, 10),
    }
    setUsers((list) => [row, ...list])
    setDraft((d) => ({ ...d, displayName: '', email: '', password: 'Pass1234' }))
  }

  return (
    <section className="admin-page">
      <header>
        <h1 className="page-title">用户管理</h1>
        <p className="page-desc">维护管理员 / 老师 / 学生账号、角色绑定与启停。</p>
      </header>

      <div className="toolbar">
        <input
          className="field"
          placeholder="搜索姓名 / 邮箱 / ID"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="field"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as 'all' | Role)}
        >
          <option value="all">全部角色</option>
          <option value="admin">管理员</option>
          <option value="teacher">老师</option>
          <option value="student">学生</option>
        </select>
      </div>

      <form className="create surface" onSubmit={onCreate}>
        <h2>新建用户</h2>
        <div className="create-grid">
          <input
            className="field"
            placeholder="显示名"
            value={draft.displayName}
            onChange={(e) => setDraft((d) => ({ ...d, displayName: e.target.value }))}
          />
          <input
            className="field"
            placeholder="邮箱"
            value={draft.email}
            onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
          />
          <input
            className="field"
            placeholder="初始密码"
            value={draft.password}
            onChange={(e) => setDraft((d) => ({ ...d, password: e.target.value }))}
          />
          <select
            className="field"
            value={draft.role}
            onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value as Role }))}
          >
            <option value="student">学生</option>
            <option value="teacher">老师</option>
            <option value="admin">管理员</option>
          </select>
          <input
            className="field"
            placeholder="班级（管理员可空）"
            value={draft.className}
            onChange={(e) => setDraft((d) => ({ ...d, className: e.target.value }))}
          />
        </div>
        <button className="btn btn-accent" type="submit">
          添加
        </button>
      </form>

      <div className="table-wrap surface">
        <table>
          <thead>
            <tr>
              <th>姓名</th>
              <th>邮箱</th>
              <th>角色</th>
              <th>组织 / 班级</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id}>
                <td>
                  <strong>{u.displayName}</strong>
                  <div className="muted tiny">{u.id}</div>
                </td>
                <td>{u.email}</td>
                <td>{u.roles.map((r) => roleLabel[r]).join('、')}</td>
                <td>
                  {u.orgName}
                  {u.className ? ` · ${u.className}` : ''}
                </td>
                <td>
                  <span className={u.status === 'active' ? 'ok' : 'no'}>
                    {u.status === 'active' ? '启用' : '停用'}
                  </span>
                </td>
                <td>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => toggleStatus(u)}>
                    {u.status === 'active' ? '停用' : '启用'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        .admin-page { display: grid; gap: 0.75rem; }
        .toolbar {
          display: grid;
          grid-template-columns: 1fr 140px;
          gap: 0.5rem;
        }
        .create {
          padding: 0.75rem 0.85rem;
          display: grid;
          gap: 0.5rem;
        }
        .create h2 { margin: 0; font-size: 0.92rem; }
        .create-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.45rem;
        }
        .table-wrap { overflow: auto; }
        table { width: 100%; border-collapse: collapse; font-size: 0.84rem; }
        th, td {
          text-align: left;
          padding: 0.55rem 0.75rem;
          border-bottom: 1px solid var(--line);
          vertical-align: top;
        }
        th {
          background: #f7f9f8;
          color: var(--ink-muted);
          font-size: 0.75rem;
        }
        tr:last-child td { border-bottom: 0; }
        .tiny { font-size: 0.72rem; }
        .ok { color: var(--accent); font-weight: 600; }
        .no { color: var(--ink-faint); }
        @media (max-width: 900px) {
          .create-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 640px) {
          .toolbar, .create-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  )
}
