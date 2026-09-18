'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { pwValid, pwStrength } from '@/src/lib/password-validation'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tokenStatus, setTokenStatus] = useState<'checking' | 'valid' | 'invalid'>(
    token ? 'checking' : 'invalid'
  )

  const strength = pwStrength(password)
  const isValid = pwValid(password)

  useEffect(() => {
    if (!token) return

    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/auth/verify-reset-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        if (!cancelled) setTokenStatus(res.ok ? 'valid' : 'invalid')
      } catch {
        if (!cancelled) setTokenStatus('invalid')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [token])

  if (tokenStatus === 'checking') {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Vérification du lien…</CardTitle>
        </CardHeader>
      </Card>
    )
  }

  if (tokenStatus === 'invalid') {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Lien invalide</CardTitle>
          <CardDescription>
            Ce lien de réinitialisation est invalide ou a expiré.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <a
            href="/forgot-password"
            className="w-full text-center text-sm text-primary font-medium hover:underline underline-offset-4"
          >
            Demander un nouveau lien
          </a>
        </CardFooter>
      </Card>
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!isValid) return

    const data = new FormData(e.currentTarget)
    const confirm = data.get('confirm') as string

    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setIsPending(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (!res.ok) {
        const json = await res.json()
        if (res.status === 400 || res.status === 404) {
          setError('Ce lien est invalide ou a expiré. Demandez-en un nouveau.')
        } else {
          setError(json.message ?? 'Une erreur est survenue.')
        }
      } else {
        router.push('/login?reset=1')
      }
    } catch {
      setError('Impossible de contacter le serveur.')
    } finally {
      setIsPending(false)
    }
  }

  const criteria = [
    { key: 'length' as const, label: '12 à 128 caractères' },
    { key: 'lower' as const, label: 'Minuscule' },
    { key: 'upper' as const, label: 'Majuscule' },
    { key: 'digit' as const, label: 'Chiffre' },
    { key: 'special' as const, label: 'Caractère spécial' },
  ]

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Nouveau mot de passe</CardTitle>
        <CardDescription>
          Choisissez un mot de passe fort pour sécuriser votre compte.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="password">Nouveau mot de passe</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              disabled={isPending}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {password.length > 0 && (
              <ul className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1">
                {criteria.map(({ key, label }) => (
                  <li
                    key={key}
                    className={`text-xs flex items-center gap-1 ${
                      strength[key] ? 'text-green-600' : 'text-muted-foreground'
                    }`}
                  >
                    <span>{strength[key] ? '✓' : '○'}</span>
                    {label}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="confirm">Confirmer le mot de passe</Label>
            <Input
              id="confirm"
              name="confirm"
              type="password"
              required
              disabled={isPending}
              autoComplete="new-password"
            />
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-3">
          <Button
            type="submit"
            className="w-full"
            disabled={isPending || !isValid}
          >
            {isPending ? 'Enregistrement…' : 'Réinitialiser le mot de passe'}
          </Button>
          {error && (
            <p className="w-full rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive text-center">
              {error}
            </p>
          )}
        </CardFooter>
      </form>
    </Card>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
