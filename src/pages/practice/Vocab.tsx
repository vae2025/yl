import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Check, Ear, RotateCcw, X } from 'lucide-react'
import { apiFetch } from '@/utils/api'

type Lesson = {
  id: string
  vocab: { term: string; reading?: string; meaning: string }[]
}

function speak(text: string, lang: string) {
  if (!('speechSynthesis' in window)) return
  const u = new SpeechSynthesisUtterance(text)
  u.lang = lang
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(u)
}

export default function VocabPractice() {
  const [params] = useSearchParams()
  const lessonId = params.get('lesson')

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [idx, setIdx] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [known, setKnown] = useState(0)
  const [total, setTotal] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    setLesson(null)
    setIdx(0)
    setRevealed(false)
    setKnown(0)
    setTotal(0)
    setDone(false)

    if (!lessonId) return
    apiFetch<Lesson>(`/api/lessons/${lessonId}`)
      .then((d) => {
        setLesson(d)
        setTotal(d.vocab.length)
      })
      .catch(() => {})
  }, [lessonId])

  const current = useMemo(() => lesson?.vocab[idx] || null, [lesson, idx])

  const langCode = useMemo(() => {
    if (!current) return 'en-US'
    const hasKana = /[\u3040-\u30ff]/.test(current.term)
    const hasHangul = /[\uac00-\ud7a3]/.test(current.term)
    if (hasKana) return 'ja-JP'
    if (hasHangul) return 'ko-KR'
    return 'en-US'
  }, [current])

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold">单词记忆</div>
          <div className="mt-1 text-[11px] text-zinc-400">
            翻牌记忆 + 自评掌握度（用于推荐与复习队列）
          </div>
        </div>
        <div className="text-[11px] text-zinc-400">
          {done ? '完成' : `${Math.min(idx + 1, total)}/${total || '—'}`}
        </div>
      </div>

      {!lessonId ? (
        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-300">
          从课时页面进入可自动加载本课词汇。
        </div>
      ) : !lesson ? (
        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-300">
          加载中…
        </div>
      ) : done ? (
        <div className="mt-6 grid gap-3">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-200">
            本轮完成：认识 {known}/{total}
          </div>
          <button
            type="button"
            onClick={async () => {
              setIdx(0)
              setKnown(0)
              setRevealed(false)
              setDone(false)
              await apiFetch<{ ok: true }>('/api/progress/log', {
                method: 'POST',
                json: { minutes: Math.max(5, Math.round(total * 1.2)), correct: known, total },
              })
            }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/50 px-4 py-3 text-sm text-zinc-200 transition hover:bg-zinc-900/50"
          >
            <RotateCcw className="h-4 w-4" />
            再来一轮
          </button>
        </div>
      ) : current ? (
        <div className="mt-6 grid gap-4">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/50 p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xl font-semibold tracking-tight text-zinc-100">
                  {current.term}
                </div>
                {current.reading ? (
                  <div className="mt-1 text-[11px] text-zinc-400">
                    {current.reading}
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => speak(current.term, langCode)}
                className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-xs text-zinc-300 transition hover:bg-zinc-900/50"
              >
                <Ear className="h-4 w-4" />
                听音
              </button>
            </div>

            <div className="mt-5">
              {revealed ? (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4 text-sm text-zinc-200">
                  {current.meaning}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setRevealed(true)}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950/40 px-4 py-3 text-sm text-zinc-200 transition hover:bg-zinc-900/50"
                >
                  显示释义
                </button>
              )}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={!revealed}
                onClick={() => {
                  setKnown((v) => v + 1)
                  setRevealed(false)
                  const next = idx + 1
                  if (next >= (lesson.vocab?.length || 0)) setDone(true)
                  setIdx(next)
                }}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-white disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                认识
              </button>
              <button
                type="button"
                disabled={!revealed}
                onClick={() => {
                  setRevealed(false)
                  const next = idx + 1
                  if (next >= (lesson.vocab?.length || 0)) setDone(true)
                  setIdx(next)
                }}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/30 px-4 py-3 text-sm text-zinc-200 transition hover:bg-zinc-900/50 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                不认识
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-300">
          本课暂无词汇。
        </div>
      )}
    </div>
  )
}
