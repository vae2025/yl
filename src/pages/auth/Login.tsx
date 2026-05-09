import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { apiFetch } from '@/utils/api'
import { useAuthStore } from '@/stores/authStore'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((s) => s.setAuth)

  const from = useMemo(() => {
    const s = location.state as { from?: string } | null
    return s?.from || '/dashboard'
  }, [location.state])

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex max-w-lg flex-col px-4 pb-14 pt-10">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-6">
          <div className="text-sm font-semibold">登录</div>
          <div className="mt-1 text-[11px] text-zinc-400">
            使用邮箱或用户名登录
          </div>

          <form
            className="mt-6 grid gap-3"
            onSubmit={async (e) => {
              e.preventDefault()
              setError(null)
              setLoading(true)
              try {
                const data = await apiFetch<{ token: string; user: { id: string; email: string; username: string } }>(
                  '/api/auth/login',
                  { method: 'POST', json: { identifier, password } },
                )
                setAuth({ token: data.token, user: data.user })
                navigate(from, { replace: true })
              } catch (err) {
                setError(err instanceof Error ? err.message : '登录失败')
              } finally {
                setLoading(false)
              }
            }}
          >
            <label className="grid gap-1">
              <span className="text-[11px] text-zinc-400">邮箱或用户名</span>
              <input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="rounded-2xl border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm outline-none ring-cyan-300/30 focus:ring-4"
                placeholder="you@example.com / username"
                required
              />
            </label>
            <label className="grid gap-1">
              <span className="text-[11px] text-zinc-400">密码</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-2xl border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm outline-none ring-cyan-300/30 focus:ring-4"
                placeholder="••••••••"
                required
              />
            </label>

            {error ? (
              <div className="rounded-2xl border border-rose-900/60 bg-rose-950/30 px-3 py-2 text-xs text-rose-200">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-white disabled:opacity-60"
            >
              {loading ? '登录中…' : '登录'}
            </button>
          </form>

          <div className="mt-4 text-[11px] text-zinc-400">
            还没有账号？{' '}
            <Link to="/auth/register" className="text-zinc-200 underline">
              去注册
            </Link>
          </div>
        </div>
        <Link
          to="/"
          className="mt-4 text-center text-xs text-zinc-400 underline decoration-zinc-700"
        >
          返回首页
        </Link>
      </div>
    </div>
  )
}

