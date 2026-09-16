'use client'

import { createContext, useCallback, useContext, useRef, useState, useTransition } from 'react'
import { apiFetch } from '@/src/lib/api-client'
import { stepUpStore } from '@/src/lib/step-up-store'
import { StepUpModal } from '@/components/StepUpModal'

interface StepUpContextValue {
  sensitiveFetch: (path: string, init?: RequestInit) => Promise<Response>
}

const StepUpContext = createContext<StepUpContextValue | null>(null)

interface ModalState {
  isSending: boolean
  sendError: string | null
  verifyError: string | null
}

export function StepUpProvider({ children }: { children: React.ReactNode }) {
  const [modalState, setModalState] = useState<ModalState | null>(null)
  const [isVerifying, startVerifying] = useTransition()
  // File d'attente plutôt qu'un slot unique : certains appelants (ex. la mise à
  // jour d'un rôle super-admin) lancent plusieurs sensitiveFetch en parallèle
  // (Promise.allSettled). Sans file, le second appel écraserait le resolver du
  // premier, qui resterait bloqué indéfiniment — un seul code doit débloquer
  // toutes les requêtes en attente à ce moment-là.
  const pending = useRef<Array<{ resolve: (token: string) => void; reject: () => void }>>([])

  // Déclenché depuis sensitiveFetch (un handler, jamais un effet de montage) :
  // pas de risque de double-appel via le double-montage des effets en Strict Mode.
  const requestStepUp = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      pending.current.push({ resolve, reject })
      if (pending.current.length > 1) return // une demande est déjà en cours, on rejoint la file

      setModalState({ isSending: true, sendError: null, verifyError: null })

      apiFetch('/auth/2fa/send', { method: 'POST' })
        .then(async (res) => {
          if (!res.ok) {
            const json = await res.json().catch(() => ({}))
            setModalState((s) => (s ? { ...s, isSending: false, sendError: json.message ?? "Impossible d'envoyer le code." } : s))
            return
          }
          setModalState((s) => (s ? { ...s, isSending: false } : s))
        })
        .catch(() => {
          setModalState((s) => (s ? { ...s, isSending: false, sendError: 'Impossible de joindre le serveur.' } : s))
        })
    })
  }, [])

  const handleVerify = useCallback((code: string) => {
    setModalState((s) => (s ? { ...s, verifyError: null } : s))
    startVerifying(async () => {
      const res = await apiFetch('/auth/2fa/verify', {
        method: 'POST',
        body: JSON.stringify({ code }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setModalState((s) => (s ? { ...s, verifyError: json.message ?? 'Code invalide.' } : s))
        return
      }
      const token = json.data.stepUpToken as string
      stepUpStore.set(token)
      pending.current.forEach((p) => p.resolve(token))
      pending.current = []
      setModalState(null)
    })
  }, [])

  const handleCancel = useCallback(() => {
    pending.current.forEach((p) => p.reject())
    pending.current = []
    setModalState(null)
  }, [])

  const sensitiveFetch = useCallback(
    async (path: string, init: RequestInit = {}): Promise<Response> => {
      const attempt = (token: string | null) =>
        apiFetch(path, {
          ...init,
          headers: token
            ? { ...(init.headers as Record<string, string> | undefined), 'X-Step-Up-Token': token }
            : init.headers,
        })

      let res = await attempt(stepUpStore.get())
      if (res.status !== 403) return res

      const json = await res.clone().json().catch(() => ({}))
      if (json?.error !== 'TWO_FACTOR_REQUIRED') return res

      try {
        const token = await requestStepUp()
        res = await attempt(token)
      } catch {
        // L'utilisateur a annulé : on garde la réponse 403 d'origine, dont le
        // message ("vérification 2FA requise") s'affiche déjà via le flux d'erreur existant.
      }

      return res
    },
    [requestStepUp],
  )

  return (
    <StepUpContext.Provider value={{ sensitiveFetch }}>
      {children}
      {modalState && (
        <StepUpModal
          isSending={modalState.isSending}
          sendError={modalState.sendError}
          verifyError={modalState.verifyError}
          isPending={isVerifying}
          onSubmitCode={handleVerify}
          onCancel={handleCancel}
        />
      )}
    </StepUpContext.Provider>
  )
}

export function useStepUp() {
  const ctx = useContext(StepUpContext)
  if (!ctx) throw new Error('useStepUp must be used within StepUpProvider')
  return ctx
}
