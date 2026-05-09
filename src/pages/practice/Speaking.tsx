import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Ear, Mic, Square } from 'lucide-react'
import { apiFetch } from '@/utils/api'

type Lesson = {
  id: string
  lines: { speaker?: string; text: string }[]
}

type SpeechRecognition = {
  lang: string
  interimResults: boolean
  continuous: boolean
  start: () => void
  stop: () => void
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
}

type SpeechRecognitionCtor = new () => SpeechRecognition

function normalize(s: string) {
  return s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
}

function levenshtein(a: string, b: string) {
  const aa = normalize(a)
  const bb = normalize(b)
  if (!aa && !bb) return 0
  const dp = Array.from({ length: aa.length + 1 }, () =>
    new Array(bb.length + 1).fill(0),
  )
  for (let i = 0; i <= aa.length; i++) dp[i][0] = i
  for (let j = 0; j <= bb.length; j++) dp[0][j] = j
  for (let i = 1; i <= aa.length; i++) {
    for (let j = 1; j <= bb.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (aa[i - 1] === bb[j - 1] ? 0 : 1),
      )
    }
  }
  return dp[aa.length][bb.length]
}

function similarity(a: string, b: string) {
  const aa = normalize(a)
  const bb = normalize(b)
  const max = Math.max(aa.length, bb.length)
  if (max === 0) return 1
  return 1 - levenshtein(aa, bb) / max
}

function speak(text: string, lang: string) {
  if (!('speechSynthesis' in window)) return
  const u = new SpeechSynthesisUtterance(text)
  u.lang = lang
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(u)
}

export default function SpeakingPractice() {
  const [params] = useSearchParams()
  const lessonId = params.get('lesson')

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [idx, setIdx] = useState(0)
  const [input, setInput] = useState('')
  const [score, setScore] = useState<number | null>(null)
  const [done, setDone] = useState(false)

  const recRef = useRef<SpeechRecognition | null>(null)
  const [listening, setListening] = useState(false)

  useEffect(() => {
    setLesson(null)
    setIdx(0)
    setInput('')
    setScore(null)
    setDone(false)
    setListening(false)
    if (!lessonId) return
    apiFetch<Lesson>(`/api/lessons/${lessonId}`)
      .then(setLesson)
      .catch(() => {})
  }, [lessonId])

  const current = useMemo(() => lesson?.lines?.[idx] || null, [lesson, idx])
  const langCode = useMemo(() => {
    const text = current?.text || ''
    const hasKana = /[\u3040-\u30ff]/.test(text)
    const hasHangul = /[\uac00-\ud7a3]/.test(text)
    if (hasKana) return 'ja-JP'
    if (hasHangul) return 'ko-KR'
    return 'en-US'
  }, [current])

  const recognitionAvailable = useMemo(() => {
    const w = window as unknown as {
      SpeechRecognition?: SpeechRecognitionCtor
      webkitSpeechRecognition?: SpeechRecognitionCtor
    }
    return !!(w.SpeechRecognition || w.webkitSpeechRecognition)
  }, [])

  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold">口语跟读</div>
          <div className="mt-1 text-[11px] text-zinc-400">
            播放示范 → 朗读/输入 → 文本相似度评分
          </div>
        </div>
        <div className="text-[11px] text-zinc-400">
          {done ? '完成' : `${Math.min(idx + 1, lesson?.lines?.length || 0)}/${lesson?.lines?.length || '—'}`}
        </div>
      </div>

      {!lessonId ? (
        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-300">
          从课时页面进入可自动加载逐句跟读内容。
        </div>
      ) : !lesson ? (
        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-300">
          加载中…
        </div>
      ) : done ? (
        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-200">
          本轮完成。建议回到课时页继续下一节或做听力训练。
        </div>
      ) : current ? (
        <div className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-950/50 p-6">
          {current.speaker ? (
            <div className="text-[11px] font-semibold text-zinc-300">
              {current.speaker}
            </div>
          ) : null}
          <div className="mt-1 text-sm leading-relaxed text-zinc-100">
            {current.text}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => speak(current.text, langCode)}
              className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-xs text-zinc-300 transition hover:bg-zinc-900/50"
            >
              <Ear className="h-4 w-4" />
              播放示范
            </button>

            <button
              type="button"
              disabled={!recognitionAvailable}
              onClick={() => {
                if (!recognitionAvailable) return
                const w = window as unknown as {
                  SpeechRecognition?: SpeechRecognitionCtor
                  webkitSpeechRecognition?: SpeechRecognitionCtor
                }
                const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition
                if (!Ctor) return

                if (listening) {
                  recRef.current?.stop()
                  setListening(false)
                  return
                }

                const rec = new Ctor()
                rec.lang = langCode
                rec.interimResults = true
                rec.continuous = false
                rec.onresult = (ev) => {
                  const t = Array.from(ev.results)
                    .map((r) => r[0]?.transcript || '')
                    .join('')
                  setInput(t)
                }
                rec.onerror = () => {
                  setListening(false)
                }
                rec.onend = () => {
                  setListening(false)
                }
                recRef.current = rec
                setListening(true)
                rec.start()
              }}
              className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-xs text-zinc-300 transition hover:bg-zinc-900/50 disabled:opacity-50"
            >
              {listening ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {recognitionAvailable ? (listening ? '停止识别' : '语音识别') : '浏览器不支持识别'}
            </button>
          </div>

          <div className="mt-4 grid gap-2">
            <div className="text-[11px] text-zinc-400">
              可直接输入你说的内容（用于对照评分）
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="min-h-24 rounded-2xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-100 outline-none ring-cyan-300/30 focus:ring-4"
              placeholder="例如：Hi, I’m Alex..."
            />
          </div>

          {score !== null ? (
            <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
              <div className="text-[11px] text-zinc-400">相似度</div>
              <div className="mt-1 text-lg font-semibold text-zinc-100">
                {Math.round(score * 100)}%
              </div>
            </div>
          ) : null}

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={async () => {
                const s = similarity(current.text, input)
                setScore(s)
                await apiFetch<{ ok: true }>('/api/progress/log', {
                  method: 'POST',
                  json: {
                    minutes: 3,
                    correct: s >= 0.75 ? 1 : 0,
                    total: 1,
                  },
                })
              }}
              className="rounded-2xl border border-zinc-800 bg-zinc-950/40 px-4 py-3 text-sm text-zinc-200 transition hover:bg-zinc-900/50"
            >
              评分
            </button>
            <button
              type="button"
              onClick={async () => {
                const next = idx + 1
                if (!lesson.lines[next]) {
                  setDone(true)
                  return
                }
                setIdx(next)
                setInput('')
                setScore(null)
              }}
              className="rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-white"
            >
              下一句
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-300">
          本课暂无可跟读内容。
        </div>
      )}
    </div>
  )
}
