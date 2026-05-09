import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Play } from 'lucide-react'
import { apiFetch } from '@/utils/api'

type Lesson = { id: string; unit: number; title: string }
type CourseDetail = {
  id: string
  title: string
  description: string
  language: 'en' | 'ja' | 'ko'
  level: string
  lessons: Lesson[]
}

export default function CourseDetailPage() {
  const { courseId } = useParams()
  const [data, setData] = useState<CourseDetail | null>(null)

  useEffect(() => {
    let mounted = true
    if (!courseId) return
    apiFetch<CourseDetail>(`/api/courses/${courseId}`)
      .then((d) => {
        if (!mounted) return
        setData(d)
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [courseId])

  return (
    <div className="grid gap-6">
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-6">
        <Link
          to="/courses"
          className="inline-flex items-center gap-2 text-xs text-zinc-300 underline decoration-zinc-700"
        >
          <ArrowLeft className="h-4 w-4" />
          返回课程
        </Link>
        <div className="mt-3 text-sm font-semibold">{data?.title || '课程'}</div>
        <div className="mt-1 text-[11px] text-zinc-400">
          {data?.description || '加载中…'}
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-6">
        <div className="text-sm font-semibold">课时列表</div>
        <div className="mt-4 grid gap-2">
          {data?.lessons?.length ? (
            data.lessons.map((l) => (
              <Link
                key={l.id}
                to={`/lessons/${l.id}`}
                className="group flex items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/50 px-4 py-3 transition hover:bg-zinc-900/50"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-zinc-100">
                    Unit {l.unit} · {l.title}
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-400">
                    场景化内容 + 练习
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 text-xs text-zinc-300">
                  <Play className="h-4 w-4" />
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))
          ) : (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-300">
              暂无课时数据。
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

