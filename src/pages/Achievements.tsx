import { useEffect, useState } from 'react'
import { apiFetch } from '@/utils/api'

type Achievement = {
  id: string
  name: string
  description: string
  earned: boolean
}

export default function AchievementsPage() {
  const [items, setItems] = useState<Achievement[]>([])

  useEffect(() => {
    apiFetch<{ achievements: Achievement[] }>('/api/achievements/me')
      .then((d) => setItems(d.achievements))
      .catch(() => {})
  }, [])

  return (
    <div className="grid gap-6">
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-6">
        <div className="text-sm font-semibold">成就激励</div>
        <div className="mt-1 text-[11px] text-zinc-400">
          记录坚持与突破，给自己一个可见的进步轨迹
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {items.length ? (
          items.map((a) => (
            <div
              key={a.id}
              className={`rounded-3xl border p-6 ${
                a.earned
                  ? 'border-cyan-400/30 bg-cyan-400/10'
                  : 'border-zinc-800 bg-zinc-950/40'
              }`}
            >
              <div className="text-sm font-semibold text-zinc-100">{a.name}</div>
              <div className="mt-1 text-[11px] leading-relaxed text-zinc-400">
                {a.description}
              </div>
              <div className="mt-3 text-[11px] text-zinc-500">
                {a.earned ? '已解锁' : '未解锁'}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-6 text-sm text-zinc-300">
            暂无成就数据。
          </div>
        )}
      </div>
    </div>
  )
}

