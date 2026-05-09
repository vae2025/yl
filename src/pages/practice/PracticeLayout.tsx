import { NavLink, Outlet } from 'react-router-dom'
import { cn } from '@/lib/utils'

const tabs = [
  { to: '/practice/vocab', label: '单词记忆' },
  { to: '/practice/grammar', label: '语法练习' },
  { to: '/practice/speaking', label: '口语跟读' },
  { to: '/practice/listening', label: '听力训练' },
]

export default function PracticeLayout() {
  return (
    <div className="grid gap-6">
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-6">
        <div className="text-sm font-semibold">互动练习</div>
        <div className="mt-1 text-[11px] text-zinc-400">
          词汇、语法、口语、听力四个模块
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) =>
                cn(
                  'rounded-2xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-xs text-zinc-300 transition hover:bg-zinc-900/50',
                  isActive && 'border-cyan-400/30 bg-cyan-400/10 text-zinc-100',
                )
              }
            >
              {t.label}
            </NavLink>
          ))}
        </div>
      </div>

      <Outlet />
    </div>
  )
}

