import { NavLink } from 'react-router-dom'
import {
  BookOpen,
  ChartLine,
  Flame,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const items = [
  { to: '/dashboard', label: '今日学习', icon: LayoutDashboard },
  { to: '/courses', label: '分级课程', icon: GraduationCap },
  { to: '/practice', label: '互动练习', icon: Target },
  { to: '/progress', label: '进度追踪', icon: ChartLine },
  { to: '/community', label: '社区交流', icon: MessageSquare },
  { to: '/achievements', label: '成就激励', icon: Trophy },
]

export default function SideNav() {
  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-3 backdrop-blur">
      <div className="grid gap-2 rounded-xl bg-zinc-900/50 p-3 ring-1 ring-zinc-800/60">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold tracking-wide text-zinc-200">
              学习模式
            </div>
            <div className="mt-1 text-[11px] leading-relaxed text-zinc-400">
              课程 + 高频练习 + 数据反馈
            </div>
          </div>
          <div className="inline-flex items-center gap-1 rounded-full bg-zinc-950/60 px-2 py-1 text-[11px] text-zinc-300 ring-1 ring-zinc-800">
            <Flame className="h-3.5 w-3.5 text-rose-300" />
            0 连续
          </div>
        </div>
        <div className="mt-1 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-zinc-950/50 p-2 ring-1 ring-zinc-800/70">
            <div className="flex items-center gap-2 text-[11px] text-zinc-400">
              <BookOpen className="h-3.5 w-3.5 text-cyan-300" />
              今日课时
            </div>
            <div className="mt-1 text-sm font-semibold text-zinc-100">—</div>
          </div>
          <div className="rounded-xl bg-zinc-950/50 p-2 ring-1 ring-zinc-800/70">
            <div className="flex items-center gap-2 text-[11px] text-zinc-400">
              <Sparkles className="h-3.5 w-3.5 text-violet-300" />
              推荐练习
            </div>
            <div className="mt-1 text-sm font-semibold text-zinc-100">—</div>
          </div>
        </div>
      </div>

      <nav className="mt-3 grid gap-1">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-900/60 hover:text-zinc-100',
                isActive && 'bg-zinc-900/80 text-zinc-100 ring-1 ring-zinc-800',
              )
            }
          >
            <it.icon className="h-4 w-4" />
            {it.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

