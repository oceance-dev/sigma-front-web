'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  FileText,
  Loader2,
  Mail,
  Search,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiFetch } from '@/src/lib/api-client'
import type { Document } from '@/src/types/document'
import { useDebounce } from '@/src/hooks/useDebounce'
import { ActionBtn } from './_shared'
import DocumentViewerModal from '@/components/DocumentViewerModal'

// ── Types ──────────────────────────────────────────────────

type CandidatStatut = 'notStarted' | 'pending' | 'submitted' | 'appointment' | 'validated' | 'approved' | 'rejected' | 'dismiss'

interface Candidature {
  id: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  dateOfBirth: string | null
  phone: string | null
  city_code: string
  sexe: 'Homme' | 'Femme' | null
  role: { id: number; name: string; level: number } | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  candidat: {
    statut: CandidatStatut
    isCompleted: boolean
    campaignId: number | null
    requestDate: string | null
    completion: { total: number; completed: number; percentage: number; isComplete: boolean }
  }
}

interface CandidatureDetail {
  user: Record<string, unknown>
  candidat: {
    id: number
    userId: string
    statut: CandidatStatut
    isCompleted: boolean
    infoParent: {
      email_parent: string
      phone_parent: string | null
      firstname_parent: string | null
      lastname_parent: string | null
    } | null
    rejectionReason: string | null
    requestDate: string | null
    validatedAt: string | null
    campaignId: number | null
    createdAt: string
  }
  documents: Document[]
}

const STATUT_CONFIG: Record<CandidatStatut, { label: string; classes: string }> = {
  notStarted:  { label: 'Non commencé', classes: 'bg-muted text-muted-foreground' },
  pending:     { label: 'En attente',   classes: 'bg-amber-100 text-amber-700' },
  submitted:   { label: 'Soumis',       classes: 'bg-blue-100 text-blue-700' },
  appointment: { label: 'RDV planifié', classes: 'bg-purple-100 text-purple-700' },
  validated:   { label: 'Validé',       classes: 'bg-emerald-100 text-emerald-700' },
  approved:    { label: 'Approuvé',     classes: 'bg-primary/10 text-primary' },
  rejected:    { label: 'Refusé',       classes: 'bg-destructive/10 text-destructive' },
  dismiss:     { label: 'Abandonné',    classes: 'bg-muted text-muted-foreground' },
}

