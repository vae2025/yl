import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
        <div className="text-2xl font-semibold">404</div>
        <div className="mt-2 text-sm text-zinc-300">页面不存在</div>
        <Link
          to="/"
          className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/40 px-4 py-3 text-sm text-zinc-200 transition hover:bg-zinc-900/50"
        >
          返回首页
        </Link>
      </div>
    </div>
  )
}

