import { Router, type Response } from 'express'
import { requireAuth, type AuthedRequest } from '../middleware/auth.js'
import { getDb, updateDb } from '../db/store.js'

const router = Router()

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

router.get('/overview', requireAuth, async (req: AuthedRequest, res: Response) => {
  const db = await getDb()
  const userId = req.userId
  const today = isoDate()

  const days = db.activity.filter((a) => a.userId === userId)
  const dates = new Set(days.filter((d) => d.minutes > 0).map((d) => d.date))

  const todayRow = days.find((d) => d.date === today)
  const total = days.reduce((acc, d) => acc + d.total, 0)
  const correct = days.reduce((acc, d) => acc + d.correct, 0)
  const accuracy = total > 0 ? correct / total : 0

  const completedLessons = db.lessonProgress.filter(
    (p) => p.userId === userId && p.completion >= 1,
  ).length

  res.json({
    success: true,
    data: {
      streakDays: computeStreak(dates),
      todayMinutes: todayRow?.minutes || 0,
      accuracy,
      completedLessons,
    },
  })
})

router.post('/log', requireAuth, async (req: AuthedRequest, res: Response) => {
  const minutes = Number(req.body?.minutes || 0)
  const correct = Number(req.body?.correct || 0)
  const total = Number(req.body?.total || 0)
  const date = isoDate()

  await updateDb((db) => {
    const row = db.activity.find((a) => a.userId === req.userId && a.date === date)
    if (!row) {
      db.activity.push({ userId: req.userId, date, minutes, correct, total })
      return
    }
    row.minutes += Math.max(0, minutes)
    row.correct += Math.max(0, correct)
    row.total += Math.max(0, total)
  })

  res.json({ success: true, data: { ok: true } })
})

export default router

