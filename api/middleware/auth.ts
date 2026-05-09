import type { Request, Response, NextFunction } from 'express'
import { getDb, updateDb } from '../db/store.js'

export type AuthedRequest = Request & { userId: string }

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) {
    res.status(401).json({ success: false, error: '未登录' })
    return
  }

  const db = await getDb()
  const session = db.sessions.find((s) => s.token === token)
  if (!session) {
    res.status(401).json({ success: false, error: '登录已失效' })
    return
  }
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    await updateDb((d) => {
      d.sessions = d.sessions.filter((s) => s.token !== token)
    })
    res.status(401).json({ success: false, error: '登录已过期' })
    return
  }

  ;(req as AuthedRequest).userId = session.userId
  next()
}
