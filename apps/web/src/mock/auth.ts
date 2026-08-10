import type { ManagedUser, Role } from '../types'

export const roleHome: Record<Role, string> = {
  student: '/student/chat',
  teacher: '/teacher/studio',
  admin: '/admin/users',
}

export type LoginResult =
  | { ok: true; user: ManagedUser; role: Role }
  | { ok: false; message: string }

/** Mock login: email + password → primary role. */
export function mockLogin(
  users: ManagedUser[],
  email: string,
  password: string,
): LoginResult {
  const normalized = email.trim().toLowerCase()
  const user = users.find((u) => u.email.toLowerCase() === normalized)

  if (!user) {
    return { ok: false, message: '账号不存在，请检查邮箱。' }
  }
  if (user.status !== 'active') {
    return { ok: false, message: '账号已停用，请联系管理员。' }
  }
  if (user.password !== password) {
    return { ok: false, message: '密码错误。' }
  }
  if (!user.roles.length) {
    return { ok: false, message: '账号未绑定角色，请联系管理员。' }
  }

  // Prefer admin > teacher > student if multiple bindings (demo rule).
  const order: Role[] = ['admin', 'teacher', 'student']
  const role = order.find((r) => user.roles.includes(r)) ?? user.roles[0]

  return { ok: true, user, role }
}

export const demoAccounts = [
  { email: 'linxiao@student.demo', password: 'student123', role: '学生' },
  { email: 'wang@school.demo', password: 'teacher123', role: '老师' },
  { email: 'admin@school.demo', password: 'admin123', role: '管理员' },
] as const
