import { useEffect, useState } from 'react'
import { apiFetch } from '@/utils/api'

type Overview = {
  streakDays: number
  todayMinutes: number
  accuracy: number
  completedLessons: number
}

export default function ProgressPage() {
  const [overview, setOverview] = useState<Overview | null>(null)

  useEffect(() => {
    apiFetch<Overview>('/api/progress/overview')
      .then(setOverview)
      .catch(() => {})
  }, [])

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-6">
      <div className="text-sm font-semibold">学习进度追踪</div>
      <div className="mt-1 text-[11px] text-zinc-400">
        完成度、正确率、学习时长、复习队列与错题本
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
          <div className="text-[11px] text-zinc-400">连续学习</div>
          <div className="mt-2 text-lg font-semibold">
            {overview ? `${overview.streakDays} 天` : '—'}
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
          <div className="text-[11px] text-zinc-400">今日时长</div>
          <div className="mt-2 text-lg font-semibold">
            {overview ? `${overview.todayMinutes} 分钟` : '—'}
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
          <div className="text-[11px] text-zinc-400">正确率</div>
          <div className="mt-2 text-lg font-semibold">
            {overview ? `${Math.round(overview.accuracy * 100)}%` : '—'}
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
          <div className="text-[11px] text-zinc-400">已完成课时</div>
          <div className="mt-2 text-lg font-semibold">
            {overview ? overview.completedLessons : '—'}
          </div>
        </div>
      </div>
    </div>
  )
}

