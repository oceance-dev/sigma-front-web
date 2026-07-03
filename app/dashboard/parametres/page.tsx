'use client'

import { apiFetch } from '@/src/lib/api-client'
import { useAuth } from '@/src/context/auth-context'
import { useActionState, useCallback, useEffect, useState } from 'react'
import {
  Bell,
  Building2,
  ChevronRight,
  Globe,
  KeyRound,
  Loader2,
  LogOut,
  Moon,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// ── Dark mode ──────────────────────────────────────────────

function useDarkMode() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('sigma_dark') === 'true'
    setIsDark(stored)
    document.documentElement.classList.toggle('dark', stored)
  }, [])

  function toggle() {
    setIsDark((prev) => {
      const next = !prev
      localStorage.setItem('sigma_dark', String(next))
      document.documentElement.classList.toggle('dark', next)
      return next
    })
  }

  return { isDark, toggle }
}

function useNotifications() {
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('sigma_notifs')
    if (stored !== null) setEnabled(stored === 'true')
  }, [])

  function toggle() {
    setEnabled((prev) => {
      const next = !prev
      localStorage.setItem('sigma_notifs', String(next))
      return next
    })
  }

  return { enabled, toggle }
}

// ── Toggle UI ──────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative h-6 w-11 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-muted'}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

// ── Row composants ─────────────────────────────────────────

