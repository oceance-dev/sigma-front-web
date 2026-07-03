'use client'

import { useState, useTransition } from 'react'
import { useAuth } from '@/src/context/auth-context'
import { Mail, X, RefreshCw, CheckCircle2 } from 'lucide-react'

export default function EmailVerificationBanner() {
  const { user } = useAuth()
  const [dismissed, setDismissed] = useState(false)
  const [sent,      setSent]      = useState(false)
  const [isPending, startTransition] = useTransition()

  if (!user || user.isEmailVerified || dismissed) return null

  function resend() {
    startTransition(async () => {
      try {
        const res = await fetch('/api/auth/resend-verification', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email: user!.email }),
        })
        if (res.ok) setSent(true)
      } catch {}
    })
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <div className="flex items-center gap-2 min-w-0">
        <Mail size={15} className="text-amber-600 shrink-0" />
        {sent ? (
          <div className="flex items-center gap-1.5 text-sm text-amber-800">
            <CheckCircle2 size={14} className="text-amber-600" />
            Email renvoyé — vérifiez votre boîte mail.
          </div>
        ) : (
          <p className="text-sm text-amber-800 truncate">
            Vérifiez votre email pour activer toutes les fonctionnalités.{' '}
            <button
              onClick={resend}
              disabled={isPending}
              className="font-medium underline underline-offset-2 hover:no-underline disabled:opacity-50"
            >
              {isPending ? 'Envoi…' : 'Renvoyer'}
            </button>
          </p>
        )}
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-amber-600 hover:bg-amber-100 transition-colors"
      >
        <X size={13} />
      </button>
    </div>
  )
}
