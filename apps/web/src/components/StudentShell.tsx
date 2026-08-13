import { Outlet, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { AppHeader } from './AppHeader'

const links = [
  { to: '/student/practice', label: '练习' },
  { to: '/student/chat', label: '对话' },
  { to: '/student/history', label: '历史' },
  { to: '/student/me', label: '我的' },
]

export function StudentShell() {
  const { currentUser, logout } = useApp()
  const navigate = useNavigate()

  return (
    <div className="app-frame">
      <AppHeader
        links={links}
        subtitle="学习空间"
        userName={currentUser?.displayName}
        onLogout={() => {
          logout()
          navigate('/')
        }}
      />
      <main className="app-main app-main--fluid">
        <Outlet />
      </main>
    </div>
  )
}
