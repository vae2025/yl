import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, CheckCircle2, Zap } from 'lucide-react'
import { apiFetch } from '@/utils/api'

type TodayTask = {
  id: string
  type: 'lesson' | 'practice'
  title: string
  reason: string
  targetRoute: string
}

type Overview = {
  streakDays: number
  todayMinutes: number
  accuracy: number
  completedLessons: number
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<TodayTask[]>([])
  const [overview, setOverview] = useState<Overview | null>(null)

  useEffect(() => {
    let mounted = true
    Promise.all([
      apiFetch<{ tasks: TodayTask[] }>('/api/recommendations/today'),
      apiFetch<Overview>('/api/progress/overview'),
    ])
      .then(([t, o]) => {
        if (!mounted) return
        setTasks(t.tasks)
        setOverview(o)
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [])

  const cards = useMemo(() => {
    return [
      {
        label: '连续学习',
        value: overview ? `${overview.streakDays} 天` : '—',
        icon: CalendarDays,
        tint: 'text-rose-300',
      },
      {
        label: '今日时长',
        value: overview ? `${overview.todayMinutes} 分钟` : '—',
        icon: Zap,
        tint: 'text-cyan-300',
      },
      {
        label: '正确率',
        value: overview ? `${Math.round(overview.accuracy * 100)}%` : '—',
        icon: CheckCircle2,
        tint: 'text-violet-300',
      },
    ] as const
  }, [overview])

  return (
    <div className="grid gap-6">
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-6">
        <div className="text-sm font-semibold">今日学习</div>
        <div className="mt-1 text-[11px] text-zinc-400">
          由你的目标、分级与历史表现生成
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          {cards.map((c) => (
            <div
              key={c.label}
              className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4"
            >
              <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                <c.icon className={`h-4 w-4 ${c.tint}`} />
                {c.label}
              </div>
              <div className="mt-2 text-lg font-semibold tracking-tight text-zinc-100">
                {c.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-sm font-semibold">今日任务</div>
            <div className="mt-1 text-[11px] text-zinc-400">
              优先解决薄弱点，保持节奏
            </div>
          </div>
          <Link
            to="/courses"
            className="text-xs text-zinc-300 underline decoration-zinc-700"
          >
            去课程目录
          </Link>
        </div>

        <div className="mt-4 grid gap-3">
          {tasks.length ? (
            tasks.map((t) => (
              <Link
                key={t.id}
                to={t.targetRoute}
                className="group rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 transition hover:bg-zinc-900/50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-zinc-100">
                      {t.title}
                    </div>
                    <div className="mt-1 text-[11px] text-zinc-400">
                      {t.reason}
                    </div>
                  </div>
                  <ArrowRight className="mt-0.5 h-4 w-4 text-zinc-300 transition group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))
          ) : (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-300">
              暂无任务。先完成学习引导或选择一门课程开始。
              <div className="mt-2">
                <Link to="/onboarding" className="text-zinc-100 underline">
                  去学习引导
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

