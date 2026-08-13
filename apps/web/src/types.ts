export type Role = 'student' | 'teacher' | 'admin'

export type UserStatus = 'active' | 'disabled'

export type ManagedUser = {
  id: string
  displayName: string
  email: string
  /** Mock only — real systems never store plaintext passwords in frontend state */
  password: string
  roles: Role[]
  orgName: string
  className?: string
  status: UserStatus
  createdAt: string
}

export type AuditRow = {
  id: string
  actor: string
  action: string
  resource: string
  purpose: string
  at: string
}

export type ClientMode = 'auto' | 'practice' | 'question_gen' | 'counsel' | 'study_plan'

export type Intent =
  | 'general'
  | 'practice'
  | 'question_gen'
  | 'counsel'
  | 'diagnose'
  | 'safety'
  | 'study_plan'
  | 'support_scheme'

export type ChatAttachment = {
  id: string
  name: string
  size: number
  mime: string
  kind: 'pdf' | 'doc' | 'text' | 'image' | 'other'
}

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  intent?: Intent
  private?: boolean
  createdAt: string
  attachments?: ChatAttachment[]
  payload?:
    | QuestionPayload
    | PracticePayload
    | SafetyPayload
    | StudyPlanPayload
    | SupportSchemePayload
    | null
}

export type QuestionItem = {
  stem: string
  type: string
  answer: string
  explanation: string
  knowledgeTags: string[]
  difficulty: number
}

export type QuestionPayload = {
  type: 'question_set'
  questions: QuestionItem[]
  /** If saved / linked to a studio pack */
  packId?: string
  packVersion?: number
}

/** Teacher question pack — traceable, versioned */
export type QuestionPackSource = 'studio_gen' | 'chat_save' | 'manual_edit'

export type QuestionPackVersion = {
  id: string
  version: number
  createdAt: string
  source: QuestionPackSource
  note?: string
  questions: QuestionItem[]
  subject: string
  knowledge: string
}

export type QuestionPack = {
  id: string
  title: string
  subject: string
  knowledge: string
  createdAt: string
  updatedAt: string
  currentVersion: number
  versions: QuestionPackVersion[]
}

export type PracticePayload = {
  type: 'practice_set'
  awaitingAnswer: boolean
  question: QuestionItem
}

export type SafetyPayload = {
  type: 'safety_card'
  resources: { label: string; kind: string }[]
}

export type StudyPlan = {
  id: string
  title: string
  horizon: string
  goals: string[]
  steps: string[]
  focusModules: string[]
  updatedAt: string
}

export type StudyPlanPayload = {
  type: 'study_plan'
  plan: StudyPlan
}

/** Teacher: intervention / support scheme based on shared learning analytics */
export type SupportSchemeSource = 'class_gen' | 'chat_save' | 'manual_edit'
export type SupportSchemeScope = 'student' | 'class' | 'group'

export type SupportSchemeBody = {
  summary: string
  goals: string[]
  actions: string[]
  focusModules: string[]
  horizon?: string
}

export type SupportSchemeVersion = {
  id: string
  version: number
  createdAt: string
  source: SupportSchemeSource
  note?: string
  body: SupportSchemeBody
}

export type SupportScheme = {
  id: string
  title: string
  scope: SupportSchemeScope
  studentIds: string[]
  studentNames: string[]
  basedOn: {
    accuracy?: number
    weakTags: string[]
    hotspotModules?: string[]
  }
  createdAt: string
  updatedAt: string
  currentVersion: number
  versions: SupportSchemeVersion[]
}

export type SupportSchemePayload = {
  type: 'support_scheme'
  title: string
  body: SupportSchemeBody
  schemeId?: string
  schemeVersion?: number
}

export type ThreadStatus = 'active' | 'archived'

export type ThreadSummary = {
  id: string
  title: string
  primaryIntent: Intent | 'mixed'
  preview: string
  lastActiveAt: string
  /** ISO date for sorting, e.g. 2026-08-10 */
  lastActiveDate: string
  messageCount: number
  pinned?: boolean
  status: ThreadStatus
  privateHint?: boolean
}

export type GrowthStageStatus = 'current' | 'past' | 'archived'

export type GrowthStage = {
  id: string
  /** e.g. 本周 · 8/4 – 8/10 */
  weekLabel: string
  weekStart: string
  weekEnd: string
  status: GrowthStageStatus
  learningText: string
  supportText: string
  nextSteps: string[]
  practiceCount?: number
  accuracy?: number
  focusModules?: string[]
}

export type ConsentFlags = {
  learningPersonalize: boolean
  historyRetain: boolean
  shareLearningWithTeacher: boolean
}

export type LearningProfile = {
  subjectsFocus: string[]
  weakKnowledge: { tag: string; level: number }[]
  difficultySweetSpot: number
  nearTermGoal: string
  commonErrorPatterns: string[]
  preferredQuestionTypes: string[]
  lastPracticeSnapshot: { accuracy: number; n: number; at: string }
}

export type SupportProfile = {
  currentMoodTrend: 'stable' | 'stressed' | 'low' | 'volatile'
  stressThemes: string[]
  whatHelps: string[]
  whatToAvoid: string[]
  supportPreference: 'warm' | 'direct' | 'structured'
  safeSummary: string
}

/** @deprecated prefer GrowthStage list; kept for single-card fallbacks */
export type WeeklySummary = {
  weekLabel: string
  learningText: string
  supportText: string
  nextSteps: string[]
}

export type ClassStudentRow = {
  id: string
  name: string
  accuracy: number
  weakTags: string[]
  shared: boolean
}

export type ModuleHotspot = {
  moduleTag: string
  askCount: number
  uniqueStudents: number
  subject: string
}

export type StudentAskProfile = {
  studentId: string
  displayName: string
  totalAsks: number
  modules: { moduleTag: string; askCount: number }[]
}

/** Admin-managed school shared library (visible to teachers/students by audience) */
export type SharedMaterialAudience = 'all' | 'teachers' | 'students'
export type SharedMaterialStatus = 'published' | 'draft' | 'archived'

export type SharedMaterial = {
  id: string
  title: string
  description: string
  subject: string
  tags: string[]
  fileName: string
  mime: string
  byteSize: number
  kind: ChatAttachment['kind']
  audience: SharedMaterialAudience
  status: SharedMaterialStatus
  uploadedByName: string
  createdAt: string
  updatedAt: string
}
