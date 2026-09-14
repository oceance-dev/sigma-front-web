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
  const pending = useRef<{ resolve: (token: string) => void; reject: () => void } | null>(null)

  // Déclenché depuis sensitiveFetch (un handler, jamais un effet de montage) :
  // pas de risque de double-appel via le double-montage des effets en Strict Mode.
  const requestStepUp = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      pending.current = { resolve, reject }
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
      pending.current?.resolve(token)
      pending.current = null
      setModalState(null)
    })
  }, [])

  const handleCancel = useCallback(() => {
    pending.current?.reject()
    pending.current = null
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
