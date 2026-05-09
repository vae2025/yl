import { Link, useNavigate } from 'react-router-dom'
import { LogOut, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

export default function TopNav() {
  const user = useAuthStore((s) => s.user)
  const clear = useAuthStore((s) => s.clear)
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-800/80 bg-zinc-950/75 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/dashboard" className="group inline-flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 ring-1 ring-zinc-800">
            <Sparkles className="h-5 w-5 text-cyan-300" />
          </span>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-wide text-zinc-100">
              LangLab
            </div>
            <div className="text-[11px] text-zinc-400">沉浸式语言学习</div>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden text-sm text-zinc-300 md:block">
                {user.username}
              </div>
              <button
                type="button"
                onClick={() => {
                  clear()
                  navigate('/')
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-900"
              >
                <LogOut className="h-4 w-4" />
                退出
              </button>
            </>
          ) : (
            <Link
              to="/auth/login"
              className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-900"
            >
              登录
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

