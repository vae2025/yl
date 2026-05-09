import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { apiFetch } from '@/utils/api'

type Lesson = {
  id: string
  lines: { text: string }[]
  grammar: { title: string; explanation: string; examples: string[] }[]
}

type Question = {
  id: string
  title: string
  prompt: string
  correct: string
  options: string[]
  explanation: string
}

function shuffle<T>(arr: T[]) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function GrammarPractice() {
  const [params] = useSearchParams()
  const lessonId = params.get('lesson')

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [correct, setCorrect] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    setLesson(null)
    setIdx(0)
    setSelected(null)
    setCorrect(0)
    setDone(false)
    if (!lessonId) return
    apiFetch<Lesson>(`/api/lessons/${lessonId}`)
      .then(setLesson)
      .catch(() => {})
  }, [lessonId])

  const questions = useMemo(() => {
    if (!lesson) return [] as Question[]
    const pool = [
      ...lesson.lines.map((l) => l.text),
      ...lesson.grammar.flatMap((g) => g.examples),
    ].filter(Boolean)

    return lesson.grammar.map((g, i) => {
      const correct = g.examples[0] || pool[0] || '—'
      const wrong = shuffle(pool.filter((x) => x !== correct)).slice(0, 2)
      return {
        id: `${lesson.id}_${i}`,
        title: g.title,
        prompt: `以下哪句更符合「${g.title}」？`,
        correct,
        options: shuffle([correct, ...wrong]),
        explanation: g.explanation,
      }
    })
  }, [lesson])

  const current = questions[idx] || null

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold">语法练习</div>
          <div className="mt-1 text-[11px] text-zinc-400">
            选择题 + 即时解析（用于巩固语法点）
          </div>
        </div>
        <div className="text-[11px] text-zinc-400">
          {done ? '完成' : `${Math.min(idx + 1, questions.length)}/${questions.length || '—'}`}
        </div>
      </div>

      {!lessonId ? (
        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-300">
          从课时页面进入可自动加载本课语法点。
        </div>
      ) : !lesson ? (
        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-300">
          加载中…
        </div>
      ) : done ? (
        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-200">
          本轮完成：正确 {correct}/{questions.length}
        </div>
      ) : current ? (
        <div className="mt-6 grid gap-3">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/50 p-6">
            <div className="text-xs font-semibold text-zinc-300">{current.title}</div>
            <div className="mt-2 text-sm text-zinc-100">{current.prompt}</div>

            <div className="mt-4 grid gap-2">
              {current.options.map((op) => {
                const isPicked = selected === op
                const isCorrect = selected && op === current.correct
                const isWrong = selected && isPicked && op !== current.correct
                return (
                  <button
                    key={op}
                    type="button"
                    disabled={!!selected}
                    onClick={() => {
                      setSelected(op)
                      if (op === current.correct) setCorrect((v) => v + 1)
                    }}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                      isCorrect
                        ? 'border-emerald-400/40 bg-emerald-400/10 text-zinc-100'
                        : isWrong
                          ? 'border-rose-400/40 bg-rose-400/10 text-zinc-100'
                          : isPicked
                            ? 'border-zinc-700 bg-zinc-900/60 text-zinc-100'
                            : 'border-zinc-800 bg-zinc-950/40 text-zinc-200 hover:bg-zinc-900/50'
                    }`}
                  >
                    {op}
                  </button>
                )
              })}
            </div>

            {selected ? (
              <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
                <div className="text-[11px] font-semibold text-zinc-300">解析</div>
                <div className="mt-1 text-[11px] leading-relaxed text-zinc-400">
                  {current.explanation}
                </div>
              </div>
            ) : null}

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={!selected}
                onClick={async () => {
                  const next = idx + 1
                  if (next >= questions.length) {
                    setDone(true)
                    await apiFetch<{ ok: true }>('/api/progress/log', {
                      method: 'POST',
                      json: {
                        minutes: Math.max(5, Math.round(questions.length * 1.8)),
                        correct,
                        total: questions.length,
                      },
                    })
                    return
                  }
                  setIdx(next)
                  setSelected(null)
                }}
                className="rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-white disabled:opacity-50"
              >
                {idx + 1 >= questions.length ? '完成' : '下一题'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-300">
          本课暂无语法点。
        </div>
      )}
    </div>
  )
}
