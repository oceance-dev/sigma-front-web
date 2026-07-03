'use client'

import { useState, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, RefreshCw, CheckCircle2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const emailParam   = searchParams.get('email') ?? ''

  const [email,    setEmail]    = useState(emailParam)
  const [sent,     setSent]     = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function resend() {
    if (!email.trim()) { setError('Saisissez votre adresse email.'); return }
    setError(null)
    startTransition(async () => {
      try {
        const res  = await fetch('/api/auth/resend-verification', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email: email.trim() }),
        })
        const json = await res.json()
        if (res.ok) setSent(true)
        else setError(json.message ?? 'Une erreur est survenue.')
      } catch {
        setError('Impossible de contacter le serveur.')
      }
    })
  }

  return (
    <div className="w-full max-w-sm flex flex-col gap-6">

      {/* Icône */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Mail size={26} className="text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground">Vérifiez votre email</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Un lien de vérification a été envoyé à{' '}
            {emailParam
              ? <strong className="text-foreground">{emailParam}</strong>
              : 'votre adresse email'
            }.
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2 text-sm text-muted-foreground">
        <p>1. Ouvrez votre boîte mail.</p>
        <p>2. Cliquez sur le lien de vérification dans l'email reçu.</p>
        <p>3. Vous serez redirigé automatiquement.</p>
      </div>

      {/* Renvoi */}
      <div className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground text-center">Vous n'avez pas reçu l'email ?</p>

        {sent ? (
          <div className="flex items-center justify-center gap-2 rounded-lg bg-primary/10 px-4 py-3 text-sm text-primary">
            <CheckCircle2 size={15} />
            Email renvoyé avec succès.
          </div>
        ) : (
          <>
            {error && (
              <p className="text-xs text-destructive text-center">{error}</p>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="email-resend" className="text-xs">Votre adresse email</Label>
              <Input
                id="email-resend"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jean.dupont@mail.com"
                disabled={isPending}
              />
              <Button onClick={resend} disabled={isPending} variant="secondary" className="w-full flex items-center gap-2">
                <RefreshCw size={14} className={isPending ? 'animate-spin' : ''} />
                {isPending ? 'Envoi…' : 'Renvoyer l\'email'}
              </Button>
            </div>
          </>
        )}
      </div>

      <Link
        href="/login"
        className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={14} />
        Retour à la connexion
      </Link>
    </div>
  )
}
