'use client'

import { apiFetch } from '@/src/lib/api-client'
import { useAuth } from '@/src/context/auth-context'
import { useActionState, useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  KeyRound,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Shield,
  User,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PersonalDataRequestsSection } from '@/components/account-requests/PersonalDataRequestsSection'

import { formatDate } from '@/src/lib/date-utils'

// ── Types ──────────────────────────────────────────────────

interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  dateOfBirth: string | null
  phone: string | null
  city_code: string | null
  sexe: 'Homme' | 'Femme' | null
  associationRoleKey: string
  isActive: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
  emailVerifiedAt: string | null
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

// ── Page ───────────────────────────────────────────────────

type OpenSection = 'edit' | 'email' | 'password' | 'delete' | null

export default function ProfilPage() {
  const { user: authUser, association, logout } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [open, setOpen] = useState<OpenSection>(null)
  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null)

  useEffect(() => {
    apiFetch('/users/me')
      .then((r) => r.json())
      .then((json) => setProfile(json.data?.user ?? null))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  const p: UserProfile | null = profile ?? (authUser ? {
    id: authUser.id,
    email: authUser.email,
    firstName: authUser.firstName,
    lastName: authUser.lastName,
    fullName: authUser.fullName,
    dateOfBirth: null, phone: null, city_code: null, sexe: null,
    associationRoleKey: authUser.associationRoleKey, isActive: authUser.isActive,
    isAdmin: authUser.isAdmin, isSuperAdmin: authUser.isSuperAdmin,
    emailVerifiedAt: null, lastLoginAt: null,
    createdAt: '', updatedAt: '',
  } : null)
  const initials = p ? `${p.firstName[0]}${p.lastName[0]}`.toUpperCase() : '?'

  function onSaved(msg: string) {
    setOpen(null)
    setGlobalSuccess(msg)
    // Recharger le profil
    apiFetch('/users/me').then(r => r.json()).then(json => setProfile(json.data?.user ?? null))
    setTimeout(() => setGlobalSuccess(null), 4000)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">

      {/* ── Succès global ───────────────────────────────── */}
      {globalSuccess && (
        <div className="flex items-center justify-between rounded-lg bg-primary/10 px-4 py-3 text-sm text-primary">
          <div className="flex items-center gap-2"><CheckCircle2 size={15} />{globalSuccess}</div>
          <button onClick={() => setGlobalSuccess(null)}><X size={13} /></button>
        </div>
      )}

      {/* ── Card avatar ─────────────────────────────────── */}
      <div className="flex items-center gap-5 rounded-xl border border-border bg-card p-5">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground select-none">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-semibold text-foreground">{p?.fullName ?? '—'}</p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {p?.isAdmin && (
              <span className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                <Shield size={11} />{p.isSuperAdmin ? 'Super Admin' : 'Admin'}
              </span>
            )}
            {association?.name && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Building2 size={11} />{association.name}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{p?.email}</p>
        </div>
      </div>

      {/* ── Informations personnelles ────────────────────── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <User size={16} className="text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Informations personnelles</p>
          </div>
          <button
            onClick={() => setOpen(open === 'edit' ? null : 'edit')}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
          >
            <Pencil size={12} />{open === 'edit' ? 'Annuler' : 'Modifier'}
          </button>
        </div>

        {open !== 'edit' ? (
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 p-5">
            <InfoField label="Prénom"     value={p?.firstName} />
            <InfoField label="Nom"        value={p?.lastName} />
            <InfoField label="Téléphone"  value={p?.phone}     icon={<Phone size={13} />} />
            <InfoField label="Code postal" value={p?.city_code} icon={<MapPin size={13} />} />
            <InfoField label="Date de naissance" value={formatDate(p?.dateOfBirth)} icon={<Calendar size={13} />} />
            <InfoField label="Genre"      value={p?.sexe} />
            <InfoField label="Membre depuis" value={formatDate(p?.createdAt)} />
            <InfoField label="Dernière connexion" value={formatDate(p?.lastLoginAt)} />
          </div>
        ) : (
          <EditProfileForm
            profile={p as UserProfile}
            onSaved={() => onSaved('Profil mis à jour avec succès.')}
            onCancel={() => setOpen(null)}
          />
        )}
      </div>

      {/* ── Sécurité ────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Sécurité</p>
          </div>
        </div>

        <div className="divide-y divide-border">
          {/* Email */}
          <div>
            <button
              onClick={() => setOpen(open === 'email' ? null : 'email')}
              className="flex w-full items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Mail size={15} className="text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Adresse email</p>
                  <p className="text-xs text-muted-foreground">{p?.email}</p>
                </div>
              </div>
              <span className="text-xs text-primary font-medium">{open === 'email' ? 'Annuler' : 'Modifier'}</span>
            </button>
            {open === 'email' && (
              <ChangeEmailForm
                onSaved={(msg) => onSaved(msg)}
                onCancel={() => setOpen(null)}
              />
            )}
          </div>

          {/* Mot de passe */}
          <div>
            <button
              onClick={() => setOpen(open === 'password' ? null : 'password')}
              className="flex w-full items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <KeyRound size={15} className="text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Mot de passe</p>
                  <p className="text-xs text-muted-foreground">Dernière modification inconnue</p>
                </div>
              </div>
              <span className="text-xs text-primary font-medium">{open === 'password' ? 'Annuler' : 'Modifier'}</span>
            </button>
            {open === 'password' && (
              <ChangePasswordForm
                onSaved={() => onSaved('Mot de passe modifié avec succès.')}
                onCancel={() => setOpen(null)}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Mes données personnelles (RGPD) ──────────────── */}
      {association && <PersonalDataRequestsSection isAdmin={!!p?.isAdmin} />}

      {/* ── Zone dangereuse ─────────────────────────────── */}
      {/* Réservée aux comptes sans association : pour un membre rattaché à
          une association, la suppression passe par le circuit RGPD ci-dessus
          (validation admin + anonymisation) plutôt que par une suppression
          immédiate et unilatérale. */}
      {!association && (
        <div className="rounded-xl border border-destructive/30 bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-destructive/20">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-destructive" />
              <p className="text-sm font-medium text-destructive">Zone dangereuse</p>
            </div>
          </div>

          <div>
            <button
              onClick={() => setOpen(open === 'delete' ? null : 'delete')}
              className="flex w-full items-center justify-between px-5 py-4 hover:bg-destructive/5 transition-colors text-left"
            >
              <div>
                <p className="text-sm font-medium text-foreground">Supprimer mon compte</p>
                <p className="text-xs text-muted-foreground">Cette action est irréversible. Toutes vos données seront supprimées.</p>
              </div>
              <span className="text-xs text-destructive font-medium shrink-0 ml-4">{open === 'delete' ? 'Annuler' : 'Supprimer'}</span>
            </button>
            {open === 'delete' && (
              <DeleteAccountForm
                onDeleted={async () => { await logout(); window.location.href = '/login' }}
                onCancel={() => setOpen(null)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── InfoField ──────────────────────────────────────────────

function InfoField({ label, value, icon }: { label: string; value?: string | null; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-1.5 text-sm text-foreground">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <span>{value ?? '—'}</span>
      </div>
    </div>
  )
}

// ── EditProfileForm ────────────────────────────────────────

type EditState = { error?: string } | null

function EditProfileForm({ profile, onSaved, onCancel }: {
  profile: UserProfile
  onSaved: () => void
  onCancel: () => void
}) {
  const [state, action, isPending] = useActionState(
    async (_prev: EditState, formData: FormData): Promise<EditState> => {
      const body = {
        firstName: (formData.get('firstName') as string).trim(),
        lastName:  (formData.get('lastName') as string).trim(),
        phone:     (formData.get('phone') as string).trim() || null,
        city_code: (formData.get('city_code') as string).trim() || null,
      }
      const res = await apiFetch('/users/me', { method: 'PUT', body: JSON.stringify(body) })
      if (!res.ok) { const j = await res.json(); return { error: j.message ?? 'Erreur.' } }
      onSaved()
      return null
    },
    null,
  )

  return (
    <form action={action} className="border-t border-border bg-muted/20 px-5 py-4 flex flex-col gap-3">
      {state?.error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="ep-fn">Prénom *</Label>
          <Input id="ep-fn" name="firstName" defaultValue={profile.firstName} required disabled={isPending} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="ep-ln">Nom *</Label>
          <Input id="ep-ln" name="lastName" defaultValue={profile.lastName} required disabled={isPending} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="ep-ph">Téléphone</Label>
          <Input id="ep-ph" name="phone" type="tel" defaultValue={profile.phone ?? ''} disabled={isPending} placeholder="0612345678" maxLength={10} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="ep-cp">Code postal</Label>
          <Input id="ep-cp" name="city_code" defaultValue={profile.city_code ?? ''} disabled={isPending} placeholder="75001" maxLength={5} inputMode="numeric" />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isPending}>Annuler</Button>
        <Button type="submit" disabled={isPending}>{isPending ? 'Enregistrement…' : 'Enregistrer'}</Button>
      </div>
    </form>
  )
}

// ── ChangeEmailForm ────────────────────────────────────────

type EmailState = { error?: string } | null

function ChangeEmailForm({ onSaved, onCancel }: {
  onSaved: (msg: string) => void
  onCancel: () => void
}) {
  const [state, action, isPending] = useActionState(
    async (_prev: EmailState, formData: FormData): Promise<EmailState> => {
      const body = {
        currentPassword: formData.get('currentPassword') as string,
        newEmail:        (formData.get('newEmail') as string).trim(),
      }
      const res = await apiFetch('/users/me/email', { method: 'PATCH', body: JSON.stringify(body) })
      const json = await res.json()
      if (!res.ok) return { error: json.message ?? 'Erreur.' }
      onSaved(json.message ?? 'Email modifié avec succès.')
      return null
    },
    null,
  )

  return (
    <form action={action} className="border-t border-border bg-muted/20 px-5 py-4 flex flex-col gap-3">
      {state?.error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}

      <div className="grid gap-1.5">
        <Label htmlFor="ce-email">Nouvel email *</Label>
        <Input id="ce-email" name="newEmail" type="email" required disabled={isPending} autoComplete="email" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="ce-pw">Mot de passe actuel *</Label>
        <Input id="ce-pw" name="currentPassword" type="password" required disabled={isPending} autoComplete="current-password" />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isPending}>Annuler</Button>
        <Button type="submit" disabled={isPending}>{isPending ? 'Modification…' : 'Modifier l\'email'}</Button>
      </div>
    </form>
  )
}

// ── ChangePasswordForm ─────────────────────────────────────

type PwState = { error?: string } | null

function ChangePasswordForm({ onSaved, onCancel }: { onSaved: () => void; onCancel: () => void }) {
  const [state, action, isPending] = useActionState(
    async (_prev: PwState, formData: FormData): Promise<PwState> => {
      const newPw     = formData.get('newPassword') as string
      const confirmPw = formData.get('newPasswordConfirmation') as string
      if (newPw !== confirmPw) return { error: 'Les mots de passe ne correspondent pas.' }
      if (newPw.length < 12)  return { error: 'Minimum 12 caractères requis.' }

      const body = {
        currentPassword:         formData.get('currentPassword') as string,
        newPassword:             newPw,
        newPasswordConfirmation: confirmPw,
      }
      const res = await apiFetch('/users/me/change-password', { method: 'PUT', body: JSON.stringify(body) })
      if (!res.ok) { const j = await res.json(); return { error: j.message ?? 'Erreur.' } }
      onSaved()
      return null
    },
    null,
  )

  return (
    <form action={action} className="border-t border-border bg-muted/20 px-5 py-4 flex flex-col gap-3">
      {state?.error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}

      <div className="grid gap-1.5">
        <Label htmlFor="cp-cur">Mot de passe actuel *</Label>
        <Input id="cp-cur" name="currentPassword" type="password" required disabled={isPending} autoComplete="current-password" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="cp-new">Nouveau mot de passe *</Label>
        <Input id="cp-new" name="newPassword" type="password" required disabled={isPending} autoComplete="new-password" />
        <p className="text-xs text-muted-foreground">Minimum 12 caractères, avec majuscule, chiffre et caractère spécial.</p>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="cp-conf">Confirmer le nouveau mot de passe *</Label>
        <Input id="cp-conf" name="newPasswordConfirmation" type="password" required disabled={isPending} autoComplete="new-password" />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isPending}>Annuler</Button>
        <Button type="submit" disabled={isPending}>{isPending ? 'Modification…' : 'Changer le mot de passe'}</Button>
      </div>
    </form>
  )
}

// ── DeleteAccountForm ──────────────────────────────────────

type DeleteState = { error?: string } | null

function DeleteAccountForm({ onDeleted, onCancel }: { onDeleted: () => void; onCancel: () => void }) {
  const [state, action, isPending] = useActionState(
    async (_prev: DeleteState, formData: FormData): Promise<DeleteState> => {
      const body = { currentPassword: formData.get('currentPassword') as string }
      const res = await apiFetch('/users/me', { method: 'DELETE', body: JSON.stringify(body) })
      if (!res.ok) { const j = await res.json(); return { error: j.message ?? 'Erreur.' } }
      onDeleted()
      return null
    },
    null,
  )

  return (
    <form action={action} className="border-t border-destructive/20 bg-destructive/5 px-5 py-4 flex flex-col gap-3">
      {state?.error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}

      <p className="text-sm text-muted-foreground">
        Confirmez votre mot de passe pour supprimer définitivement votre compte. <strong className="text-foreground">Cette action est irréversible.</strong>
      </p>
      <div className="grid gap-1.5">
        <Label htmlFor="da-pw">Mot de passe *</Label>
        <Input id="da-pw" name="currentPassword" type="password" required disabled={isPending} autoComplete="current-password" />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isPending}>Annuler</Button>
        <Button type="submit" disabled={isPending} className="bg-destructive text-white hover:bg-destructive/90">
          {isPending ? 'Suppression…' : 'Supprimer mon compte'}
        </Button>
      </div>
    </form>
  )
}
