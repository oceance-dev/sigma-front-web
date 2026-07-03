'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

type State = 'loading' | 'success' | 'error'

export default function VerifyEmailConfirmPage() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const token        = searchParams.get('token')

  const [state,   setState]   = useState<State>('loading')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!token) { setState('error'); setMessage('Lien invalide ou expiré.'); return }

    fetch('/api/auth/verify-email', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ token }),
    })
      .then(async (res) => {
        const json = await res.json()
        if (res.ok) {
          setState('success')
          setMessage(json.message ?? 'Votre email a bien été vérifié.')
          setTimeout(() => router.replace('/login'), 3000)
        } else {
          setState('error')
          setMessage(json.message ?? 'Lien invalide ou expiré.')
        }
      })
      .catch(() => {
        setState('error')
        setMessage('Impossible de contacter le serveur.')
      })
  }, [token, router])

  return (
    <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">

      {state === 'loading' && (
        <>
          <Loader2 size={40} className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Vérification en cours…</p>
        </>
      )}

      {state === 'success' && (
        <>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 size={28} className="text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Email vérifié !</h1>
            <p className="mt-1 text-sm text-muted-foreground">{message}</p>
            <p className="mt-1 text-xs text-muted-foreground">Redirection automatique dans 3 secondes…</p>
          </div>
          <Link href="/login">
            <Button className="w-full">Se connecter</Button>
          </Link>
        </>
      )}

      {state === 'error' && (
        <>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <XCircle size={28} className="text-destructive" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Lien invalide</h1>
            <p className="mt-1 text-sm text-muted-foreground">{message}</p>
          </div>
          <Link href="/verify-email">
            <Button variant="secondary" className="w-full">Renvoyer un email</Button>
          </Link>
        </>
      )}

    </div>
  )
}
