import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createSeedDb, type Db } from './seed.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_DIR = path.join(__dirname, '../data')
const DB_PATH = path.join(DATA_DIR, 'db.json')

let cached: Db | null = null
let writing: Promise<void> | null = null

async function ensureDataDir() {
  await mkdir(DATA_DIR, { recursive: true })
}

export async function getDb(): Promise<Db> {
  if (cached) return cached
  await ensureDataDir()
  try {
    const raw = await readFile(DB_PATH, 'utf-8')
    cached = JSON.parse(raw) as Db
    return cached
  } catch {
    cached = createSeedDb()
    await persistDb(cached)
    return cached
  }
}

export async function persistDb(db: Db): Promise<void> {
  await ensureDataDir()
  const payload = JSON.stringify(db, null, 2)

  if (!writing) {
    writing = (async () => {
      await writeFile(DB_PATH, payload, 'utf-8')
    })().finally(() => {
      writing = null
    })
    return writing
  }

  await writing
  return persistDb(db)
}

export async function updateDb<T>(fn: (db: Db) => T | Promise<T>): Promise<T> {
  const db = await getDb()
  const result = await fn(db)
  await persistDb(db)
  return result
}

