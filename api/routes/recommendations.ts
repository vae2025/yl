import { Router, type Response } from 'express'
import { requireAuth, type AuthedRequest } from '../middleware/auth.js'
import { getDb } from '../db/store.js'

const router = Router()

router.get('/today', requireAuth, async (req: AuthedRequest, res: Response) => {
  const db = await getDb()
  const pref = db.preferences.find((p) => p.userId === req.userId)
  if (!pref) {
    res.json({ success: true, data: { tasks: [] } })
    return
  }

  const course =
    db.courses.find((c) => c.language === pref.language && c.level === pref.level) ||
    db.courses.find((c) => c.language === pref.language)

  if (!course) {
    res.json({ success: true, data: { tasks: [] } })
    return
  }

  const lessons = db.lessons
    .filter((l) => l.courseId === course.id)
    .sort((a, b) => a.unit - b.unit)

  const finished = new Set(
    db.lessonProgress
      .filter((p) => p.userId === req.userId && p.completion >= 1)
      .map((p) => p.lessonId),
  )
  const nextLesson = lessons.find((l) => !finished.has(l.id)) || lessons[0]

  const tasks = nextLesson
    ? [
        {
          id: `lesson_${nextLesson.id}`,
          type: 'lesson' as const,
          title: `课时：${nextLesson.title}`,
          reason: '从课程路径的下一节开始，先建立输入与语感。',
          targetRoute: `/lessons/${nextLesson.id}`,
        },
        {
          id: `practice_vocab_${nextLesson.id}`,
          type: 'practice' as const,
          title: '练习：单词记忆（SRS）',
          reason: '把本课关键词放进复习队列，减少遗忘。',
          targetRoute: `/practice/vocab?lesson=${nextLesson.id}`,
        },
      ]
    : []

  res.json({ success: true, data: { tasks } })
})

export default router

