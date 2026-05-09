import { Router, type Request, type Response } from 'express'
import { getDb, updateDb } from '../db/store.js'
import { requireAuth, type AuthedRequest } from '../middleware/auth.js'

const router = Router()

router.get('/:lessonId', async (req: Request, res: Response) => {
  const lessonId = String(req.params.lessonId)
  const db = await getDb()
  const lesson = db.lessons.find((l) => l.id === lessonId)
  if (!lesson) {
    res.status(404).json({ success: false, error: '课时不存在' })
    return
  }

  res.json({ success: true, data: lesson })
})

function isoDate(d = new Date()) {
  return d.toISOString().slice(0, 10)
}

function computeStreak(dates: Set<string>) {
  let streak = 0
  const cursor = new Date()
  while (true) {
    const key = isoDate(cursor)
    if (!dates.has(key)) break
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

router.post(
  '/:lessonId/complete',
  requireAuth,
  async (req: AuthedRequest, res: Response) => {
    const lessonId = String(req.params.lessonId)
    const minutes = Number(req.body?.minutes || 10)
    const correct = Number(req.body?.correct || 0)
    const total = Number(req.body?.total || 0)

    const payload = await updateDb((db) => {
      const lesson = db.lessons.find((l) => l.id === lessonId)
      if (!lesson) return { ok: false as const, error: '课时不存在' }

      const now = new Date().toISOString()
      const existing = db.lessonProgress.find(
        (p) => p.userId === req.userId && p.lessonId === lessonId,
      )
      if (!existing) {
        db.lessonProgress.push({
          userId: req.userId,
          lessonId,
          completion: 1,
          updatedAt: now,
        })
      } else {
        existing.completion = Math.max(existing.completion, 1)
        existing.updatedAt = now
      }

      const date = isoDate()
      const day = db.activity.find((a) => a.userId === req.userId && a.date === date)
      if (!day) {
        db.activity.push({
          userId: req.userId,
          date,
          minutes: Math.max(0, minutes),
          correct: Math.max(0, correct),
          total: Math.max(0, total),
        })
      } else {
        day.minutes += Math.max(0, minutes)
        day.correct += Math.max(0, correct)
        day.total += Math.max(0, total)
      }

      const hasFirstLesson = db.userAchievements.some(
        (ua) => ua.userId === req.userId && ua.achievementId === 'first_lesson',
      )
      if (!hasFirstLesson) {
        db.userAchievements.push({
          userId: req.userId,
          achievementId: 'first_lesson',
          earnedAt: now,
        })
      }

      const dates = new Set(
        db.activity
          .filter((a) => a.userId === req.userId && a.minutes > 0)
          .map((a) => a.date),
      )
      const streak = computeStreak(dates)
      if (streak >= 3) {
        const has = db.userAchievements.some(
          (ua) => ua.userId === req.userId && ua.achievementId === 'streak_3',
        )
        if (!has) {
          db.userAchievements.push({
            userId: req.userId,
            achievementId: 'streak_3',
            earnedAt: now,
          })
        }
      }

      return { ok: true as const }
    })

    if (!payload.ok) {
      res.status(404).json({ success: false, error: payload.error })
      return
    }

    res.json({ success: true, data: { ok: true } })
  },
)

export default router
