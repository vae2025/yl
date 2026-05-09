import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto'

export function hashPassword(password: string, salt: string) {
  const hash = pbkdf2Sync(password, salt, 120_000, 32, 'sha256')
  return hash.toString('hex')
}

export function makeSalt() {
  return randomBytes(16).toString('hex')
}

export function verifyPassword(args: {
  password: string
  salt: string
  hashHex: string
}) {
  const computed = Buffer.from(hashPassword(args.password, args.salt), 'hex')
  const stored = Buffer.from(args.hashHex, 'hex')
  if (computed.length !== stored.length) return false
  return timingSafeEqual(computed, stored)
}

export function makeToken() {
  return randomBytes(24).toString('hex')
}

export function plusDaysIso(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

