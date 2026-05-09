import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Ear, RotateCcw } from 'lucide-react'
import { apiFetch } from '@/utils/api'

type Lesson = {
  id: string
  lines: { text: string }[]
}

function shuffle<T>(arr: T[]) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function speak(text: string, lang: string) {
  if (!('speechSynthesis' in window)) return
  const u = new SpeechSynthesisUtterance(text)
  u.lang = lang
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(u)
}

export default function ListeningPractice() {
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

  const current = useMemo(() => lesson?.lines?.[idx]?.text || '', [lesson, idx])
  const langCode = useMemo(() => {
    const hasKana = /[\u3040-\u30ff]/.test(current)
    const hasHangul = /[\uac00-\ud7a3]/.test(current)
    if (hasKana) return 'ja-JP'
    if (hasHangul) return 'ko-KR'
    return 'en-US'
  }, [current])

  const options = useMemo(() => {
    if (!lesson) return []
    const pool = lesson.lines.map((l) => l.text).filter(Boolean)
    const wrong = shuffle(pool.filter((p) => p !== current)).slice(0, 2)
    return shuffle([current, ...wrong])
  }, [lesson, current])

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold">听力训练</div>
          <div className="mt-1 text-[11px] text-zinc-400">
            先听后选，帮助建立“声音→语义”的直连
          </div>
        </div>
        <div className="text-[11px] text-zinc-400">
          {done ? '完成' : `${Math.min(idx + 1, lesson?.lines?.length || 0)}/${lesson?.lines?.length || '—'}`}
        </div>
      </div>

      {!lessonId ? (
        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-300">
          从课时页面进入可自动加载本课听力句子。
        </div>
      ) : !lesson ? (
        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-300">
          加载中…
        </div>
      ) : done ? (
        <div className="mt-6 grid gap-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-200">
            本轮完成：正确 {correct}/{lesson.lines.length}
          </div>
          <button
            type="button"
            onClick={() => {
              setIdx(0)
              setSelected(null)
              setCorrect(0)
              setDone(false)
            }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/50 px-4 py-3 text-sm text-zinc-200 transition hover:bg-zinc-900/50"
          >
            <RotateCcw className="h-4 w-4" />
            再来一轮
          </button>
        </div>
      ) : (
        <div className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-950/50 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-zinc-400">
              点击播放后选择你听到的句子
            </div>
            <button
              type="button"
              onClick={() => speak(current, langCode)}
              className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-xs text-zinc-300 transition hover:bg-zinc-900/50"
            >
              <Ear className="h-4 w-4" />
              播放
            </button>
          </div>

          <div className="mt-4 grid gap-2">
            {options.map((op) => {
              const isPicked = selected === op
              const isCorrect = selected && op === current
              const isWrong = selected && isPicked && op !== current
              return (
                <button
                  key={op}
                  type="button"
                  disabled={!!selected}
                  onClick={async () => {
                    setSelected(op)
                    const ok = op === current
                    if (ok) setCorrect((v) => v + 1)
                    await apiFetch<{ ok: true }>('/api/progress/log', {
                      method: 'POST',
                      json: { minutes: 2, correct: ok ? 1 : 0, total: 1 },
                    })
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

          <div className="mt-4 flex items-center justify-end">
            <button
              type="button"
              disabled={!selected}
              onClick={() => {
                const next = idx + 1
                if (!lesson.lines[next]) {
                  setDone(true)
                  return
                }
                setIdx(next)
                setSelected(null)
              }}
              className="rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-white disabled:opacity-50"
            >
              {idx + 1 >= lesson.lines.length ? '完成' : '下一题'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
