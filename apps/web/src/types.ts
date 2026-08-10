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

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  intent?: Intent
  private?: boolean
  createdAt: string
  payload?: QuestionPayload | PracticePayload | SafetyPayload | StudyPlanPayload | null
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

export type ThreadSummary = {
  id: string
  title: string
  primaryIntent: Intent | 'mixed'
  preview: string
  lastActiveAt: string
  privateHint?: boolean
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
