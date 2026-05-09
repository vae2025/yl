import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '@/utils/api'

type Post = {
  id: string
  title: string
  content: string
  createdAt: string
  likeCount: number
  commentCount: number
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<{ posts: Post[] }>('/api/community/posts')
      .then((d) => setPosts(d.posts))
      .catch(() => {})
  }, [])

  return (
    <div className="grid gap-6">
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-6">
        <div className="text-sm font-semibold">社区交流</div>
        <div className="mt-1 text-[11px] text-zinc-400">
          打卡、提问、纠错与互助
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-6">
        <div className="text-sm font-semibold">发布帖子</div>
        <div className="mt-1 text-[11px] text-zinc-400">
          分享学习方法、提问或打卡（会解锁社区成就）
        </div>

        <form
          className="mt-4 grid gap-3"
          onSubmit={async (e) => {
            e.preventDefault()
            setError(null)
            setPosting(true)
            try {
              const post = await apiFetch<Post>('/api/community/posts', {
                method: 'POST',
                json: { title, content },
              })
              setPosts((p) => [post, ...p])
              setTitle('')
              setContent('')
            } catch (err) {
              setError(err instanceof Error ? err.message : '发布失败')
            } finally {
              setPosting(false)
            }
          }}
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-2xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-100 outline-none ring-cyan-300/30 focus:ring-4"
            placeholder="标题（例如：今天把 A1 的打招呼学顺了）"
            required
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-24 rounded-2xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-100 outline-none ring-cyan-300/30 focus:ring-4"
            placeholder="内容…"
            required
          />
          {error ? (
            <div className="rounded-2xl border border-rose-900/60 bg-rose-950/30 px-3 py-2 text-xs text-rose-200">
              {error}
            </div>
          ) : null}
          <button
            type="submit"
            disabled={posting}
            className="rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-white disabled:opacity-60"
          >
            {posting ? '发布中…' : '发布'}
          </button>
        </form>
      </div>

      <div className="grid gap-3">
        {posts.length ? (
          posts.map((p) => (
            <Link
              key={p.id}
              to={`/community/${p.id}`}
              className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-6 transition hover:bg-zinc-900/40"
            >
              <div className="text-sm font-semibold text-zinc-100">{p.title}</div>
              <div className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-zinc-400">
                {p.content}
              </div>
              <div className="mt-3 text-[11px] text-zinc-500">
                {p.likeCount} 赞 · {p.commentCount} 评论
              </div>
            </Link>
          ))
        ) : (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-6 text-sm text-zinc-300">
            暂无帖子。
          </div>
        )}
      </div>
    </div>
  )
}
