import type {
  AuditRow,
  ClassStudentRow,
  ConsentFlags,
  LearningProfile,
  ManagedUser,
  ModuleHotspot,
  StudentAskProfile,
  StudyPlan,
  SupportProfile,
  ThreadSummary,
  WeeklySummary,
} from '../types'

export const mockConsent: ConsentFlags = {
  learningPersonalize: true,
  historyRetain: true,
  shareLearningWithTeacher: false,
}

/** Per-student overrides managed by admin (student Me cannot edit). */
export const mockUserConsents: Record<string, ConsentFlags> = {
  'u-s1': {
    learningPersonalize: true,
    historyRetain: true,
    shareLearningWithTeacher: true,
  },
  'u-s2': {
    learningPersonalize: true,
    historyRetain: true,
    shareLearningWithTeacher: true,
  },
  'u-s3': {
    learningPersonalize: false,
    historyRetain: false,
    shareLearningWithTeacher: false,
  },
}

export const mockStudyPlan: StudyPlan = {
  id: 'plan-1',
  title: '两周二次函数巩固计划',
  horizon: '14 天',
  goals: ['选择正确率 ≥ 80%', '能独立求顶点与对称轴'],
  steps: [
    '每天 10 分钟选择/填空',
    '隔天 1 道中档综合题',
    '周末回顾错题并复述题意',
  ],
  focusModules: ['二次函数', '应用题'],
  updatedAt: '2026-08-09',
}

export const mockLearning: LearningProfile = {
  subjectsFocus: ['数学'],
  weakKnowledge: [
    { tag: '二次函数', level: 2 },
    { tag: '应用题审题', level: 3 },
  ],
  difficultySweetSpot: 3,
  nearTermGoal: '两周内二次函数选择正确率超过 80%',
  commonErrorPatterns: ['审题跳步', '符号粗心'],
  preferredQuestionTypes: ['选择题', '填空题'],
  lastPracticeSnapshot: { accuracy: 0.68, n: 18, at: '2026-08-09' },
}

export const mockSupport: SupportProfile = {
  currentMoodTrend: 'stressed',
  stressThemes: ['考试焦虑', '怕辜负期待'],
  whatHelps: ['先共情再拆任务', '短目标'],
  whatToAvoid: ['说别人都很轻松', '立刻加压刷题'],
  supportPreference: 'warm',
  safeSummary: '近两周考前紧张，表达过自我否定倾向，无明确危机计划（示例数据）。',
}

export const mockThreads: ThreadSummary[] = [
  {
    id: 't-1',
    title: '二次函数巩固',
    primaryIntent: 'practice',
    preview: '我们先做 1 道巩固题…',
    lastActiveAt: '今天 09:12',
  },
  {
    id: 't-2',
    title: '情绪支持会话',
    primaryIntent: 'counsel',
    preview: '情绪支持会话',
    lastActiveAt: '昨天 21:40',
    privateHint: true,
  },
  {
    id: 't-3',
    title: '一次函数出题',
    primaryIntent: 'question_gen',
    preview: '已生成 3 道示例题…',
    lastActiveAt: '08-08',
  },
]

export const mockWeekly: WeeklySummary = {
  weekLabel: '本周 · 8/4 – 8/10',
  learningText: '完成练习 18 题，正确率 68%。二次函数仍是主要薄弱点，应用题审题有所改善。',
  supportText: '考前紧张主题出现多次。短目标拆解对你更有效；系统已避免在高压时追加刷题。',
  nextSteps: ['每天 10 分钟二次函数选择', '大题前先用自己的话复述题意', '焦虑时先写三件可控的小事'],
}

export const mockClassStudents: ClassStudentRow[] = [
  {
    id: 's-1',
    name: '林晓',
    accuracy: 0.72,
    weakTags: ['二次函数'],
    shared: true,
  },
  {
    id: 's-2',
    name: '周予',
    accuracy: 0.61,
    weakTags: ['方程应用'],
    shared: true,
  },
  {
    id: 's-3',
    name: '未授权示例',
    accuracy: 0,
    weakTags: [],
    shared: false,
  },
]

