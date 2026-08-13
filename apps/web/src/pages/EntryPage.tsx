import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { BrandMark } from '../components/BrandMark'
import { useApp } from '../context/AppContext'
import { roleHome } from '../mock/auth'

export function EntryPage() {
  const { login, role, currentUser } = useApp()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (role && currentUser) {
      navigate(roleHome[role], { replace: true })
    }
  }, [role, currentUser, navigate])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    await new Promise((r) => setTimeout(r, 280))
    const result = login(email, password)
    setLoading(false)
    if (!result.ok) {
      setError(result.message || '登录失败')
      return
    }
    navigate(result.redirect || '/', { replace: true })
  }

  return (
    <div className="login-page">
      <div className="login-page__art" aria-hidden>
        <div className="orb orb-a" />
        <div className="orb orb-b" />
        <div className="login-copy">
          <p className="eyebrow">AIFOREC</p>
          <h1>学得更稳，也照顾好心情。</h1>
          <p>练习巩固、个性化出题，以及学业压力下的倾诉空间。</p>
        </div>
      </div>

      <section className="login-card surface">
        <BrandMark size="lg" />
        <p className="login-card__lead">使用学校账号登录。</p>

        <form className="login-form" onSubmit={onSubmit}>
          <label className="field-label">
            账号邮箱
            <input
              className="field"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="field-label">
            密码
            <input
              className="field"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error ? <p className="login-error">{error}</p> : null}
          <button className="btn btn-primary login-submit" type="submit" disabled={loading}>
            {loading ? '登录中…' : '进入 AIFOREC'}
          </button>
        </form>
      </section>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
        }
        .login-page__art {
          position: relative;
          overflow: hidden;
          padding: clamp(2rem, 5vw, 4rem);
          display: grid;
          align-content: end;
          background:
            linear-gradient(160deg, #17352e 0%, #0f1f1c 48%, #1a2e28 100%);
          color: #eef8f3;
        }
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(8px);
        }
        .orb-a {
          width: 280px;
          height: 280px;
          background: rgba(125, 206, 184, 0.28);
          top: 12%;
          left: 10%;
          animation: floaty 8s ease-in-out infinite;
        }
        .orb-b {
          width: 220px;
          height: 220px;
          background: rgba(255,255,255,0.08);
          right: 8%;
          bottom: 22%;
          animation: floaty 10s ease-in-out 1s infinite reverse;
        }
        .login-copy {
          position: relative;
          z-index: 1;
          max-width: 28rem;
        }
        .eyebrow {
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-size: 0.72rem;
          opacity: 0.7;
          margin: 0 0 0.8rem;
        }
        .login-copy h1 {
          margin: 0;
          font-size: clamp(2rem, 4vw, 2.8rem);
          line-height: 1.15;
          color: #f4fffa;
        }
        .login-copy p:last-child {
          margin: 1rem 0 0;
          line-height: 1.65;
          color: rgba(238,248,243,0.78);
        }
        .login-card {
          margin: auto;
          width: min(100% - 2rem, 420px);
          padding: 1.8rem 1.6rem 1.5rem;
          border-radius: 14px;
          animation: softIn 0.5s ease both;
        }
        .login-card__lead {
          margin: 1rem 0 1.25rem;
          color: var(--ink-muted);
          line-height: 1.55;
          font-size: 0.95rem;
        }
        .login-form {
          display: grid;
          gap: 0.8rem;
        }
        .field-label {
          display: grid;
          gap: 0.35rem;
          font-size: 0.84rem;
          color: var(--ink-muted);
        }
        .login-submit { width: 100%; margin-top: 0.2rem; }
        .login-error {
          margin: 0;
          color: var(--danger);
          font-size: 0.88rem;
        }
        @keyframes softIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: none; }
        }
        @keyframes floaty {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(12px); }
        }
        @media (max-width: 900px) {
          .login-page { grid-template-columns: 1fr; }
          .login-page__art {
            min-height: 240px;
            align-content: center;
          }
          .login-card {
            margin: 1.2rem auto 2rem;
          }
        }
      `}</style>
    </div>
  )
}
