'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { tokenStore } from '@/src/lib/token-store'
import { stepUpStore } from '@/src/lib/step-up-store'
import { primeRefresh } from '@/src/lib/api-client'
import type { AuthAssociation, AuthUser } from '@/src/types/auth'

const INACTIVITY_MS = 30 * 60 * 1000 // 30 minutes
const THROTTLE_MS = 30_000 // reset timer au plus toutes les 30 s

interface AuthState {
  user: AuthUser | null
  association: AuthAssociation | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface LoginResult {
  error?: string
  user?: AuthUser
  twoFactorRequired?: true
  challengeId?: string
  expiresAt?: string
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<LoginResult>
  verifyLoginTwoFactor: (challengeId: string, code: string) => Promise<{ error?: string; user?: AuthUser }>
  logout: () => Promise<void>
  hasPermission: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    association: null,
    isLoading: true,
    isAuthenticated: false,
  })
  const initialized = useRef(false)
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastActivity = useRef(0)

  const clearInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    inactivityTimer.current = null
  }, [])

  const scheduleInactivityLogout = useCallback(() => {
    clearInactivityTimer()
    inactivityTimer.current = setTimeout(() => {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenStore.get() ?? ''}` },
      }).catch(() => {})
      tokenStore.clear()
      stepUpStore.clear()
      setState({ user: null, association: null, isLoading: false, isAuthenticated: false })
      window.location.replace('/login')
    }, INACTIVITY_MS)
  }, [clearInactivityTimer])

  // Restaurer la session au montage via le cookie httpOnly (BFF)
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const p = fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!json) {
          setState((s) => ({ ...s, isLoading: false }))
          return null
        }
        const token = json.data.accessToken as string
        tokenStore.set(token)
        setState({
          user: json.data.user,
          association: json.data.association,
          isLoading: false,
          isAuthenticated: true,
        })
        return token
      })
      .catch(() => {
        setState((s) => ({ ...s, isLoading: false }))
        return null
      })

    // Register as the active refresh so concurrent apiFetch 401s wait for this
    // promise instead of firing a second /auth/refresh (which triggers TOKEN_REUSED).
    primeRefresh(p)
  }, [])

  // Démarrer / arrêter le timer d'inactivité selon l'état d'auth
  useEffect(() => {
    if (!state.isAuthenticated) {
      clearInactivityTimer()
      return
    }

    const handleActivity = () => {
      const now = Date.now()
      if (now - lastActivity.current < THROTTLE_MS) return
      lastActivity.current = now
      scheduleInactivityLogout()
    }

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'] as const
    events.forEach((e) => window.addEventListener(e, handleActivity, { passive: true }))
    scheduleInactivityLogout() // démarre le timer dès la connexion

    return () => {
      events.forEach((e) => window.removeEventListener(e, handleActivity))
      clearInactivityTimer()
    }
  }, [state.isAuthenticated, scheduleInactivityLogout, clearInactivityTimer])

  // Rafraîchit proactivement le token quand l'utilisateur revient sur l'onglet
  useEffect(() => {
    if (!state.isAuthenticated) return

    const handleVisibility = () => {
      if (document.hidden) return

      const p = fetch('/api/auth/me')
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (!json?.data?.accessToken) {
            tokenStore.clear()
            setState({ user: null, association: null, isLoading: false, isAuthenticated: false })
            window.location.replace('/login')
            return null
          }
          tokenStore.set(json.data.accessToken)
          setState((prev) => ({
            ...prev,
            user: json.data.user,
            association: json.data.association,
          }))
          return json.data.accessToken as string
        })
        .catch(() => null)

      // Bloque les apiFetch 401 concurrents pendant le refresh
      primeRefresh(p)
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [state.isAuthenticated])

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const body = await res.json().catch(() => ({}))

      if (!res.ok) {
        const messages: Record<string, string> = {
          ACCOUNT_INACTIVE: 'Votre compte est inactif.',
          ACCOUNT_LOCKED: 'Compte verrouillé — réessayez dans 15 min.',
          ASSOCIATION_INACTIVE: "L'association est inactive.",
        }
        return { error: messages[body?.code] ?? 'Identifiants invalides.' }
      }

      if (body.twoFactorRequired) {
        return {
          twoFactorRequired: true,
          challengeId: body.data.challengeId,
          expiresAt: body.data.expiresAt,
        }
      }

      const { data } = body
      tokenStore.set(data.accessToken)
      setState({
        user: data.user,
        association: data.association,
        isLoading: false,
        isAuthenticated: true,
      })
      return { user: data.user as AuthUser }
    } catch {
      return { error: 'Impossible de joindre le serveur. Vérifiez votre connexion.' }
    }
  }, [])

  const verifyLoginTwoFactor = useCallback(async (challengeId: string, code: string) => {
    try {
      const res = await fetch('/api/auth/login/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId, code }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const messages: Record<string, string> = {
          TWO_FACTOR_INVALID: 'Code invalide ou expiré. Réessayez ou reconnectez-vous.',
        }
        return { error: messages[body?.error] ?? 'Code invalide ou expiré. Réessayez ou reconnectez-vous.' }
      }

      const { data } = await res.json()
      tokenStore.set(data.accessToken)
      setState({
        user: data.user,
        association: data.association,
        isLoading: false,
        isAuthenticated: true,
      })
      return { user: data.user as AuthUser }
    } catch {
      return { error: 'Impossible de joindre le serveur. Vérifiez votre connexion.' }
    }
  }, [])

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenStore.get() ?? ''}` },
    }).catch(() => {})

    tokenStore.clear()
    stepUpStore.clear()
    setState({ user: null, association: null, isLoading: false, isAuthenticated: false })
  }, [])

  const hasPermission = useCallback(
    (permission: string) => {
      if (!!state.user?.isSuperAdmin) return true
      return state.user?.permissions.includes(permission) ?? false
    },
    [state.user],
  )

  return (
    <AuthContext.Provider value={{ ...state, login, verifyLoginTwoFactor, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
