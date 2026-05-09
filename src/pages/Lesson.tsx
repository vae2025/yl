import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BookOpen, Headphones, Mic, SpellCheck } from 'lucide-react'
import { apiFetch } from '@/utils/api'

type Line = { speaker?: string; text: string }
type LessonDetail = {
  id: string
  title: string
  courseId: string
  unit: number
  contentType: 'dialogue' | 'article'
  lines: Line[]
  vocab: { term: string; reading?: string; meaning: string }[]
  grammar: { title: string; explanation: string; examples: string[] }[]
}

export default function LessonPage() {
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<LessonDetail | null>(null)
  const [showVocab, setShowVocab] = useState(true)
  const [showGrammar, setShowGrammar] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [completeOk, setCompleteOk] = useState(false)

  useEffect(() => {
    let mounted = true
    if (!lessonId) return
    apiFetch<LessonDetail>(`/api/lessons/${lessonId}`)
      .then((d) => {
        if (!mounted) return
        setData(d)
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [lessonId])

  const primaryLines = useMemo(() => data?.lines || [], [data])

  return (
    <div className="grid gap-6">
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-6">
        <div className="text-sm font-semibold">{data?.title || '课时'}</div>
        <div className="mt-1 text-[11px] text-zinc-400">
          Unit {data?.unit ?? '—'} · 沉浸式内容 + 互动练习
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <section className="col-span-12 lg:col-span-8">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold">内容</div>
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-2 text-[11px] text-zinc-400">
                  <input
                    type="checkbox"
                    checked={showVocab}
                    onChange={(e) => setShowVocab(e.target.checked)}
                  />
                  词汇
                </label>
                <label className="inline-flex items-center gap-2 text-[11px] text-zinc-400">
                  <input
                    type="checkbox"
                    checked={showGrammar}
                    onChange={(e) => setShowGrammar(e.target.checked)}
                  />
                  语法
                </label>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {primaryLines.map((l, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4"
                >
                  {l.speaker ? (
                    <div className="text-[11px] font-semibold text-zinc-300">
                      {l.speaker}
                    </div>
                  ) : null}
                  <div className="mt-1 text-sm leading-relaxed text-zinc-100">
                    {l.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
              <Link
                to={`/practice/vocab?lesson=${data?.id || ''}`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/50 px-3 py-3 text-sm text-zinc-200 transition hover:bg-zinc-900/60"
              >
                <SpellCheck className="h-4 w-4 text-rose-300" />
                单词
              </Link>
              <Link
                to={`/practice/grammar?lesson=${data?.id || ''}`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/50 px-3 py-3 text-sm text-zinc-200 transition hover:bg-zinc-900/60"
              >
                <BookOpen className="h-4 w-4 text-violet-300" />
                语法
              </Link>
              <Link
                to={`/practice/speaking?lesson=${data?.id || ''}`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/50 px-3 py-3 text-sm text-zinc-200 transition hover:bg-zinc-900/60"
              >
                <Mic className="h-4 w-4 text-cyan-300" />
                跟读
              </Link>
              <Link
                to={`/practice/listening?lesson=${data?.id || ''}`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/50 px-3 py-3 text-sm text-zinc-200 transition hover:bg-zinc-900/60"
              >
                <Headphones className="h-4 w-4 text-zinc-200" />
                听力
              </Link>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
              <div className="text-[11px] text-zinc-400">
                学完后点击完成，用于进度追踪与推荐调整
              </div>
              <button
                type="button"
                disabled={!data?.id || completing}
                onClick={async () => {
                  if (!data?.id) return
                  setCompleting(true)
                  try {
                    await apiFetch<{ ok: true }>(`/api/lessons/${data.id}/complete`, {
                      method: 'POST',
                      json: { minutes: 12 },
                    })
                    setCompleteOk(true)
                    navigate('/dashboard')
                  } finally {
                    setCompleting(false)
                  }
                }}
                className="rounded-2xl bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-white disabled:opacity-60"
              >
                {completeOk ? '已完成' : completing ? '提交中…' : '完成本课'}
              </button>
            </div>
          </div>
        </section>

        <aside className="col-span-12 lg:col-span-4">
          <div className="grid gap-6">
            {showVocab ? (
              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-6">
                <div className="text-sm font-semibold">本课词汇</div>
                <div className="mt-4 grid gap-2">
                  {data?.vocab?.length ? (
                    data.vocab.map((v) => (
                      <div
                        key={v.term}
                        className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4"
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <div className="text-sm font-semibold text-zinc-100">
                            {v.term}
                          </div>
                          {v.reading ? (
                            <div className="text-[11px] text-zinc-400">
                              {v.reading}
                            </div>
                          ) : null}
                        </div>
                        <div className="mt-1 text-[11px] text-zinc-400">
                          {v.meaning}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-300">
                      暂无词汇数据。
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {showGrammar ? (
              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-6">
                <div className="text-sm font-semibold">语法点</div>
                <div className="mt-4 grid gap-2">
                  {data?.grammar?.length ? (
                    data.grammar.map((g) => (
                      <div
                        key={g.title}
                        className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4"
                      >
                        <div className="text-sm font-semibold text-zinc-100">
                          {g.title}
                        </div>
                        <div className="mt-1 text-[11px] leading-relaxed text-zinc-400">
                          {g.explanation}
                        </div>
                        {g.examples?.length ? (
                          <div className="mt-2 grid gap-1">
                            {g.examples.slice(0, 2).map((ex) => (
                              <div
                                key={ex}
                                className="text-[11px] text-zinc-300"
                              >
                                {ex}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-300">
                      暂无语法数据。
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  )
}
