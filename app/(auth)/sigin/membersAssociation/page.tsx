'use client'

import { useState, useTransition, type FormEvent } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react'
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

const FR_PHONE = /^0[1-9]\d{8}$/

type Errors = Record<string, string>

function pwChecks(pw: string) {
  return {
    length:  pw.length >= 12 && pw.length <= 128,
    lower:   /[a-z]/.test(pw),
    upper:   /[A-Z]/.test(pw),
    digit:   /\d/.test(pw),
    special: /[^a-zA-Z0-9]/.test(pw),
  }
}

function validate(fd: FormData): Errors {
  const e: Errors = {}
  const get = (k: string) => (fd.get(k) as string ?? '').trim()

  if (!get('codeAssociation')) e.codeAssociation = 'Code de l\'association requis'
  if (!get('invitationCode'))  e.invitationCode  = 'Code d\'invitation requis'

  if (!get('firstName') || get('firstName').length < 2)
    e.firstName = 'Prénom requis (2 caractères minimum)'
  if (!get('lastName') || get('lastName').length < 2)
    e.lastName = 'Nom requis (2 caractères minimum)'

  const phone = get('phone').replace(/\s/g, '')
  if (!phone || !FR_PHONE.test(phone))
    e.phone = 'Téléphone invalide (ex: 0612345678)'

  if (!get('email') || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(get('email')))
    e.email = 'Email valide requis'

  const pw = fd.get('password') as string ?? ''
  if (!Object.values(pwChecks(pw)).every(Boolean))
    e.password = 'Le mot de passe ne respecte pas les critères'

  if (pw !== (fd.get('confirmPassword') as string ?? ''))
    e.confirmPassword = 'Les mots de passe ne correspondent pas'

  return e
}

type SuccessData = { email: string; firstName: string }

