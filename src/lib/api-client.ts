import { tokenStore } from './token-store'
import { stepUpStore } from './step-up-store'

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

// Enregistré par StepUpProvider (src/context/step-up-context.tsx) au montage.
// apiFetch ne sait rien de React/de la modale — il délègue juste l'ouverture
// du prompt 2FA à ce handler quand le backend répond 403 TWO_FACTOR_REQUIRED,
// exactement comme primeRefresh délègue le refresh à auth-context.
let stepUpHandler: (() => Promise<string>) | null = null

export function registerStepUpHandler(fn: (() => Promise<string>) | null): void {
  stepUpHandler = fn
}

// Ne pose Content-Type: application/json que pour les bodies JSON.
// Pour un FormData, on laisse le navigateur définir le boundary multipart.
function buildHeaders(token: string | null, base?: HeadersInit, body?: BodyInit | null): Headers {
  const h = new Headers(base)
  if (!(body instanceof FormData)) h.set('Content-Type', 'application/json')
  if (token) h.set('Authorization', `Bearer ${token}`)
  // Toujours attaché s'il existe et n'est pas expiré, sur *toute* requête —
  // les routes qui n'exigent pas de step-up l'ignorent simplement. C'est ce
  // qui garantit qu'une route sensible, présente ou future, est protégée sans
  // qu'aucun composant n'ait à le demander explicitement.
  const stepUpToken = stepUpStore.getValid()
  if (stepUpToken) h.set('X-Step-Up-Token', stepUpToken)
  return h
}

async function isTwoFactorRequired(res: Response): Promise<boolean> {
  if (res.status !== 403) return false
  const json = await res.clone().json().catch(() => ({}))
  return json?.error === 'TWO_FACTOR_REQUIRED'
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`
  const doFetch = (token: string | null) =>
    fetch(url, { ...init, headers: buildHeaders(token, init.headers, init.body) })

  let res = await doFetch(tokenStore.get())

  if (res.status === 401) {
    const newToken = await doRefresh()
    if (!newToken) {
      if (typeof window !== 'undefined') window.location.href = '/login'
      return res
    }
    res = await doFetch(newToken)
  }

  if (stepUpHandler && (await isTwoFactorRequired(res))) {
    try {
      await stepUpHandler() // résout une fois un stepUpToken valide obtenu (stocké dans stepUpStore)
      res = await doFetch(tokenStore.get())
    } catch {
      // L'utilisateur a annulé la modale — on garde la réponse 403 d'origine,
      // dont le message s'affiche déjà via le flux d'erreur existant de l'appelant.
    }
  }

  return res
}
