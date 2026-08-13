import type {
  AuditRow,
  ClassStudentRow,
  ConsentFlags,
  GrowthStage,
  LearningProfile,
  ManagedUser,
  ModuleHotspot,
  QuestionPack,
  SharedMaterial,
  StudentAskProfile,
  StudyPlan,
  SupportProfile,
  SupportScheme,
  PackAssignment,
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

/** Teacher studio: versioned question packs */
export const mockQuestionPacks: QuestionPack[] = [
  {
    id: 'qp-1',
    title: '二次函数 · 中档综合',
    subject: '数学',
    knowledge: '二次函数',
    createdAt: '2026-08-08T10:00:00.000Z',
    updatedAt: '2026-08-10T14:20:00.000Z',
    currentVersion: 2,
    versions: [
      {
        id: 'qpv-1-1',
        version: 1,
        createdAt: '2026-08-08T10:00:00.000Z',
        source: 'studio_gen',
        note: '出题台按知识点初版',
        subject: '数学',
        knowledge: '二次函数',
        questions: [
          {
            stem: '已知抛物线 y=x²-2x+1，求顶点坐标。',
            type: 'short_answer',
            answer: '(1,0)',
            explanation: '配方或公式法。',
            knowledgeTags: ['二次函数'],
            difficulty: 2,
          },
          {
            stem: '求对称轴方程。',
            type: 'short_answer',
            answer: 'x=1',
            explanation: '对称轴 x=-b/(2a)。',
            knowledgeTags: ['二次函数'],
            difficulty: 2,
          },
        ],
      },
      {
        id: 'qpv-1-2',
        version: 2,
        createdAt: '2026-08-10T14:20:00.000Z',
        source: 'chat_save',
        note: '助手对话整理：增难度、补解析',
        subject: '数学',
        knowledge: '二次函数',
        questions: [
          {
            stem: '已知抛物线 y=x²-2x+1，求顶点坐标，并说明是否与 x 轴相切。',
            type: 'short_answer',
            answer: '(1,0)；相切',
            explanation: '顶点在 x 轴上则相切。',
            knowledgeTags: ['二次函数'],
            difficulty: 3,
          },
          {
            stem: '若平移使顶点变为 (2,1)，写出新解析式。',
            type: 'short_answer',
            answer: 'y=(x-2)²+1',
            explanation: '顶点式平移。',
            knowledgeTags: ['二次函数'],
            difficulty: 3,
          },
          {
            stem: '比较开口与 y=2x² 的异同。',
            type: 'short_answer',
            answer: '开口同向上，本抛物线更「窄」若系数更大；此处 a=1 更宽',
            explanation: '|a| 越大开口越窄。',
            knowledgeTags: ['二次函数'],
            difficulty: 3,
          },
        ],
      },
    ],
  },
]

/** Admin school library — shared with teachers / students by audience */
export const mockSharedMaterials: SharedMaterial[] = [
  {
    id: 'sm-1',
    title: '二次函数单元讲义',
    description: '校级统一讲义，含顶点式与图像性质。',
    subject: '数学',
    tags: ['二次函数', '课标'],
    fileName: '二次函数单元讲义.pdf',
    mime: 'application/pdf',
    byteSize: 1_240_000,
    kind: 'pdf',
    audience: 'all',
    status: 'published',
    uploadedByName: '校管理员',
    createdAt: '2026-08-01T08:00:00.000Z',
    updatedAt: '2026-08-05T09:00:00.000Z',
  },
  {
    id: 'sm-2',
    title: '中考模拟卷 · 函数综合',
    description: '教师组卷参考；学生可见可练。',
    subject: '数学',
    tags: ['模拟卷', '综合'],
    fileName: '中考模拟_函数综合.pdf',
    mime: 'application/pdf',
    byteSize: 2_100_000,
    kind: 'pdf',
    audience: 'all',
    status: 'published',
    uploadedByName: '校管理员',
    createdAt: '2026-08-03T10:00:00.000Z',
    updatedAt: '2026-08-03T10:00:00.000Z',
  },
  {
    id: 'sm-3',
    title: '教师专用 · 易错点命题说明',
    description: '仅教师可见，用于命题边界与难度梯度。',
    subject: '数学',
    tags: ['命题', '教师'],
    fileName: '易错点命题说明.docx',
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    byteSize: 420_000,
    kind: 'doc',
    audience: 'teachers',
    status: 'published',
    uploadedByName: '校管理员',
    createdAt: '2026-08-04T11:00:00.000Z',
    updatedAt: '2026-08-04T11:00:00.000Z',
  },
  {
    id: 'sm-4',
    title: '学生自测 · 一次函数入门',
    description: '面向学生即时出题与练习。',
    subject: '数学',
    tags: ['一次函数', '入门'],
    fileName: '一次函数入门练习.pdf',
    mime: 'application/pdf',
    byteSize: 680_000,
    kind: 'pdf',
    audience: 'students',
    status: 'published',
    uploadedByName: '校管理员',
    createdAt: '2026-08-06T12:00:00.000Z',
    updatedAt: '2026-08-06T12:00:00.000Z',
  },
  {
    id: 'sm-5',
    title: '草稿 · 未发布阅读材料',
    description: '草稿，师生均不可见。',
    subject: '语文',
    tags: ['草稿'],
    fileName: '阅读材料草稿.txt',
    mime: 'text/plain',
    byteSize: 12_000,
    kind: 'text',
    audience: 'all',
    status: 'draft',
    uploadedByName: '校管理员',
    createdAt: '2026-08-10T08:00:00.000Z',
    updatedAt: '2026-08-10T08:00:00.000Z',
  },
]

/** Teacher: versioned learning-support schemes (authorized analytics only) */
export const mockSupportSchemes: SupportScheme[] = [
  {
    id: 'ss-1',
    title: '林晓 · 二次函数补差',
    scope: 'student',
    studentIds: ['s-1'],
    studentNames: ['林晓'],
    basedOn: {
      accuracy: 0.72,
      weakTags: ['二次函数'],
      hotspotModules: ['二次函数'],
    },
    createdAt: '2026-08-08T09:00:00.000Z',
    updatedAt: '2026-08-10T11:30:00.000Z',
    currentVersion: 2,
    versions: [
      {
        id: 'ssv-1-1',
        version: 1,
        createdAt: '2026-08-08T09:00:00.000Z',
        source: 'class_gen',
        note: '班级学情一键生成',
        body: {
          summary: '林晓练习正确率约 72%，薄弱点为二次函数。基于已授权学情整理。',
          goals: ['二次函数相关正确率提升约 10%', '能独立完成中档题关键步骤'],
          actions: [
            '每天 10–15 分钟围绕「二次函数」巩固',
            '隔天 1 道变式题并写简短错因',
            '周末复盘错题 20 分钟',
          ],
          focusModules: ['二次函数'],
          horizon: '14 天',
        },
      },
      {
        id: 'ssv-1-2',
        version: 2,
        createdAt: '2026-08-10T11:30:00.000Z',
        source: 'chat_save',
        note: '助手对话迭代：缩短每日时长、加审题步骤',
        body: {
          summary: '林晓练习正确率约 72%，薄弱点为二次函数；已收紧每日可完成量。',
          goals: ['两周内选择正确率超过 80%', '大题前先复述题意'],
          actions: [
            '每天 10 分钟二次函数选择',
            '大题前用自己的话复述题意',
            '周末错题复盘 15 分钟',
          ],
          focusModules: ['二次函数', '应用题'],
          horizon: '14 天',
        },
      },
    ],
  },
  {
    id: 'ss-2',
    title: '班级分层 · 二次函数',
    scope: 'class',
    studentIds: ['s-1', 's-2'],
    studentNames: ['林晓', '周予'],
    basedOn: {
      accuracy: 0.66,
      weakTags: ['二次函数', '方程应用'],
      hotspotModules: ['二次函数', '应用题'],
    },
    createdAt: '2026-08-09T16:00:00.000Z',
    updatedAt: '2026-08-09T16:00:00.000Z',
    currentVersion: 1,
    versions: [
      {
        id: 'ssv-2-1',
        version: 1,
        createdAt: '2026-08-09T16:00:00.000Z',
        source: 'class_gen',
        note: '按班级热点一键生成',
        body: {
          summary: '已授权 2 人，共享均正确率约 66%。班级提问热点：二次函数、应用题。',
          goals: ['班级热点模块提问减少', '分层练习覆盖薄弱标签'],
          actions: [
            '课上 10 分钟针对热点模块快练',
            '按正确率分两档布置变式作业',
            '下周复盘提问模块变化',
          ],
          focusModules: ['二次函数', '应用题'],
          horizon: '7 天',
        },
      },
    ],
  },
]

/** Assigned packs for student practice (snapshots) */
export const mockPackAssignments: PackAssignment[] = [
  {
    id: 'asg-1',
    packId: 'qp-1',
    packTitle: '二次函数 · 中档综合',
    packVersion: 2,
    subject: '数学',
    knowledge: '二次函数',
    questions: [
      {
        stem: '已知抛物线 y=x²-2x+1，求顶点坐标，并说明是否与 x 轴相切。',
        type: 'short_answer',
        answer: '(1,0)；相切',
        explanation: '顶点在 x 轴上则相切。',
        knowledgeTags: ['二次函数'],
        difficulty: 3,
      },
      {
        stem: '若平移使顶点变为 (2,1)，写出新解析式。',
        type: 'short_answer',
        answer: 'y=(x-2)²+1',
        explanation: '顶点式平移。',
        knowledgeTags: ['二次函数'],
        difficulty: 3,
      },
      {
        stem: '比较开口与 y=2x² 的异同。',
        type: 'short_answer',
        answer: '开口同向上，本抛物线更「窄」若系数更大；此处 a=1 更宽',
        explanation: '|a| 越大开口越窄。',
        knowledgeTags: ['二次函数'],
        difficulty: 3,
      },
    ],
    assignedByName: '王老师',
    assignedAt: '2026-08-11T09:00:00.000Z',
    dueLabel: '本周五前',
    attempts: [
      {
        studentId: 'u-s1',
        studentName: '林晓',
        status: 'assigned',
        answers: [],
      },
      {
        studentId: 'u-s2',
        studentName: '周予',
        status: 'submitted',
        startedAt: '2026-08-11T10:00:00.000Z',
        submittedAt: '2026-08-11T10:25:00.000Z',
        answers: [
          { questionIndex: 0, studentAnswer: '(1,0)；相切', correct: true },
          { questionIndex: 1, studentAnswer: 'y=(x-2)^2+1', correct: true },
          {
            questionIndex: 2,
            studentAnswer: '开口都向上',
            correct: false,
          },
        ],
        score: 2 / 3,
        aiAnalysis: {
          summary: '正确率 67%（2/3）。顶点与平移已掌握，开口宽窄比较仍不稳。',
          strengths: ['顶点与相切判断正确', '顶点式平移写法基本规范'],
          weaknesses: ['二次函数：开口宽窄（|a|）表述不完整'],
          nextSteps: [
            '对照解析用「|a| 越大开口越窄」造句',
            '再练 2 道开口比较题',
            '掌握后再提高综合难度',
          ],
          focusModules: ['二次函数'],
        },
      },
    ],
  },
]

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
  safeSummary: '近两周考前紧张，表达过自我否定倾向，无明确危机计划。',
}

