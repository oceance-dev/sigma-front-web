'use client'

import { apiFetch } from '@/src/lib/api-client'
import { useCallback, useEffect, useState, useTransition } from 'react'
import { Building2, CalendarPlus, Check, Loader2, Pencil, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Association, AssociationUpdateBody } from '@/src/types/association'

const STATUS_CLASSES: Record<string, string> = {
  active:    'bg-primary/10 text-primary',
  pending:   'bg-amber-100 text-amber-700',
  suspended: 'bg-destructive/10 text-destructive',
  cancelled: 'bg-muted text-muted-foreground',
}
const STATUS_LABELS: Record<string, string> = {
  active:    'Active',
  pending:   'En attente',
  suspended: 'Suspendue',
  cancelled: 'Annulée',
}

const ASSOC_TYPES = [
  { value: 'gendarmerie', label: 'Gendarmerie' },
  { value: 'sport',       label: 'Sportive' },
  { value: 'culturelle',  label: 'Culturelle' },
  { value: 'generale',    label: 'Générale' },
]

export default function SuperAdminAssociationsPage() {
  const [associations, setAssociations] = useState<Association[]>([])
  const [meta, setMeta] = useState<{ total: number; lastPage: number; currentPage: number } | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [detailTarget, setDetailTarget] = useState<Association | null>(null)
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [isPending, startTransition] = useTransition()

  const load = useCallback(async (p: number, q: string) => {
    setIsLoading(true)
    const params = new URLSearchParams({ page: String(p), limit: '15' })
    if (q) params.set('search', q)
    const res = await apiFetch(`/super-admin/associations?${params}`)
    if (res.ok) {
      const json = await res.json()
      setAssociations(json.data.associations ?? [])
      setMeta(json.data.meta ?? null)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => { load(page, search) }, [load, page, search])

  function action(id: string, type: 'approve' | 'reject') {
    if (type === 'reject' && !confirm('Rejeter cette association ?')) return
    startTransition(async () => {
      const res = await apiFetch(`/super-admin/associations/${id}/${type}`, { method: 'POST' })
      const json = await res.json()
      if (res.ok) { setFeedback({ message: json.message, type: 'success' }); load(page, search) }
      else setFeedback({ message: json.message ?? 'Erreur.', type: 'error' })
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Associations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gestion de toutes les associations de la plateforme</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="flex items-center gap-2 h-9 px-4 text-sm">
          <Building2 size={15} /> Nouvelle association
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Rechercher une association…"
          className="h-9 flex-1 max-w-sm rounded-md border border-input bg-transparent px-3 text-sm placeholder:text-muted-foreground outline-none focus-visible:border-ring"
        />
        {meta && <p className="text-sm text-muted-foreground">{meta.total} association{meta.total > 1 ? 's' : ''}</p>}
      </div>

      {feedback && (
        <div className={`flex items-center justify-between rounded-lg px-4 py-2 text-sm ${feedback.type === 'success' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
          {feedback.message}
          <button onClick={() => setFeedback(null)}><X size={13} /></button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      ) : associations.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-center text-muted-foreground">
          <Building2 size={32} className="opacity-30" />
          <p className="text-sm">Aucune association trouvée.</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-xl border border-border overflow-hidden">
          {associations.map((assoc) => (
            <div
              key={assoc.id}
              role="button"
              tabIndex={0}
              onClick={() => setDetailTarget(assoc)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDetailTarget(assoc) } }}
              className="flex items-center gap-4 bg-card px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer outline-none focus-visible:bg-muted/40"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Building2 size={16} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{assoc.name}</p>
                <p className="text-xs text-muted-foreground">{assoc.city} · {assoc.email ?? '—'}</p>
              </div>
              <span className={`rounded px-2 py-0.5 text-xs font-medium shrink-0 ${STATUS_CLASSES[assoc.status] ?? 'bg-muted text-muted-foreground'}`}>
                {STATUS_LABELS[assoc.status] ?? assoc.status}
              </span>
              {assoc.status === 'pending' && (
                <div className="flex gap-1 shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); action(assoc.id, 'approve') }} disabled={isPending}
                    className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-40" title="Approuver">
                    <Check size={14} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); action(assoc.id, 'reject') }} disabled={isPending}
                    className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-40" title="Rejeter">
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {meta && meta.lastPage > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>Page {page} sur {meta.lastPage}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1 || isLoading}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-accent disabled:opacity-40">‹</button>
            <span className="text-xs">{page} / {meta.lastPage}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page === meta.lastPage || isLoading}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-accent disabled:opacity-40">›</button>
          </div>
        </div>
      )}

      {showCreate && (
        <CreateAssociationModal
          onClose={() => setShowCreate(false)}
          onSaved={(msg) => { setShowCreate(false); setFeedback({ message: msg, type: 'success' }); load(page, search) }}
        />
      )}

      {detailTarget && (
        <AssociationDetailModal
          association={detailTarget}
          onClose={() => setDetailTarget(null)}
          onSaved={(msg) => { setDetailTarget(null); setFeedback({ message: msg, type: 'success' }); load(page, search) }}
        />
      )}
    </div>
  )
}

function CreateAssociationModal({ onClose, onSaved }: {
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const [assocType,   setAssocType]   = useState('gendarmerie')
  const [error,       setError]       = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isPending,   startTransition] = useTransition()

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    const fd = new FormData(e.currentTarget)
    const get = (k: string) => (fd.get(k) as string ?? '').trim()

    startTransition(async () => {
      const body = {
        association: {
          name:       get('assoc_name'),
          type:       assocType,
          email:      get('assoc_email') || null,
          city:       get('city'),
          postalCode: get('postalCode'),
          country:    get('country') || 'France',
        },
        responsable: {
          firstName:            get('firstName'),
          lastName:             get('lastName'),
          email:                get('resp_email'),
          phone:                get('resp_phone'),
          password:             get('password'),
          passwordConfirmation: get('passwordConfirmation'),
        },
      }

      const res  = await apiFetch('/super-admin/associations', { method: 'POST', body: JSON.stringify(body) })
      const json = await res.json()

      if (res.ok) { onSaved(json.message ?? 'Association créée avec succès.'); return }

      if (res.status === 422 && Array.isArray(json.errors)) {
        const MAP: Record<string, string> = {
          'association.name':       'assoc_name',
          'association.email':      'assoc_email',
          'association.city':       'city',
          'association.postalCode': 'postalCode',
          'responsable.firstName':  'firstName',
          'responsable.lastName':   'lastName',
          'responsable.email':      'resp_email',
          'responsable.phone':      'resp_phone',
          'responsable.password':   'password',
        }
        const errs: Record<string, string> = {}
        for (const err of json.errors) errs[MAP[err.field] ?? err.field] = err.message
        setFieldErrors(errs)
      } else {
        setError(json.message ?? 'Une erreur est survenue.')
      }
    })
  }

  function fieldErr(key: string) {
    return fieldErrors[key] ? <p className="text-xs text-destructive mt-0.5">{fieldErrors[key]}</p> : null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
          <h2 className="text-sm font-medium text-foreground">Nouvelle association</h2>
          <button onClick={onClose} className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent">
            <X size={14} />
          </button>
        </div>

        <form id="create-assoc-form" onSubmit={submit} className="overflow-y-auto flex flex-col gap-5 p-4">
          {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Association</p>
            <div className="grid gap-1.5">
              <Label htmlFor="ca-name">Nom *</Label>
              <Input id="ca-name" name="assoc_name" required disabled={isPending} placeholder="Cadets de la Somme" aria-invalid={!!fieldErrors.assoc_name} />
              {fieldErr('assoc_name')}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ca-type">Type *</Label>
              <select id="ca-type" value={assocType} onChange={(e) => setAssocType(e.target.value)} disabled={isPending}
                className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring">
                {ASSOC_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ca-email">Email <span className="ml-1 text-xs text-muted-foreground">(optionnel)</span></Label>
              <Input id="ca-email" name="assoc_email" type="email" disabled={isPending} placeholder="contact@asso.fr" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="ca-cp">Code postal *</Label>
                <Input id="ca-cp" name="postalCode" inputMode="numeric" required disabled={isPending} placeholder="80000" maxLength={5} />
                {fieldErr('postalCode')}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="ca-city">Ville *</Label>
                <Input id="ca-city" name="city" required disabled={isPending} placeholder="Amiens" />
                {fieldErr('city')}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="ca-country">Pays *</Label>
                <Input id="ca-country" name="country" defaultValue="France" required disabled={isPending} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Compte administrateur</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="ca-fn">Prénom *</Label>
                <Input id="ca-fn" name="firstName" required disabled={isPending} placeholder="Jean" />
                {fieldErr('firstName')}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="ca-ln">Nom *</Label>
                <Input id="ca-ln" name="lastName" required disabled={isPending} placeholder="Dupont" />
                {fieldErr('lastName')}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="ca-remail">Email *</Label>
                <Input id="ca-remail" name="resp_email" type="email" required disabled={isPending} placeholder="jean.dupont@mail.com" />
                {fieldErr('resp_email')}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="ca-rphone">Téléphone *</Label>
                <Input id="ca-rphone" name="resp_phone" type="tel" required disabled={isPending} placeholder="0612345678" maxLength={10} />
                {fieldErr('resp_phone')}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="ca-pw">Mot de passe *</Label>
                <Input id="ca-pw" name="password" type="password" required disabled={isPending} autoComplete="new-password" />
                {fieldErr('password')}
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="ca-pwc">Confirmation *</Label>
                <Input id="ca-pwc" name="passwordConfirmation" type="password" required disabled={isPending} autoComplete="new-password" />
              </div>
            </div>
          </div>
        </form>

        <div className="flex justify-end gap-2 border-t border-border p-4 shrink-0">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>Annuler</Button>
          <Button type="submit" form="create-assoc-form" disabled={isPending}>
            {isPending ? 'Création…' : 'Créer l\'association'}
          </Button>
        </div>
      </div>
    </div>
  )
}

const MIN_TRIAL_DAYS = 1
const MAX_TRIAL_DAYS = 365
const POSTAL_CODE_RE = /^\d{5}$/

function associationToUpdateBody(association: Association): AssociationUpdateBody {
  return {
    email:      association.email ?? '',
    phone:      association.phone ?? '',
    address:    association.address ?? '',
    city:       association.city ?? '',
    postalCode: association.postalCode ?? '',
    country:    association.country ?? '',
  }
}

function AssociationDetailModal({ association, onClose, onSaved }: {
  association: Association
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const [days, setDays] = useState(14)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [isEditing, setIsEditing] = useState(false)
  const [formState, setFormState] = useState<AssociationUpdateBody>(() => associationToUpdateBody(association))
  const [infoError, setInfoError] = useState<string | null>(null)
  const [isSavingInfo, startInfoTransition] = useTransition()

  const [deleteStep, setDeleteStep] = useState<'idle' | 'requesting' | 'confirming'>('idle')
  const [deleteCode, setDeleteCode] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeletePending, startDeleteTransition] = useTransition()

  // Le clamp n'est qu'un confort UI : le back reste l'autorité sur les bornes.
  const clampedDays = Math.min(MAX_TRIAL_DAYS, Math.max(MIN_TRIAL_DAYS, Math.trunc(days) || MIN_TRIAL_DAYS))

  function extendTrial(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await apiFetch(`/super-admin/associations/${association.id}/extend-trial`, {
        method: 'PATCH',
        body: JSON.stringify({ days: clampedDays }),
      })
      const json = await res.json()
      if (res.ok) { onSaved(json.message ?? `Essai prolongé de ${clampedDays} jour${clampedDays > 1 ? 's' : ''}.`) }
      else setError(json.message ?? 'Une erreur est survenue.')
    })
  }

  function updateFormField<K extends keyof AssociationUpdateBody>(key: K, value: string) {
    setFormState((prev) => ({ ...prev, [key]: value }))
  }

  function cancelEdit() {
    setIsEditing(false)
    setInfoError(null)
    setFormState(associationToUpdateBody(association))
  }

  function saveInfo(e: React.FormEvent) {
    e.preventDefault()
    setInfoError(null)
    if (formState.postalCode && !POSTAL_CODE_RE.test(formState.postalCode)) {
      setInfoError('Le code postal doit contenir 5 chiffres.')
      return
    }
    startInfoTransition(async () => {
      const res = await apiFetch(`/super-admin/associations/${association.id}`, {
        method: 'PATCH',
        body: JSON.stringify(formState),
      })
      const json = await res.json()
      if (res.ok) { onSaved(json.message ?? 'Association mise à jour avec succès.') }
      else setInfoError(json.message ?? 'Une erreur est survenue.')
    })
  }

  function requestDeletion() {
    setDeleteError(null)
    startDeleteTransition(async () => {
      const res = await apiFetch(`/super-admin/associations/${association.id}/deletion-code`, { method: 'POST' })
      const json = await res.json()
      if (res.ok) { setDeleteStep('confirming') }
      else setDeleteError(json.message ?? 'Impossible d’envoyer le code.')
    })
  }

  function confirmDeletion() {
    setDeleteError(null)
    startDeleteTransition(async () => {
      const res = await apiFetch(`/super-admin/associations/${association.id}`, {
        method: 'DELETE',
        body: JSON.stringify({ code: deleteCode }),
      })
      const json = await res.json()
      if (res.ok) { onSaved(json.message ?? 'Association supprimée avec succès.') }
      else setDeleteError(json.message ?? 'Une erreur est survenue.')
    })
  }

  function cancelDeletion() {
    setDeleteStep('idle')
    setDeleteCode('')
    setDeleteError(null)
  }

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-medium text-foreground truncate">{association.name}</h2>
          <button onClick={onClose} className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent shrink-0">
            <X size={14} />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Statut</span>
              <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[association.status] ?? 'bg-muted text-muted-foreground'}`}>
                {STATUS_LABELS[association.status] ?? association.status}
              </span>
            </div>

            {!isEditing && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Ville</span>
                  <span className="text-foreground">{association.city || '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="text-foreground truncate max-w-[60%]">{association.email ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Téléphone</span>
                  <span className="text-foreground">{association.phone ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Adresse</span>
                  <span className="text-foreground truncate max-w-[60%]">{association.address || '—'}</span>
                </div>
              </>
            )}

            {isEditing && (
              <form id="edit-info-form" onSubmit={saveInfo} className="flex flex-col gap-3 py-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formState.email}
                    onChange={(e) => updateFormField('email', e.target.value)}
                    disabled={isSavingInfo}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="edit-phone">Téléphone</Label>
                  <Input
                    id="edit-phone"
                    type="tel"
                    value={formState.phone}
                    onChange={(e) => updateFormField('phone', e.target.value)}
                    disabled={isSavingInfo}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="edit-address">Adresse</Label>
                  <Input
                    id="edit-address"
                    value={formState.address}
                    onChange={(e) => updateFormField('address', e.target.value)}
                    disabled={isSavingInfo}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="edit-cp">Code postal</Label>
                    <Input
                      id="edit-cp"
                      inputMode="numeric"
                      maxLength={5}
                      value={formState.postalCode}
                      onChange={(e) => updateFormField('postalCode', e.target.value)}
                      disabled={isSavingInfo}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="edit-city">Ville</Label>
                    <Input
                      id="edit-city"
                      value={formState.city}
                      onChange={(e) => updateFormField('city', e.target.value)}
                      disabled={isSavingInfo}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="edit-country">Pays</Label>
                    <Input
                      id="edit-country"
                      value={formState.country}
                      onChange={(e) => updateFormField('country', e.target.value)}
                      disabled={isSavingInfo}
                    />
                  </div>
                </div>
                {infoError && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{infoError}</p>}
                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="secondary" size="sm" onClick={cancelEdit} disabled={isSavingInfo}>
                    Annuler
                  </Button>
                  <Button type="submit" size="sm" disabled={isSavingInfo}>
                    {isSavingInfo ? 'Enregistrement…' : 'Enregistrer'}
                  </Button>
                </div>
              </form>
            )}

            {!isEditing && (
              <div className="flex justify-end pt-1">
                <Button type="button" variant="ghost" size="xs" onClick={() => setIsEditing(true)}>
                  <Pencil size={12} /> Modifier
                </Button>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Période d'essai</span>
              <span className="text-foreground">
                {association.isTrial && association.trialEndsAt
                  ? `Jusqu'au ${new Date(association.trialEndsAt).toLocaleDateString('fr-FR')}`
                  : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Administrateur</span>
              <span className="text-foreground truncate max-w-[60%]">
                {association.admin ? `${association.admin.fullName} (${association.admin.email})` : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Nombre d&apos;utilisateurs</span>
              <span className="text-foreground">{association.userCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Paiement</span>
              <span className={`rounded px-2 py-0.5 text-xs font-medium ${association.hasActivePayment ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                {association.hasActivePayment ? 'Actif' : 'Inactif'}
              </span>
            </div>
            {association.siret && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">SIRET</span>
                <span className="text-foreground">{association.siret}</span>
              </div>
            )}
            {association.rna && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">RNA</span>
                <span className="text-foreground">{association.rna}</span>
              </div>
            )}
          </div>

          <form onSubmit={extendTrial} className="flex flex-col gap-3 border-t border-border pt-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <CalendarPlus size={15} className="text-primary" /> Prolonger la période d'essai
            </div>
            {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            <div className="flex items-end gap-2">
              <div className="flex flex-col gap-1.5 flex-1">
                <Label htmlFor="trial-days">Jours supplémentaires</Label>
                <Input
                  id="trial-days"
                  type="number"
                  min={MIN_TRIAL_DAYS}
                  max={MAX_TRIAL_DAYS}
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  disabled={isPending}
                />
              </div>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Envoi…' : `Ajouter ${clampedDays} j`}
              </Button>
            </div>
          </form>

          {!isEditing && (
            <div className="flex flex-col gap-2 border-t border-destructive/20 pt-4">
              <p className="text-xs font-semibold text-destructive uppercase tracking-wider">Zone dangereuse</p>
              {deleteStep === 'idle' && deleteError && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{deleteError}</p>
              )}
              <Button type="button" variant="destructive" onClick={requestDeletion} disabled={isDeletePending}>
                <Trash2 size={14} /> {isDeletePending ? 'Envoi du code…' : 'Supprimer l’association'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>

    {deleteStep === 'confirming' && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
        onClick={(e) => { if (e.target === e.currentTarget) cancelDeletion() }}>
        <div className="w-full max-w-sm rounded-xl border border-border bg-card shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-medium text-foreground">Confirmer la suppression</h2>
            <button onClick={cancelDeletion} className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent shrink-0">
              <X size={14} />
            </button>
          </div>

          <div className="flex flex-col gap-4 p-4">
            <p className="text-sm text-muted-foreground">
              Vous êtes sur le point de supprimer définitivement{' '}
              <span className="font-medium text-foreground">{association.name}</span>.
              {association.userCount > 0 && (
                <> {association.userCount} utilisateur{association.userCount > 1 ? 's' : ''} {association.userCount > 1 ? 'seront désactivés' : 'sera désactivé'}.</>
              )}{' '}
              Cette action est irréversible.
            </p>

            <div className="grid gap-1.5">
              <Label htmlFor="delete-code">Code reçu par email</Label>
              <Input
                id="delete-code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                autoComplete="one-time-code"
                autoFocus
                placeholder="123456"
                value={deleteCode}
                onChange={(e) => setDeleteCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                disabled={isDeletePending}
                className="text-center text-lg tracking-[0.4em]"
              />
            </div>

            {deleteError && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{deleteError}</p>
            )}

            <button
              type="button"
              onClick={requestDeletion}
              disabled={isDeletePending}
              className="self-start text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline disabled:opacity-50"
            >
              Renvoyer le code
            </button>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={cancelDeletion} disabled={isDeletePending}>
                Annuler
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={confirmDeletion}
                disabled={isDeletePending || deleteCode.length !== 6}
              >
                {isDeletePending ? 'Suppression…' : 'Confirmer la suppression'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