function StatutBadge({ statut }: { statut: CandidatStatut }) {
  const cfg = STATUT_CONFIG[statut] ?? STATUT_CONFIG.notStarted
  return (
    <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${cfg.classes}`}>
      {cfg.label}
    </span>
  )
}

// ── DetailField ────────────────────────────────────────────

function DetailField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value ?? '—'}</p>
    </div>
  )
}

// ── RejectModal ────────────────────────────────────────────

function RejectModal({ title, endpoint, onClose, onDone }: {
  title: string
  endpoint: string
  onClose: () => void
  onDone: (msg: string) => void
}) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function submit() {
    if (!reason.trim()) { setError('Le motif est obligatoire.'); return }
    setError(null)
    startTransition(async () => {
      const res = await apiFetch(endpoint, { method: 'PATCH', body: JSON.stringify({ reason: reason.trim() }) })
      const json = await res.json()
      if (res.ok) onDone(json.message ?? 'Refus enregistré.')
      else setError(json.message ?? 'Erreur.')
    })
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-sm rounded-xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-medium text-foreground">{title}</h2>
          <button onClick={onClose} className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent"><X size={14} /></button>
        </div>
        <div className="flex flex-col gap-3 p-4">
          {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <div className="grid gap-1.5">
            <Label htmlFor="reject-reason">Motif de refus *</Label>
            <textarea
              id="reject-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              disabled={isPending}
              placeholder="Expliquez la raison du refus…"
              className="w-full rounded-md border border-input bg-transparent px-2.5 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring resize-none"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border p-4">
          <Button variant="secondary" onClick={onClose} disabled={isPending}>Annuler</Button>
          <Button onClick={submit} disabled={isPending || !reason.trim()} className="bg-destructive text-white hover:bg-destructive/90">
            {isPending ? 'Envoi…' : 'Confirmer le refus'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── ScheduleModal ──────────────────────────────────────────

function ScheduleModal({ candidature, onClose, onDone }: {
  candidature: Candidature
  onClose: () => void
  onDone: (msg: string) => void
}) {
  const [date,    setDate]    = useState('')
  const [message, setMessage] = useState('')
  const [error,   setError]   = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function submit() {
    if (!date) { setError('La date est obligatoire.'); return }
    setError(null)
    startTransition(async () => {
      const res = await apiFetch(`/admin/candidatures/${candidature.id}/schedule`, {
        method: 'PATCH',
        body: JSON.stringify({
          requestDate: new Date(date).toISOString(),
          ...(message.trim() && { message: message.trim() }),
        }),
      })
      const json = await res.json()
      if (res.ok) onDone(json.message ?? 'Entretien planifié — email de convocation envoyé.')
      else setError(json.message ?? 'Erreur.')
    })
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-sm rounded-xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-medium text-foreground">Planifier un entretien</h2>
          <button onClick={onClose} className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent"><X size={14} /></button>
        </div>

        <div className="flex flex-col gap-4 p-4">
          {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          {/* Candidat */}
          <div className="flex items-center gap-2.5 rounded-lg bg-muted/40 px-3 py-2.5">
            <div className="h-7 w-7 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
              {candidature.firstName[0]}{candidature.lastName[0]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{candidature.fullName}</p>
              <p className="text-xs text-muted-foreground truncate">{candidature.email}</p>
            </div>
          </div>

          {/* Date */}
          <div className="grid gap-1.5">
            <Label htmlFor="sched-date">Date et heure de l'entretien *</Label>
            <input
              id="sched-date"
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isPending}
              className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Message optionnel */}
          <div className="grid gap-1.5">
            <Label htmlFor="sched-msg">
              Message pour le candidat
              <span className="ml-1 text-xs text-muted-foreground">(optionnel)</span>
            </Label>
            <textarea
              id="sched-msg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              disabled={isPending}
              placeholder="Informations complémentaires sur le lieu, les documents à apporter…"
              className="w-full rounded-md border border-input bg-transparent px-2.5 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring resize-none"
            />
          </div>

          {/* Note email */}
          <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5">
            <Mail size={14} className="text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              Un email de convocation sera automatiquement envoyé à <strong>{candidature.email}</strong> avec la date et l'heure de l'entretien.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border p-4">
          <Button variant="secondary" onClick={onClose} disabled={isPending}>Annuler</Button>
          <Button onClick={submit} disabled={isPending || !date} className="flex items-center gap-1.5">
            <Mail size={14} />
            {isPending ? 'Envoi…' : 'Envoyer la convocation'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── CandidatureDetailModal ─────────────────────────────────

function CandidatureDetailModal({ candidature, onClose, onRefresh, onFeedback, onSchedule }: {
  candidature: Candidature
  onClose: () => void
  onRefresh: () => void
  onFeedback: (msg: string, type: 'success' | 'error') => void
  onSchedule: () => void
}) {
  const [detail,     setDetail]     = useState<CandidatureDetail | null>(null)
  const [isLoading,  setIsLoading]  = useState(true)
  const [rejectDoc,  setRejectDoc]  = useState<Document | null>(null)
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null)
  const [isPending,  startTransition] = useTransition()

  async function downloadDoc(doc: Document) {
    const res = await apiFetch(`/candidatures/documents/download-url/${doc.id}`)
    if (!res.ok) return
    const json = await res.json().catch(() => null)
    if (json?.data?.url) window.open(json.data.url, '_blank')
  }

  useEffect(() => {
    apiFetch(`/admin/candidatures/${candidature.id}`)
      .then((r) => r.json())
      .then((json) => setDetail(json.data ?? null))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [candidature.id])

  function approveDoc(docId: string) {
    startTransition(async () => {
      const res = await apiFetch(`/admin/candidatures/${candidature.id}/documents/${docId}/approve`, { method: 'PATCH' })
      const json = await res.json()
      if (res.ok) {
        onFeedback(json.message ?? 'Document validé.', 'success')
        setDetail((prev) => prev ? {
          ...prev,
          documents: prev.documents.map((d) => d.id === docId ? { ...d, status: 'approved' as const } : d)
        } : prev)
      } else {
        onFeedback(json.message ?? 'Erreur.', 'error')
      }
    })
  }

  const cand  = detail?.candidat
  const parent = cand?.infoParent

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium text-foreground">{candidature.fullName}</h2>
            {detail && <StatutBadge statut={detail.candidat.statut} />}
          </div>
          <button onClick={onClose} className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent">
            <X size={14} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
        ) : !detail ? (
          <p className="p-4 text-sm text-destructive">Impossible de charger le détail.</p>
        ) : (
          <div className="overflow-y-auto flex flex-col gap-4 p-4">

            {/* Infos candidat */}
            <section className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-xl border border-border bg-muted/20 p-4">
              <DetailField label="Email"        value={candidature.email} />
              <DetailField label="Téléphone"    value={candidature.phone} />
              <DetailField label="Date de naissance" value={candidature.dateOfBirth ? new Date(candidature.dateOfBirth).toLocaleDateString('fr-FR') : null} />
              <DetailField label="Genre"        value={candidature.sexe} />
              <DetailField label="Code postal"  value={candidature.city_code} />
              <DetailField label="Rôle"         value={candidature.role?.name ?? '—'} />
              {cand?.requestDate && (
                <DetailField label="RDV prévu" value={new Date(cand.requestDate).toLocaleString('fr-FR')} />
              )}
              {cand?.rejectionReason && (
                <div className="col-span-2">
                  <DetailField label="Motif de refus" value={cand.rejectionReason} />
                </div>
              )}
            </section>

            {/* Info parent */}
            {parent && (parent.email_parent || parent.firstname_parent) && (
              <section className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Informations parentales</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-xl border border-border bg-muted/20 p-4">
                  <DetailField label="Prénom"    value={parent.firstname_parent} />
                  <DetailField label="Nom"       value={parent.lastname_parent} />
                  <DetailField label="Email"     value={parent.email_parent} />
                  <DetailField label="Téléphone" value={parent.phone_parent} />
                </div>
              </section>
            )}

            {/* Documents */}
            {detail.documents.length > 0 && (
              <section className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Documents ({detail.documents.length})
                </p>
                <div className="flex flex-col divide-y divide-border rounded-xl border border-border overflow-hidden">
                  {detail.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 bg-card px-3 py-2.5">
                      <FileText size={14} className="shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{doc.originalName}</p>
                        <p className="text-xs text-muted-foreground">{doc.categoryLabel} · {doc.fileSizeFormatted}</p>
                        {doc.rejectionReason && (
                          <p className="text-xs text-destructive">Refusé : {doc.rejectionReason}</p>
                        )}
                      </div>
                      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                        doc.status === 'approved' ? 'bg-primary/10 text-primary'
                        : doc.status === 'rejected' ? 'bg-destructive/10 text-destructive'
                        : 'bg-amber-100 text-amber-700'
                      }`}>
                        {doc.status === 'approved' ? 'Validé' : doc.status === 'rejected' ? 'Refusé' : 'En attente'}
                      </span>
                      <div className="flex gap-1 shrink-0">
                        <ActionBtn onClick={() => setViewingDoc(doc)} disabled={isPending} title="Visualiser" className="hover:bg-accent hover:text-foreground">
                          <Eye size={13} />
                        </ActionBtn>
                        {doc.status === 'pending' && (
                          <>
                            <ActionBtn onClick={() => approveDoc(doc.id)} disabled={isPending} title="Valider" className="hover:bg-primary/10 hover:text-primary">
                              <Check size={13} />
                            </ActionBtn>
                            <ActionBtn onClick={() => setRejectDoc(doc)} disabled={isPending} title="Refuser" className="hover:bg-destructive/10 hover:text-destructive">
                              <X size={13} />
                            </ActionBtn>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Footer actions */}
        {detail && (() => {
          const statut = detail.candidat.statut
          const rdvDate = detail.candidat.requestDate
          const rdvPasse = rdvDate ? new Date(rdvDate) < new Date() : false

          return (
            <div className="flex flex-col gap-3 border-t border-border p-4 shrink-0">

              {/* Statut du rendez-vous */}
              {rdvDate && statut === 'appointment' && (
                <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                  rdvPasse
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-blue-200 bg-blue-50'
                }`}>
                  <Calendar size={13} className={rdvPasse ? 'text-emerald-600 shrink-0' : 'text-blue-600 shrink-0'} />
                  <p className={`text-xs ${rdvPasse ? 'text-emerald-700' : 'text-blue-700'}`}>
                    {rdvPasse ? 'Entretien passé le ' : 'Entretien prévu le '}
                    <strong>{new Date(rdvDate).toLocaleString('fr-FR', {
                      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}</strong>
                  </p>
                </div>
              )}

              {/* Boutons */}
              <div className="flex gap-2 flex-wrap">
                <Button variant="secondary" onClick={onClose}>Fermer</Button>

                {/* submitted → Proposer un entretien */}
                {statut === 'submitted' && (
                  <Button
                    variant="secondary"
                    onClick={() => { onClose(); onSchedule() }}
                    disabled={isPending}
                    className="flex items-center gap-1.5 text-purple-700 border-purple-200 hover:bg-purple-50"
                  >
                    <Calendar size={14} /> Proposer un entretien
                  </Button>
                )}

                {/* appointment + RDV passé → Valider + Refuser */}
                {statut === 'appointment' && rdvPasse && (
                  <>
                    <Button
                      onClick={() => {
                        startTransition(async () => {
                          const res = await apiFetch(`/admin/candidatures/${candidature.id}/approve`, { method: 'PATCH' })
                          const json = await res.json()
                          if (res.ok) { onFeedback(json.message ?? 'Candidature validée.', 'success'); onRefresh() }
                          else onFeedback(json.message ?? 'Erreur.', 'error')
                        })
                      }}
                      disabled={isPending}
                      className="flex items-center gap-1.5"
                    >
                      <Check size={14} /> Valider
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        // Ouvrir le modal de refus — géré par le parent via onClose + rejectTarget
                        onClose()
                      }}
                      disabled={isPending}
                      className="flex items-center gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/5"
                    >
                      <X size={14} /> Refuser
                    </Button>
                  </>
                )}

                {/* appointment + RDV futur → attente */}
                {statut === 'appointment' && !rdvPasse && rdvDate && (
                  <p className="text-xs text-muted-foreground self-center">
                    Les actions seront disponibles après la date de l'entretien.
                  </p>
                )}
              </div>
            </div>
          )
        })()}
      </div>

      {/* Modal refus document */}
      {rejectDoc && (
        <RejectModal
          title={`Refuser le document "${rejectDoc.originalName}"`}
          endpoint={`/admin/candidatures/${candidature.id}/documents/${rejectDoc.id}/reject`}
          onClose={() => setRejectDoc(null)}
          onDone={(msg) => {
            setRejectDoc(null)
            onFeedback(msg, 'success')
            setDetail((prev) => prev ? {
              ...prev,
              documents: prev.documents.map((d) => d.id === rejectDoc.id ? { ...d, status: 'rejected' as const } : d)
            } : prev)
          }}
        />
      )}

      {/* Visualiseur de document */}
      {viewingDoc && (
        <DocumentViewerModal
          doc={viewingDoc}
          onClose={() => setViewingDoc(null)}
          onDownload={() => downloadDoc(viewingDoc)}
        />
      )}
    </div>
  )
}

// ── CandidaturesTab ────────────────────────────────────────

export default function CandidaturesTab() {
  const [candidatures, setCandidatures] = useState<Candidature[]>([])
  const [meta, setMeta] = useState<{ total: number; perPage: number; currentPage: number; lastPage: number } | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [detail, setDetail] = useState<Candidature | null>(null)
  const [rejectTarget, setRejectTarget] = useState<Candidature | null>(null)
  const [scheduleTarget, setScheduleTarget] = useState<Candidature | null>(null)
  const [isPending, startTransition] = useTransition()

  const debouncedSearch = useDebounce(search)

  const load = useCallback(async (p: number, q: string) => {
    setIsLoading(true)
    const params = new URLSearchParams({ page: String(p), limit: '15', all: 'true' })
    if (q) params.set('search', q)
    const res = await apiFetch(`/admin/candidatures?${params}`)
    if (res.ok) {
      const json = await res.json()
      const list = json.data?.candidats ?? json.data?.items ?? json.data
      setCandidatures(Array.isArray(list) ? list : [])
      setMeta(json.data?.meta ?? null)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => { load(page, debouncedSearch) }, [load, page, debouncedSearch])

  function handleSearch(value: string) { setSearch(value); setPage(1) }

  function approve(id: string) {
    startTransition(async () => {
      const res = await apiFetch(`/admin/candidatures/${id}/approve`, { method: 'PATCH' })
      const json = await res.json()
      if (res.ok) {
        setFeedback({ message: json.message ?? 'Candidat approuvé avec succès.', type: 'success' })
        load(page, debouncedSearch)
      } else {
        setFeedback({ message: json.message ?? 'Erreur.', type: 'error' })
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">

      <div>
        <p className="text-sm font-medium text-foreground">Candidatures</p>
        <p className="text-xs text-muted-foreground">Gérez les demandes d'adhésion aux cadets de la gendarmerie.</p>
      </div>

      {feedback && (
        <div className={`flex items-center justify-between rounded-lg px-4 py-2 text-sm ${
          feedback.type === 'success' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'
        }`}>
          {feedback.message}
          <button onClick={() => setFeedback(null)}><X size={13} /></button>
        </div>
      )}

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher un candidat…"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 size={16} className="animate-spin" /> Chargement…
        </div>
      ) : candidatures.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
          <ClipboardList size={36} strokeWidth={1.5} />
          <p className="text-sm">{search ? 'Aucun résultat.' : 'Aucune candidature pour le moment.'}</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-xl border border-border overflow-hidden">
          {candidatures.map((cand) => {
            const initials = `${cand.firstName[0]}${cand.lastName[0]}`.toUpperCase()
            const statut   = cand.candidat.statut
            const pct      = cand.candidat.completion.percentage

            return (
              <div key={cand.id} className="flex items-center gap-3 bg-card px-4 py-3 hover:bg-muted/40 transition-colors">
                {/* Avatar */}
                <div className="h-9 w-9 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                  {initials}
                </div>

                {/* Infos */}
                <button onClick={() => setDetail(cand)} className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground">{cand.fullName}</p>
                    {cand.sexe && <span className="text-[10px] text-muted-foreground">{cand.sexe}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {cand.email}
                    {cand.phone && ` · ${cand.phone}`}
                    {cand.dateOfBirth && ` · ${new Date(cand.dateOfBirth).toLocaleDateString('fr-FR')}`}
                  </p>
                  {/* Barre de complétion */}
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-1.5 flex-1 max-w-24 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{cand.candidat.completion.completed}/{cand.candidat.completion.total} docs</span>
                  </div>
                </button>

                {/* Statut */}
                <StatutBadge statut={statut} />

                {/* Actions */}
                <div className="flex gap-1 shrink-0">
                  {statut === 'submitted' && (
                    <>
                      <ActionBtn onClick={() => setScheduleTarget(cand)} disabled={isPending} title="Proposer un entretien" className="hover:bg-purple-100 hover:text-purple-700">
                        <Calendar size={14} />
                      </ActionBtn>
                      <ActionBtn onClick={() => setRejectTarget(cand)} disabled={isPending} title="Refuser" className="hover:bg-destructive/10 hover:text-destructive">
                        <X size={14} />
                      </ActionBtn>
                    </>
                  )}
                  {statut === 'appointment' && (() => {
                    const rdvPasse = cand.candidat.requestDate
                      ? new Date(cand.candidat.requestDate) < new Date()
                      : false
                    return rdvPasse ? (
                      <>
                        <ActionBtn onClick={() => approve(cand.id)} disabled={isPending} title="Valider" className="hover:bg-primary/10 hover:text-primary">
                          <Check size={14} />
                        </ActionBtn>
                        <ActionBtn onClick={() => setRejectTarget(cand)} disabled={isPending} title="Refuser" className="hover:bg-destructive/10 hover:text-destructive">
                          <X size={14} />
                        </ActionBtn>
                      </>
                    ) : (
                      <span className="text-xs text-purple-700 bg-purple-100 rounded px-2 py-0.5">
                        {cand.candidat.requestDate
                          ? `RDV le ${new Date(cand.candidat.requestDate).toLocaleDateString('fr-FR')}`
                          : 'RDV planifié'}
                      </span>
                    )
                  })()}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {meta && meta.lastPage > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>{meta.total} candidature{meta.total > 1 ? 's' : ''}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => p - 1)} disabled={page === 1 || isLoading}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-accent disabled:opacity-40">
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs">{page} / {meta.lastPage}</span>
            <button onClick={() => setPage((p) => p + 1)} disabled={page === meta.lastPage || isLoading}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-accent disabled:opacity-40">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────── */}
      {detail && (
        <CandidatureDetailModal
          candidature={detail}
          onClose={() => setDetail(null)}
          onRefresh={() => { setDetail(null); load(page, debouncedSearch) }}
          onFeedback={(msg, type) => setFeedback({ message: msg, type })}
          onSchedule={() => { setScheduleTarget(detail); setDetail(null) }}
        />
      )}
      {rejectTarget && (
        <RejectModal
          title={`Refuser la candidature de ${rejectTarget.fullName}`}
          endpoint={`/admin/candidatures/${rejectTarget.id}/reject`}
          onClose={() => setRejectTarget(null)}
          onDone={(msg) => { setRejectTarget(null); setFeedback({ message: msg, type: 'success' }); load(page, debouncedSearch) }}
        />
      )}
      {scheduleTarget && (
        <ScheduleModal
          candidature={scheduleTarget}
          onClose={() => setScheduleTarget(null)}
          onDone={(msg) => { setScheduleTarget(null); setFeedback({ message: msg, type: 'success' }); load(page, debouncedSearch) }}
        />
      )}
    </div>
  )
}
