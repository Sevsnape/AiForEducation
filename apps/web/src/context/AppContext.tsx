import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  mockConsent,
  mockGrowthStages,
  mockLearning,
  mockPackAssignments,
  mockQuestionPacks,
  mockSharedMaterials,
  mockStudyPlan,
  mockSupport,
  mockSupportSchemes,
  mockThreads,
  mockUserConsents,
  mockUsers,
} from '../mock/data'
import { mockLogin, roleHome } from '../mock/auth'
import { buildAiAnalysis, gradeAnswer } from '../lib/practice'
import type {
  ChatMessage,
  ClientMode,
  ConsentFlags,
  GrowthStage,
  LearningProfile,
  ManagedUser,
  PackAssignment,
  QuestionItem,
  QuestionPack,
  QuestionPackSource,
  Role,
  SharedMaterial,
  StudyPlan,
  SupportProfile,
  SupportScheme,
  SupportSchemeBody,
  SupportSchemeScope,
  SupportSchemeSource,
  ThreadSummary,
} from '../types'
import { welcomeStudent, welcomeTeacher } from '../mock/data'

type CreatePackInput = {
  title: string
  subject: string
  knowledge: string
  questions: QuestionItem[]
  source: QuestionPackSource
  note?: string
}

type AppendVersionInput = {
  packId: string
  questions: QuestionItem[]
  source: QuestionPackSource
  note?: string
  subject?: string
  knowledge?: string
  title?: string
}

type CreateSchemeInput = {
  title: string
  scope: SupportSchemeScope
  studentIds: string[]
  studentNames: string[]
  basedOn: SupportScheme['basedOn']
  body: SupportSchemeBody
  source: SupportSchemeSource
  note?: string
}

type AppendSchemeVersionInput = {
  schemeId: string
  body: SupportSchemeBody
  source: SupportSchemeSource
  note?: string
  title?: string
}

type AssignPackInput = {
  packId: string
  students: { id: string; name: string }[]
  dueLabel?: string
  assignedByName: string
}

