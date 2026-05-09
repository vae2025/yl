import { Router, type Response } from 'express'
import { requireAuth, type AuthedRequest } from '../middleware/auth.js'
import { getDb, updateDb } from '../db/store.js'

const router = Router()

router.get('/me', requireAuth, async (req: AuthedRequest, res: Response) => {
  const db = await getDb()
  const earned = new Set(
    db.userAchievements
      .filter((ua) => ua.userId === req.userId)
      .map((ua) => ua.achievementId),
  )

  const achievements = db.achievements.map((a) => ({
    id: a.id,
    name: a.name,
    description: a.description,
    earned: earned.has(a.id),
  }))

  res.json({ success: true, data: { achievements } })
})

router.post('/unlock', requireAuth, async (req: AuthedRequest, res: Response) => {
  const achievementId = String(req.body?.achievementId || '')
  if (!achievementId) {
    res.status(400).json({ success: false, error: '参数不合法' })
    return
  }

  await updateDb((db) => {
    const exists = db.achievements.some((a) => a.id === achievementId)
    if (!exists) return
    const already = db.userAchievements.some(
      (ua) => ua.userId === req.userId && ua.achievementId === achievementId,
    )
    if (already) return
    db.userAchievements.push({
      userId: req.userId,
      achievementId,
      earnedAt: new Date().toISOString(),
    })
  })

  res.json({ success: true, data: { ok: true } })
})

export default router

