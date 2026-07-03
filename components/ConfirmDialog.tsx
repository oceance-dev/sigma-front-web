'use client'

import { Button } from '@/components/ui/button'

interface ConfirmDialogProps {
  open:      boolean
  message:   string
  confirmLabel?: string
  danger?:   boolean
  onConfirm: () => void
  onCancel:  () => void
}

export function ConfirmDialog({
  open,
  message,
  confirmLabel = 'Confirmer',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
      <div
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm text-foreground">{message}</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onCancel}>Annuler</Button>
          <Button variant={danger ? 'destructive' : 'default'} size="sm" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
