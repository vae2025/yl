import { Link } from 'react-router-dom'
import { ArrowRight, Globe2, Headphones, Mic, SpellCheck } from 'lucide-react'

const languages = [
  { code: 'en', name: '英语', accent: 'from-cyan-400/30 to-cyan-400/0' },
  { code: 'ja', name: '日语', accent: 'from-rose-400/30 to-rose-400/0' },
  { code: 'ko', name: '韩语', accent: 'from-violet-400/30 to-violet-400/0' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.12),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(244,63,94,0.12),transparent_50%),radial-gradient(circle_at_60%_90%,rgba(168,85,247,0.12),transparent_55%)]" />
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-zinc-900 ring-1 ring-zinc-800" />
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-wide">LangLab</div>
            <div className="text-[11px] text-zinc-400">沉浸式在线语言学习平台</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/auth/login"
            className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-900"
          >
            登录
          </Link>
          <Link
            to="/auth/register"
            className="rounded-xl bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-white"
          >
            注册
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-8">
        <div className="grid grid-cols-12 gap-8">
          <section className="col-span-12 md:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/60 px-3 py-1 text-[11px] text-zinc-300">
              <Globe2 className="h-3.5 w-3.5 text-cyan-300" />
              分级课程 · 互动练习 · 数据追踪 · 社区激励
            </div>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl">
              让语言学习更像
              <span className="text-cyan-200">“身临其境”</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-300">
              课程分级清晰，练习高频反馈。系统把你的弱项变成“今日任务”，把坚持变成成就与奖励。
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-3">
                <div className="flex items-center gap-2 text-xs text-zinc-300">
                  <SpellCheck className="h-4 w-4 text-rose-300" />
                  词汇与语法
                </div>
                <div className="mt-2 text-[11px] text-zinc-400">SRS + 错题回炉</div>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-3">
                <div className="flex items-center gap-2 text-xs text-zinc-300">
                  <Mic className="h-4 w-4 text-violet-300" />
                  口语跟读
                </div>
                <div className="mt-2 text-[11px] text-zinc-400">逐句对照与回放</div>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-3">
                <div className="flex items-center gap-2 text-xs text-zinc-300">
                  <Headphones className="h-4 w-4 text-cyan-300" />
                  听力训练
                </div>
                <div className="mt-2 text-[11px] text-zinc-400">精听/泛听两种模式</div>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-3">
                <div className="flex items-center gap-2 text-xs text-zinc-300">
                  <ArrowRight className="h-4 w-4 text-zinc-200" />
                  推荐路径
                </div>
                <div className="mt-2 text-[11px] text-zinc-400">更贴近你的节奏</div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/auth/register"
                className="inline-flex items-center gap-2 rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-white"
              >
                立即开始
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/courses"
                className="rounded-2xl border border-zinc-800 bg-zinc-950/50 px-4 py-3 text-sm text-zinc-200 transition hover:bg-zinc-900/50"
              >
                先看看课程
              </Link>
            </div>
          </section>

          <section className="col-span-12 md:col-span-5">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-5">
              <div className="text-xs font-semibold tracking-wide text-zinc-200">
                选择你的语种
              </div>
              <div className="mt-3 grid gap-3">
                {languages.map((l) => (
                  <Link
                    key={l.code}
                    to={`/courses?language=${l.code}`}
                    className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4 transition hover:bg-zinc-900/60"
                  >
                    <div
                      className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${l.accent}`}
                    />
                    <div className="relative flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-zinc-100">
                          {l.name}
                        </div>
                        <div className="mt-1 text-[11px] text-zinc-400">
                          分级课程 + 场景化练习
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-zinc-300 transition group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

