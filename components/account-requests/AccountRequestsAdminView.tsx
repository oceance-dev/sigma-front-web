'use client'

import { apiFetch } from '@/src/lib/api-client'
import { useCallback, useEffect, useState, useTransition } from 'react'
import { Inbox, Loader2, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useDebounce } from '@/src/hooks/useDebounce'
import { formatDate, formatDateShort } from '@/src/lib/date-utils'
import {
  REQUEST_CHANGE_FIELD_LABELS,
  REQUEST_CHANGE_FIELD_ORDER,
  REQUEST_STATUS_CLASSES,
  REQUEST_STATUS_LABELS,
  REQUEST_TYPE_CLASSES,
  REQUEST_TYPE_LABELS,
  formatRequestChangeValue,
  type AccountRequestItem,
  type RequestedAccountChanges,
} from '@/src/types/account-request'

type Scope = 'admin' | 'super-admin'

// ── Vue de traitement des demandes RGPD ─────────────────────
//
// Réutilisée telle quelle par le panel super-admin (toutes associations,
// y compris transmises) et par l'onglet association d'un admin (scopé à sa
// propre association par le backend) — mêmes endpoints /admin/account-requests,
// le backend fait déjà tout le filtrage par rôle. Seules diffèrent : la
// visibilité de l'action "Transmettre" (uniquement pour un admin d'association,
// le super-admin étant déjà le dernier échelon) et le statut par défaut affiché.

