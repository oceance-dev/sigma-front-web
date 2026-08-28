'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import {
  AlertCircle,
  Archive,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock,
  ClipboardList,
  FileText,
  Loader2,
  Pencil,
  Play,
  Plus,
  Users,
  X,
  XCircle,
} from 'lucide-react'
import { useActionState } from 'react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Label } from '@/components/ui/label'
import { apiFetch } from '@/src/lib/api-client'
import { formatDateShort as fmtDate } from '@/src/lib/date-utils'
import type { DocumentRequirement } from '@/src/types/document-requirement'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { ActionBtn } from './_shared'

// ── Types ──────────────────────────────────────────────────

type CampaignStatus = 'draft' | 'open' | 'closed' | 'archived'

interface Campaign {
  id: number
  associationId: string
  name: string
  year: number
  status: CampaignStatus
  isOpen: boolean
  campaignStartsAt: string | null
  campaignEndsAt: string | null
  startsAt: string | null
  endsAt: string | null
  createdAt: string
  updatedAt: string
}

interface CampaignStats {
  total: number
  submitted: number
  approved: number
  rejected: number
  pending: number
  byStatus: Record<string, number>
}

const CAMPAIGN_STATUS_CONFIG: Record<CampaignStatus, { label: string; classes: string }> = {
  draft:    { label: 'Brouillon', classes: 'bg-muted text-muted-foreground' },
  open:     { label: 'Ouverte',   classes: 'bg-emerald-100 text-emerald-700' },
  closed:   { label: 'Fermée',    classes: 'bg-blue-100 text-blue-700' },
  archived: { label: 'Archivée',  classes: 'bg-muted text-muted-foreground' },
}