export const mockUsers: ManagedUser[] = [
  {
    id: 'u-admin',
    displayName: '系统管理员',
    email: 'admin@school.demo',
    password: 'admin123',
    roles: ['admin'],
    orgName: '示例中学',
    status: 'active',
    createdAt: '2026-07-01',
  },
  {
    id: 'u-t1',
    displayName: '王老师',
    email: 'wang@school.demo',
    password: 'teacher123',
    roles: ['teacher'],
    orgName: '示例中学',
    className: '初二(3)班',
    status: 'active',
    createdAt: '2026-07-05',
  },
  {
    id: 'u-s1',
    displayName: '林晓',
    email: 'linxiao@student.demo',
    password: 'student123',
    roles: ['student'],
    orgName: '示例中学',
    className: '初二(3)班',
    status: 'active',
    createdAt: '2026-07-10',
  },
  {
    id: 'u-s2',
    displayName: '周予',
    email: 'zhouyu@student.demo',
    password: 'student123',
    roles: ['student'],
    orgName: '示例中学',
    className: '初二(3)班',
    status: 'active',
    createdAt: '2026-07-10',
  },
  {
    id: 'u-s3',
    displayName: '停用示例',
    email: 'disabled@student.demo',
    password: 'student123',
    roles: ['student'],
    orgName: '示例中学',
    className: '初二(1)班',
    status: 'disabled',
    createdAt: '2026-06-20',
  },
]

export const mockAudits: AuditRow[] = [
  {
    id: 'a-1',
    actor: '王老师',
    action: 'guard_deny',
    resource: 'counsel',
    purpose: 'teacher_cannot_access_student_support',
    at: '2026-08-09 21:12',
  },
  {
    id: 'a-2',
    actor: '林晓',
    action: 'safety_reply',
    resource: 'thread:t-demo',
    purpose: 'crisis_or_high_risk',
    at: '2026-08-08 15:40',
  },
  {
    id: 'a-3',
    actor: '系统管理员',
    action: 'user_disable',
    resource: 'user:u-s3',
    purpose: 'account_lifecycle',
    at: '2026-08-01 10:02',
  },
]

/** 与后端 AnalyticsService demo seed 对齐（仅学习侧） */
export const mockModuleHotspots: ModuleHotspot[] = [
  { moduleTag: '二次函数', askCount: 3, uniqueStudents: 2, subject: '数学' },
  { moduleTag: '应用题', askCount: 1, uniqueStudents: 1, subject: '数学' },
  { moduleTag: '一次函数', askCount: 1, uniqueStudents: 1, subject: '数学' },
  { moduleTag: '方程', askCount: 1, uniqueStudents: 1, subject: '数学' },
  { moduleTag: '几何证明', askCount: 1, uniqueStudents: 1, subject: '数学' },
  { moduleTag: '有理数', askCount: 1, uniqueStudents: 1, subject: '数学' },
]

export const mockStudentAskProfiles: StudentAskProfile[] = [
  {
    studentId: 'u-s1',
    displayName: '林晓',
    totalAsks: 4,
    modules: [
      { moduleTag: '二次函数', askCount: 2 },
      { moduleTag: '应用题', askCount: 1 },
      { moduleTag: '有理数', askCount: 1 },
    ],
  },
  {
    studentId: 'u-s2',
    displayName: '周予',
    totalAsks: 4,
    modules: [
      { moduleTag: '一次函数', askCount: 1 },
      { moduleTag: '二次函数', askCount: 1 },
      { moduleTag: '方程', askCount: 1 },
      { moduleTag: '几何证明', askCount: 1 },
    ],
  },
]

export const welcomeStudent =
  '你好，我是 AIFOREC。可以陪你练习巩固、按知识点出题、一起定学习计划，或聊聊学习压力——心情相关默认仅你可见。'

export const welcomeTeacher =
  '你好，教师工作台已就绪。可组卷出题、查看授权范围内学情。学生支持侧内容不会出现在此。'
