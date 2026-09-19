'use client'

import { useAuth } from '@/src/context/auth-context'
import { apiFetch } from '@/src/lib/api-client'
import { useActionState, useCallback, useEffect, useState, useTransition } from 'react'
import {
  AlertCircle,
  Bell,
  BookOpen,
  Building2,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  FileX,
  HelpCircle,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  MessageCircle,
  Moon,
  Newspaper,
  Play,
  Receipt,
  RefreshCw,
  Settings,
  Shield,
  User,
  X,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatDate, formatMonth } from '@/src/lib/date-utils'
import { PersonalDataRequestsSection } from '@/components/account-requests/PersonalDataRequestsSection'
import type { BillingPlan, Invoice } from '@/src/types/billing'

// ── Types & données statiques ──────────────────────────────

type SectionId =
  | 'profil' | 'donnees' | 'parametres' | 'abonnement' | 'factures'
  | 'nouveautes' | 'aide' | 'support' | 'logout'

interface SectionItem {
  id: SectionId
  label: string
  icon: React.ReactNode
  adminOnly?: boolean
  danger?: boolean
}

// 'donnees' (RGPD) n'est PAS adminOnly : un admin d'association doit pouvoir demander
// l'accès à SES PROPRES données exactement comme un membre — seul le traitement des
// demandes des AUTRES (approuver/rejeter) est réservé aux admins, ailleurs (onglet
// association / panel super-admin), pas ici.
const SECTIONS: SectionItem[] = [
  { id: 'profil',      label: 'Mon profil',            icon: <User        size={16} /> },
  { id: 'donnees',     label: 'Mes données (RGPD)',    icon: <FileText    size={16} /> },
  { id: 'parametres',  label: 'Paramètres',            icon: <Settings    size={16} /> },
  { id: 'abonnement',  label: 'Abonnement',            icon: <CreditCard  size={16} />, adminOnly: true },
  { id: 'factures',    label: 'Mes factures',          icon: <Receipt     size={16} />, adminOnly: true },
  { id: 'nouveautes',  label: 'Nouveautés',            icon: <Newspaper   size={16} /> },
  { id: 'aide',        label: 'Aide & tutoriels',      icon: <HelpCircle  size={16} />, adminOnly: true },
  { id: 'support',     label: 'Contacter le support',  icon: <Mail        size={16} /> },
  { id: 'logout',      label: 'Se déconnecter',        icon: <LogOut      size={16} />, danger: true },
]

// ── Types aide ─────────────────────────────────────────────

interface GuideStep { title: string; content: string }
interface HelpGuide { id: number; title: string; description: string; steps: GuideStep[] }
interface HelpFaq   { id: number; question: string; answer: string }
interface HelpVideo { id: number; title: string; description?: string | null; url: string; duration?: string | null; thumbnail?: string | null }

// ── Types nouveautés ───────────────────────────────────────

type NewsCategory = 'feature' | 'improvement' | 'fix'
interface NewsEntry { id: number; title: string; content: string; category: NewsCategory; publishedAt: string }

const NEWS_CFG: Record<NewsCategory, { label: string; classes: string; dot: string }> = {
  feature:     { label: 'Nouveauté',    classes: 'bg-primary/10 text-primary',      dot: 'bg-primary' },
  improvement: { label: 'Amélioration', classes: 'bg-blue-100 text-blue-700',       dot: 'bg-blue-500' },
  fix:         { label: 'Correction',   classes: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-500' },
}

// ── Types profil ───────────────────────────────────────────

interface UserProfile {
  id: string; email: string; firstName: string; lastName: string; fullName: string
  dateOfBirth: string | null; phone: string | null; city_code: string | null
  sexe: 'Homme' | 'Femme' | null; associationRoleKey: string
  isActive: boolean; isAdmin: boolean; isSuperAdmin: boolean
  emailVerifiedAt: string | null; lastLoginAt: string | null; createdAt: string; updatedAt: string
}

// ── Hooks paramètres ───────────────────────────────────────

function useDarkMode() {
  const [isDark, setIsDark] = useState(false)
  useEffect(() => { setIsDark(localStorage.getItem('sigma_dark') === 'true') }, [])
  function toggle() {
    setIsDark(p => {
      const n = !p
      localStorage.setItem('sigma_dark', String(n))
      document.documentElement.classList.toggle('dark', n)
      return n
    })
  }
  return { isDark, toggle }
}

function useNotifications() {
  const [enabled, setEnabled] = useState(true)
  useEffect(() => { const s = localStorage.getItem('sigma_notifs'); if (s !== null) setEnabled(s === 'true') }, [])
  function toggle() { setEnabled(p => { const n = !p; localStorage.setItem('sigma_notifs', String(n)); return n }) }
  return { enabled, toggle }
}

// ── Composants UI ──────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button" role="switch" aria-checked={checked} onClick={onChange}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-muted'}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
    </div>
  )
}

