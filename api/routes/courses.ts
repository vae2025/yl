import { Router, type Request, type Response } from 'express'
import { getDb } from '../db/store.js'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
  const language = String(req.query.language || 'en')
  const level = String(req.query.level || 'A1')

  const db = await getDb()
  const courses = db.courses.filter(
    (c) => c.language === language && c.level === level,
  )

  res.json({ success: true, data: { courses } })
})

router.get('/:courseId', async (req: Request, res: Response) => {
  const courseId = String(req.params.courseId)
  const db = await getDb()
  const course = db.courses.find((c) => c.id === courseId)
  if (!course) {
    res.status(404).json({ success: false, error: '课程不存在' })
    return
  }

  const lessons = db.lessons
    .filter((l) => l.courseId === courseId)
    .map((l) => ({ id: l.id, unit: l.unit, title: l.title }))
    .sort((a, b) => a.unit - b.unit)

  res.json({ success: true, data: { ...course, lessons } })
})

export default router