export const mockThreads: ThreadSummary[] = [
  {
    id: 't-1',
    title: '二次函数巩固',
    primaryIntent: 'practice',
    preview: '我们先做 1 道巩固题…',
    lastActiveAt: '今天 09:12',
    lastActiveDate: '2026-08-10',
    messageCount: 14,
    pinned: true,
    status: 'active',
  },
  {
    id: 't-2',
    title: '情绪支持会话',
    primaryIntent: 'counsel',
    preview: '情绪支持会话',
    lastActiveAt: '昨天 21:40',
    lastActiveDate: '2026-08-09',
    messageCount: 8,
    status: 'active',
    privateHint: true,
  },
  {
    id: 't-3',
    title: '一次函数出题',
    primaryIntent: 'question_gen',
    preview: '已生成 3 道练习题…',
    lastActiveAt: '08-08',
    lastActiveDate: '2026-08-08',
    messageCount: 6,
    status: 'active',
  },
  {
    id: 't-4',
    title: '两周学习计划共创',
    primaryIntent: 'study_plan',
    preview: '好，我们一起来定学习计划…',
    lastActiveAt: '08-07',
    lastActiveDate: '2026-08-07',
    messageCount: 11,
    status: 'active',
  },
  {
    id: 't-5',
    title: '有理数加减练习（旧）',
    primaryIntent: 'practice',
    preview: '计算：(-3)+5 = ?',
    lastActiveAt: '07-28',
    lastActiveDate: '2026-07-28',
    messageCount: 20,
    status: 'archived',
  },
]

