import type {
  PracticeAiAnalysis,
  QuestionAttempt,
  QuestionItem,
} from '../types'

function norm(s: string) {
  return s.replace(/\s+/g, '').toLowerCase()
}

/** Loose mock grading for short answers */
export function gradeAnswer(student: string, expected: string): boolean {
  const a = norm(student)
  const b = norm(expected)
  if (!a) return false
  if (a === b) return true
  if (b.includes(a) && a.length >= Math.min(2, b.length)) return true
  if (a.includes(b) && b.length >= 2) return true
  // tolerate common punctuation variants
  const strip = (x: string) => x.replace(/[；;，,。.、]/g, '')
  return strip(a) === strip(b)
}

export function buildAiAnalysis(
  questions: QuestionItem[],
  answers: QuestionAttempt[],
): PracticeAiAnalysis {
  const wrong = answers.filter((a) => !a.correct)
  const right = answers.filter((a) => a.correct)
  const wrongTags = [
    ...new Set(
      wrong.flatMap((a) => questions[a.questionIndex]?.knowledgeTags || []),
    ),
  ]
  const rightTags = [
    ...new Set(
      right.flatMap((a) => questions[a.questionIndex]?.knowledgeTags || []),
    ),
  ]
  const rate = answers.length ? Math.round((right.length / answers.length) * 100) : 0

  if (wrong.length === 0) {
    return {
      summary: `本次全部正确（${rate}%）。掌握较稳，可适度提高难度或做综合变式。`,
      strengths: rightTags.length ? rightTags.map((t) => `${t} 相关题表现稳定`) : ['基础题正确率高'],
      weaknesses: [],
      nextSteps: ['挑战高一档难度的综合题', '试着用自己的话复述解析要点'],
      focusModules: rightTags.slice(0, 3),
    }
  }

  return {
    summary: `正确率 ${rate}%（${right.length}/${answers.length}）。主要卡在：${wrongTags.join('、') || '审题与书写规范'}。`,
    strengths: right.length
      ? [`已掌握 ${right.length} 题对应要点`]
      : ['仍完成了整套作答，可从错因入手'],
    weaknesses: wrongTags.length
      ? wrongTags.map((t) => `${t}：建议对照解析重做变式`)
      : ['答案表述与标准答案差距较大，注意规范写法'],
    nextSteps: [
      '先看错题解析，再用自己的话写一遍关键步骤',
      wrongTags[0] ? `针对「${wrongTags[0]}」再练 2～3 道同型题` : '从错题中挑 1 道口述题意',
      '不要连续刷难题；掌握后再加难度',
    ],
    focusModules: wrongTags.length ? wrongTags : ['综合巩固'],
  }
}

export function classAggregateNote(
  analyses: PracticeAiAnalysis[],
  submitted: number,
  total: number,
): string {
  if (!submitted) return '尚无学生提交，暂无班级分析。'
  const modules = new Map<string, number>()
  for (const a of analyses) {
    for (const m of a.focusModules) modules.set(m, (modules.get(m) || 0) + 1)
  }
  const top = [...modules.entries()].sort((x, y) => y[1] - x[1])[0]
  return `已提交 ${submitted}/${total}。共性薄弱多集中在「${top?.[0] || '综合'}」；建议课上快练 + 分层变式，勿对未提交同学加压催刷。`
}
