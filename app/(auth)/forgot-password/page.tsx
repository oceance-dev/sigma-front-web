'use client'

import { useState } from 'react'
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

export default function ForgotPasswordPage() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsPending(true)
    setError(null)

    const data = new FormData(e.currentTarget)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.get('email') }),
      })

      if (!res.ok) {
        const json = await res.json()
        setError(json.message ?? 'Une erreur est survenue.')
      } else {
        setSent(true)
      }
    } catch {
      setError('Impossible de contacter le serveur.')
    } finally {
      setIsPending(false)
    }
  }

  if (sent) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Email envoyé</CardTitle>
          <CardDescription>
            Si un compte existe pour cette adresse, vous recevrez un lien de
            réinitialisation dans quelques minutes. Pensez à vérifier vos
            spams.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <a
            href="/login"
            className="w-full text-center text-sm text-primary font-medium hover:underline underline-offset-4"
          >
            Retour à la connexion
          </a>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Mot de passe oublié</CardTitle>
        <CardDescription>
          Entrez votre adresse email et nous vous enverrons un lien pour
          réinitialiser votre mot de passe.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="grid gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="jean@example.fr"
              required
              disabled={isPending}
              autoComplete="email"
            />
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-3">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Envoi…' : 'Envoyer le lien'}
          </Button>
          {error && (
            <p className="w-full rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive text-center">
              {error}
            </p>
          )}
          <a
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground hover:underline underline-offset-4"
          >
            Retour à la connexion
          </a>
        </CardFooter>
      </form>
    </Card>
  )
}
