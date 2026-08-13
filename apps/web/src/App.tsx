import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminShell } from './components/AdminShell'
import { StudentShell } from './components/StudentShell'
import { TeacherShell } from './components/TeacherShell'
import { useApp } from './context/AppContext'
import { ConsentsPage } from './pages/admin/ConsentsPage'
import { AuditPage } from './pages/admin/AuditPage'
import { AnalyticsPage } from './pages/admin/AnalyticsPage'
import { MaterialsPage } from './pages/admin/MaterialsPage'
import { OrgsPage } from './pages/admin/OrgsPage'
import { UsersPage } from './pages/admin/UsersPage'
import { EntryPage } from './pages/EntryPage'
import { ChatPage } from './pages/student/ChatPage'
import { HistoryPage } from './pages/student/HistoryPage'
import { MePage } from './pages/student/MePage'
import { PracticePage } from './pages/student/PracticePage'
import { AssignmentsPage } from './pages/teacher/AssignmentsPage'
import { ClassPage } from './pages/teacher/ClassPage'
import { SchemesPage } from './pages/teacher/SchemesPage'
import { StudioPage } from './pages/teacher/StudioPage'
import { TeacherChatPage } from './pages/teacher/TeacherChatPage'
import type { Role } from './types'

function RequireRole({
  role,
  children,
}: {
  role: Role
  children: React.ReactNode
}) {
  const { role: current, currentUser } = useApp()
  if (!currentUser || current !== role) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <>
      <div className="app-bg-grid" aria-hidden />
      <Routes>
        <Route path="/" element={<EntryPage />} />
        <Route
          path="/student"
          element={
            <RequireRole role="student">
              <StudentShell />
            </RequireRole>
          }
        >
          <Route path="practice" element={<PracticePage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="me" element={<MePage />} />
          <Route index element={<Navigate to="practice" replace />} />
        </Route>
        <Route
          path="/teacher"
          element={
            <RequireRole role="teacher">
              <TeacherShell />
            </RequireRole>
          }
        >
          <Route path="studio" element={<StudioPage />} />
          <Route path="assignments" element={<AssignmentsPage />} />
          <Route path="class" element={<ClassPage />} />
          <Route path="schemes" element={<SchemesPage />} />
          <Route path="chat" element={<TeacherChatPage />} />
          <Route index element={<Navigate to="studio" replace />} />
        </Route>
        <Route
          path="/admin"
          element={
            <RequireRole role="admin">
              <AdminShell />
            </RequireRole>
          }
        >
          <Route path="users" element={<UsersPage />} />
          <Route path="orgs" element={<OrgsPage />} />
          <Route path="materials" element={<MaterialsPage />} />
          <Route path="consents" element={<ConsentsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="audit" element={<AuditPage />} />
          <Route index element={<Navigate to="users" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
