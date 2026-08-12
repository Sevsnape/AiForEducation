import type { ChatAttachment, Role, SharedMaterial } from '../types'

export function materialToAttachment(m: SharedMaterial): ChatAttachment {
  return {
    id: `lib-${m.id}`,
    name: `[校本] ${m.title}`,
    size: m.byteSize,
    mime: m.mime,
    kind: m.kind,
  }
}

export function attachmentMaterialId(a: ChatAttachment): string | null {
  return a.id.startsWith('lib-') ? a.id.slice(4) : null
}

/** Published materials visible to a non-admin role */
export function visibleSharedMaterials(
  materials: SharedMaterial[],
  role: Role | null,
): SharedMaterial[] {
  if (role === 'admin') return materials
  return materials.filter((m) => {
    if (m.status !== 'published') return false
    if (role === 'teacher') return m.audience === 'all' || m.audience === 'teachers'
    if (role === 'student') return m.audience === 'all' || m.audience === 'students'
    return false
  })
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}
