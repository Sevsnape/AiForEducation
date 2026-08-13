import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { BrandMark } from './BrandMark'

const links = [
  { to: '/admin/users', label: '用户管理', short: '用户' },
  { to: '/admin/orgs', label: '组织班级', short: '组织' },
  { to: '/admin/materials', label: '资料管理', short: '资料' },
  { to: '/admin/consents', label: '同意设置', short: '同意' },
  { to: '/admin/analytics', label: '学情分析', short: '学情' },
  { to: '/admin/audit', label: '审计日志', short: '审计' },
]

const SIDEBAR_KEY = 'aiforec-admin-sidebar-collapsed'

export function AdminShell() {
  const { currentUser, logout } = useApp()
  const navigate = useNavigate()
  const initial = (currentUser?.displayName || '管').slice(0, 1)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, collapsed ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [collapsed])

  return (
    <div className={`app-frame admin-frame ${collapsed ? 'admin-frame--collapsed' : ''}`}>
      <header className="topbar admin-topbar">
        <div className="topbar__left">
          <button
            type="button"
            className="btn btn-ghost btn-sm admin-toggle"
            aria-expanded={!collapsed}
            aria-controls="admin-sidebar"
            title={collapsed ? '展开侧栏' : '收起侧栏'}
            onClick={() => setCollapsed((v) => !v)}
          >
            {collapsed ? '⟩' : '⟨'}
          </button>
          <BrandMark subtitle="校园管理" />
        </div>
        <div className="topbar__right">
          <div className="topbar__user">
            <span className="topbar__avatar">{initial}</span>
            <span className="topbar__user-name">{currentUser?.displayName}</span>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              logout()
              navigate('/')
            }}
          >
            退出
          </button>
        </div>
      </header>

      <div className="admin-body">
        <aside id="admin-sidebar" className="admin-sidebar" aria-label="管理导航">
          {!collapsed ? <div className="admin-sidebar__label">功能</div> : null}
          <nav className="admin-sidebar__nav">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                title={l.label}
                className={({ isActive }) => `admin-side-link ${isActive ? 'active' : ''}`}
              >
                <span className="admin-side-link__full">{l.label}</span>
                <span className="admin-side-link__short">{l.short}</span>
              </NavLink>
            ))}
          </nav>
          {!collapsed ? (
            <p className="admin-sidebar__hint">
              学情分析仅含练习与提问数据，不含学生心情对话原文。
            </p>
          ) : null}
        </aside>
        <main className="admin-main">
          <Outlet />
        </main>
      </div>

      <style>{`
        .admin-frame {
          background: var(--bg);
        }
        .admin-topbar .topbar__center {
          display: none;
        }
        .admin-toggle {
          min-width: 1.8rem;
          padding-left: 0.35rem;
          padding-right: 0.35rem;
          font-size: 0.9rem;
          line-height: 1;
        }
        .admin-body {
          flex: 1;
          display: grid;
          grid-template-columns: 200px minmax(0, 1fr);
          min-height: calc(100vh - var(--header-h));
          transition: grid-template-columns 0.18s ease;
        }
        .admin-frame--collapsed .admin-body {
          grid-template-columns: 56px minmax(0, 1fr);
        }
        .admin-sidebar {
          border-right: 1px solid var(--line);
          background: #f7f9f8;
          padding: 0.85rem 0.55rem;
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
          overflow: hidden;
        }
        .admin-sidebar__label {
          font-size: 0.68rem;
          font-weight: 600;
          color: var(--ink-faint);
          letter-spacing: 0.04em;
          text-transform: uppercase;
          padding: 0 0.55rem;
        }
        .admin-sidebar__nav {
          display: grid;
          gap: 0.15rem;
        }
        .admin-side-link {
          display: block;
          padding: 0.48rem 0.65rem;
          color: var(--ink-muted);
          font-size: 0.84rem;
          font-weight: 500;
          border-radius: var(--radius-sm);
          border-left: 2px solid transparent;
          white-space: nowrap;
        }
        .admin-side-link__short { display: none; }
        .admin-frame--collapsed .admin-side-link {
          padding: 0.48rem 0.2rem;
          text-align: center;
          border-left-color: transparent;
          font-size: 0.72rem;
        }
        .admin-frame--collapsed .admin-side-link__full { display: none; }
        .admin-frame--collapsed .admin-side-link__short { display: inline; }
        .admin-frame--collapsed .admin-side-link.active {
          border-left-color: transparent;
          box-shadow: inset 0 -2px 0 var(--accent);
        }
        .admin-side-link:hover {
          color: var(--ink);
          background: rgba(20, 28, 25, 0.04);
        }
        .admin-side-link.active {
          color: var(--accent);
          background: var(--accent-soft);
          font-weight: 600;
          border-left-color: var(--accent);
        }
        .admin-sidebar__hint {
          margin: auto 0.55rem 0.35rem;
          font-size: 0.7rem;
          line-height: 1.4;
          color: var(--ink-faint);
        }
        .admin-main {
          padding: 0.85rem 1rem 1.1rem;
          min-width: 0;
        }
        @media (max-width: 800px) {
          .admin-body,
          .admin-frame--collapsed .admin-body {
            grid-template-columns: 1fr;
          }
          .admin-sidebar {
            border-right: 0;
            border-bottom: 1px solid var(--line);
            padding-bottom: 0.55rem;
          }
          .admin-sidebar__nav {
            display: flex;
            flex-wrap: wrap;
            gap: 0.25rem;
          }
          .admin-side-link__short { display: none; }
          .admin-side-link__full { display: inline; }
          .admin-frame--collapsed .admin-side-link__full { display: inline; }
          .admin-frame--collapsed .admin-side-link__short { display: none; }
          .admin-sidebar__hint { display: none; }
        }
      `}</style>
    </div>
  )
}
