/**
 * This is a user authentication API route demo.
 * Handle user registration, login, token management, etc.
 */
import { Router, type Request, type Response } from 'express'
import { randomUUID } from 'node:crypto'
import { updateDb } from '../db/store.js'
import { hashPassword, makeSalt, makeToken, plusDaysIso, verifyPassword } from '../utils/auth.js'

const router = Router()

/**
 * User Login
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const email = String(req.body?.email || '').trim().toLowerCase()
  const username = String(req.body?.username || '').trim()
  const password = String(req.body?.password || '')

  if (!email || !username || password.length < 6) {
    res.status(400).json({ success: false, error: '参数不合法' })
    return
  }

  const payload = await updateDb((db) => {
    const emailTaken = db.users.some((u) => u.email === email)
    const usernameTaken = db.users.some((u) => u.username === username)
    if (emailTaken || usernameTaken) {
      return { ok: false as const, error: '邮箱或用户名已被占用' }
    }

    const salt = makeSalt()
    const user = {
      id: randomUUID(),
      email,
      username,
      passwordSalt: salt,
      passwordHash: hashPassword(password, salt),
      createdAt: new Date().toISOString(),
    }
    db.users.push(user)

    const token = makeToken()
    db.sessions.push({ token, userId: user.id, expiresAt: plusDaysIso(14) })

    return {
      ok: true as const,
      token,
      user: { id: user.id, email: user.email, username: user.username },
    }
  })

  if (!payload.ok) {
    res.status(409).json({ success: false, error: payload.error })
    return
  }

  res.json({ success: true, data: { token: payload.token, user: payload.user } })
})

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const identifier = String(req.body?.identifier || '').trim().toLowerCase()
  const password = String(req.body?.password || '')

  if (!identifier || !password) {
    res.status(400).json({ success: false, error: '参数不合法' })
    return
  }

  const payload = await updateDb((db) => {
    const user =
      db.users.find((u) => u.email === identifier) ||
      db.users.find((u) => u.username.toLowerCase() === identifier)
    if (!user) return { ok: false as const, error: '账号或密码错误' }

    const ok = verifyPassword({
      password,
      salt: user.passwordSalt,
      hashHex: user.passwordHash,
    })
    if (!ok) return { ok: false as const, error: '账号或密码错误' }

    db.sessions = db.sessions.filter((s) => s.userId !== user.id)
    const token = makeToken()
    db.sessions.push({ token, userId: user.id, expiresAt: plusDaysIso(14) })

    return {
      ok: true as const,
      token,
      user: { id: user.id, email: user.email, username: user.username },
    }
  })

  if (!payload.ok) {
    res.status(401).json({ success: false, error: payload.error })
    return
  }

  res.json({ success: true, data: { token: payload.token, user: payload.user } })
})

/**
 * User Logout
 * POST /api/auth/logout
 */
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) {
    res.json({ success: true, data: { ok: true } })
    return
  }

  await updateDb((db) => {
    db.sessions = db.sessions.filter((s) => s.token !== token)
  })

  res.json({ success: true, data: { ok: true } })
})

export default router
