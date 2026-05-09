import { create } from 'zustand'

export type AuthUser = {
  id: string
  email: string
  username: string
}

type AuthState = {
  token: string | null
  user: AuthUser | null
  hydrated: boolean
  hydrate: () => void
  setAuth: (args: { token: string; user: AuthUser }) => void
  clear: () => void
}

const STORAGE_KEY = 'langlab_auth'

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  hydrated: false,
  hydrate: () => {
    if (get().hydrated) return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        set({ hydrated: true })
        return
      }
      const parsed = JSON.parse(raw) as { token: string; user: AuthUser }
      set({ token: parsed.token, user: parsed.user, hydrated: true })
    } catch {
      localStorage.removeItem(STORAGE_KEY)
      set({ hydrated: true })
    }
  },
  setAuth: ({ token, user }) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }))
    set({ token, user, hydrated: true })
  },
  clear: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ token: null, user: null, hydrated: true })
  },
}))