function Feedback({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  return (
    <div className={`flex items-center justify-between gap-3 rounded-lg px-4 py-2 text-sm mb-4 ${
      type === 'success' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'
    }`}>
      <div className="flex items-center gap-2">
        {type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
        {message}
      </div>
      <button onClick={onClose}><X size={13} /></button>
    </div>
  )
}

function EmptyState({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
      {icon}
      <p className="text-sm">{label}</p>
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// SECTION : PROFIL
// ══════════════════════════════════════════════════════════

function ProfilSection() {
  const { user: authUser, association } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [open, setOpen] = useState<'edit' | 'email' | 'password' | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const load = useCallback(() => {
    apiFetch('/users/me').then(r => r.json()).then(j => setProfile(j.data?.user ?? null)).finally(() => setIsLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  const p = profile ?? (authUser ? {
    id: authUser.id, email: authUser.email, firstName: authUser.firstName, lastName: authUser.lastName, fullName: authUser.fullName,
    dateOfBirth: null, phone: null, city_code: null, sexe: null,
    associationRoleKey: authUser.associationRoleKey, isActive: authUser.isActive,
    isAdmin: authUser.isAdmin, isSuperAdmin: authUser.isSuperAdmin,
    emailVerifiedAt: null, lastLoginAt: null, createdAt: '', updatedAt: '',
  } as UserProfile : null)

  const initials = p ? `${p.firstName[0]}${p.lastName[0]}`.toUpperCase() : '?'

  function onSaved(msg: string) {
    setOpen(null); setSuccess(msg); load(); setTimeout(() => setSuccess(null), 4000)
  }

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>

  return (
    <>
      <SectionHeader title="Mon profil" description="Vos informations personnelles" />
      {success && <Feedback message={success} type="success" onClose={() => setSuccess(null)} />}

      {/* Avatar */}
      <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 mb-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">{initials}</div>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-foreground truncate">{p?.fullName ?? '—'}</p>
          <p className="text-sm text-muted-foreground truncate">{p?.email}</p>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {p?.isAdmin && (
              <span className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                <Shield size={11} />{p.isSuperAdmin ? 'Super Admin' : 'Admin'}
              </span>
            )}
            {association?.name && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground"><Building2 size={11} />{association.name}</span>
            )}
          </div>
        </div>
      </div>

      {/* Infos */}
      <div className="rounded-xl border border-border bg-card overflow-hidden mb-4">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <p className="text-sm font-medium text-foreground">Informations personnelles</p>
          <button onClick={() => setOpen(open === 'edit' ? null : 'edit')} className="text-xs text-primary font-medium hover:underline">
            {open === 'edit' ? 'Annuler' : 'Modifier'}
          </button>
        </div>
        {open === 'edit' && p ? (
          <EditProfileForm profile={p} onSaved={() => onSaved('Profil mis à jour.')} onCancel={() => setOpen(null)} />
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 p-4">
            <Info label="Prénom" value={p?.firstName} />
            <Info label="Nom" value={p?.lastName} />
            <Info label="Téléphone" value={p?.phone} />
            <Info label="Code postal" value={p?.city_code} />
            <Info label="Date de naissance" value={formatDate(p?.dateOfBirth)} />
            <Info label="Dernière connexion" value={formatDate(p?.lastLoginAt)} />
          </div>
        )}
      </div>

      {/* Sécurité */}
      <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
        <div>
          <button onClick={() => setOpen(open === 'email' ? null : 'email')} className="flex w-full items-center justify-between px-4 py-3 hover:bg-muted/40 text-left">
            <div className="flex items-center gap-3">
              <Mail size={15} className="text-muted-foreground" />
              <div><p className="text-sm font-medium text-foreground">Email</p><p className="text-xs text-muted-foreground">{p?.email}</p></div>
            </div>
            <span className="text-xs text-primary font-medium">{open === 'email' ? 'Annuler' : 'Modifier'}</span>
          </button>
          {open === 'email' && <ChangeEmailForm onSaved={msg => onSaved(msg)} onCancel={() => setOpen(null)} />}
        </div>
        <div>
          <button onClick={() => setOpen(open === 'password' ? null : 'password')} className="flex w-full items-center justify-between px-4 py-3 hover:bg-muted/40 text-left">
            <div className="flex items-center gap-3">
              <KeyRound size={15} className="text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Mot de passe</p>
            </div>
            <span className="text-xs text-primary font-medium">{open === 'password' ? 'Annuler' : 'Modifier'}</span>
          </button>
          {open === 'password' && <ChangePasswordForm onSaved={() => onSaved('Mot de passe modifié.')} onCancel={() => setOpen(null)} />}
        </div>
      </div>
    </>
  )
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value ?? '—'}</p>
    </div>
  )
}

type FState = { error?: string } | null

function EditProfileForm({ profile, onSaved, onCancel }: { profile: UserProfile; onSaved: () => void; onCancel: () => void }) {
  const [state, action, isPending] = useActionState(async (_: FState, fd: FormData): Promise<FState> => {
    const body = {
      firstName: (fd.get('firstName') as string).trim(),
      lastName:  (fd.get('lastName') as string).trim(),
      phone:     (fd.get('phone') as string).trim() || null,
      city_code: (fd.get('city_code') as string).trim() || null,
    }
    const res = await apiFetch('/users/me', { method: 'PUT', body: JSON.stringify(body) })
    if (!res.ok) { const j = await res.json(); return { error: j.message ?? 'Erreur.' } }
    onSaved(); return null
  }, null)

  return (
    <form action={action} className="border-t border-border bg-muted/20 p-4 flex flex-col gap-3">
      {state?.error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5"><Label htmlFor="pf-fn">Prénom *</Label><Input id="pf-fn" name="firstName" defaultValue={profile.firstName} required disabled={isPending} /></div>
        <div className="grid gap-1.5"><Label htmlFor="pf-ln">Nom *</Label><Input id="pf-ln" name="lastName" defaultValue={profile.lastName} required disabled={isPending} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5"><Label htmlFor="pf-ph">Téléphone</Label><Input id="pf-ph" name="phone" type="tel" defaultValue={profile.phone ?? ''} disabled={isPending} maxLength={10} /></div>
        <div className="grid gap-1.5"><Label htmlFor="pf-cp">Code postal</Label><Input id="pf-cp" name="city_code" defaultValue={profile.city_code ?? ''} disabled={isPending} maxLength={5} /></div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isPending}>Annuler</Button>
        <Button type="submit" disabled={isPending}>{isPending ? 'Enregistrement…' : 'Enregistrer'}</Button>
      </div>
    </form>
  )
}

function ChangeEmailForm({ onSaved, onCancel }: { onSaved: (msg: string) => void; onCancel: () => void }) {
  const [state, action, isPending] = useActionState(async (_: FState, fd: FormData): Promise<FState> => {
    const body = { currentPassword: fd.get('currentPassword') as string, newEmail: (fd.get('newEmail') as string).trim() }
    const res = await apiFetch('/users/me/email', { method: 'PATCH', body: JSON.stringify(body) })
    const json = await res.json()
    if (!res.ok) return { error: json.message ?? 'Erreur.' }
    onSaved(json.message ?? 'Email modifié.'); return null
  }, null)

  return (
    <form action={action} className="border-t border-border bg-muted/20 p-4 flex flex-col gap-3">
      {state?.error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}
      <div className="grid gap-1.5"><Label htmlFor="em-new">Nouvel email *</Label><Input id="em-new" name="newEmail" type="email" required disabled={isPending} /></div>
      <div className="grid gap-1.5"><Label htmlFor="em-pw">Mot de passe actuel *</Label><Input id="em-pw" name="currentPassword" type="password" required disabled={isPending} /></div>
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isPending}>Annuler</Button>
        <Button type="submit" disabled={isPending}>{isPending ? 'Modification…' : 'Modifier'}</Button>
      </div>
    </form>
  )
}

function ChangePasswordForm({ onSaved, onCancel }: { onSaved: () => void; onCancel: () => void }) {
  const [state, action, isPending] = useActionState(async (_: FState, fd: FormData): Promise<FState> => {
    const newPw = fd.get('newPassword') as string
    const confPw = fd.get('newPasswordConfirmation') as string
    if (newPw !== confPw) return { error: 'Les mots de passe ne correspondent pas.' }
    if (newPw.length < 12) return { error: 'Minimum 12 caractères.' }
    const body = { currentPassword: fd.get('currentPassword') as string, newPassword: newPw, newPasswordConfirmation: confPw }
    const res = await apiFetch('/users/me/change-password', { method: 'PUT', body: JSON.stringify(body) })
    if (!res.ok) { const j = await res.json(); return { error: j.message ?? 'Erreur.' } }
    onSaved(); return null
  }, null)

  return (
    <form action={action} className="border-t border-border bg-muted/20 p-4 flex flex-col gap-3">
      {state?.error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}
      <div className="grid gap-1.5"><Label htmlFor="pw-cur">Mot de passe actuel *</Label><Input id="pw-cur" name="currentPassword" type="password" required disabled={isPending} /></div>
      <div className="grid gap-1.5"><Label htmlFor="pw-new">Nouveau mot de passe *</Label><Input id="pw-new" name="newPassword" type="password" required disabled={isPending} /><p className="text-xs text-muted-foreground">Min. 12 caractères, majuscule, chiffre, spécial.</p></div>
      <div className="grid gap-1.5"><Label htmlFor="pw-conf">Confirmer *</Label><Input id="pw-conf" name="newPasswordConfirmation" type="password" required disabled={isPending} /></div>
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isPending}>Annuler</Button>
        <Button type="submit" disabled={isPending}>{isPending ? 'Modification…' : 'Changer'}</Button>
      </div>
    </form>
  )
}

// ══════════════════════════════════════════════════════════
// SECTION : MES DONNÉES (RGPD)
// ══════════════════════════════════════════════════════════

function DonneesSection() {
  const { user } = useAuth()
  return (
    <>
      <SectionHeader title="Mes données (RGPD)" description="Demandez l'accès à vos données personnelles (Art. 15), leur suppression, ou suivez vos demandes en cours." />
      <PersonalDataRequestsSection isAdmin={!!user?.isAdmin} />
    </>
  )
}

// ══════════════════════════════════════════════════════════
// SECTION : PARAMÈTRES
// ══════════════════════════════════════════════════════════

function ParametresSection() {
  const { isDark, toggle: toggleDark } = useDarkMode()
  const { enabled: notifs, toggle: toggleNotifs } = useNotifications()

  return (
    <>
      <SectionHeader title="Paramètres" description="Configurez votre application" />

      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        <SettingRow icon={<Bell size={17} />} label="Notifications" description="Recevoir les alertes" right={<Toggle checked={notifs} onChange={toggleNotifs} />} />
        <SettingRow icon={<Moon size={17} />} label="Mode sombre"  description="Thème de l'application" right={<Toggle checked={isDark} onChange={toggleDark} />} />
      </div>
    </>
  )
}

function SettingRow({ icon, label, description, right }: { icon: React.ReactNode; label: string; description?: string; right: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 px-4 py-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {right}
    </div>
  )
}

// ══════════════════════════════════════════════════════════
// SECTION : ABONNEMENT
// ══════════════════════════════════════════════════════════

function AbonnementSection() {
  const { association } = useAuth()
  const [plans, setPlans] = useState<BillingPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false)
  const [showChangePlan, setShowChangePlan] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const isActive = association?.hasValidSubscription ?? false
  const isTrial  = association?.isTrial ?? false
  const isExpired = !isActive && !isTrial

  useEffect(() => {
    apiFetch('/billing/plans').then(r => r.json()).then(j => setPlans(j.data.plans ?? [])).catch(() => {}).finally(() => setIsLoading(false))
  }, [])

  function checkout(priceId: string) {
    setError(null)
    startTransition(async () => {
      const res = await apiFetch('/billing/checkout', { method: 'POST', body: JSON.stringify({
        priceId,
        successRedirect: `${window.location.origin}/dashboard?success=true`,
        cancelRedirect: window.location.origin + '/dashboard',
      })})
      const json = await res.json()
      if (!res.ok) { setError(json.message ?? 'Erreur.'); return }
      window.location.href = json.data.url
    })
  }

  function openPortal() {
    startTransition(async () => {
      const res = await apiFetch('/billing/portal')
      const json = await res.json()
      if (!res.ok) { setError(json.message ?? 'Erreur.'); return }
      window.open(json.data.url, '_blank')
    })
  }

  function cancelSub() {
    if (!confirm('Annuler votre abonnement ? Vous gardez l\'accès jusqu\'à la fin de la période en cours.')) return
    startTransition(async () => {
      const res = await apiFetch('/billing/cancel', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) { setError(json.message ?? 'Erreur.'); return }
      setCancelAtPeriodEnd(true); setSuccess(json.message)
    })
  }

  function resumeSub() {
    startTransition(async () => {
      const res = await apiFetch('/billing/resume', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) { setError(json.message ?? 'Erreur.'); return }
      setCancelAtPeriodEnd(false); setSuccess(json.message)
    })
  }

  function changePlan(newPriceId: string) {
    startTransition(async () => {
      const res = await apiFetch('/billing/change-plan', { method: 'POST', body: JSON.stringify({ newPriceId }) })
      const json = await res.json()
      if (!res.ok) { setError(json.message ?? 'Erreur.'); return }
      setShowChangePlan(false); setSuccess(json.message)
    })
  }

  return (
    <>
      <SectionHeader title="Abonnement" description="Gérez votre abonnement Sigma" />
      {success && <Feedback message={success} type="success" onClose={() => setSuccess(null)} />}
      {error   && <Feedback message={error}   type="error"   onClose={() => setError(null)} />}

      {/* Statut */}
      {isActive && !cancelAtPeriodEnd && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 mb-4">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <p className="text-sm font-medium text-primary">Abonnement actif</p>
        </div>
      )}
      {isActive && cancelAtPeriodEnd && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 mb-4">
          <div className="h-2 w-2 rounded-full bg-amber-500" />
          <p className="text-sm font-medium text-amber-700">Résiliation programmée</p>
        </div>
      )}
      {isTrial && (
        <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 mb-4">
          <Zap size={16} className="text-blue-600 shrink-0" />
          <p className="text-sm font-medium text-blue-700">Période d'essai en cours</p>
        </div>
      )}
      {isExpired && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 mb-4">
          <div className="h-2 w-2 rounded-full bg-destructive" />
          <p className="text-sm font-medium text-destructive">Accès expiré</p>
        </div>
      )}

      {/* Actions abonné actif */}
      {isActive && (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 mb-4">
          <p className="text-sm font-medium text-foreground">Actions</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={openPortal} disabled={isPending} className="flex items-center gap-2 h-8 text-xs">
              <ExternalLink size={13} /> Portail Stripe
            </Button>
            {!cancelAtPeriodEnd ? (
              <Button variant="secondary" onClick={cancelSub} disabled={isPending} className="text-destructive hover:bg-destructive/10 h-8 text-xs">Annuler</Button>
            ) : (
              <Button variant="secondary" onClick={resumeSub} disabled={isPending} className="flex items-center gap-2 h-8 text-xs">
                <RefreshCw size={13} /> Réactiver
              </Button>
            )}
            <Button variant="secondary" onClick={() => setShowChangePlan(v => !v)} disabled={isPending} className="h-8 text-xs">
              {showChangePlan ? 'Masquer les plans' : 'Changer de plan'}
            </Button>
          </div>
        </div>
      )}

      {/* Plans */}
      {(isTrial || isExpired || showChangePlan) && (
        <>
          <p className="text-sm font-medium text-foreground mb-3">
            {showChangePlan ? 'Choisir un nouveau plan' : isExpired ? 'Choisissez un plan pour rétablir votre accès' : 'Passez à un plan payant'}
          </p>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4"><Loader2 size={16} className="animate-spin" /> Chargement…</div>
          ) : plans.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun plan disponible.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {plans.map(plan => (
                <div key={plan.priceId} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-foreground">{plan.label}</p>
                    <p className="mt-0.5 text-xl font-bold text-foreground">
                      {(plan.amount / 100).toFixed(2).replace('.', ',')} €
                      <span className="ml-1 text-xs font-normal text-muted-foreground">/{plan.interval === 'month' ? 'mois' : 'an'}</span>
                    </p>
                  </div>
                  {plan.features.length > 0 && (
                    <ul className="flex flex-col gap-1">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CheckCircle2 size={12} className="text-primary shrink-0" />{f}
                        </li>
                      ))}
                    </ul>
                  )}
                  <Button onClick={() => showChangePlan ? changePlan(plan.priceId) : checkout(plan.priceId)} disabled={isPending} className="w-full mt-auto h-8 text-xs">
                    {showChangePlan ? 'Choisir' : 'Souscrire'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  )
}

