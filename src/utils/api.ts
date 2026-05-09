import { useAuthStore } from '@/stores/authStore'

export type ApiOk<T> = { success: true; data: T }
export type ApiErr = { success: false; error: string }
export type ApiResp<T> = ApiOk<T> | ApiErr

export async function apiFetch<T>(
  input: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const token = useAuthStore.getState().token
  const headers = new Headers(init?.headers)
  if (init?.json !== undefined) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(input, {
    ...init,
    headers,
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
  })

  const text = await res.text()
  const payload = text ? (JSON.parse(text) as ApiResp<T>) : null

  if (!res.ok || !payload || payload.success === false) {
    const message =
      payload && payload.success === false
        ? payload.error
        : `请求失败（${res.status}）`
    throw new Error(message)
  }

  return payload.data
}

