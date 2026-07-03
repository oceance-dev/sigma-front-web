import { tokenStore } from './token-store'

const API_BASE = '/api/sigma'

// Single promise shared across all concurrent callers (including session init).
// Using a promise instead of boolean+queue prevents duplicate refresh calls.
let refreshing: Promise<string | null> | null = null

// Called by auth-context to register the /api/auth/me init fetch as the active
// refresh, so any concurrent apiFetch 401 waits for it instead of firing a
// second backend /auth/refresh with the same token (which triggers TOKEN_REUSED).
export function primeRefresh(p: Promise<string | null>): void {
  if (!refreshing) {
    refreshing = p.finally(() => {
      refreshing = null
    })
  }
}

function doRefresh(): Promise<string | null> {
  if (refreshing) return refreshing

  refreshing = fetch('/api/auth/refresh', { method: 'POST' })
    .then((res) => {
      if (!res.ok) {
        tokenStore.clear()
        return null
      }
      return res.json().then(({ data }) => {
        tokenStore.set(data.accessToken)
        return data.accessToken as string
      })
    })
    .catch(() => null)
    .finally(() => {
      refreshing = null
    })

  return refreshing
}

function buildHeaders(token: string | null, base?: HeadersInit): Headers {
  const h = new Headers(base)
  h.set('Content-Type', 'application/json')
  if (token) h.set('Authorization', `Bearer ${token}`)
  return h
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`

  const res = await fetch(url, { ...init, headers: buildHeaders(tokenStore.get(), init.headers) })
  if (res.status !== 401) return res

  const newToken = await doRefresh()

  if (!newToken) {
    if (typeof window !== 'undefined') window.location.href = '/login'
    return res
  }

  return fetch(url, { ...init, headers: buildHeaders(newToken, init.headers) })
}
