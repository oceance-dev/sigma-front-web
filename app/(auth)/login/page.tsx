'use client'

import { useState, Suspense } from 'react'
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
import { PasswordInput } from '@/components/PasswordInput'
import { useAuth } from '@/src/context/auth-context'
import { ROLE_KEYS } from '@/src/lib/role-keys'

function LoginForm() {
  const { login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const resetSuccess = searchParams.get('reset') === '1'

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsPending(true)
    setError(null)

    const data = new FormData(e.currentTarget)
    const result = await login(
      data.get('email') as string,
      data.get('password') as string,
    )

    if (result.error) {
      setError(result.error)
      setIsPending(false)
    } else {
      const role = result.user?.associationRoleKey
      router.push(role === ROLE_KEYS.CANDIDAT ? '/candidat/documents' : '/dashboard')
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Connexion</CardTitle>
        <CardDescription>
          Entrez vos identifiants pour accéder à votre compte
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="flex flex-col gap-4">
            {resetSuccess && (
              <p className="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-700 text-center">
                Mot de passe réinitialisé. Vous pouvez vous connecter.
              </p>
            )}
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
            <div className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mot de passe</Label>
                <a
                  href="/forgot-password"
                  className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
                >
                  Mot de passe oublié ?
                </a>
              </div>
              <PasswordInput
                id="password"
                name="password"
                required
                disabled={isPending}
                autoComplete="current-password"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-3 pt-6">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Connexion…' : 'Se connecter'}
          </Button>
          {error && (
            <p className="w-full rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive text-center">
              {error}
            </p>
          )}
          <p className="text-sm text-muted-foreground text-center">
            Pas encore de compte ?{' '}
            <a
              href="/sigin"
              className="text-primary font-medium hover:underline underline-offset-4"
            >
              S'inscrire
            </a>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
