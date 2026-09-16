'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { apiFetch, registerStepUpHandler } from '@/src/lib/api-client'
import { stepUpStore } from '@/src/lib/step-up-store'
import { StepUpModal } from '@/components/StepUpModal'

interface ModalState {
  isSending: boolean
  sendError: string | null
  verifyError: string | null
}

// Monté une seule fois à la racine (app/layout.tsx). N'expose plus de hook/
// contexte : il s'enregistre auprès d'apiFetch (registerStepUpHandler) qui,
// lui, est le seul point d'entrée réseau de toute l'app — donc AUCUN composant
// n'a besoin de savoir que la route qu'il appelle est protégée par la 2FA.
export function StepUpProvider({ children }: { children: React.ReactNode }) {
  const [modalState, setModalState] = useState<ModalState | null>(null)
  const [isVerifying, startVerifying] = useTransition()
  // File d'attente plutôt qu'un slot unique : plusieurs requêtes peuvent
  // déclencher un besoin de step-up au même moment (ex. deux appels en
  // parallèle) — un seul code doit débloquer toutes les requêtes en attente,
  // et une seule modale/un seul envoi de code doit partir à la fois.
  const pending = useRef<Array<{ resolve: (token: string) => void; reject: () => void }>>([])

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

  useEffect(() => {
    registerStepUpHandler(requestStepUp)
    return () => registerStepUpHandler(null)
  }, [requestStepUp])

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
      stepUpStore.set(token, json.data.expiresIn)
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

  return (
    <>
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
    </>
  )
}