type AppContextValue = {
  role: Role | null
  currentUser: ManagedUser | null
  mode: ClientMode
  setMode: (mode: ClientMode) => void
  messages: ChatMessage[]
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
  threads: ThreadSummary[]
  setThreads: React.Dispatch<React.SetStateAction<ThreadSummary[]>>
  growthStages: GrowthStage[]
  setGrowthStages: React.Dispatch<React.SetStateAction<GrowthStage[]>>
  /** Current student session consent mirror (admin-managed; not editable on student Me). */
  consent: ConsentFlags
  orgConsentDefaults: ConsentFlags
  setOrgConsentDefaults: React.Dispatch<React.SetStateAction<ConsentFlags>>
  userConsents: Record<string, ConsentFlags>
  setUserConsent: (userId: string, flags: ConsentFlags) => void
  learning: LearningProfile
  setLearning: React.Dispatch<React.SetStateAction<LearningProfile>>
  support: SupportProfile
  setSupport: React.Dispatch<React.SetStateAction<SupportProfile>>
  studyPlan: StudyPlan | null
  setStudyPlan: React.Dispatch<React.SetStateAction<StudyPlan | null>>
  /** Teacher: versioned question packs in studio */
  questionPacks: QuestionPack[]
  createQuestionPack: (input: CreatePackInput) => QuestionPack
  appendPackVersion: (input: AppendVersionInput) => QuestionPack | null
  /** Pack currently attached to teacher chat for refinement */
  chatPackId: string | null
  attachPackToChat: (packId: string) => void
  clearChatPack: () => void
  /** Teacher: versioned support schemes from class analytics */
  supportSchemes: SupportScheme[]
  createSupportScheme: (input: CreateSchemeInput) => SupportScheme
  appendSchemeVersion: (input: AppendSchemeVersionInput) => SupportScheme | null
  chatSchemeId: string | null
  attachSchemeToChat: (schemeId: string) => void
  clearChatScheme: () => void
  /** Pack assignments: teacher distribute → student practice */
  assignments: PackAssignment[]
  assignPack: (input: AssignPackInput) => PackAssignment | null
  startAssignment: (assignmentId: string, studentId: string) => void
  submitAssignment: (
    assignmentId: string,
    studentId: string,
    answers: { questionIndex: number; studentAnswer: string }[],
  ) => void
  /** Admin school shared library */
  sharedMaterials: SharedMaterial[]
  upsertSharedMaterial: (
    material: Omit<SharedMaterial, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
  ) => SharedMaterial
  setSharedMaterialStatus: (id: string, status: SharedMaterial['status']) => void
  removeSharedMaterial: (id: string) => void
  users: ManagedUser[]
  setUsers: React.Dispatch<React.SetStateAction<ManagedUser[]>>
  busy: boolean
  setBusy: (v: boolean) => void
  login: (email: string, password: string) => { ok: boolean; message?: string; redirect?: string }
  logout: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

function stamp() {
  return new Date().toISOString()
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(null)
  const [currentUser, setCurrentUser] = useState<ManagedUser | null>(null)
  const [mode, setMode] = useState<ClientMode>('auto')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [threads, setThreads] = useState(mockThreads)
  const [growthStages, setGrowthStages] = useState(mockGrowthStages)
  const [orgConsentDefaults, setOrgConsentDefaults] = useState(mockConsent)
  const [userConsents, setUserConsents] = useState(mockUserConsents)
  const [learning, setLearning] = useState(mockLearning)
  const [support, setSupport] = useState(mockSupport)
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(mockStudyPlan)
  const [questionPacks, setQuestionPacks] = useState<QuestionPack[]>(mockQuestionPacks)
  const [chatPackId, setChatPackId] = useState<string | null>(null)
  const [supportSchemes, setSupportSchemes] = useState<SupportScheme[]>(mockSupportSchemes)
  const [chatSchemeId, setChatSchemeId] = useState<string | null>(null)
  const [assignments, setAssignments] = useState<PackAssignment[]>(mockPackAssignments)
  const [sharedMaterials, setSharedMaterials] = useState<SharedMaterial[]>(mockSharedMaterials)
  const [users, setUsers] = useState(mockUsers)
  const [busy, setBusy] = useState(false)

  const consent =
    (currentUser && userConsents[currentUser.id]) || orgConsentDefaults

  const setUserConsent = useCallback((userId: string, flags: ConsentFlags) => {
    setUserConsents((prev) => ({ ...prev, [userId]: flags }))
  }, [])

  const upsertSharedMaterial = useCallback(
    (material: Omit<SharedMaterial, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      const now = stamp()
      if (material.id) {
        let saved: SharedMaterial | null = null
        setSharedMaterials((prev) =>
          prev.map((m) => {
            if (m.id !== material.id) return m
            saved = { ...m, ...material, id: m.id, createdAt: m.createdAt, updatedAt: now }
            return saved
          }),
        )
        return (
          saved || {
            ...material,
            id: material.id,
            createdAt: now,
            updatedAt: now,
          }
        )
      }
      const created: SharedMaterial = {
        ...material,
        id: `sm-${Date.now()}`,
        createdAt: now,
        updatedAt: now,
      }
      setSharedMaterials((prev) => [created, ...prev])
      return created
    },
    [],
  )

  const setSharedMaterialStatus = useCallback((id: string, status: SharedMaterial['status']) => {
    const now = stamp()
    setSharedMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status, updatedAt: now } : m)),
    )
  }, [])

  const removeSharedMaterial = useCallback((id: string) => {
    setSharedMaterials((prev) => prev.filter((m) => m.id !== id))
  }, [])

  const createQuestionPack = useCallback((input: CreatePackInput) => {
    const now = stamp()
    const pack: QuestionPack = {
      id: `qp-${Date.now()}`,
      title: input.title,
      subject: input.subject,
      knowledge: input.knowledge,
      createdAt: now,
      updatedAt: now,
      currentVersion: 1,
      versions: [
        {
          id: `qpv-${Date.now()}`,
          version: 1,
          createdAt: now,
          source: input.source,
          note: input.note,
          questions: input.questions,
          subject: input.subject,
          knowledge: input.knowledge,
        },
      ],
    }
    setQuestionPacks((prev) => [pack, ...prev])
    return pack
  }, [])

  const appendPackVersion = useCallback((input: AppendVersionInput) => {
    let result: QuestionPack | null = null
    setQuestionPacks((prev) => {
      const idx = prev.findIndex((p) => p.id === input.packId)
      if (idx < 0) return prev
      const p = prev[idx]
      const now = stamp()
      const version = p.currentVersion + 1
      const next: QuestionPack = {
        ...p,
        title: input.title || p.title,
        subject: input.subject || p.subject,
        knowledge: input.knowledge || p.knowledge,
        updatedAt: now,
        currentVersion: version,
        versions: [
          ...p.versions,
          {
            id: `qpv-${Date.now()}`,
            version,
            createdAt: now,
            source: input.source,
            note: input.note,
            questions: input.questions,
            subject: input.subject || p.subject,
            knowledge: input.knowledge || p.knowledge,
          },
        ],
      }
      result = next
      const copy = [...prev]
      copy[idx] = next
      return copy
    })
    return result
  }, [])

  const attachPackToChat = useCallback((packId: string) => {
    setChatPackId(packId)
  }, [])

  const clearChatPack = useCallback(() => setChatPackId(null), [])

  const createSupportScheme = useCallback((input: CreateSchemeInput) => {
    const now = stamp()
    const scheme: SupportScheme = {
      id: `ss-${Date.now()}`,
      title: input.title,
      scope: input.scope,
      studentIds: input.studentIds,
      studentNames: input.studentNames,
      basedOn: input.basedOn,
      createdAt: now,
      updatedAt: now,
      currentVersion: 1,
      versions: [
        {
          id: `ssv-${Date.now()}`,
          version: 1,
          createdAt: now,
          source: input.source,
          note: input.note,
          body: input.body,
        },
      ],
    }
    setSupportSchemes((prev) => [scheme, ...prev])
    return scheme
  }, [])

  const appendSchemeVersion = useCallback((input: AppendSchemeVersionInput) => {
    let result: SupportScheme | null = null
    setSupportSchemes((prev) => {
      const idx = prev.findIndex((s) => s.id === input.schemeId)
      if (idx < 0) return prev
      const s = prev[idx]
      const now = stamp()
      const version = s.currentVersion + 1
      const next: SupportScheme = {
        ...s,
        title: input.title || s.title,
        updatedAt: now,
        currentVersion: version,
        versions: [
          ...s.versions,
          {
            id: `ssv-${Date.now()}`,
            version,
            createdAt: now,
            source: input.source,
            note: input.note,
            body: input.body,
          },
        ],
      }
      result = next
      const copy = [...prev]
      copy[idx] = next
      return copy
    })
    return result
  }, [])

  const attachSchemeToChat = useCallback((schemeId: string) => {
    setChatSchemeId(schemeId)
  }, [])

  const clearChatScheme = useCallback(() => setChatSchemeId(null), [])

  const assignPack = useCallback(
    (input: AssignPackInput) => {
      const pack = questionPacks.find((p) => p.id === input.packId)
      if (!pack || !input.students.length) return null
      const ver = pack.versions.find((v) => v.version === pack.currentVersion)
      const questions: QuestionItem[] =
        ver?.questions ?? pack.versions[pack.versions.length - 1]?.questions ?? []
      if (!questions.length) return null
      const now = stamp()
      const created: PackAssignment = {
        id: `asg-${Date.now()}`,
        packId: pack.id,
        packTitle: pack.title,
        packVersion: pack.currentVersion,
        subject: pack.subject,
        knowledge: pack.knowledge,
        questions,
        assignedByName: input.assignedByName,
        assignedAt: now,
        dueLabel: input.dueLabel,
        attempts: input.students.map((s) => ({
          studentId: s.id,
          studentName: s.name,
          status: 'assigned',
          answers: [],
        })),
      }
      setAssignments((prev) => [created, ...prev])
      return created
    },
    [questionPacks],
  )

  const startAssignment = useCallback((assignmentId: string, studentId: string) => {
    const now = stamp()
    setAssignments((prev) =>
      prev.map((a) => {
        if (a.id !== assignmentId) return a
        return {
          ...a,
          attempts: a.attempts.map((t) =>
            t.studentId === studentId && t.status === 'assigned'
              ? { ...t, status: 'in_progress', startedAt: now }
              : t,
          ),
        }
      }),
    )
  }, [])

  const submitAssignment = useCallback(
    (
      assignmentId: string,
      studentId: string,
      rawAnswers: { questionIndex: number; studentAnswer: string }[],
    ) => {
      const now = stamp()
      setAssignments((prev) =>
        prev.map((a) => {
          if (a.id !== assignmentId) return a
          return {
            ...a,
            attempts: a.attempts.map((t) => {
              if (t.studentId !== studentId) return t
              const answers = a.questions.map((q, i) => {
                const found = rawAnswers.find((x) => x.questionIndex === i)
                const studentAnswer = found?.studentAnswer?.trim() || ''
                return {
                  questionIndex: i,
                  studentAnswer,
                  correct: gradeAnswer(studentAnswer, q.answer),
                }
              })
              const correctCount = answers.filter((x) => x.correct).length
              const score = answers.length ? correctCount / answers.length : 0
              return {
                ...t,
                status: 'submitted' as const,
                startedAt: t.startedAt || now,
                submittedAt: now,
                answers,
                score,
                aiAnalysis: buildAiAnalysis(a.questions, answers),
              }
            }),
          }
        }),
      )
    },
    [],
  )

  const logout = useCallback(() => {
    setRole(null)
    setCurrentUser(null)
    setMessages([])
    setMode('auto')
    setChatPackId(null)
    setChatSchemeId(null)
  }, [])

  const login = useCallback(
    (email: string, password: string) => {
      const result = mockLogin(users, email, password)
      if (!result.ok) {
        return { ok: false, message: result.message }
      }

      setCurrentUser(result.user)
      setRole(result.role)
      setMode(result.role === 'teacher' ? 'question_gen' : 'auto')
      setChatPackId(null)
      setChatSchemeId(null)

      if (result.role === 'admin') {
        setMessages([])
      } else {
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: result.role === 'student' ? welcomeStudent : welcomeTeacher,
            intent: 'general',
            createdAt: new Date().toISOString(),
          },
        ])
      }

      return { ok: true, redirect: roleHome[result.role] }
    },
    [users],
  )

  const value = useMemo(
    () => ({
      role,
      currentUser,
      mode,
      setMode,
      messages,
      setMessages,
      threads,
      setThreads,
      growthStages,
      setGrowthStages,
      consent,
      orgConsentDefaults,
      setOrgConsentDefaults,
      userConsents,
      setUserConsent,
      learning,
      setLearning,
      support,
      setSupport,
      studyPlan,
      setStudyPlan,
      questionPacks,
      createQuestionPack,
      appendPackVersion,
      chatPackId,
      attachPackToChat,
      clearChatPack,
      supportSchemes,
      createSupportScheme,
      appendSchemeVersion,
      chatSchemeId,
      attachSchemeToChat,
      clearChatScheme,
      assignments,
      assignPack,
      startAssignment,
      submitAssignment,
      sharedMaterials,
      upsertSharedMaterial,
      setSharedMaterialStatus,
      removeSharedMaterial,
      users,
      setUsers,
      busy,
      setBusy,
      login,
      logout,
    }),
    [
      role,
      currentUser,
      mode,
      messages,
      threads,
      growthStages,
      consent,
      orgConsentDefaults,
      userConsents,
      setUserConsent,
      learning,
      support,
      studyPlan,
      questionPacks,
      createQuestionPack,
      appendPackVersion,
      chatPackId,
      attachPackToChat,
      clearChatPack,
      supportSchemes,
      createSupportScheme,
      appendSchemeVersion,
      chatSchemeId,
      attachSchemeToChat,
      clearChatScheme,
      assignments,
      assignPack,
      startAssignment,
      submitAssignment,
      sharedMaterials,
      upsertSharedMaterial,
      setSharedMaterialStatus,
      removeSharedMaterial,
      users,
      busy,
      login,
      logout,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
