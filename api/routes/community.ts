import { Router, type Response } from 'express'
import { randomUUID } from 'node:crypto'
import { requireAuth, type AuthedRequest } from '../middleware/auth.js'
import { getDb, updateDb } from '../db/store.js'

const router = Router()

router.get('/posts', requireAuth, async (_req: AuthedRequest, res: Response) => {
  const db = await getDb()
  const posts = [...db.posts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  res.json({ success: true, data: { posts } })
})

router.get(
  '/posts/:postId',
  requireAuth,
  async (req: AuthedRequest, res: Response) => {
    const db = await getDb()
    const post = db.posts.find((p) => p.id === String(req.params.postId))
    if (!post) {
      res.status(404).json({ success: false, error: '帖子不存在' })
      return
    }
    res.json({ success: true, data: post })
  },
)

router.post('/posts', requireAuth, async (req: AuthedRequest, res: Response) => {
  const title = String(req.body?.title || '').trim()
  const content = String(req.body?.content || '').trim()

  if (!title || !content) {
    res.status(400).json({ success: false, error: '参数不合法' })
    return
  }

  const post = await updateDb((db) => {
    const now = new Date().toISOString()
    const p = {
      id: randomUUID(),
      authorId: req.userId,
      title,
      content,
      createdAt: now,
      likeCount: 0,
      commentCount: 0,
    }
    db.posts.push(p)

    const has = db.userAchievements.some(
      (ua) => ua.userId === req.userId && ua.achievementId === 'first_post',
    )
    if (!has) {
      db.userAchievements.push({
        userId: req.userId,
        achievementId: 'first_post',
        earnedAt: now,
      })
    }

    return p
  })

  res.json({ success: true, data: post })
})

export default router
