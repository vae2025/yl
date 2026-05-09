import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { apiFetch } from '@/utils/api'

type Post = {
  id: string
  title: string
  content: string
  createdAt: string
  likeCount: number
  commentCount: number
}

export default function PostDetailPage() {
  const { postId } = useParams()
  const [post, setPost] = useState<Post | null>(null)

  useEffect(() => {
    if (!postId) return
    apiFetch<Post>(`/api/community/posts/${postId}`)
      .then(setPost)
      .catch(() => {})
  }, [postId])

  return (
    <div className="grid gap-6">
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/40 p-6">
        <Link
          to="/community"
          className="inline-flex items-center gap-2 text-xs text-zinc-300 underline decoration-zinc-700"
        >
          <ArrowLeft className="h-4 w-4" />
          返回社区
        </Link>
        <div className="mt-3 text-sm font-semibold">{post?.title || '帖子'}</div>
        <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">
          {post?.content || '加载中…'}
        </div>
        <div className="mt-4 text-[11px] text-zinc-500">
          {post ? `${post.likeCount} 赞 · ${post.commentCount} 评论` : ''}
        </div>
      </div>
    </div>
  )
}

