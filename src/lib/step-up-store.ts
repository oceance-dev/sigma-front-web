interface StepUpState {
  token: string | null
  expiresAt: number | null // epoch ms
}

let state: StepUpState = { token: null, expiresAt: null }

const FALLBACK_MS = 15 * 60 * 1000 // au cas où expiresIn est absent/mal formé

// Parse un délai type "15m" / "90s" / "1h" renvoyé par /auth/2fa/verify.
function parseExpiresIn(expiresIn: unknown): number {
  if (typeof expiresIn !== 'string') return FALLBACK_MS
  const match = expiresIn.trim().match(/^(\d+)\s*(ms|s|m|h)$/i)
  if (!match) return FALLBACK_MS
  const value = Number(match[1])
  const unitMs = { ms: 1, s: 1_000, m: 60_000, h: 3_600_000 }[match[2].toLowerCase() as 'ms' | 's' | 'm' | 'h']
  return value * unitMs
}

export const stepUpStore = {
  set: (token: string, expiresIn: unknown) => {
    state = { token, expiresAt: Date.now() + parseExpiresIn(expiresIn) }
  },
  clear: () => {
    state = { token: null, expiresAt: null }
  },
  // Ne renvoie le jeton que s'il est encore valide — évite d'attacher un
  // X-Step-Up-Token qu'on sait déjà expiré côté client.
  getValid: (): string | null => {
    if (!state.token || !state.expiresAt || Date.now() >= state.expiresAt) return null
    return state.token
  },
}
