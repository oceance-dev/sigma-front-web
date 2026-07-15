'use client'

import { useState, useTransition, type FormEvent } from 'react'
import Link from 'next/link'
import { ArrowLeft, Building2, CheckCircle2, Loader2, Mail, MapPin } from 'lucide-react'
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

interface AssociationInfo {
  id: string
  name: string
  city: string
  postalCode: string
}

type SuccessData = { email: string; firstName: string }

export default function MemberInscription() {
  const [step,         setStep]         = useState<'code' | 'info'>('code')
  const [association,  setAssociation]  = useState<AssociationInfo | null>(null)
  const [codeError,    setCodeError]    = useState<string | null>(null)
  const [isVerifying,  startVerify]     = useTransition()

  const [errors,       setErrors]       = useState<Errors>({})
  const [globalError,  setGlobalError]  = useState<string | null>(null)
  const [success,      setSuccess]      = useState<SuccessData | null>(null)
  const [password,     setPassword]     = useState('')
  const [isPending,    startTransition] = useTransition()

  // ── Étape 1 : retrouver l'association via son code ────────

  function handleVerifyCode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setCodeError(null)
    const code = ((e.currentTarget.elements.namedItem('codeAssociation') as HTMLInputElement)?.value ?? '').trim()

    if (!code) {
      setCodeError('Le code de l\'association est obligatoire.')
      return
    }

    startVerify(async () => {
      try {
        const res  = await fetch(`/api/sigma/associations/by-code/${encodeURIComponent(code)}`)
        const json = await res.json()

        if (!res.ok) {
          setCodeError(json.message ?? 'Association introuvable ou inactive.')
          return
        }

        const data = json.data?.association ?? json.data
        setAssociation({
          id:         data.id,
          name:       data.name,
          city:       data.city       ?? '',
          postalCode: data.postalCode ?? '',
        })
        setStep('info')
      } catch {
        setCodeError('Impossible de joindre le serveur.')
      }
    })
  }

  // ── Étape 2 : validation du formulaire ────────────────────

  function validate(fd: FormData): Errors {
    const e: Errors = {}
    const get = (k: string) => (fd.get(k) as string ?? '').trim()

    if (!get('firstname') || get('firstname').length < 2) e.firstname    = 'Prénom requis (2 caractères minimum)'
    if (!get('lastname')  || get('lastname').length  < 2) e.lastname     = 'Nom requis (2 caractères minimum)'
    if (!get('dateOfBirth'))                               e.dateOfBirth  = 'Date de naissance requise'
    if (!get('sexe'))                                      e.sexe         = 'Sexe requis'
    if (!/^\d{5}$/.test(get('city_code')))                e.city_code    = 'Code postal invalide (5 chiffres)'

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

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!association) return
    setGlobalError(null)

    const fd          = new FormData(e.currentTarget)
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
          associationMember: {
            firstname:            get('firstname'),
            lastname:             get('lastname'),
            email:                get('email'),
            password:             fd.get('password') as string,
            passwordConfirmation: fd.get('confirmPassword') as string,
            phone:                get('phone').replace(/\s/g, ''),
            city_code:            get('city_code'),
            dateOfBirth:          get('dateOfBirth'),
            sexe:                 get('sexe'),
            associationId:        association.id,
          },
        }

        const res  = await fetch('/api/sigma/register/member-association', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(body),
        })
        const json = await res.json()

        if (!res.ok) {
          if (res.status === 422 && Array.isArray(json.errors)) {
            const serverErrors: Errors = {}
            for (const err of json.errors) {
              const field = (err.field as string).replace('associationMember.', '')
              serverErrors[field] = err.message
            }
            setErrors(serverErrors)
          } else {
            setGlobalError(json.message ?? 'Une erreur est survenue. Veuillez réessayer.')
          }
          return
        }

        setSuccess({ email: get('email'), firstName: get('firstname') })
      } catch {
        setGlobalError('Impossible de joindre le serveur. Vérifiez votre connexion.')
      }
    })
  }

  // ── Succès ────────────────────────────────────────────────

  if (success) {
    return (
      <div className="w-full max-w-xl">
        <Card size="sm">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 size={28} className="text-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-medium text-foreground">Bienvenue, {success.firstName} !</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Votre demande d'adhésion a été envoyée. Un administrateur doit valider votre compte avant que vous puissiez vous connecter.
              </p>
            </div>
            <div className="flex items-start gap-2 rounded-lg bg-muted/50 px-4 py-3 text-left max-w-xs">
              <Mail size={15} className="text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Un email de confirmation a été envoyé à{' '}
                <span className="font-medium text-foreground">{success.email}</span>.
              </p>
            </div>
            <Link href="/login" className="mt-2 text-sm font-medium text-primary hover:underline underline-offset-4">
              Retour à la connexion
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Étape 1 : saisie du code ──────────────────────────────

  if (step === 'code') {
    return (
      <div className="w-full max-w-xl flex flex-col gap-4">
        <Link href="/sigin" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
          <ArrowLeft size={15} /> Retour
        </Link>
        <form onSubmit={handleVerifyCode} className="flex flex-col gap-4">
          <Card size="sm">
            <CardHeader>
              <CardTitle>Rejoindre une association</CardTitle>
              <CardDescription>Saisissez le code transmis par votre association</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {codeError && (
                <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {codeError}
                </div>
              )}
              <Field id="codeAssociation" label="Code de l'association" required>
                <Input
                  id="codeAssociation"
                  name="codeAssociation"
                  placeholder="Ex: SIGMA-2024"
                  disabled={isVerifying}
                  autoFocus
                />
              </Field>
            </CardContent>
            <CardFooter className="flex-col gap-3">
              <Button type="submit" className="w-full" disabled={isVerifying}>
                {isVerifying
                  ? <><Loader2 size={14} className="animate-spin mr-2" />Recherche…</>
                  : 'Continuer'}
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Vous avez déjà un compte ?{' '}
                <Link href="/login" className="text-primary font-medium hover:underline underline-offset-4">Se connecter</Link>
              </p>
            </CardFooter>
          </Card>
        </form>
      </div>
    )
  }

  // ── Étape 2 : formulaire d'inscription ────────────────────

  const checks = pwChecks(password)

  return (
    <div className="w-full max-w-xl flex flex-col gap-4">
      <button
        onClick={() => { setStep('code'); setAssociation(null) }}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft size={15} /> Retour
      </button>

      {association && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Building2 size={18} className="text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{association.name}</p>
            {(association.city || association.postalCode) && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin size={11} />
                {[association.city, association.postalCode].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        </div>
      )}

      {globalError && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {globalError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">

        <Card size="sm">
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
            <CardDescription>Vos informations en tant que membre</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Field id="firstname" label="Prénom" required error={errors.firstname}>
                <Input id="firstname" name="firstname" placeholder="Jean" disabled={isPending}
                  autoComplete="given-name" aria-invalid={!!errors.firstname} />
              </Field>
              <Field id="lastname" label="Nom" required error={errors.lastname}>
                <Input id="lastname" name="lastname" placeholder="Dupont" disabled={isPending}
                  autoComplete="family-name" aria-invalid={!!errors.lastname} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field id="dateOfBirth" label="Date de naissance" required error={errors.dateOfBirth}>
                <Input id="dateOfBirth" name="dateOfBirth" type="date" disabled={isPending}
                  autoComplete="bday" aria-invalid={!!errors.dateOfBirth} />
              </Field>
              <Field id="sexe" label="Sexe" required error={errors.sexe}>
                <select id="sexe" name="sexe" disabled={isPending}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                  <option value="">Sélectionner…</option>
                  <option value="Homme">Homme</option>
                  <option value="Femme">Femme</option>
                </select>
              </Field>
            </div>
            <Field id="city_code" label="Code postal" required error={errors.city_code}>
              <Input id="city_code" name="city_code" placeholder="80000" inputMode="numeric"
                maxLength={5} disabled={isPending} aria-invalid={!!errors.city_code} />
            </Field>
            <Field id="phone" label="Téléphone" required error={errors.phone}>
              <Input id="phone" name="phone" type="tel" placeholder="0612345678"
                maxLength={10} disabled={isPending} autoComplete="tel" aria-invalid={!!errors.phone} />
            </Field>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle>Informations de connexion</CardTitle>
            <CardDescription>Ces identifiants vous permettront de vous connecter</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Field id="email" label="Email" required error={errors.email}>
              <Input id="email" name="email" type="email" placeholder="jean@example.fr"
                disabled={isPending} autoComplete="email" aria-invalid={!!errors.email} />
            </Field>
            <Field id="password" label="Mot de passe" required error={errors.password}>
              <PasswordInput id="password" name="password" disabled={isPending}
                autoComplete="new-password" value={password}
                onChange={(e) => setPassword(e.target.value)} aria-invalid={!!errors.password} />
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
              <PasswordInput id="confirmPassword" name="confirmPassword"
                disabled={isPending} autoComplete="new-password" aria-invalid={!!errors.confirmPassword} />
            </Field>
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

function Field({ id, label, required, error, children }: {
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
