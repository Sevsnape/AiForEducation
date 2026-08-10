import { NavLink } from 'react-router-dom'
import { BrandMark } from './BrandMark'

type LinkItem = { to: string; label: string }

type Props = {
  links: LinkItem[]
  subtitle?: string
  userName?: string
  onLogout: () => void
}

export function AppHeader({ links, subtitle, userName, onLogout }: Props) {
  const initial = (userName || '?').slice(0, 1)
  return (
    <header className="topbar">
      <div className="topbar__left">
        <BrandMark subtitle={subtitle} />
      </div>
      <nav className="topbar__center" aria-label="主导航">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) => `top-nav-link ${isActive ? 'active' : ''}`}
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="topbar__right">
        <div className="topbar__user">
          <span className="topbar__avatar" aria-hidden>
            {initial}
          </span>
          <span className="topbar__user-name">{userName}</span>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onLogout}>
          退出
        </button>
      </div>
    </header>
  )
}
