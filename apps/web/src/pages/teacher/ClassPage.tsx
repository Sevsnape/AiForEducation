import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { mockClassStudents, mockModuleHotspots } from '../../mock/data'
import type { ClassStudentRow } from '../../types'

export function ClassPage() {
  const { createSupportScheme, attachSchemeToChat, setMessages, setMode } = useApp()
  const navigate = useNavigate()
  const [flash, setFlash] = useState<string | null>(null)
  const shared = mockClassStudents.filter((s) => s.shared)
  const avg =
    shared.length === 0
      ? 0
      : Math.round((shared.reduce((a, s) => a + s.accuracy, 0) / shared.length) * 100)
  const classHot = mockModuleHotspots.slice(0, 4)
  const maxAsk = Math.max(...classHot.map((h) => h.askCount), 1)

  function makeStudentScheme(s: ClassStudentRow) {
    if (!s.shared) return
    const weak = s.weakTags[0] || '综合'
    const scheme = createSupportScheme({
      title: `${s.name} · ${weak}补差`,
      scope: 'student',
      studentIds: [s.id],
      studentNames: [s.name],
      basedOn: {
        accuracy: s.accuracy,
        weakTags: s.weakTags,
        hotspotModules: classHot.slice(0, 2).map((h) => h.moduleTag),
      },
      source: 'class_gen',
      note: '班级学情一键生成',
      body: {
        summary: `${s.name} 练习正确率 ${Math.round(s.accuracy * 100)}%，薄弱：${s.weakTags.join('、') || '待补'}。基于已授权学情整理。`,
        goals: [`${weak}相关正确率提升约 10%`, '能独立完成中档题关键步骤'],
        actions: [
          `每天 10–15 分钟围绕「${weak}」巩固`,
          '隔天 1 道变式题并写简短错因',
          '周末复盘错题 20 分钟',
        ],
        focusModules: s.weakTags.length ? s.weakTags : [weak],
        horizon: '14 天',
      },
    })
    setFlash(`已生成方案「${scheme.title}」v1`)
    return scheme
  }

  function makeClassScheme() {
    const tags = [...new Set(shared.flatMap((s) => s.weakTags))]
    const hot = classHot.map((h) => h.moduleTag)
    const scheme = createSupportScheme({
      title: `班级分层 · ${hot[0] || tags[0] || '综合'}`,
      scope: 'class',
      studentIds: shared.map((s) => s.id),
      studentNames: shared.map((s) => s.name),
      basedOn: {
        accuracy: shared.length ? avg / 100 : undefined,
        weakTags: tags,
        hotspotModules: hot,
      },
      source: 'class_gen',
      note: '按班级热点一键生成',
      body: {
        summary: `已授权 ${shared.length} 人，共享均正确率 ${avg}%。班级提问热点：${hot.join('、') || '—'}。`,
        goals: ['班级热点模块提问减少', '分层练习覆盖薄弱标签'],
        actions: [
          '课上 10 分钟针对热点模块快练',
          '按正确率分两档布置变式作业',
          '下周复盘提问模块变化',
        ],
        focusModules: hot.length ? hot : tags,
        horizon: '7 天',
      },
    })
    setFlash(`已生成班级方案「${scheme.title}」v1`)
    return scheme
  }

  return (
    <section className="class">
      <header className="class__head">
        <div>
          <h1 className="page-title">班级学情</h1>
          <p className="page-desc">
            仅展示已同意共享的学情指标与模块提问热点。可据此生成学情方案，并与 AI 迭代后存入方案库。
          </p>
        </div>
        <div className="class__head-right">
          <div className="class__stats">
            <div>
              <span className="stat-n">{mockClassStudents.length}</span>
              <span className="stat-l">班级人数</span>
            </div>
            <div>
              <span className="stat-n">{shared.length}</span>
              <span className="stat-l">已授权</span>
            </div>
            <div>
              <span className="stat-n">{avg}%</span>
              <span className="stat-l">共享均正确率</span>
            </div>
          </div>
          <div className="class__actions">
            <Link className="btn btn-sm" to="/teacher/schemes">
              方案库
            </Link>
            <button
              type="button"
              className="btn btn-sm btn-accent"
              disabled={!shared.length}
              onClick={() => {
                const s = makeClassScheme()
                if (s) navigate('/teacher/schemes')
              }}
            >
              生成班级方案
            </button>
          </div>
        </div>
      </header>

      {flash ? (
        <div className="class-flash" role="status">
          <span>{flash}</span>
          <Link to="/teacher/schemes">查看方案库</Link>
          <button type="button" onClick={() => setFlash(null)}>
            关闭
          </button>
        </div>
      ) : null}

      <div className="class__body">
        <div className="surface table-wrap">
          <table>
            <thead>
              <tr>
                <th>学生</th>
                <th>正确率</th>
                <th>薄弱点</th>
                <th>共享状态</th>
                <th>方案</th>
              </tr>
            </thead>
            <tbody>
              {mockClassStudents.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.shared ? `${Math.round(s.accuracy * 100)}%` : '—'}</td>
                  <td>{s.shared ? s.weakTags.join('、') || '—' : '—'}</td>
                  <td>
                    {s.shared ? (
                      <span className="ok">已授权</span>
                    ) : (
                      <span className="no">未授权</span>
                    )}
                  </td>
                  <td>
                    {s.shared ? (
                      <div className="row-actions">
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => {
                            makeStudentScheme(s)
                            navigate('/teacher/schemes')
                          }}
                        >
                          生成方案
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-accent"
                          onClick={() => {
                            const scheme = makeStudentScheme(s)
                            if (!scheme) return
                            const body = scheme.versions[0].body
                            attachSchemeToChat(scheme.id)
                            setMode('auto')
                            setMessages((prev) => [
                              ...prev,
                              {
                                id: `sys-scheme-${Date.now()}`,
                                role: 'assistant',
                                content: `已根据 ${s.name} 的授权学情生成方案「${scheme.title}」。可继续细化；完成后点「存入方案库」。`,
                                intent: 'support_scheme',
                                createdAt: new Date().toISOString(),
                                payload: {
                                  type: 'support_scheme',
                                  title: scheme.title,
                                  body,
                                  schemeId: scheme.id,
                                  schemeVersion: 1,
                                },
                              },
                            ])
                            navigate('/teacher/chat')
                          }}
                        >
                          生成并对话
                        </button>
                      </div>
                    ) : (
                      <span className="no">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <aside className="surface hot-panel">
          <h2>班级提问模块热点</h2>
          <p className="muted tiny">按学业提问聚合；可据此生成班级方案。</p>
          <ul>
            {classHot.map((h) => (
              <li key={h.moduleTag}>
                <div className="hot-line">
                  <strong>{h.moduleTag}</strong>
                  <span className="muted">
                    {h.askCount} 次 · {h.uniqueStudents} 人
                  </span>
                </div>
                <div className="hot-bar">
                  <i style={{ width: `${(h.askCount / maxAsk) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <style>{`
        .class { display: grid; gap: 0.75rem; }
        .class__head {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: end;
          gap: 0.75rem;
        }
        .class__head-right {
          display: grid;
          gap: 0.45rem;
          justify-items: end;
        }
        .class__actions { display: flex; gap: 0.35rem; flex-wrap: wrap; }
        .class__stats {
          display: flex;
          gap: 0;
          border: 1px solid var(--line);
          background: #fff;
        }
        .class__stats > div {
          display: grid;
          gap: 0.1rem;
          padding: 0.45rem 0.85rem;
          border-right: 1px solid var(--line);
          min-width: 5.5rem;
        }
        .class__stats > div:last-child { border-right: 0; }
        .stat-n {
          font-family: var(--font-display);
          font-size: 1.05rem;
          font-weight: 650;
          line-height: 1.1;
        }
        .stat-l {
          font-size: 0.7rem;
          color: var(--ink-faint);
        }
        .class-flash {
          display: flex;
          flex-wrap: wrap;
          gap: 0.55rem;
          align-items: center;
          padding: 0.45rem 0.75rem;
          font-size: 0.78rem;
          background: var(--accent-soft);
          border: 1px solid color-mix(in srgb, var(--accent) 25%, var(--line));
        }
        .class-flash a { color: var(--accent); font-weight: 650; text-decoration: none; }
        .class-flash button {
          margin-left: auto;
          border: 0;
          background: transparent;
          color: var(--ink-muted);
          cursor: pointer;
          font-size: 0.74rem;
        }
        .class__body {
          display: grid;
          grid-template-columns: minmax(0, 1.6fr) minmax(220px, 0.9fr);
          gap: 0.55rem;
        }
        .table-wrap { overflow: auto; }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.84rem;
        }
        th, td {
          text-align: left;
          padding: 0.55rem 0.75rem;
          border-bottom: 1px solid var(--line);
          vertical-align: middle;
        }
        th {
          color: var(--ink-muted);
          font-weight: 600;
          font-size: 0.75rem;
          background: #f7f9f8;
        }
        tr:last-child td { border-bottom: 0; }
        .ok { color: var(--accent); font-weight: 600; }
        .no { color: var(--ink-faint); }
        .row-actions { display: flex; flex-wrap: wrap; gap: 0.3rem; }
        .hot-panel { padding: 0.75rem 0.85rem; }
        .hot-panel h2 { margin: 0; font-size: 0.92rem; }
        .tiny { margin: 0.2rem 0 0.55rem; font-size: 0.74rem; }
        .hot-panel ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.5rem; }
        .hot-line {
          display: flex;
          justify-content: space-between;
          gap: 0.4rem;
          font-size: 0.82rem;
        }
        .hot-bar {
          margin-top: 0.25rem;
          height: 6px;
          background: #e8eeeb;
          overflow: hidden;
        }
        .hot-bar i {
          display: block;
          height: 100%;
          background: var(--accent);
        }
        @media (max-width: 800px) {
          .class__body { grid-template-columns: 1fr; }
          .class__head-right { justify-items: start; }
        }
      `}</style>
    </section>
  )
}