export function AccountRequestsAdminView({ scope }: { scope: Scope }) {
  const [requests, setRequests] = useState<AccountRequestItem[]>([])
  const [meta, setMeta] = useState<{ total: number; lastPage: number; currentPage: number } | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState(scope === 'super-admin' ? 'escalated' : 'pending')
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
            ? scope === 'super-admin'
              ? `${meta?.total ?? 0} demande${(meta?.total ?? 0) > 1 ? 's' : ''} transmise${(meta?.total ?? 0) > 1 ? 's' : ''} par un administrateur d'association, en attente de votre décision.`
              : `${meta?.total ?? 0} demande${(meta?.total ?? 0) > 1 ? 's' : ''} transmise${(meta?.total ?? 0) > 1 ? 's' : ''} au super administrateur — lecture seule.`
            : `Suivi des demandes des membres concernant leurs données (accès, modification, suppression)${scope === 'super-admin' ? ', toutes associations confondues.' : '.'}`}
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
          <option value="pending">En attente</option>
          {scope === 'super-admin' && <option value="escalated">Transmises (super-admin)</option>}
          {scope === 'admin' && <option value="escalated">Transmises par vous (lecture seule)</option>}
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
              className={`flex items-center gap-3 bg-card px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer outline-none focus-visible:bg-muted/40 ${r.status === 'escalated' ? 'border-l-4 border-l-violet-400' : ''}`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{r.user?.fullName ?? 'Utilisateur supprimé'}</p>
                <p className="text-xs text-muted-foreground truncate">{r.user?.email ?? '—'} · {r.association?.name ?? '—'}</p>
              </div>
              <span className={`rounded px-2 py-0.5 text-xs font-medium shrink-0 ${REQUEST_TYPE_CLASSES[r.type]}`}>
                {REQUEST_TYPE_LABELS[r.type]}
              </span>
              <span className={`rounded px-2 py-0.5 text-xs font-medium shrink-0 ${REQUEST_STATUS_CLASSES[r.status]}`}>
                {REQUEST_STATUS_LABELS[r.status]}
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
          scope={scope}
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

type PendingAction = 'approve' | 'delete' | 'reject' | 'correct' | 'escalate' | null

function AccountRequestDetailModal({ scope, request, onClose, onSaved }: {
  scope: Scope
  request: AccountRequestItem
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const [panel, setPanel] = useState<'reject' | 'correct' | 'escalate' | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [escalateNote, setEscalateNote] = useState('')
  const [correction, setCorrection] = useState<RequestedAccountChanges>(() => request.requestedChanges ?? {})
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)

  // Un admin d'association n'agit plus sur une demande qu'il a transmise — elle sort de
  // sa file dès l'escalade et reste en lecture seule jusqu'à la décision du super-admin.
  // Le super-admin, lui, traite aussi bien le "pending" que l'"escalated".
  const isActionable = scope === 'super-admin'
    ? request.status === 'pending' || request.status === 'escalated'
    : request.status === 'pending'
  const presentFields = REQUEST_CHANGE_FIELD_ORDER.filter((k) => request.requestedChanges?.[k] !== undefined)

  function approve() {
    if (request.type === 'data_deletion') {
      const ok = confirm(`Approuver anonymisera définitivement les données de ${request.user?.fullName ?? 'ce membre'}. Cette action est irréversible. Continuer ?`)
      if (!ok) return
    }
    setError(null)
    setPendingAction('approve')
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
    setPendingAction('reject')
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

  function submitEscalate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setPendingAction('escalate')
    startTransition(async () => {
      const note = escalateNote.trim()
      const res = await apiFetch(`/admin/account-requests/${request.id}/escalate`, {
        method: 'PATCH',
        body: JSON.stringify(note ? { note } : {}),
      })
      const json = await res.json()
      if (res.ok) onSaved(json.message ?? 'Demande transmise au super administrateur.')
      else setError(json.message ?? 'Une erreur est survenue.')
    })
  }

  function submitCorrection(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setPendingAction('correct')
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
    setPendingAction('delete')
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
              <span className={`rounded px-2 py-0.5 text-xs font-medium ${REQUEST_TYPE_CLASSES[request.type]}`}>{REQUEST_TYPE_LABELS[request.type]}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Statut</span>
              <span className={`rounded px-2 py-0.5 text-xs font-medium ${REQUEST_STATUS_CLASSES[request.status]}`}>{REQUEST_STATUS_LABELS[request.status]}</span>
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
                  <span className="text-muted-foreground">{REQUEST_CHANGE_FIELD_LABELS[k]} demandé</span>
                  <span className="text-foreground truncate max-w-[60%]">{formatRequestChangeValue(k, request.requestedChanges![k] as string)}</span>
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
              {request.status === 'approved' && request.type === 'data_access' && (
                <p className="rounded-lg bg-primary/10 px-3 py-2 text-primary">
                  Un email contenant ses données a été envoyé à {request.user?.email ?? 'l’utilisateur'}.
                </p>
              )}
            </div>
          )}

          {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          {isActionable && panel === null && (
            <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
              <Button type="button" variant="destructive" size="sm" onClick={removeRequest} disabled={isPending}>
                {isPending && pendingAction === 'delete' ? 'Suppression…' : 'Supprimer'}
              </Button>
              {request.type === 'account_update' && (
                <Button type="button" variant="secondary" size="sm" onClick={() => setPanel('correct')} disabled={isPending}>
                  Corriger
                </Button>
              )}
              {scope === 'admin' && (
                <Button type="button" variant="secondary" size="sm" onClick={() => setPanel('escalate')} disabled={isPending}>
                  Transmettre
                </Button>
              )}
              <Button type="button" variant="secondary" size="sm" onClick={() => setPanel('reject')} disabled={isPending}>
                Rejeter
              </Button>
              <Button type="button" size="sm" onClick={approve} disabled={isPending}>
                {isPending && pendingAction === 'approve' ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 size={12} className="animate-spin" />
                    {request.type === 'data_access' ? 'Génération du rapport…' : 'Envoi…'}
                  </span>
                ) : 'Approuver'}
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
                  maxLength={500}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => { setPanel(null); setRejectReason(''); setError(null) }} disabled={isPending}>
                  Annuler
                </Button>
                <Button type="submit" variant="destructive" size="sm" disabled={isPending}>
                  {isPending && pendingAction === 'reject' ? 'Envoi…' : 'Confirmer le rejet'}
                </Button>
              </div>
            </form>
          )}

          {panel === 'escalate' && (
            <form onSubmit={submitEscalate} className="flex flex-col gap-3 border-t border-border pt-4">
              <div className="grid gap-1.5">
                <Label htmlFor="escalate-note">Note pour le super administrateur <span className="text-xs text-muted-foreground">(optionnel)</span></Label>
                <Input
                  id="escalate-note"
                  value={escalateNote}
                  onChange={(e) => setEscalateNote(e.target.value)}
                  disabled={isPending}
                  placeholder="Contexte utile pour la décision…"
                  maxLength={500}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => { setPanel(null); setEscalateNote(''); setError(null) }} disabled={isPending}>
                  Annuler
                </Button>
                <Button type="submit" size="sm" disabled={isPending}>
                  {isPending && pendingAction === 'escalate' ? 'Transmission…' : 'Transmettre au super administrateur'}
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
                  <Label htmlFor={`correct-${k}`}>{REQUEST_CHANGE_FIELD_LABELS[k]}</Label>
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
                  {isPending && pendingAction === 'correct' ? 'Enregistrement…' : 'Enregistrer la correction'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
