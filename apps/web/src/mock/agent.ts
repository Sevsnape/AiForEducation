import type { ChatAttachment, ChatMessage, ClientMode, Intent, Role } from '../types'

function id() {
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function detectIntent(text: string, mode: ClientMode, role: Role): Intent {
  if (role === 'teacher' && mode === 'counsel') return 'safety'
  if (mode !== 'auto') {
    if (mode === 'practice') return 'practice'
    if (mode === 'question_gen') return 'question_gen'
    if (mode === 'counsel') return 'counsel'
    if (mode === 'study_plan') return 'study_plan'
  }
  if (/自杀|自残|不想活/.test(text)) return 'safety'
  if (/焦虑|难过|压力|心情|害怕|紧张/.test(text)) return 'counsel'
  if (/学习计划|定计划|周计划|复习计划|帮我规划/.test(text)) return 'study_plan'
  if (/学情方案|辅导方案|补差方案|分层方案|针对.*方案/.test(text)) return 'support_scheme'
  if (/出题|组卷|出几道|根据.*文件|按.*材料/.test(text)) return 'question_gen'
  if (/练习|刷题|巩固|错题/.test(text)) return 'practice'
  if (/薄弱|诊断|哪里不会/.test(text)) return 'diagnose'
  return role === 'teacher' || role === 'admin' ? 'question_gen' : 'general'
}

export async function mockInvoke(input: {
  role: Role
  text: string
  mode: ClientMode
  attachments?: ChatAttachment[]
}): Promise<ChatMessage> {
  await new Promise((r) => setTimeout(r, 450 + Math.random() * 350))
  const intent = detectIntent(input.text, input.mode, input.role)
  const files = input.attachments || []
  const fileNames = files.map((f) => f.name).join('、')

  if (intent === 'safety' && input.role === 'teacher' && input.mode === 'counsel') {
    return {
      id: id(),
      role: 'assistant',
      content: '当前账号无法进入学生心情支持会话。请使用出题与授权学情相关功能。',
      intent: 'safety',
      createdAt: new Date().toISOString(),
    }
  }

  if (intent === 'safety') {
    return {
      id: id(),
      role: 'assistant',
      content:
        '我很关心你现在的状态。若你感到危险或有伤害自己的想法，请立刻联系身边可信赖的人，或寻求当地紧急求助资源。我可以继续陪你慢慢说，但现在不会安排练习或出题。这里提供的是学业情绪支持，不能替代专业医疗。',
      intent: 'safety',
      private: true,
      createdAt: new Date().toISOString(),
      payload: {
        type: 'safety_card',
        resources: [
          { label: '联系身边可信的人', kind: 'social' },
          { label: '紧急情况拨打当地急救电话', kind: 'emergency' },
        ],
      },
    }
  }

  if (intent === 'question_gen') {
    const basedOn = fileNames ? `已参考附件「${fileNames}」` : '已按当前知识点'
    return {
      id: id(),
      role: 'assistant',
      content: `${basedOn}生成了几道练习题。可调整难度后再次出题。`,
      intent: 'question_gen',
      createdAt: new Date().toISOString(),
      payload: {
        type: 'question_set',
        questions: [
          {
            stem: fileNames
              ? `根据材料要点，写出一个与「${fileNames}」相关的关键结论。`
              : '二次函数 y=x²-2x-3 的对称轴是？',
            type: 'short_answer',
            answer: fileNames ? '（依材料要点作答）' : 'x=1',
            explanation: fileNames
              ? '抓住材料中的关键结论再落笔。'
              : '对称轴 x=-b/(2a)=2/2=1。',
            knowledgeTags: fileNames ? ['材料仿写'] : ['二次函数'],
            difficulty: 3,
          },
          {
            stem: '若抛物线开口向下且顶点在第二象限，则 a、h 的符号？',
            type: 'short_answer',
            answer: 'a<0，h<0',
            explanation: '开口向下 a<0；顶点横坐标 h= -b/(2a) 在第二象限则 h<0。',
            knowledgeTags: ['二次函数图像'],
            difficulty: 3,
          },
        ],
      },
    }
  }

  if (intent === 'practice') {
    return {
      id: id(),
      role: 'assistant',
      content: fileNames
        ? `已看到你附上的「${fileNames}」。我们先做一道与材料相关的短练习。`
        : '我们先做一道短练习。答完可以继续。',
      intent: 'practice',
      createdAt: new Date().toISOString(),
      payload: {
        type: 'practice_set',
        awaitingAnswer: true,
        question: {
          stem: fileNames
            ? '结合附件材料：请复述其中一道题的题意（用自己的话）。'
            : '计算：(-3)+5 = ?',
          type: 'short_answer',
          answer: fileNames ? '（学生自述）' : '2',
          explanation: fileNames ? '先复述再求解，减少审题跳步。' : '5-3=2。',
          knowledgeTags: fileNames ? ['材料练习'] : ['有理数加减'],
          difficulty: 2,
        },
      },
    }
  }

  if (intent === 'counsel') {
    return {
      id: id(),
      role: 'assistant',
      content: fileNames
        ? `我看到你附上了「${fileNames}」（仅你可见）。想先说说这份材料/作业哪一点让你最卡住或最难受吗？`
        : '我在认真听你说。学习压力大的时候，先允许自己喘口气是很正常的。想先说说最近哪一件事最让你难受，还是学习上的哪一块最让你焦虑？（此对话默认仅你可见。）',
      intent: 'counsel',
      private: true,
      createdAt: new Date().toISOString(),
    }
  }

  if (intent === 'diagnose') {
    return {
      id: id(),
      role: 'assistant',
      content:
        '根据近期练习与提问，相对薄弱的点包括：二次函数、应用题审题。要不要针对「二次函数」做一组短练习？',
      intent: 'diagnose',
      createdAt: new Date().toISOString(),
    }
  }

  if (intent === 'study_plan') {
    const plan = {
      id: `plan-${Date.now()}`,
      title: '共创学习计划（草稿）',
      horizon: '14 天',
      goals: ['聚焦薄弱模块稳步提升', '每天可完成的小目标'],
      steps: [
        '第 1–3 天：诊断错因 + 基础题热身',
        '第 4–10 天：主攻模块短练（每天 10–15 分钟）',
        '第 11–14 天：综合回顾与错题复盘',
      ],
      focusModules: ['二次函数', '应用题'],
      updatedAt: new Date().toISOString().slice(0, 10),
    }
    return {
      id: id(),
      role: 'assistant',
      content:
        '好，我们一起来定学习计划。我先根据你提到的目标和可用时间给一版草稿，你可以改目标、天数或模块，确认后会保存在「我的」。',
      intent: 'study_plan',
      createdAt: new Date().toISOString(),
      payload: { type: 'study_plan', plan },
    }
  }

  if (intent === 'support_scheme') {
    const body = {
      summary: '基于已授权学情的补差草案：聚焦薄弱模块，控制每日可完成量。',
      goals: ['薄弱模块正确率提升约 10%', '能独立完成关键步骤'],
      actions: ['每天 10–15 分钟短练', '隔天一道变式题', '周末错题复盘'],
      focusModules: ['二次函数'],
      horizon: '14 天',
    }
    return {
      id: id(),
      role: 'assistant',
      content:
        input.role === 'teacher'
          ? '已按学情讨论整理一版辅导方案草案。可改目标与行动；满意后点「存入方案库」归档并记版本。'
          : '学情方案由老师基于授权数据制定；你仍可用「学习计划」模式与我一起定个人节奏。',
      intent: 'support_scheme',
      createdAt: new Date().toISOString(),
      payload:
        input.role === 'teacher'
          ? {
              type: 'support_scheme' as const,
              title: '对话整理 · 学情方案',
              body,
            }
          : null,
    }
  }

  return {
    id: id(),
    role: 'assistant',
    content: fileNames
      ? `已收到附件「${fileNames}」。你可以继续提问、要求讲解，或切换到「出题 / 练习」模式基于材料生成题。`
      : input.role === 'teacher'
        ? '可以直接描述「学科 + 知识点 + 题型 + 数量」，讨论学情方案，或使用出题台 / 方案库。'
        : '你可以选择下方模式：练习、出题、学习计划，或聊聊心情；也可以添加文件一起问。',
    intent: 'general',
    createdAt: new Date().toISOString(),
  }
}