export default function MemberInscription() {
  const [errors,      setErrors]      = useState<Errors>({})
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [success,     setSuccess]     = useState<SuccessData | null>(null)
  const [password,    setPassword]    = useState('')
  const [isPending,   startTransition] = useTransition()

  const checks = pwChecks(password)

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setGlobalError(null)

    const fd = new FormData(e.currentTarget)
    const fieldErrors = validate(fd)

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      const first = Object.keys(fieldErrors)[0]
      document.getElementById(first)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    setErrors({})

    startTransition(async () => {
      try {
        const get = (k: string) => (fd.get(k) as string ?? '').trim()

        const body = {
          codeAssociation: get('codeAssociation'),
          invitationCode:  get('invitationCode'),
          firstName:       get('firstName'),
          lastName:        get('lastName'),
          phone:           get('phone').replace(/\s/g, ''),
          email:           get('email'),
          password:        fd.get('password') as string,
          passwordConfirmation: fd.get('confirmPassword') as string,
        }

        const res = await fetch('/api/sigma/register/member-association', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(body),
        })

        const json = await res.json()

        if (!res.ok) {
          if (res.status === 422 && Array.isArray(json.errors)) {
            const serverErrors: Errors = {}
            for (const err of json.errors) {
              serverErrors[err.field] = err.message
            }
            setErrors(serverErrors)
          } else {
            setGlobalError(json.message ?? 'Une erreur est survenue. Veuillez réessayer.')
          }
          return
        }

        setSuccess({ email: get('email'), firstName: get('firstName') })
      } catch {
        setGlobalError('Impossible de joindre le serveur. Vérifiez votre connexion.')
      }
    })
  }

  if (success) {
    return (
      <div className="w-full max-w-xl flex flex-col gap-4">
        <Card size="sm">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 size={28} className="text-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-medium text-foreground">Bienvenue, {success.firstName} !</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Votre compte a été créé. Un administrateur doit valider votre adhésion avant que vous puissiez vous connecter.
              </p>
            </div>
            <div className="flex items-start gap-2 rounded-lg bg-muted/50 px-4 py-3 text-left max-w-xs">
              <Mail size={15} className="text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Un email de confirmation a été envoyé à{' '}
                <span className="font-medium text-foreground">{success.email}</span>.
              </p>
            </div>
            <Link
              href="/login"
              className="mt-2 text-sm font-medium text-primary hover:underline underline-offset-4"
            >
              Retour à la connexion
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full max-w-xl flex flex-col gap-4">
      <Link
        href="/sigin"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft size={15} />
        Retour
      </Link>

      {globalError && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {globalError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

        <Card size="sm">
          <CardHeader>
            <CardTitle>Rejoindre une association</CardTitle>
            <CardDescription>Renseignez les codes transmis par votre association</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Field id="codeAssociation" label="Code de l'association" required error={errors.codeAssociation}>
                <Input
                  id="codeAssociation"
                  name="codeAssociation"
                  placeholder="ASSOC-XXXX"
                  disabled={isPending}
                  aria-invalid={!!errors.codeAssociation}
                />
              </Field>
              <Field id="invitationCode" label="Code d'invitation" required error={errors.invitationCode}>
                <Input
                  id="invitationCode"
                  name="invitationCode"
                  placeholder="INV-XXXX"
                  disabled={isPending}
                  aria-invalid={!!errors.invitationCode}
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
            <CardDescription>Vos informations en tant que membre</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Field id="firstName" label="Prénom" required error={errors.firstName}>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="Jean"
                    disabled={isPending}
                    autoComplete="given-name"
                    aria-invalid={!!errors.firstName}
                  />
                </Field>
                <Field id="lastName" label="Nom" required error={errors.lastName}>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="Dupont"
                    disabled={isPending}
                    autoComplete="family-name"
                    aria-invalid={!!errors.lastName}
                  />
                </Field>
              </div>
              <Field id="phone" label="Téléphone" required error={errors.phone}>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="0612345678"
                  disabled={isPending}
                  maxLength={10}
                  autoComplete="tel"
                  aria-invalid={!!errors.phone}
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>Informations de connexion</CardTitle>
            <CardDescription>Ces identifiants vous permettront de vous connecter</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <Field id="email" label="Email" required error={errors.email}>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="jean@example.fr"
                  disabled={isPending}
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                />
              </Field>
              <Field id="password" label="Mot de passe" required error={errors.password}>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  disabled={isPending}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!errors.password}
                />
                {password.length > 0 && (
                  <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                    <PwCheck ok={checks.length}>12–128 caractères</PwCheck>
                    <PwCheck ok={checks.lower}>1 minuscule</PwCheck>
                    <PwCheck ok={checks.upper}>1 majuscule</PwCheck>
                    <PwCheck ok={checks.digit}>1 chiffre</PwCheck>
                    <PwCheck ok={checks.special}>1 caractère spécial</PwCheck>
                  </ul>
                )}
              </Field>
              <Field id="confirmPassword" label="Confirmer le mot de passe" required error={errors.confirmPassword}>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  disabled={isPending}
                  autoComplete="new-password"
                  aria-invalid={!!errors.confirmPassword}
                />
              </Field>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Création en cours…' : 'Créer mon compte'}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Vous avez déjà un compte ?{' '}
              <Link href="/login" className="text-primary font-medium hover:underline underline-offset-4">
                Se connecter
              </Link>
            </p>
          </CardFooter>
        </Card>

      </form>
    </div>
  )
}

function Field({
  id, label, required, error, children,
}: {
  id: string; label: string; required?: boolean; error?: string; children: React.ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>
        {label}
        {!required && <span className="ml-1 text-xs text-muted-foreground">(optionnel)</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function PwCheck({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className={`flex items-center gap-1.5 text-xs transition-colors ${ok ? 'text-primary' : 'text-muted-foreground'}`}>
      <span className="text-[10px] font-bold">{ok ? '✓' : '○'}</span>
      {children}
    </li>
  )
}
