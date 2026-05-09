import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, Filter } from 'lucide-react'
import { apiFetch } from '@/utils/api'

type Course = {
  id: string
  language: 'en' | 'ja' | 'ko'
  level: string
  title: string
  description: string
}

const languageName: Record<Course['language'], string> = {
  en: '英语',
  ja: '日语',
  ko: '韩语',
}

export default function Courses() {
  const [params, setParams] = useSearchParams()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  const language = (params.get('language') as Course['language'] | null) || 'en'
  const level = params.get('level') || 'A1'

  useEffect(() => {
    let mounted = true
    setLoading(true)
    apiFetch<{ courses: Course[] }>(`/api/courses?language=${language}&level=${level}`)
      .then((d) => {
        if (!mounted) return
        setCourses(d.courses)
      })
      .catch(() => {})
      .finally(() => {
        if (!mounted) return
        setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [language, level])

  const levels = useMemo(() => ['A1', 'A2', 'B1'], [])

  return (
    <div className="grid gap-6">
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold">分级课程</div>
            <div className="mt-1 text-[11px] text-zinc-400">
              {languageName[language]} · {level} · 单元化学习
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-xs text-zinc-300">
            <Filter className="h-4 w-4" />
            筛选
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
            <div className="text-xs font-semibold text-zinc-200">语种</div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(['en', 'ja', 'ko'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    params.set('language', c)
                    setParams(params, { replace: true })
                  }}
                  className={`rounded-xl border px-3 py-2 text-sm transition ${
                    language === c
                      ? 'border-cyan-400/40 bg-cyan-400/10 text-zinc-100'
                      : 'border-zinc-800 bg-zinc-950/30 text-zinc-300 hover:bg-zinc-900/50'
                  }`}
                >
                  {languageName[c]}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
            <div className="text-xs font-semibold text-zinc-200">等级</div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {levels.map((lv) => (
                <button
                  key={lv}
                  type="button"
                  onClick={() => {
                    params.set('level', lv)
                    setParams(params, { replace: true })
                  }}
                  className={`rounded-xl border px-3 py-2 text-sm transition ${
                    level === lv
                      ? 'border-violet-400/40 bg-violet-400/10 text-zinc-100'
                      : 'border-zinc-800 bg-zinc-950/30 text-zinc-300 hover:bg-zinc-900/50'
                  }`}
                >
                  {lv}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        {loading ? (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-6 text-sm text-zinc-300">
            加载中…
          </div>
        ) : courses.length ? (
          courses.map((c) => (
            <Link
              key={c.id}
              to={`/courses/${c.id}`}
              className="group rounded-3xl border border-zinc-800 bg-zinc-950/40 p-6 transition hover:bg-zinc-900/40"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-zinc-100">
                    {c.title}
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-400">
                    {c.description}
                  </div>
                </div>
                <ArrowRight className="mt-0.5 h-4 w-4 text-zinc-300 transition group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))
        ) : (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-6 text-sm text-zinc-300">
            暂无课程数据。
          </div>
        )}
      </div>
    </div>
  )
}

