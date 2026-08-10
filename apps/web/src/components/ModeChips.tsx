import type { ClientMode } from '../types'

const modes: { id: ClientMode; label: string }[] = [
  { id: 'auto', label: '自动' },
  { id: 'practice', label: '练习' },
  { id: 'question_gen', label: '出题' },
  { id: 'study_plan', label: '学习计划' },
  { id: 'counsel', label: '心情' },
]

type Props = {
  value: ClientMode
  onChange: (mode: ClientMode) => void
  teacher?: boolean
}

export function ModeChips({ value, onChange, teacher }: Props) {
  const list = teacher
    ? modes.filter((m) => m.id !== 'counsel' && m.id !== 'study_plan')
    : modes
  return (
    <div className="chip-row" role="group" aria-label="对话模式">
      {list.map((m) => (
        <button
          key={m.id}
          type="button"
          className={`chip ${value === m.id ? 'active' : ''}`}
          onClick={() => onChange(m.id)}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}
