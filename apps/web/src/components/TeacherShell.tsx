import { Outlet, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { AppHeader } from './AppHeader'

const links = [
  { to: '/teacher/studio', label: '出题台' },
  { to: '/teacher/assignments', label: '作业' },
  { to: '/teacher/class', label: '班级学情' },
  { to: '/teacher/schemes', label: '方案库' },
  { to: '/teacher/chat', label: '助手' },
]

export function TeacherShell() {
  const { currentUser, logout } = useApp()
  const navigate = useNavigate()

  return (
    <div className="app-frame">
      <AppHeader
        links={links}
        subtitle="教学工作台"
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
