'use client'

import { apiFetch } from '@/src/lib/api-client'
import { useCallback, useEffect, useState, useTransition } from 'react'
import { Inbox, Loader2, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useDebounce } from '@/src/hooks/useDebounce'
import { formatDate, formatDateShort } from '@/src/lib/date-utils'

// ── Types ──────────────────────────────────────────────────

type RequestType = 'account_update' | 'data_access' | 'data_deletion'
type RequestStatus = 'pending' | 'escalated' | 'approved' | 'rejected'

interface RequestedAccountChanges {
  firstname?: string
  lastname?: string
  dateOfBirth?: string
  email?: string
  phone?: string
  city_code?: string
  sexe?: 'Homme' | 'Femme'
}

interface AccountRequestItem {
  id: string
  userId: string
  associationId: string
  type: RequestType
  requestedChanges: RequestedAccountChanges | null
  hasPasswordChange: boolean
  reason: string | null
  status: RequestStatus
  validatedBy: string | null
  validatedAt: string | null
  rejectionReason: string | null
  escalatedBy: string | null
  escalatedAt: string | null
  escalationNote: string | null
  createdAt: string
  updatedAt: string
  user: { id: string; fullName: string; email: string } | null
  association: { id: string; name: string } | null
}

const TYPE_LABELS: Record<RequestType, string> = {
  account_update: 'Modification de compte',
  data_access: 'Accès aux données',
  data_deletion: 'Suppression des données',
}
const TYPE_CLASSES: Record<RequestType, string> = {
  account_update: 'bg-blue-100 text-blue-700',
  data_access: 'bg-muted text-muted-foreground',
  data_deletion: 'bg-destructive/10 text-destructive',
}

const STATUS_LABELS: Record<RequestStatus, string> = {
  pending: 'En attente',
  escalated: 'Transmise',
  approved: 'Approuvée',
  rejected: 'Rejetée',
}
const STATUS_CLASSES: Record<RequestStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  escalated: 'bg-violet-100 text-violet-700',
  approved: 'bg-primary/10 text-primary',
  rejected: 'bg-destructive/10 text-destructive',
}

const CHANGE_FIELD_ORDER: (keyof RequestedAccountChanges)[] = [
  'firstname', 'lastname', 'dateOfBirth', 'email', 'phone', 'city_code', 'sexe',
]
const CHANGE_FIELD_LABELS: Record<keyof RequestedAccountChanges, string> = {
  firstname: 'Prénom',
  lastname: 'Nom',
  dateOfBirth: 'Date de naissance',
  email: 'Email',
  phone: 'Téléphone',
  city_code: 'Code postal',
  sexe: 'Sexe',
}

function formatChangeValue(key: keyof RequestedAccountChanges, value: string) {
  return key === 'dateOfBirth' ? new Date(value).toLocaleDateString('fr-FR') : value
}

// ── Page ───────────────────────────────────────────────────