export const mockGrowthStages: GrowthStage[] = [
  {
    id: 'g-w4',
    weekLabel: '本周 · 8/4 – 8/10',
    weekStart: '2026-08-04',
    weekEnd: '2026-08-10',
    status: 'current',
    learningText:
      '完成练习 18 题，正确率 68%。二次函数仍是主要薄弱点，应用题审题有所改善。',
    supportText:
      '考前紧张主题出现多次。短目标拆解对你更有效；高压时不会追加刷题。',
    nextSteps: [
      '每天 10 分钟二次函数选择',
      '大题前先用自己的话复述题意',
      '焦虑时先写三件可控的小事',
    ],
    practiceCount: 18,
    accuracy: 0.68,
    focusModules: ['二次函数', '应用题'],
  },
  {
    id: 'g-w3',
    weekLabel: '上周 · 7/28 – 8/3',
    weekStart: '2026-07-28',
    weekEnd: '2026-08-03',
    status: 'past',
    learningText: '完成练习 22 题，正确率 61%。有理数运算趋稳，开始接触二次函数图像。',
    supportText: '周中有一次明显低落，对话后恢复；练习节奏已略放缓。',
    nextSteps: ['二次函数入门选择', '保持每天短练，不堆量'],
    practiceCount: 22,
    accuracy: 0.61,
    focusModules: ['有理数', '二次函数'],
  },
  {
    id: 'g-w2',
    weekLabel: '7/21 – 7/27',
    weekStart: '2026-07-21',
    weekEnd: '2026-07-27',
    status: 'past',
    learningText: '完成练习 15 题，正确率 74%。一次函数掌握较好，开始方程应用。',
    supportText: '整体较平稳，偶有赶作业焦虑。',
    nextSteps: ['方程应用题审题三步法', '周末错题回顾'],
    practiceCount: 15,
    accuracy: 0.74,
    focusModules: ['一次函数', '方程'],
  },
  {
    id: 'g-w1',
    weekLabel: '7/14 – 7/20（已归档）',
    weekStart: '2026-07-14',
    weekEnd: '2026-07-20',
    status: 'archived',
    learningText: '开学前热身周：有理数加减为主，正确率 70%。',
    supportText: '假期尾声略有松懈感，无明显危机信号。',
    nextSteps: ['保持基础题热身'],
    practiceCount: 12,
    accuracy: 0.7,
    focusModules: ['有理数'],
  },
]

