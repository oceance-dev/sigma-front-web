'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { useActionState } from 'react'
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  Mail,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiFetch } from '@/src/lib/api-client'
import type { DocumentRequirement } from '@/src/types/document-requirement'
import { ConfirmDialog } from '@/components/ConfirmDialog'

// ── Constants ──────────────────────────────────────────────

const REQUIRED_FOR_OPTIONS = [
  { value: 'all',        label: 'Tous' },
  { value: 'candidates', label: 'Candidats uniquement' },
  { value: 'members',    label: 'Membres' },
  { value: 'staff',      label: 'Staff' },
]

const REQUIRED_AT_OPTIONS = [
  { value: 'registration', label: 'À l\'inscription' },
  { value: 'anytime',      label: 'À tout moment' },
  { value: 'approval',     label: 'À l\'approbation' },
]

// ── ReqFormModal ───────────────────────────────────────────

type ReqFormState = { error?: string } | null

function ReqFormModal({
  title,
  initial,
  onClose,
  onSaved,
}: {
  title: string
  initial?: DocumentRequirement
  onClose: () => void
  onSaved: () => void
}) {
  const [state, action, isPending] = useActionState(
    async (_prev: ReqFormState, formData: FormData): Promise<ReqFormState> => {
      const body = {
        documentTypeId:     Number(formData.get('documentTypeId')),
        isRequired:         formData.get('isRequired') === 'true',
        requiredFor:        formData.get('requiredFor') as string,
        requiredAt:         formData.get('requiredAt') as string,
        customName:         (formData.get('customName') as string).trim() || null,
        customInstructions: (formData.get('customInstructions') as string).trim() || null,
        customValidityDays: formData.get('customValidityDays')
          ? Number(formData.get('customValidityDays'))
          : null,
      }

      const url = initial
        ? `/document-requirements/update-document-required/${initial.id}`
        : '/document-requirements/create-document-required'
      const method = initial ? 'PUT' : 'POST'

      const res = await apiFetch(url, { method, body: JSON.stringify(body) })
      if (!res.ok) {
        const json = await res.json()
        return { error: json.message ?? 'Erreur lors de l\'enregistrement.' }
      }
      onSaved()
      return null
    },
    null,
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border px-4 py-3 sticky top-0 bg-card z-10">
          <h2 className="text-sm font-medium">{title}</h2>
          <button onClick={onClose} className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent">
            <X size={14} />
          </button>
        </div>

        <form action={action}>
          <div className="flex flex-col gap-4 p-4">
            {state?.error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
            )}

            <div className="grid gap-1.5">
              <Label htmlFor="req-typeId">ID du type de document *</Label>
              <Input
                id="req-typeId"
                name="documentTypeId"
                type="number"
                min={1}
                defaultValue={initial?.documentTypeId}
                required
                disabled={isPending}
                placeholder="ex. 3"
              />
              <p className="text-xs text-muted-foreground">Identifiant du type de document défini par l'administration.</p>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="req-customName">Nom personnalisé</Label>
              <Input
                id="req-customName"
                name="customName"
                defaultValue={initial?.customName ?? ''}
                disabled={isPending}
                placeholder="Laissez vide pour utiliser le nom par défaut"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="req-requiredFor">Requis pour *</Label>
              <select
                id="req-requiredFor"
                name="requiredFor"
                defaultValue={initial?.requiredFor ?? 'all'}
                disabled={isPending}
                className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {REQUIRED_FOR_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="req-requiredAt">Requis à *</Label>
              <select
                id="req-requiredAt"
                name="requiredAt"
                defaultValue={initial?.requiredAt ?? 'registration'}
                disabled={isPending}
                className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {REQUIRED_AT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="req-validity">Validité (jours)</Label>
              <Input
                id="req-validity"
                name="customValidityDays"
                type="number"
                min={1}
                defaultValue={initial?.customValidityDays ?? ''}
                disabled={isPending}
                placeholder="Laissez vide pour la valeur par défaut"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="req-instructions">Instructions personnalisées</Label>
              <textarea
                id="req-instructions"
                name="customInstructions"
                defaultValue={initial?.customInstructions ?? ''}
                disabled={isPending}
                rows={3}
                placeholder="Instructions spécifiques à votre association…"
                className="w-full rounded-md border border-input bg-transparent px-2.5 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="isRequired"
                  value="true"
                  defaultChecked={initial?.isRequired !== false}
                  className="accent-primary"
                  disabled={isPending}
                />
                Obligatoire
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="isRequired"
                  value="false"
                  defaultChecked={initial?.isRequired === false}
                  className="accent-primary"
                  disabled={isPending}
                />
                Facultatif
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-border p-4 sticky bottom-0 bg-card">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>Annuler</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── DocumentsRequisTab ─────────────────────────────────────

export default function DocumentsRequisTab() {
  const [requirements, setRequirements] = useState<DocumentRequirement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<DocumentRequirement | null>(null)
  const [isPending, startTransition] = useTransition()
  const [confirmPending, setConfirmPending] = useState<null | { message: string; onConfirm: () => void }>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const res = await apiFetch('/document-requirements')
    if (res.ok) {
      const json = await res.json()
      const list = Array.isArray(json.data)
        ? json.data
        : (json.data?.requirements ?? json.data?.documentRequirements ?? json.data?.items ?? [])
      setRequirements(list)
    } else {
      setError('Impossible de charger les exigences.')
    }
    setIsLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function toggle(req: DocumentRequirement) {
    startTransition(async () => {
      const res = await apiFetch(`/document-requirements/${req.id}/toggle`, { method: 'POST' })
      if (res.ok) {
        setRequirements((prev) =>
          prev.map((r) => r.id === req.id ? { ...r, isEnabled: !r.isEnabled } : r)
        )
      }
    })
  }

  function deleteReq(id: number) {
    setConfirmPending({
      message: 'Supprimer cette exigence ?',
      onConfirm: () => {
        startTransition(async () => {
          const res = await apiFetch(`/document-requirements/delete-document-required/${id}`, { method: 'DELETE' })
          if (res.ok) {
            setRequirements((prev) => prev.filter((r) => r.id !== id))
            setFeedback('Exigence supprimée.')
          }
        })
      },
    })
  }

  function reorder(id: number, direction: 'up' | 'down') {
    const idx = requirements.findIndex((r) => r.id === id)
    if (idx === -1) return
    const newIdx = direction === 'up' ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= requirements.length) return

    const reordered = [...requirements]
    ;[reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]]
    setRequirements(reordered)

    const orderData = reordered.map((r, i) => ({ id: r.id, sortOrder: i + 1 }))
    apiFetch('/document-requirements/reorder', {
      method: 'POST',
      body: JSON.stringify({ orders: orderData }),
    })
  }

  function initialize() {
    startTransition(async () => {
      const res = await apiFetch('/document-requirements/initialize', { method: 'POST' })
      if (res.ok) { setFeedback('Exigences initialisées.'); load() }
    })
  }

  function reset() {
    setConfirmPending({
      message: 'Réinitialiser toutes les exigences aux valeurs par défaut ?',
      onConfirm: () => {
        startTransition(async () => {
          const res = await apiFetch('/document-requirements/reset', { method: 'POST' })
          if (res.ok) { setFeedback('Exigences réinitialisées.'); load() }
        })
      },
    })
  }

  return (
    <div className="flex flex-col gap-4">

      {/* ── En-tête ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">Documents requis</p>
          <p className="text-xs text-muted-foreground">Gérez les documents obligatoires pour vos membres et candidats.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={initialize} disabled={isPending} className="flex items-center gap-2 text-xs h-8 px-3">
            <RefreshCw size={13} />
            Initialiser
          </Button>
          <Button variant="secondary" onClick={reset} disabled={isPending} className="flex items-center gap-2 text-xs h-8 px-3">
            <RotateCcw size={13} />
            Réinitialiser
          </Button>
          <Button onClick={() => setShowCreate(true)} disabled={isPending} className="flex items-center gap-2 text-xs h-8 px-3">
            <Plus size={13} />
            Ajouter
          </Button>
        </div>
      </div>

      {/* ── Notice documents de santé ─────────────────────── */}
      <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
        <Mail size={15} className="text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">
          <strong>Documents de santé :</strong> pour protéger la confidentialité des données de santé, aucun document de
          cette nature n'est déposé en ligne par le candidat. À la place de la zone de dépôt habituelle, un simple
          message lui indique d'envoyer le document par courrier postal à l'association.
        </p>
      </div>

      {/* ── Feedback ────────────────────────────────────── */}
      {feedback && (
        <div className="flex items-center justify-between rounded-lg bg-primary/10 px-4 py-2 text-sm text-primary">
          {feedback}
          <button onClick={() => setFeedback(null)}><X size={13} /></button>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
          <AlertCircle size={14} />{error}
        </div>
      )}

      {/* ── Liste ───────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
          <Loader2 size={16} className="animate-spin" /> Chargement…
        </div>
      ) : requirements.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <FileText size={36} strokeWidth={1.5} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Aucune exigence configurée.</p>
          <Button onClick={initialize} variant="secondary" className="flex items-center gap-2 text-xs">
            <RefreshCw size={13} />
            Initialiser les défauts
          </Button>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-xl border border-border overflow-hidden">
          {requirements.map((req, idx) => (
            <div key={req.id} className={`flex items-center gap-3 bg-card px-4 py-3 transition-colors ${!req.isEnabled ? 'opacity-50' : ''}`}>

              {/* Réordonner */}
              <div className="flex flex-col gap-0.5 shrink-0">
                <button
                  onClick={() => reorder(req.id, 'up')}
                  disabled={idx === 0 || isPending}
                  className="flex h-4 w-4 items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ChevronUp size={12} />
                </button>
                <button
                  onClick={() => reorder(req.id, 'down')}
                  disabled={idx === requirements.length - 1 || isPending}
                  className="flex h-4 w-4 items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ChevronDown size={12} />
                </button>
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-foreground">{req.effectiveName}</p>
                  {req.isRequired && (
                    <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-destructive/10 text-destructive">
                      Obligatoire
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {req.requiredForLabel} · {req.requiredAtLabel}
                  {req.effectiveValidityDays && ` · Validité ${req.effectiveValidityDays}j`}
                </p>
                {req.effectiveInstructions && (
                  <p className="text-xs text-muted-foreground mt-0.5 italic truncate">{req.effectiveInstructions}</p>
                )}
              </div>

              {/* Toggle activé */}
              <button
                onClick={() => toggle(req)}
                disabled={isPending}
                title={req.isEnabled ? 'Désactiver' : 'Activer'}
                className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${req.isEnabled ? 'bg-primary' : 'bg-muted'}`}
              >
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${req.isEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>

              {/* Actions */}
              <button
                onClick={() => setEditing(req)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={() => deleteReq(req.id)}
                disabled={isPending}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────── */}
      {showCreate && (
        <ReqFormModal
          title="Ajouter une exigence"
          onClose={() => setShowCreate(false)}
          onSaved={() => { setShowCreate(false); load() }}
        />
      )}
      {editing && (
        <ReqFormModal
          title={`Modifier "${editing.effectiveName}"`}
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load() }}
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