function CampaignBadge({ status }: { status: CampaignStatus }) {
  const cfg = CAMPAIGN_STATUS_CONFIG[status]
  return <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${cfg.classes}`}>{cfg.label}</span>
}

// ── CampaignFormModal ──────────────────────────────────────

type CampaignFormState = { error?: string } | null

function CampaignFormModal({ title, initial, onClose, onSaved }: {
  title: string
  initial?: Campaign
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const [state, action, isPending] = useActionState(
    async (_prev: CampaignFormState, formData: FormData): Promise<CampaignFormState> => {
      const campaignStartsAt = (formData.get('campaignStartsAt') as string) || null
      const campaignEndsAt   = (formData.get('campaignEndsAt')   as string) || null
      const startsAt         = (formData.get('startsAt')         as string) || null
      const endsAt           = (formData.get('endsAt')           as string) || null

      if (campaignStartsAt && campaignEndsAt && campaignEndsAt < campaignStartsAt) {
        return { error: 'La date de fin de campagne doit être postérieure à son ouverture.' }
      }
      if (startsAt && endsAt && endsAt < startsAt) {
        return { error: 'La date de fermeture des candidatures doit être postérieure à leur ouverture.' }
      }
      if (campaignStartsAt && startsAt && startsAt < campaignStartsAt) {
        return { error: 'L\'ouverture des candidatures ne peut précéder l\'ouverture de la campagne.' }
      }
      if (campaignEndsAt && endsAt && endsAt > campaignEndsAt) {
        return { error: 'La fermeture des candidatures ne peut dépasser la fin de la campagne.' }
      }

      const body: Record<string, unknown> = {
        name:             (formData.get('name') as string).trim(),
        year:             Number(formData.get('year')),
        campaignStartsAt,
        campaignEndsAt,
        startsAt,
        endsAt,
      }
      const url    = initial ? `/admin/campaigns/${initial.id}` : '/admin/campaigns'
      const method = initial ? 'PUT' : 'POST'
      const res    = await apiFetch(url, { method, body: JSON.stringify(body) })
      const json   = await res.json()
      if (!res.ok) return { error: json.message ?? 'Erreur.' }
      onSaved(json.message ?? (initial ? 'Campagne modifiée.' : 'Campagne créée.'))
      return null
    },
    null,
  )

  const toInputDate = (iso: string | null | undefined) => {
    if (!iso) return ''
    return iso.slice(0, 10)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-medium text-foreground">{title}</h2>
          <button onClick={onClose} className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent"><X size={14} /></button>
        </div>
        <form action={action}>
          <div className="flex flex-col gap-3 p-4">
            {state?.error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}
            <div className="grid gap-1.5">
              <Label htmlFor="camp-name">Nom *</Label>
              <Input id="camp-name" name="name" defaultValue={initial?.name} required disabled={isPending} placeholder="Campagne 2026" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="camp-year">Année *</Label>
              <Input id="camp-year" name="year" type="number" defaultValue={initial?.year ?? new Date().getFullYear()} required disabled={isPending} min={2020} max={2100} />
            </div>
            <fieldset className="grid gap-2 rounded-lg border border-border p-3">
              <legend className="px-1 text-xs font-medium text-muted-foreground">Période de la campagne</legend>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="camp-camp-start">Ouverture</Label>
                  <DatePicker id="camp-camp-start" name="campaignStartsAt" defaultValue={toInputDate(initial?.campaignStartsAt)} disabled={isPending} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="camp-camp-end">Fin</Label>
                  <DatePicker id="camp-camp-end" name="campaignEndsAt" defaultValue={toInputDate(initial?.campaignEndsAt)} disabled={isPending} />
                </div>
              </div>
            </fieldset>
            <fieldset className="grid gap-2 rounded-lg border border-border p-3">
              <legend className="px-1 text-xs font-medium text-muted-foreground">Période d'inscription des candidatures</legend>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="camp-start">Ouverture</Label>
                  <DatePicker id="camp-start" name="startsAt" defaultValue={toInputDate(initial?.startsAt)} disabled={isPending} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="camp-end">Clôture</Label>
                  <DatePicker id="camp-end" name="endsAt" defaultValue={toInputDate(initial?.endsAt)} disabled={isPending} />
                </div>
              </div>
            </fieldset>
          </div>
          <div className="flex justify-end gap-2 border-t border-border p-4">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>Annuler</Button>
            <Button type="submit" disabled={isPending}>{isPending ? 'Enregistrement…' : 'Enregistrer'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── CampaignDetailView ─────────────────────────────────────

function CampaignDetailView({ campaign, onBack, onEdit, onAction, onStatusAction, isPending }: {
  campaign: Campaign
  onBack: () => void
  onEdit: () => void
  onAction: (msg: string) => void
  onStatusAction: (action: 'open' | 'close' | 'archive') => void
  isPending: boolean
}) {
  const [stats,        setStats]        = useState<CampaignStats | null>(null)
  const [requirements, setRequirements] = useState<DocumentRequirement[]>([])
  const [selected,     setSelected]     = useState<Set<number>>(new Set())
  const [isLoading,    setIsLoading]    = useState(true)
  const [reqError,     setReqError]     = useState<string | null>(null)
  const [isValidating, startValidate]   = useTransition()
  const [confirmPending, setConfirmPending] = useState<null | { message: string; onConfirm: () => void }>(null)

  useEffect(() => {
    Promise.all([
      apiFetch(`/admin/campaigns/${campaign.id}`).then((r) => r.json()),
      apiFetch('/document-requirements').then((r) => r.json()),
    ]).then(([campJson, reqJson]) => {
      setStats(campJson.data?.stats ?? null)

      const list: DocumentRequirement[] = Array.isArray(reqJson.data)
        ? reqJson.data
        : (reqJson.data?.requirements ?? reqJson.data?.documentRequirements ?? reqJson.data?.items ?? [])

      const enabled = list.filter((r) => r.isEnabled)
      setRequirements(enabled)
      // Pré-sélectionner toutes les exigences activées
      setSelected(new Set(enabled.map((r) => r.id)))
    }).catch(() => {}).finally(() => setIsLoading(false))
  }, [campaign.id])

  function toggleAll() {
    setSelected((prev) =>
      prev.size === requirements.length
        ? new Set()
        : new Set(requirements.map((r) => r.id))
    )
  }

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function validate() {
    if (selected.size === 0) return
    setReqError(null)
    startValidate(async () => {
      const res  = await apiFetch(`/admin/campaigns/${campaign.id}/requirements`, {
        method: 'PUT',
        body: JSON.stringify({ requirementIds: Array.from(selected) }),
      })
      const json = await res.json()
      if (res.ok) onAction(json.message ?? 'Exigences de la campagne validées.')
      else setReqError(json.message ?? 'Erreur.')
    })
  }

  const STAT_CARDS: { label: string; value: number; icon: ReactNode; iconBg: string }[] = stats ? [
    { label: 'Total',      value: stats.total,     icon: <Users size={20} className="text-blue-600" />,              iconBg: 'bg-blue-50' },
    { label: 'Soumis',     value: stats.submitted, icon: <FileText size={20} className="text-blue-500" />,            iconBg: 'bg-blue-50' },
    { label: 'Approuvés',  value: stats.approved,  icon: <CheckCircle2 size={20} className="text-emerald-600" />,     iconBg: 'bg-emerald-50' },
    { label: 'Refusés',    value: stats.rejected,  icon: <XCircle size={20} className="text-destructive" />,          iconBg: 'bg-destructive/10' },
    { label: 'En attente', value: stats.pending,   icon: <Clock size={20} className="text-amber-600" />,             iconBg: 'bg-amber-50' },
  ] : []

  const allChecked = requirements.length > 0 && selected.size === requirements.length

  return (
    <div className="flex flex-col gap-5">

      {/* ── Header ───────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBack} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-accent transition-colors">
            <ChevronLeft size={16} />
          </button>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-foreground truncate">{campaign.name}</h2>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <CampaignBadge status={campaign.status} />
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar size={11} /> {campaign.year}
              </span>
            </div>
          </div>
        </div>
        {(campaign.status === 'draft' || campaign.status === 'closed') && (
          <Button variant="secondary" onClick={onEdit} disabled={isPending} className="flex items-center gap-1.5 h-8 px-3 text-xs shrink-0">
            <Pencil size={13} /> Modifier
          </Button>
        )}
      </div>

      {/* ── Stats ────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-3">
          {STAT_CARDS.map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-3 text-center">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.iconBg}`}>
                {s.icon}
              </div>
              <p className="text-2xl font-bold text-foreground leading-none">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Actions statut ───────────────────────────── */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-foreground">Actions</p>
        {campaign.status === 'draft' && (
          <Button onClick={() => onStatusAction('open')} disabled={isPending} className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
            <Play size={15} /> Ouvrir la campagne
          </Button>
        )}
        {campaign.status === 'open' && (
          <Button
            onClick={() => setConfirmPending({ message: 'Fermer cette campagne ?', onConfirm: () => onStatusAction('close') })}
            disabled={isPending}
            variant="secondary"
            className="w-full"
          >
            Fermer la campagne
          </Button>
        )}
        {campaign.status === 'closed' && (
          <Button
            onClick={() => setConfirmPending({ message: 'Archiver cette campagne ?', onConfirm: () => onStatusAction('archive') })}
            disabled={isPending}
            variant="secondary"
            className="w-full flex items-center justify-center gap-2"
          >
            <Archive size={14} /> Archiver la campagne
          </Button>
        )}
      </div>

      {/* ── Sélection des exigences ───────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Documents requis de la campagne</p>
          {requirements.length > 0 && (
            <button
              onClick={toggleAll}
              className="text-xs text-primary hover:underline underline-offset-4"
            >
              {allChecked ? 'Tout désélectionner' : 'Tout sélectionner'}
            </button>
          )}
        </div>

        <p className="text-xs text-muted-foreground -mt-1">
          Sélectionnez les documents requis qui s'appliquent à cette campagne.
        </p>

        {reqError && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{reqError}</p>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 size={15} className="animate-spin" /> Chargement…
          </div>
        ) : requirements.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">Aucune exigence configurée dans l'onglet "Documents requis".</p>
            <p className="text-xs text-muted-foreground mt-1">Créez d'abord des exigences dans l'onglet dédié.</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border rounded-xl border border-border overflow-hidden">
            {requirements.map((req) => {
              const isChecked = selected.has(req.id)
              return (
                <label
                  key={req.id}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                    isChecked ? 'bg-primary/5 hover:bg-primary/8' : 'bg-card hover:bg-muted/30'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggle(req.id)}
                    disabled={isValidating}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground">{req.effectiveName}</p>
                      {req.isRequired && (
                        <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-destructive/10 text-destructive">
                          Obligatoire
                        </span>
                      )}
                      <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">
                        {req.requiredForLabel}
                      </span>
                    </div>
                    {req.effectiveInstructions && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{req.effectiveInstructions}</p>
                    )}
                    {req.effectiveValidityDays && (
                      <p className="text-xs text-muted-foreground mt-0.5">Validité : {req.effectiveValidityDays} j</p>
                    )}
                  </div>
                </label>
              )
            })}
          </div>
        )}

        {requirements.length > 0 && (
          <Button
            onClick={validate}
            disabled={isValidating || isPending || selected.size === 0}
            className="w-full flex items-center justify-center gap-2"
          >
            {isValidating
              ? <><Loader2 size={14} className="animate-spin" /> Validation…</>
              : <><Check size={14} /> Valider la sélection ({selected.size}/{requirements.length})</>}
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmPending}
        message={confirmPending?.message ?? ''}
        onConfirm={() => { confirmPending?.onConfirm(); setConfirmPending(null) }}
        onCancel={() => setConfirmPending(null)}
        danger
      />
    </div>
  )
}

// ── CampagnesTab ───────────────────────────────────────────

export default function CampagnesTab() {
  const [campaigns,        setCampaigns]        = useState<Campaign[]>([])
  const [isLoading,        setIsLoading]        = useState(true)
  const [feedback,         setFeedback]         = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [showCreate,       setShowCreate]       = useState(false)
  const [editing,          setEditing]          = useState<Campaign | null>(null)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [isPending,        startTransition]     = useTransition()
  const [confirmPending, setConfirmPending] = useState<null | { message: string; onConfirm: () => void }>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    const res = await apiFetch('/admin/campaigns')
    if (res.ok) {
      const json = await res.json()
      setCampaigns(Array.isArray(json.data?.campaigns) ? json.data.campaigns : [])
    }
    setIsLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function statusAction(id: number, action: 'open' | 'close' | 'archive') {
    startTransition(async () => {
      const res = await apiFetch(`/admin/campaigns/${id}/${action}`, { method: 'POST' })
      const json = await res.json()
      if (res.ok) {
        setFeedback({ message: json.message ?? 'Action effectuée.', type: 'success' })
        setSelectedCampaign(null)
        load()
      } else {
        setFeedback({ message: json.message ?? 'Erreur.', type: 'error' })
      }
    })
  }

  const activeCampaign = campaigns.find((c) => c.status === 'open')

  return (
    <div className="flex flex-col gap-4">

      {/* Feedback (toujours visible même en vue détail) */}
      {feedback && (
        <div className={`flex items-center justify-between rounded-lg px-4 py-2 text-sm ${
          feedback.type === 'success' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'
        }`}>
          {feedback.message}
          <button onClick={() => setFeedback(null)}><X size={13} /></button>
        </div>
      )}

      {/* ── Vue détail ─────────────────────────────────── */}
      {selectedCampaign ? (
        <CampaignDetailView
          campaign={selectedCampaign}
          onBack={() => setSelectedCampaign(null)}
          onEdit={() => { setEditing(selectedCampaign); setSelectedCampaign(null) }}
          onAction={(msg) => { setFeedback({ message: msg, type: 'success' }); setSelectedCampaign(null); load() }}
          onStatusAction={(action) => statusAction(selectedCampaign.id, action)}
          isPending={isPending}
        />
      ) : (
        <>
          {/* ── En-tête liste ──────────────────────────── */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm font-medium text-foreground">Campagnes de recrutement</p>
              <p className="text-xs text-muted-foreground">Gérez les campagnes d'adhésion des cadets.</p>
            </div>
            <Button onClick={() => setShowCreate(true)} disabled={isPending} className="flex items-center gap-2 h-8 px-3 text-xs">
              <Plus size={13} /> Nouvelle campagne
            </Button>
          </div>

          {/* Bannière campagne active */}
          {activeCampaign && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-sm font-medium text-emerald-800">
                  Campagne active : <span className="font-bold">{activeCampaign.name}</span>
                  {activeCampaign.campaignEndsAt && ` · jusqu'au ${fmtDate(activeCampaign.campaignEndsAt)}`}
                </p>
              </div>
              <Button
                onClick={() => setConfirmPending({ message: 'Fermer cette campagne ?', onConfirm: () => statusAction(activeCampaign.id, 'close') })}
                disabled={isPending}
                variant="secondary"
                className="h-7 px-3 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-100"
              >
                Fermer
              </Button>
            </div>
          )}

          {/* Liste */}
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 size={16} className="animate-spin" /> Chargement…
            </div>
          ) : campaigns.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
              <ClipboardList size={36} strokeWidth={1.5} />
              <p className="text-sm">Aucune campagne pour le moment.</p>
              <Button onClick={() => setShowCreate(true)} variant="secondary" className="flex items-center gap-2 text-xs h-8 px-3">
                <Plus size={13} /> Créer la première campagne
              </Button>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border rounded-xl border border-border overflow-hidden">
              {campaigns.map((camp) => (
                <div key={camp.id} className="flex items-center gap-3 bg-card px-4 py-3 hover:bg-muted/40 transition-colors">
                  <button onClick={() => setSelectedCampaign(camp)} className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground">{camp.name}</p>
                      <span className="text-xs text-muted-foreground">({camp.year})</span>
                    </div>
                    <div className="mt-0.5 flex flex-col gap-0.5">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Campagne :</span>{' '}
                        {camp.campaignStartsAt ? `du ${fmtDate(camp.campaignStartsAt)}` : 'début non défini'}
                        {camp.campaignEndsAt  ? ` au ${fmtDate(camp.campaignEndsAt)}` : ''}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Candidatures :</span>{' '}
                        {camp.startsAt ? `du ${fmtDate(camp.startsAt)}` : 'début non défini'}
                        {camp.endsAt  ? ` au ${fmtDate(camp.endsAt)}` : ''}
                      </p>
                    </div>
                  </button>
                  <CampaignBadge status={camp.status} />
                  <div className="flex gap-1 shrink-0">
                    {(camp.status === 'draft' || camp.status === 'closed') && (
                      <ActionBtn onClick={() => setEditing(camp)} disabled={isPending} title="Modifier" className="hover:bg-accent hover:text-foreground">
                        <Pencil size={14} />
                      </ActionBtn>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showCreate && (
        <CampaignFormModal
          title="Nouvelle campagne"
          onClose={() => setShowCreate(false)}
          onSaved={(msg) => { setShowCreate(false); setFeedback({ message: msg, type: 'success' }); load() }}
        />
      )}
      {editing && (
        <CampaignFormModal
          title={`Modifier "${editing.name}"`}
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={(msg) => { setEditing(null); setFeedback({ message: msg, type: 'success' }); load() }}
        />
      )}

      <ConfirmDialog
        open={!!confirmPending}
        message={confirmPending?.message ?? ''}
        onConfirm={() => { confirmPending?.onConfirm(); setConfirmPending(null) }}
        onCancel={() => setConfirmPending(null)}
        danger
      />
    </div>
  )
}