function SettingRow({ icon, label, description, right, onClick, expandable = false }: {
  icon: React.ReactNode
  label: string
  description?: string
  right?: React.ReactNode
  onClick?: () => void
  expandable?: boolean
}) {
  const inner = (
    <>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
        <span className="text-primary">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {right ?? (expandable && <ChevronRight size={16} className="text-muted-foreground shrink-0" />)}
    </>
  )

  // Si la ligne contient un élément interactif dans `right` (ex. Toggle),
  // on utilise un div pour éviter le button-in-button invalide
  if (right) {
    return (
      <div className="flex w-full items-center gap-4 px-4 py-4">
        {inner}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-4 px-4 py-4 text-left transition-colors ${onClick ? 'hover:bg-muted/40 cursor-pointer' : 'cursor-default'}`}
    >
      {inner}
    </button>
  )
}

function SectionCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {title && (
        <p className="px-4 pt-4 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </p>
      )}
      <div className="divide-y divide-border">{children}</div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────

type OpenSection = 'profil' | 'password' | 'association' | null

export default function ParametresPage() {
  const { user, association: authAssociation, logout } = useAuth()
  const { isDark, toggle: toggleDark } = useDarkMode()
  const { enabled: notifs, toggle: toggleNotifs } = useNotifications()
  const isAdmin = user?.isAdmin ?? false

  const [open, setOpen] = useState<OpenSection>(null)

  function toggleSection(s: OpenSection) {
    setOpen((prev) => (prev === s ? null : s))
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">

      {/* ── En-tête ─────────────────────────────────────── */}
      <div>
        <h1 className="heading-1">Paramètres</h1>
        <p className="text-muted mt-1">Configurez votre application</p>
      </div>

      {/* ── Général ─────────────────────────────────────── */}
      <SectionCard>
        <SettingRow
          icon={<Bell size={17} />}
          label="Notifications"
          description="Recevoir les alertes"
          right={<Toggle checked={notifs} onChange={toggleNotifs} />}
        />
        <SettingRow
          icon={<Moon size={17} />}
          label="Mode sombre"
          description="Thème de l'application"
          right={<Toggle checked={isDark} onChange={toggleDark} />}
        />
      </SectionCard>

      {/* ── Compte ──────────────────────────────────────── */}
      <SectionCard title="Compte">
        {/* Profil */}
        <div>
          <SettingRow icon={<User size={17} />} label="Profil" expandable onClick={() => toggleSection('profil')} />
          {open === 'profil' && <ProfilForm user={user} onClose={() => setOpen(null)} />}
        </div>

        {/* Mot de passe */}
        <div>
          <SettingRow icon={<KeyRound size={17} />} label="Changer le mot de passe" expandable onClick={() => toggleSection('password')} />
          {open === 'password' && <PasswordForm onClose={() => setOpen(null)} />}
        </div>

        {/* Déconnexion tous appareils */}
        <SettingRow
          icon={<LogOut size={17} />}
          label="Déconnexion de tous les appareils"
          expandable
          onClick={async () => {
            if (confirm('Se déconnecter de tous les appareils ?')) {
              await logout()
              window.location.href = '/login'
            }
          }}
        />
      </SectionCard>

      {/* ── Préférences ─────────────────────────────────── */}
      <SectionCard title="Préférences">
        <SettingRow
          icon={<Globe size={17} />}
          label="Langue"
          right={<span className="flex items-center gap-1 text-sm text-muted-foreground">Français <ChevronRight size={14} /></span>}
        />
      </SectionCard>

      {/* ── Association (admin) ─────────────────────────── */}
      {isAdmin && (
        <SectionCard title="Association">
          <div>
            <SettingRow
              icon={<Building2 size={17} />}
              label="Informations de l'association"
              description="Modifier le nom, les coordonnées et les identifiants"
              expandable
              onClick={() => toggleSection('association')}
            />
            {open === 'association' && authAssociation && (
              <AssociationForm associationId={authAssociation.id} onClose={() => setOpen(null)} />
            )}
          </div>
        </SectionCard>
      )}
    </div>
  )
}

// ── Formulaire profil ──────────────────────────────────────

type ProfilState = { error?: string; success?: string } | null

function ProfilForm({ user, onClose }: { user: ReturnType<typeof useAuth>['user']; onClose: () => void }) {
  const [state, action, isPending] = useActionState(
    async (_prev: ProfilState, formData: FormData): Promise<ProfilState> => {
      const body = {
        firstName: (formData.get('firstName') as string).trim(),
        lastName:  (formData.get('lastName') as string).trim(),
        phone:     (formData.get('phone') as string).trim() || null,
        city_code: (formData.get('city_code') as string).trim() || null,
      }
      const res = await apiFetch('/users/me', { method: 'PUT', body: JSON.stringify(body) })
      if (!res.ok) { const j = await res.json(); return { error: j.message ?? 'Erreur.' } }
      return { success: 'Profil mis à jour avec succès.' }
    },
    null,
  )

  return (
    <form action={action} className="border-t border-border bg-muted/20 px-4 py-4 flex flex-col gap-3">
      {state?.error   && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}
      {state?.success && <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">{state.success}</p>}

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="p-fname">Prénom *</Label>
          <Input id="p-fname" name="firstName" defaultValue={user?.firstName ?? ''} required disabled={isPending} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="p-lname">Nom *</Label>
          <Input id="p-lname" name="lastName" defaultValue={user?.lastName ?? ''} required disabled={isPending} />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="p-email">Email</Label>
        <Input id="p-email" value={user?.email ?? ''} disabled className="opacity-60" />
        <p className="text-xs text-muted-foreground">L'email ne peut pas être modifié ici.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="p-phone">Téléphone</Label>
          <Input id="p-phone" name="phone" type="tel" defaultValue={''} disabled={isPending} placeholder="0612345678" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="p-city">Code postal</Label>
          <Input id="p-city" name="city_code" defaultValue={''} disabled={isPending} placeholder="75001" maxLength={5} />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>Annuler</Button>
        <Button type="submit" disabled={isPending}>{isPending ? 'Enregistrement…' : 'Enregistrer'}</Button>
      </div>
    </form>
  )
}

// ── Formulaire mot de passe ────────────────────────────────

type PwState = { error?: string; success?: string } | null

function PasswordForm({ onClose }: { onClose: () => void }) {
  const [state, action, isPending] = useActionState(
    async (_prev: PwState, formData: FormData): Promise<PwState> => {
      const newPw      = formData.get('newPassword') as string
      const confirmPw  = formData.get('confirmPassword') as string
      if (newPw !== confirmPw) return { error: 'Les mots de passe ne correspondent pas.' }
      if (newPw.length < 12)  return { error: 'Le mot de passe doit contenir au moins 12 caractères.' }

      const body = {
        currentPassword:      (formData.get('currentPassword') as string),
        newPassword:          newPw,
        passwordConfirmation: confirmPw,
      }
      const res = await apiFetch('/users/me/change-password', { method: 'PUT', body: JSON.stringify(body) })
      if (!res.ok) { const j = await res.json(); return { error: j.message ?? 'Erreur.' } }
      return { success: 'Mot de passe mis à jour.' }
    },
    null,
  )

  return (
    <form action={action} className="border-t border-border bg-muted/20 px-4 py-4 flex flex-col gap-3">
      {state?.error   && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}
      {state?.success && <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">{state.success}</p>}

      <div className="grid gap-1.5">
        <Label htmlFor="pw-current">Mot de passe actuel *</Label>
        <Input id="pw-current" name="currentPassword" type="password" required disabled={isPending} autoComplete="current-password" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="pw-new">Nouveau mot de passe *</Label>
        <Input id="pw-new" name="newPassword" type="password" required disabled={isPending} autoComplete="new-password" />
        <p className="text-xs text-muted-foreground">Minimum 12 caractères, avec majuscule, chiffre et caractère spécial.</p>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="pw-confirm">Confirmer le nouveau mot de passe *</Label>
        <Input id="pw-confirm" name="confirmPassword" type="password" required disabled={isPending} autoComplete="new-password" />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>Annuler</Button>
        <Button type="submit" disabled={isPending}>{isPending ? 'Mise à jour…' : 'Changer le mot de passe'}</Button>
      </div>
    </form>
  )
}

// ── Formulaire association ─────────────────────────────────

type AssocState = { error?: string; success?: string } | null

interface AssocData {
  name: string; email: string | null; phone: string | null; address: string | null
  city: string; postalCode: string; country: string; rna: string | null; siret: string | null
}

function AssociationForm({ associationId, onClose }: { associationId: string; onClose: () => void }) {
  const [data, setData] = useState<AssocData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    const res = await apiFetch(`/admin/association/${associationId}`)
    if (res.ok) {
      const json = await res.json()
      const a = json.data.association
      setData({
        name: a.name ?? '', email: a.email ?? '', phone: a.phone ?? '',
        address: a.address ?? '', city: a.city ?? '', postalCode: a.postalCode ?? '',
        country: a.country ?? 'France', rna: a.rna ?? '', siret: a.siret ?? '',
      })
    }
    setIsLoading(false)
  }, [associationId])

  useEffect(() => { load() }, [load])

  const [state, action, isPending] = useActionState(
    async (_prev: AssocState, formData: FormData): Promise<AssocState> => {
      const get = (k: string) => (formData.get(k) as string ?? '').trim()
      const body = {
        name:       get('name'),
        email:      get('email') || null,
        phone:      get('phone') || null,
        address:    get('address') || null,
        city:       get('city'),
        postalCode: get('postalCode'),
        country:    get('country'),
        rna:        get('rna') || null,
        siret:      get('siret') || null,
      }
      const res = await apiFetch(`/admin/association/${associationId}/update`, { method: 'PUT', body: JSON.stringify(body) })
      if (!res.ok) { const j = await res.json(); return { error: j.message ?? 'Erreur.' } }
      return { success: 'Association mise à jour avec succès.' }
    },
    null,
  )

  if (isLoading) {
    return (
      <div className="border-t border-border bg-muted/20 px-4 py-6 flex justify-center">
        <Loader2 size={18} className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <form action={action} className="border-t border-border bg-muted/20 px-4 py-4 flex flex-col gap-3">
      {state?.error   && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}
      {state?.success && <p className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">{state.success}</p>}

      <div className="grid gap-1.5">
        <Label htmlFor="a-name">Nom *</Label>
        <Input id="a-name" name="name" defaultValue={data?.name} required disabled={isPending} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="a-email">Email</Label>
          <Input id="a-email" name="email" type="email" defaultValue={data?.email ?? ''} disabled={isPending} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="a-phone">Téléphone</Label>
          <Input id="a-phone" name="phone" type="tel" defaultValue={data?.phone ?? ''} disabled={isPending} />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="a-address">Adresse</Label>
        <Input id="a-address" name="address" defaultValue={data?.address ?? ''} disabled={isPending} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="a-postal">Code postal *</Label>
          <Input id="a-postal" name="postalCode" defaultValue={data?.postalCode} required maxLength={5} disabled={isPending} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="a-city">Ville *</Label>
          <Input id="a-city" name="city" defaultValue={data?.city} required disabled={isPending} />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="a-country">Pays *</Label>
        <Input id="a-country" name="country" defaultValue={data?.country ?? 'France'} required disabled={isPending} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="a-rna">RNA</Label>
          <Input id="a-rna" name="rna" defaultValue={data?.rna ?? ''} disabled={isPending} placeholder="W801234567" maxLength={10} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="a-siret">SIRET</Label>
          <Input id="a-siret" name="siret" defaultValue={data?.siret ?? ''} disabled={isPending} placeholder="14 chiffres" maxLength={14} inputMode="numeric" />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>Annuler</Button>
        <Button type="submit" disabled={isPending}>{isPending ? 'Enregistrement…' : 'Enregistrer'}</Button>
      </div>
    </form>
  )
}