/** Convenience: current stage as legacy WeeklySummary shape */
export const mockWeekly: WeeklySummary = {
  weekLabel: mockGrowthStages[0].weekLabel,
  learningText: mockGrowthStages[0].learningText,
  supportText: mockGrowthStages[0].supportText,
  nextSteps: mockGrowthStages[0].nextSteps,
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
    name: '陈默',
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
    orgName: '育才中学',
    status: 'active',
    createdAt: '2026-07-01',
  },
  {
    id: 'u-t1',
    displayName: '王老师',
    email: 'wang@school.demo',
    password: 'teacher123',
    roles: ['teacher'],
    orgName: '育才中学',
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
    orgName: '育才中学',
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
    orgName: '育才中学',
    className: '初二(3)班',
    status: 'active',
    createdAt: '2026-07-10',
  },
  {
    id: 'u-s3',
    displayName: '停用账号',
    email: 'disabled@student.demo',
    password: 'student123',
    roles: ['student'],
    orgName: '育才中学',
    className: '初二(1)班',
    status: 'disabled',
    createdAt: '2026-06-20',
  },
]

export const mockAudits: AuditRow[] = [
  {
    id: 'a-1',
    actor: '王老师',
    action: '拒绝访问',
    resource: '心情会话',
    purpose: '教师不可查看学生心情支持内容',
    at: '2026-08-09 21:12',
  },
  {
    id: 'a-2',
    actor: '林晓',
    action: '危机应答',
    resource: '对话',
    purpose: '高风险或危机信号',
    at: '2026-08-08 15:40',
  },
  {
    id: 'a-3',
    actor: '系统管理员',
    action: '停用账号',
    resource: '用户',
    purpose: '账号生命周期管理',
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
  '你好，我是 AIFOREC。可以陪你练习巩固、按知识点出题、一起定学习计划，或聊聊学习压力。'

export const welcomeTeacher =
  '你好，教学工作台已就绪。可组卷出题、查看授权范围内的学情。'
