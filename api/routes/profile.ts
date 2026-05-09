import { Router, type Response } from 'express'
import { requireAuth, type AuthedRequest } from '../middleware/auth.js'
import { updateDb } from '../db/store.js'
import type { LanguageCode } from '../db/seed.js'

const router = Router()

router.get('/me', requireAuth, async (req: AuthedRequest, res: Response) => {
  const payload = await updateDb((db) => {
    const user = db.users.find((u) => u.id === req.userId)
    if (!user) return null
    return { id: user.id, email: user.email, username: user.username }
  })

  if (!payload) {
    res.status(401).json({ success: false, error: '未登录' })
    return
  }

  res.json({ success: true, data: payload })
})

router.post(
  '/preferences',
  requireAuth,
  async (req: AuthedRequest, res: Response) => {
    const language = String(req.body?.language || '') as LanguageCode
    const level = String(req.body?.level || '')
    const dailyMinutes = Number(req.body?.dailyMinutes || 0)

    if (!['en', 'ja', 'ko'].includes(language)) {
      res.status(400).json({ success: false, error: '语种不合法' })
      return
    }
    if (!['A1', 'A2', 'B1'].includes(level)) {
      res.status(400).json({ success: false, error: '等级不合法' })
      return
    }
    if (!Number.isFinite(dailyMinutes) || dailyMinutes < 5 || dailyMinutes > 120) {
      res.status(400).json({ success: false, error: '目标不合法' })
      return
    }

    await updateDb((db) => {
      db.preferences = db.preferences.filter((p) => p.userId !== req.userId)
      db.preferences.push({
        userId: req.userId,
        language,
        level: level as 'A1' | 'A2' | 'B1',
        dailyMinutes,
        updatedAt: new Date().toISOString(),
      })
    })

    res.json({ success: true, data: { ok: true } })
  },
)

export default router

