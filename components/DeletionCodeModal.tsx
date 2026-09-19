'use client'

import { useEffect, useState } from 'react'
import { Loader2, ShieldAlert, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TwoFactorCodeForm } from '@/components/TwoFactorCodeForm'

const RESEND_COOLDOWN_MS = 60_000
// Les deux cas où le backend veut qu'on redemande un code partagent ce suffixe dans le
// message ("Aucun code en attente, demandez-en un nouveau" / "Code expiré, demandez-en un
// nouveau"), contrairement à "Code invalide" — c'est le seul signal dont on dispose pour
// distinguer "retour à l'étape 1" de "laisser ressaisir" sans réécrire le message affiché.
const NEEDS_NEW_CODE_RE = /demandez-en un nouveau/i

type Step = 'warning' | 'sending' | 'code' | 'verifying'

interface DeletionCodeModalProps {
  title: string
  warningText: React.ReactNode
  requestCode: () => Promise<Response>
  confirmDeletion: (code: string) => Promise<Response>
  onDeleted: (message: string) => void
  onCancel: () => void
}

// Suppression protégée par un code de confirmation à usage unique envoyé par email à
// l'admin CONNECTÉ (et non par step-up 2FA, cf. StepUpModal). Générique sur l'entité
// supprimée : le caller fournit les appels réseau, ce composant ne connaît que le flow
// en 2 étapes (avertissement → envoi du code → saisie) commun aux routes de suppression
// du panel super-admin (associations, utilisateurs, …).
export function DeletionCodeModal({ title, warningText, requestCode, confirmDeletion, onDeleted, onCancel }: DeletionCodeModalProps) {
  const [step, setStep] = useState<Step>('warning')
  const [error, setError] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [canResendAt, setCanResendAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())

  // Tick pour le minuteur d'expiration du code et le cooldown du renvoi — seulement
  // utile une fois un code envoyé.
  useEffect(() => {
    if (step !== 'code') return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [step])

  const remainingCodeMs = expiresAt ? new Date(expiresAt).getTime() - now : null
  const isCodeExpired = remainingCodeMs !== null && remainingCodeMs <= 0
  const resendRemainingS = canResendAt ? Math.max(0, Math.ceil((canResendAt - now) / 1000)) : 0
  const isBusy = step === 'sending' || step === 'verifying'

  async function sendCode() {
    setError(null)
    setStep('sending')
    try {
      const res = await requestCode()
      const json = await res.json().catch(() => ({}))
      if (res.ok) {
        setExpiresAt(json.data?.expiresAt ?? null)
        setCanResendAt(Date.now() + RESEND_COOLDOWN_MS)
        setNow(Date.now())
        setStep('code')
      } else {
        setError(json.message ?? "Impossible d'envoyer le code.")
        setStep('warning')
      }
    } catch {
      setError('Impossible de joindre le serveur.')
      setStep('warning')
    }
  }

  async function confirmCode(code: string) {
    setError(null)
    setStep('verifying')
    try {
      const res = await confirmDeletion(code)
      const json = await res.json().catch(() => ({}))
      if (res.ok) {
        onDeleted(json.message ?? 'Suppression effectuée avec succès.')
        return
      }
      const message = json.message ?? 'Une erreur est survenue.'
      setError(message)
      if (json.error === 'DELETION_CODE_INVALID' && NEEDS_NEW_CODE_RE.test(message)) {
        setExpiresAt(null)
        setStep('warning')
      } else {
        setStep('code')
      }
    } catch {
      setError('Impossible de joindre le serveur.')
      setStep('code')
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !isBusy) onCancel() }}
    >
      <div className="w-full max-w-sm rounded-xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-medium text-foreground">{title}</h2>
          <button
            onClick={onCancel}
            disabled={isBusy}
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent shrink-0 disabled:opacity-40"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-4">
          {(step === 'warning' || step === 'sending') && (
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <ShieldAlert size={16} className="mt-0.5 shrink-0 text-destructive" />
                <div>{warningText}</div>
              </div>

              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={onCancel} disabled={step === 'sending'}>
                  Annuler
                </Button>
                <Button type="button" variant="destructive" onClick={sendCode} disabled={step === 'sending'}>
                  {step === 'sending' ? (
                    <><Loader2 size={14} className="animate-spin" /> Envoi…</>
                  ) : (
                    'Envoyer le code'
                  )}
                </Button>
              </div>
            </div>
          )}

          {(step === 'code' || step === 'verifying') && (
            <TwoFactorCodeForm
              description="Un code de confirmation vous a été envoyé par email. Saisissez-le pour confirmer la suppression."
              error={error}
              isPending={step === 'verifying'}
              submitLabel="Confirmer la suppression"
              submitVariant="destructive"
              onSubmit={confirmCode}
              footer={
                <div className="flex flex-col items-center gap-2 pt-1">
                  {remainingCodeMs !== null && (
                    <p className="text-xs text-muted-foreground">
                      {isCodeExpired ? 'Code expiré.' : `Expire dans ${formatMs(remainingCodeMs)}`}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={sendCode}
                    disabled={resendRemainingS > 0}
                    className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline disabled:opacity-50 disabled:no-underline disabled:hover:no-underline"
                  >
                    {resendRemainingS > 0 ? `Renvoyer un code (${resendRemainingS}s)` : 'Renvoyer un code'}
                  </button>
                  <button
                    type="button"
                    onClick={onCancel}
                    className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
                  >
                    Annuler
                  </button>
                </div>
              }
            />
          )}
        </div>
      </div>
    </div>
  )
}

function formatMs(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}