export default function SuperAdminAccountRequestsPage() {
  const [requests, setRequests] = useState<AccountRequestItem[]>([])
  const [meta, setMeta] = useState<{ total: number; lastPage: number; currentPage: number } | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('escalated')
  const [type, setType] = useState('')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [detailTarget, setDetailTarget] = useState<AccountRequestItem | null>(null)
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const debouncedSearch = useDebounce(search)

  const load = useCallback(async (p: number, q: string, st: string, ty: string) => {
    setIsLoading(true)
    const params = new URLSearchParams({ page: String(p), limit: '15' })
    if (q) params.set('search', q)
    if (st) params.set('status', st)
    if (ty) params.set('type', ty)
    const res = await apiFetch(`/admin/account-requests?${params}`)
    if (res.ok) {
      const json = await res.json()
      setRequests(json.data.requests ?? [])
      setMeta(json.data.meta ?? null)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => { load(page, debouncedSearch, status, type) }, [load, page, debouncedSearch, status, type])

  function handleSearch(v: string) { setSearch(v); setPage(1) }
  function handleStatus(v: string) { setStatus(v); setPage(1) }
  function handleType(v: string) { setType(v); setPage(1) }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Demandes RGPD</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {status === 'escalated'
            ? `${meta?.total ?? 0} demande${(meta?.total ?? 0) > 1 ? 's' : ''} transmise${(meta?.total ?? 0) > 1 ? 's' : ''} par un administrateur d'association, en attente de votre décision.`
            : "Suivi des demandes des membres concernant leurs données (accès, modification, suppression), toutes associations confondues."}
        </p>
      </div>

      {feedback && (
        <div className={`flex items-center justify-between rounded-lg px-4 py-2 text-sm ${feedback.type === 'success' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
          {feedback.message}
          <button onClick={() => setFeedback(null)}><X size={13} /></button>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un membre (nom, email)…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={status}
          onChange={(e) => handleStatus(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">Tous statuts</option>
          <option value="escalated">Transmises (super-admin)</option>
          <option value="pending">En attente</option>
          <option value="approved">Approuvées</option>
          <option value="rejected">Rejetées</option>
        </select>
        <select
          value={type}
          onChange={(e) => handleType(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">Tous types</option>
          <option value="account_update">Modification de compte</option>
          <option value="data_access">Accès aux données</option>
          <option value="data_deletion">Suppression des données</option>
        </select>
        {meta && <p className="self-center text-sm text-muted-foreground">{meta.total} demande{meta.total > 1 ? 's' : ''}</p>}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-center text-muted-foreground">
          <Inbox size={32} className="opacity-30" />
          <p className="text-sm">Aucune demande trouvée.</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-xl border border-border overflow-hidden">
          {requests.map((r) => (
            <div
              key={r.id}
              role="button"
              tabIndex={0}
              onClick={() => setDetailTarget(r)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDetailTarget(r) } }}
              className="flex items-center gap-3 bg-card px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer outline-none focus-visible:bg-muted/40"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{r.user?.fullName ?? 'Utilisateur supprimé'}</p>
                <p className="text-xs text-muted-foreground truncate">{r.user?.email ?? '—'} · {r.association?.name ?? '—'}</p>
              </div>
              <span className={`rounded px-2 py-0.5 text-xs font-medium shrink-0 ${TYPE_CLASSES[r.type]}`}>
                {TYPE_LABELS[r.type]}
              </span>
              <span className={`rounded px-2 py-0.5 text-xs font-medium shrink-0 ${STATUS_CLASSES[r.status]}`}>
                {STATUS_LABELS[r.status]}
              </span>
              <span className="hidden sm:block text-xs text-muted-foreground shrink-0 w-20 text-right">
                {formatDateShort(r.createdAt)}
              </span>
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

      {detailTarget && (
        <AccountRequestDetailModal
          request={detailTarget}
          onClose={() => setDetailTarget(null)}
          onSaved={(msg) => {
            setDetailTarget(null)
            setFeedback({ message: msg, type: 'success' })
            load(page, debouncedSearch, status, type)
          }}
        />
      )}
    </div>
  )
}

// ── AccountRequestDetailModal ────────────────────────────────

function AccountRequestDetailModal({ request, onClose, onSaved }: {
  request: AccountRequestItem
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const [panel, setPanel] = useState<'reject' | 'correct' | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [correction, setCorrection] = useState<RequestedAccountChanges>(() => request.requestedChanges ?? {})
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const isActionable = request.status === 'pending' || request.status === 'escalated'
  const presentFields = CHANGE_FIELD_ORDER.filter((k) => request.requestedChanges?.[k] !== undefined)

  function approve() {
    if (request.type === 'data_deletion') {
      const ok = confirm(`Approuver anonymisera définitivement les données de ${request.user?.fullName ?? 'ce membre'}. Cette action est irréversible. Continuer ?`)
      if (!ok) return
    }
    setError(null)
    startTransition(async () => {
      const res = await apiFetch(`/admin/account-requests/${request.id}/approve`, { method: 'PATCH' })
      const json = await res.json()
      if (res.ok) onSaved(json.message ?? 'Demande approuvée.')
      else setError(json.message ?? 'Une erreur est survenue.')
    })
  }

  function submitReject(e: React.FormEvent) {
    e.preventDefault()
    if (rejectReason.trim().length < 5) { setError('Le motif doit contenir au moins 5 caractères.'); return }
    setError(null)
    startTransition(async () => {
      const res = await apiFetch(`/admin/account-requests/${request.id}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ reason: rejectReason.trim() }),
      })
      const json = await res.json()
      if (res.ok) onSaved(json.message ?? 'Demande rejetée.')
      else setError(json.message ?? 'Une erreur est survenue.')
    })
  }

  function submitCorrection(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await apiFetch(`/admin/account-requests/${request.id}`, {
        method: 'PUT',
        body: JSON.stringify(correction),
      })
      const json = await res.json()
      if (res.ok) onSaved(json.message ?? 'Demande mise à jour.')
      else setError(json.message ?? 'Une erreur est survenue.')
    })
  }

  function removeRequest() {
    if (!confirm('Supprimer définitivement cette demande ?')) return
    setError(null)
    startTransition(async () => {
      const res = await apiFetch(`/admin/account-requests/${request.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (res.ok) onSaved(json.message ?? 'Demande supprimée.')
      else setError(json.message ?? 'Une erreur est survenue.')
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
          <h2 className="text-sm font-medium text-foreground truncate">{request.user?.fullName ?? 'Utilisateur supprimé'}</h2>
          <button onClick={onClose} className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent shrink-0">
            <X size={14} />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-4 overflow-y-auto">
          <div className="flex flex-col gap-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="text-foreground truncate max-w-[60%]">{request.user?.email ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Association</span>
              <span className="text-foreground truncate max-w-[60%]">{request.association?.name ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Type</span>
              <span className={`rounded px-2 py-0.5 text-xs font-medium ${TYPE_CLASSES[request.type]}`}>{TYPE_LABELS[request.type]}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Statut</span>
              <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[request.status]}`}>{STATUS_LABELS[request.status]}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Envoyée le</span>
              <span className="text-foreground">{formatDate(request.createdAt)}</span>
            </div>
          </div>

          {request.type === 'account_update' && (
            <div className="flex flex-col gap-1 border-t border-border pt-3 text-sm">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Modifications demandées</p>
              {presentFields.map((k) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{CHANGE_FIELD_LABELS[k]} demandé</span>
                  <span className="text-foreground truncate max-w-[60%]">{formatChangeValue(k, request.requestedChanges![k] as string)}</span>
                </div>
              ))}
              {request.hasPasswordChange && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Mot de passe</span>
                  <span className="text-foreground">changement demandé (valeur non visible)</span>
                </div>
              )}
              {presentFields.length === 0 && !request.hasPasswordChange && (
                <p className="text-sm text-muted-foreground">Aucune modification renseignée.</p>
              )}
            </div>
          )}

          {(request.type === 'data_access' || request.type === 'data_deletion') && (
            <div className="flex flex-col gap-1 border-t border-border pt-3 text-sm">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Motif</p>
              <p className="text-foreground">{request.reason ?? '—'}</p>
            </div>
          )}

          {request.status === 'escalated' && (
            <div className="flex flex-col gap-1 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm">
              <p className="text-xs font-semibold text-violet-700 uppercase tracking-wider">Transmise au super-admin</p>
              {request.escalationNote && <p className="text-foreground">{request.escalationNote}</p>}
              <p className="text-xs text-muted-foreground">
                Par l&apos;administrateur {request.escalatedBy ?? '—'}
                {request.escalatedAt ? ` · le ${formatDate(request.escalatedAt)}` : ''}
              </p>
            </div>
          )}

          {(request.status === 'approved' || request.status === 'rejected') && (
            <div className="flex flex-col gap-1 border-t border-border pt-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Traitée le</span>
                <span className="text-foreground">{formatDate(request.validatedAt)}</span>
              </div>
              {request.status === 'rejected' && request.rejectionReason && (
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">Motif du rejet</span>
                  <span className="text-foreground">{request.rejectionReason}</span>
                </div>
              )}
            </div>
          )}

          {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          {isActionable && panel === null && (
            <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
              <Button type="button" variant="destructive" size="sm" onClick={removeRequest} disabled={isPending}>
                Supprimer
              </Button>
              {request.type === 'account_update' && (
                <Button type="button" variant="secondary" size="sm" onClick={() => setPanel('correct')} disabled={isPending}>
                  Corriger
                </Button>
              )}
              <Button type="button" variant="secondary" size="sm" onClick={() => setPanel('reject')} disabled={isPending}>
                Rejeter
              </Button>
              <Button type="button" size="sm" onClick={approve} disabled={isPending}>
                {isPending ? 'Envoi…' : 'Approuver'}
              </Button>
            </div>
          )}

          {panel === 'reject' && (
            <form onSubmit={submitReject} className="flex flex-col gap-3 border-t border-border pt-4">
              <div className="grid gap-1.5">
                <Label htmlFor="reject-reason">Motif du rejet *</Label>
                <Input
                  id="reject-reason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  disabled={isPending}
                  placeholder="Minimum 5 caractères"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => { setPanel(null); setRejectReason(''); setError(null) }} disabled={isPending}>
                  Annuler
                </Button>
                <Button type="submit" variant="destructive" size="sm" disabled={isPending}>
                  {isPending ? 'Envoi…' : 'Confirmer le rejet'}
                </Button>
              </div>
            </form>
          )}

          {panel === 'correct' && (
            <form onSubmit={submitCorrection} className="flex flex-col gap-3 border-t border-border pt-4">
              {presentFields.length === 0 && (
                <p className="text-sm text-muted-foreground">Aucun champ à corriger.</p>
              )}
              {presentFields.map((k) => (
                <div key={k} className="grid gap-1.5">
                  <Label htmlFor={`correct-${k}`}>{CHANGE_FIELD_LABELS[k]}</Label>
                  {k === 'sexe' ? (
                    <select
                      id={`correct-${k}`}
                      value={correction.sexe ?? ''}
                      onChange={(e) => setCorrection((c) => ({ ...c, sexe: e.target.value as 'Homme' | 'Femme' }))}
                      disabled={isPending}
                      className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring"
                    >
                      <option value="Homme">Homme</option>
                      <option value="Femme">Femme</option>
                    </select>
                  ) : k === 'dateOfBirth' ? (
                    <Input
                      id={`correct-${k}`}
                      type="date"
                      value={correction.dateOfBirth?.slice(0, 10) ?? ''}
                      onChange={(e) => setCorrection((c) => ({ ...c, dateOfBirth: e.target.value }))}
                      disabled={isPending}
                    />
                  ) : (
                    <Input
                      id={`correct-${k}`}
                      value={(correction[k] as string) ?? ''}
                      onChange={(e) => setCorrection((c) => ({ ...c, [k]: e.target.value }))}
                      disabled={isPending}
                    />
                  )}
                </div>
              ))}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => { setPanel(null); setError(null) }} disabled={isPending}>
                  Annuler
                </Button>
                <Button type="submit" size="sm" disabled={isPending || presentFields.length === 0}>
                  {isPending ? 'Enregistrement…' : 'Enregistrer la correction'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
