import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '@/utils/api'

type Pref = {
  language: 'en' | 'ja' | 'ko'
  level: 'A1' | 'A2' | 'B1'
  dailyMinutes: number
}

const STORAGE_KEY = 'langlab_pref'

export default function Onboarding() {
  const navigate = useNavigate()
  const initial = useMemo(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as Pref) : null
    } catch {
      return null
    }
  }, [])

  const [language, setLanguage] = useState<Pref['language']>(
    initial?.language || 'en',
  )
  const [level, setLevel] = useState<Pref['level']>(initial?.level || 'A1')
  const [dailyMinutes, setDailyMinutes] = useState<number>(
    initial?.dailyMinutes || 15,
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-6">
      <div className="text-sm font-semibold">学习引导</div>
      <div className="mt-1 text-[11px] text-zinc-400">
        选择语种与当前水平，系统会生成今日任务与学习路径
      </div>

      <form
        className="mt-6 grid gap-4"
        onSubmit={async (e) => {
          e.preventDefault()
          setSaving(true)
          setError(null)
          const pref: Pref = { language, level, dailyMinutes }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(pref))
          try {
            await apiFetch<{ ok: true }>('/api/profile/preferences', {
              method: 'POST',
              json: pref,
            })
            navigate('/dashboard', { replace: true })
          } catch (err) {
            setError(err instanceof Error ? err.message : '保存失败')
          } finally {
            setSaving(false)
          }
        }}
      >
        <div className="grid gap-2">
          <div className="text-xs font-semibold text-zinc-200">语种</div>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { code: 'en', name: '英语' },
                { code: 'ja', name: '日语' },
                { code: 'ko', name: '韩语' },
              ] as const
            ).map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLanguage(l.code)}
                className={`rounded-2xl border px-3 py-3 text-sm transition ${
                  language === l.code
                    ? 'border-cyan-400/40 bg-cyan-400/10 text-zinc-100'
                    : 'border-zinc-800 bg-zinc-950/40 text-zinc-300 hover:bg-zinc-900/60'
                }`}
              >
                {l.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-2">
          <div className="text-xs font-semibold text-zinc-200">当前水平</div>
          <div className="grid grid-cols-3 gap-2">
            {(['A1', 'A2', 'B1'] as const).map((lv) => (
              <button
                key={lv}
                type="button"
                onClick={() => setLevel(lv)}
                className={`rounded-2xl border px-3 py-3 text-sm transition ${
                  level === lv
                    ? 'border-violet-400/40 bg-violet-400/10 text-zinc-100'
                    : 'border-zinc-800 bg-zinc-950/40 text-zinc-300 hover:bg-zinc-900/60'
                }`}
              >
                {lv}
              </button>
            ))}
          </div>
          <div className="text-[11px] text-zinc-400">
            A1 入门｜A2 基础｜B1 进阶
          </div>
        </div>

        <label className="grid gap-2">
          <div className="text-xs font-semibold text-zinc-200">每日目标（分钟）</div>
          <input
            type="range"
            min={10}
            max={60}
            step={5}
            value={dailyMinutes}
            onChange={(e) => setDailyMinutes(Number(e.target.value))}
          />
          <div className="text-[11px] text-zinc-400">{dailyMinutes} 分钟/天</div>
        </label>

        {error ? (
          <div className="rounded-2xl border border-rose-900/60 bg-rose-950/30 px-3 py-2 text-xs text-rose-200">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          className="rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-white disabled:opacity-60"
        >
          {saving ? '生成中…' : '生成学习路径'}
        </button>
      </form>
    </div>
  )
}

