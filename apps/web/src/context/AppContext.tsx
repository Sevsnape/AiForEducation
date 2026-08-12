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
  mockQuestionPacks,
  mockStudyPlan,
  mockSupport,
  mockThreads,
  mockUserConsents,
  mockUsers,
} from '../mock/data'
import { mockLogin, roleHome } from '../mock/auth'
import type {
  ChatMessage,
  ClientMode,
  ConsentFlags,
  GrowthStage,
  LearningProfile,
  ManagedUser,
  QuestionItem,
  QuestionPack,
  QuestionPackSource,
  Role,
  StudyPlan,
  SupportProfile,
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
  const [users, setUsers] = useState(mockUsers)
  const [busy, setBusy] = useState(false)

  const consent =
    (currentUser && userConsents[currentUser.id]) || orgConsentDefaults

  const setUserConsent = useCallback((userId: string, flags: ConsentFlags) => {
    setUserConsents((prev) => ({ ...prev, [userId]: flags }))
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

  const logout = useCallback(() => {
    setRole(null)
    setCurrentUser(null)
    setMessages([])
    setMode('auto')
    setChatPackId(null)
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