// ══════════════════════════════════════════════════════════
// SECTION : FACTURES
// ══════════════════════════════════════════════════════════

const INV_STATUS: Record<Invoice['status'], { label: string; classes: string }> = {
  paid:          { label: 'Payée',        classes: 'bg-primary/10 text-primary' },
  open:          { label: 'En attente',   classes: 'bg-amber-100 text-amber-700' },
  void:          { label: 'Annulée',      classes: 'bg-muted text-muted-foreground' },
  uncollectible: { label: 'Irrécouvrable', classes: 'bg-destructive/10 text-destructive' },
}

function FacturesSection() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch('/billing/invoices').then(r => r.json()).then(j => setInvoices(j.data ?? [])).catch(() => setError('Impossible de charger les factures.')).finally(() => setIsLoading(false))
  }, [])

  return (
    <>
      <SectionHeader title="Mes factures" description="Historique des paiements" />
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4"><Loader2 size={16} className="animate-spin" /> Chargement…</div>
      ) : error ? (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"><AlertCircle size={14} /> {error}</div>
      ) : invoices.length === 0 ? (
        <EmptyState icon={<FileX size={36} strokeWidth={1.5} />} label="Aucune facture pour le moment." />
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-xl border border-border overflow-hidden">
          {invoices.map(inv => (
            <div key={inv.id} className="flex items-center gap-4 bg-card px-4 py-3 hover:bg-muted/40 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{formatDate(inv.paidAt ?? inv.createdAt)}</p>
                <p className="text-xs text-muted-foreground truncate">{inv.stripeInvoiceId}</p>
              </div>
              <p className="text-sm font-medium text-foreground shrink-0">{inv.amountPaidFormatted}</p>
              <span className={`rounded px-2 py-0.5 text-xs font-medium shrink-0 ${INV_STATUS[inv.status].classes}`}>{INV_STATUS[inv.status].label}</span>
              {inv.invoicePdf && (
                <a href={inv.invoicePdf} target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Télécharger">
                  <Download size={15} />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}

// ══════════════════════════════════════════════════════════
// SECTION : NOUVEAUTÉS
// ══════════════════════════════════════════════════════════

function NouveautesSection() {
  const [entries, setEntries] = useState<NewsEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch('/news').then(r => r.ok ? r.json() : null).then(j => setEntries(j?.data?.entries ?? j?.data ?? [])).catch(() => setError('Impossible de charger les nouveautés.')).finally(() => setIsLoading(false))
  }, [])

  const groups = entries.reduce<{ label: string; items: NewsEntry[] }[]>((acc, entry) => {
    const label = formatMonth(entry.publishedAt)
    const existing = acc.find(g => g.label === label)
    if (existing) existing.items.push(entry)
    else acc.push({ label, items: [entry] })
    return acc
  }, [])

  return (
    <>
      <SectionHeader title="Nouveautés" description="Les dernières mises à jour" />
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4"><Loader2 size={16} className="animate-spin" /> Chargement…</div>
      ) : error ? (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"><AlertCircle size={14} /> {error}</div>
      ) : entries.length === 0 ? (
        <EmptyState icon={<Newspaper size={36} strokeWidth={1.5} />} label="Aucune nouveauté pour le moment." />
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map(group => (
            <div key={group.label} className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider capitalize">{group.label}</p>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="flex flex-col gap-3">
                {group.items.map(entry => {
                  const cfg = NEWS_CFG[entry.category] ?? NEWS_CFG.feature
                  return (
                    <div key={entry.id} className="flex gap-3">
                      <div className="flex flex-col items-center pt-1 shrink-0">
                        <div className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
                        <div className="w-px flex-1 bg-border mt-2" />
                      </div>
                      <div className="flex flex-col gap-1.5 pb-4 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.classes}`}>{cfg.label}</span>
                          <span className="text-[10px] text-muted-foreground">{formatDate(entry.publishedAt)}</span>
                        </div>
                        <p className="text-sm font-semibold text-foreground">{entry.title}</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{entry.content}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

// ══════════════════════════════════════════════════════════
// SECTION : AIDE
// ══════════════════════════════════════════════════════════

function AideSection() {
  const [guides, setGuides] = useState<HelpGuide[]>([])
  const [faqs, setFaqs] = useState<HelpFaq[]>([])
  const [videos, setVideos] = useState<HelpVideo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      const [g, f, v] = await Promise.allSettled([
        apiFetch('/help/guides').then(r => r.json()),
        apiFetch('/help/faqs').then(r => r.json()),
        apiFetch('/help/videos').then(r => r.json()),
      ])
      if (g.status === 'rejected' && f.status === 'rejected' && v.status === 'rejected') {
        setError('Impossible de charger l\'aide.')
      } else {
        if (g.status === 'fulfilled') setGuides(g.value.data?.guides ?? g.value.data ?? [])
        if (f.status === 'fulfilled') setFaqs(f.value.data?.faqs ?? f.value.data ?? [])
        if (v.status === 'fulfilled') setVideos(v.value.data?.videos ?? v.value.data ?? [])
      }
      setIsLoading(false)
    })()
  }, [])

  return (
    <>
      <SectionHeader title="Aide & tutoriels" description="Guides, FAQ et vidéos" />
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4"><Loader2 size={16} className="animate-spin" /> Chargement…</div>
      ) : error ? (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"><AlertCircle size={14} /> {error}</div>
      ) : (
        <div className="flex flex-col gap-6">
          <AideBlock title="Guide de démarrage" icon={<BookOpen size={15} />}>
            {guides.length === 0 ? <p className="text-sm text-muted-foreground">Aucun guide disponible.</p> : guides.map(g => <GuideCard key={g.id} guide={g} />)}
          </AideBlock>

          <AideBlock title="Questions fréquentes" icon={<MessageCircle size={15} />}>
            {faqs.length === 0 ? <p className="text-sm text-muted-foreground">Aucune question disponible.</p> : faqs.map(f => <FaqItem key={f.id} faq={f} />)}
          </AideBlock>

          <AideBlock title="Vidéos tutoriels" icon={<Play size={15} />}>
            {videos.length === 0
              ? <p className="text-sm text-muted-foreground">Aucune vidéo disponible.</p>
              : <div className="grid gap-3 sm:grid-cols-2">{videos.map(v => <VideoCard key={v.id} video={v} />)}</div>
            }
          </AideBlock>
        </div>
      )}
    </>
  )
}

function AideBlock({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-primary">{icon}</span>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <div className="flex-1 h-px bg-border" />
      </div>
      {children}
    </div>
  )
}

function GuideCard({ guide }: { guide: HelpGuide }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/40">
        <p className="text-sm font-semibold text-foreground">{guide.title}</p>
        <ChevronDown size={14} className={`shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="border-t border-border px-4 py-3 flex flex-col gap-3">
          {guide.description && <p className="text-sm text-muted-foreground">{guide.description}</p>}
          {guide.steps?.length > 0 && (
            <div className="flex flex-col gap-2">
              {guide.steps.map((s, i) => (
                <div key={i} className="flex gap-2.5">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">{i + 1}</div>
                  <div className="min-w-0"><p className="text-sm font-medium text-foreground">{s.title}</p><p className="text-xs text-muted-foreground">{s.content}</p></div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function FaqItem({ faq }: { faq: HelpFaq }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/40">
        <p className="text-sm font-medium text-foreground">{faq.question}</p>
        <ChevronDown size={14} className={`shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="border-t border-border px-4 py-3"><p className="text-sm text-muted-foreground whitespace-pre-line">{faq.answer}</p></div>}
    </div>
  )
}

function VideoCard({ video }: { video: HelpVideo }) {
  return (
    <a href={video.url} target="_blank" rel="noopener noreferrer" className="group flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:border-primary/40 transition-all">
      <div className="relative aspect-video bg-muted flex items-center justify-center">
        {video.thumbnail ? <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" /> : <Play size={24} className="text-muted-foreground" />}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90"><Play size={14} className="text-foreground ml-0.5" /></div>
        </div>
        {video.duration && <span className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">{video.duration}</span>}
      </div>
      <div className="p-3 flex flex-col gap-0.5">
        <p className="text-sm font-medium text-foreground leading-tight">{video.title}</p>
        {video.description && <p className="text-xs text-muted-foreground line-clamp-2">{video.description}</p>}
      </div>
    </a>
  )
}

// ══════════════════════════════════════════════════════════
// SECTION : SUPPORT
// ══════════════════════════════════════════════════════════

function SupportSection() {
  return (
    <>
      <SectionHeader title="Contacter le support" description="Notre équipe est à votre écoute" />
      <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10"><Mail size={18} className="text-primary" /></div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">contact.sigma.cloud@gmail.com</p>
            <p className="text-xs text-muted-foreground mt-0.5">Réponse sous 24h ouvrées</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Une question, un bug, une suggestion ? Écrivez-nous et nous vous répondrons rapidement.
        </p>
        <a href="mailto:contact.sigma.cloud@gmail.com" className="block">
          <Button className="w-full flex items-center justify-center gap-2"><Mail size={14} /> Envoyer un e-mail</Button>
        </a>
      </div>
    </>
  )
}

// ══════════════════════════════════════════════════════════
// SECTION : DÉCONNEXION
// ══════════════════════════════════════════════════════════

function LogoutSection({ onLogout, isPending }: { onLogout: () => void; isPending: boolean }) {
  return (
    <>
      <SectionHeader title="Se déconnecter" description="Fin de votre session actuelle" />
      <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10"><LogOut size={18} className="text-destructive" /></div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Vous serez redirigé vers la page de connexion. Vos données seront conservées en toute sécurité.
          </p>
        </div>
        <Button onClick={onLogout} disabled={isPending} className="w-full bg-destructive text-white hover:bg-destructive/90 flex items-center justify-center gap-2">
          <LogOut size={14} /> {isPending ? 'Déconnexion…' : 'Se déconnecter'}
        </Button>
      </div>
    </>
  )
}

// ══════════════════════════════════════════════════════════
// MODAL PRINCIPAL
// ══════════════════════════════════════════════════════════

export function AccountModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user, association, logout } = useAuth()
  const [active, setActive] = useState<SectionId>('profil')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // RGPD self-service suppose une association (modèle account-requests scopé dessus) —
  // absente uniquement pour un compte super-admin plateforme sans association propre.
  const visibleSections = SECTIONS.filter(s =>
    (!s.adminOnly || user?.isAdmin) && (s.id !== 'donnees' || !!association)
  )
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '?'

  function handleLogout() {
    startTransition(async () => {
      await logout()
      onClose()
      window.location.href = '/login'
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-4xl h-[85vh] max-h-[760px] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col sm:flex-row">

        {/* Sidebar */}
        <aside className="sm:w-64 shrink-0 border-b sm:border-b-0 sm:border-r border-border bg-muted/30 flex flex-col">
          <div className="hidden sm:flex items-center gap-3 px-4 py-4 border-b border-border">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{initials}</div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{user ? `${user.firstName} ${user.lastName}` : '—'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>

          <nav className="flex sm:flex-col gap-0.5 p-2 sm:p-3 overflow-x-auto sm:overflow-y-auto flex-1">
            {visibleSections.map(section => {
              const isActive = active === section.id
              return (
                <button
                  key={section.id}
                  onClick={() => setActive(section.id)}
                  className={[
                    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-left transition-colors shrink-0 whitespace-nowrap sm:whitespace-normal',
                    isActive
                      ? section.danger ? 'bg-destructive/10 text-destructive font-medium' : 'bg-primary/10 text-primary font-medium'
                      : section.danger ? 'text-destructive hover:bg-destructive/10' : 'text-foreground hover:bg-accent',
                  ].join(' ')}
                >
                  <span className={isActive || section.danger ? '' : 'text-muted-foreground'}>{section.icon}</span>
                  {section.label}
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Contenu */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between px-6 py-3 border-b border-border shrink-0">
            <p className="text-sm font-medium text-muted-foreground">Mon compte</p>
            <button onClick={onClose} aria-label="Fermer" className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground">
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {active === 'profil'     && <ProfilSection />}
            {active === 'donnees'    && <DonneesSection />}
            {active === 'parametres' && <ParametresSection />}
            {active === 'abonnement' && <AbonnementSection />}
            {active === 'factures'   && <FacturesSection />}
            {active === 'nouveautes' && <NouveautesSection />}
            {active === 'aide'       && <AideSection />}
            {active === 'support'    && <SupportSection />}
            {active === 'logout'     && <LogoutSection onLogout={handleLogout} isPending={isPending} />}
          </div>
        </div>

      </div>
    </div>
  )
}
