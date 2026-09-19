'use client'

import { Loader2, ShieldCheck, X } from 'lucide-react'
import { TwoFactorCodeForm } from '@/components/TwoFactorCodeForm'

interface StepUpModalProps {
  isSending: boolean
  sendError: string | null
  verifyError: string | null
  isPending: boolean
  onSubmitCode: (code: string) => void
  onCancel: () => void
}

export function StepUpModal({ isSending, sendError, verifyError, isPending, onSubmitCode, onCancel }: StepUpModalProps) {
  return (
    // z-[100] : cette modale peut être déclenchée depuis n'importe quel écran, y compris
    // par-dessus une modale de confirmation déjà ouverte à z-[60] (ex. reset password) —
    // elle doit donc toujours s'afficher au-dessus de tout le reste de l'app.
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
      <div
        className="w-full max-w-sm rounded-xl border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-primary" />
            <h2 className="text-sm font-medium text-foreground">Vérification requise</h2>
          </div>
          <button onClick={onCancel} className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent">
            <X size={14} />
          </button>
        </div>

        <div className="p-4">
          {isSending ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 size={16} className="animate-spin" /> Envoi du code…
            </div>
          ) : (
            <>
              {sendError && (
                <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{sendError}</p>
              )}
              <TwoFactorCodeForm
                description="Cette action sensible nécessite une confirmation. Entrez le code reçu par email."
                error={verifyError}
                isPending={isPending}
                submitLabel="Confirmer"
                onSubmit={onSubmitCode}
                footer={
                  <button
                    type="button"
                    onClick={onCancel}
                    className="self-center text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
                  >
                    Annuler
                  </button>
                }
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
