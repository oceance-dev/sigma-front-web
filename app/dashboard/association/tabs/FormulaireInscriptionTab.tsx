'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Loader2,
  Lock,
  Pencil,
  Plus,
  Shield,
  Trash2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiFetch } from '@/src/lib/api-client'
import type { CustomField, CustomFieldType } from '@/src/types/association'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { ActionBtn } from './_shared'

// ── Types & constants ──────────────────────────────────────

const FIELD_TYPE_LABELS: Record<CustomFieldType, string> = {
  text:     'Texte court',
  email:    'Email',
  tel:      'Téléphone',
  date:     'Date',
  textarea: 'Texte long',
  select:   'Liste de choix',
  checkbox: 'Case à cocher',
}

interface DefaultField { label: string; required: boolean; note?: string }

const DEFAULT_FIELDS_GENERIC: DefaultField[] = [
  { label: 'Prénom',                    required: true  },
  { label: 'Nom',                       required: true  },
  { label: 'Email',                     required: true  },
  { label: 'Code postal',               required: true  },
  { label: 'Ville',                     required: false },
  { label: 'Date de naissance',         required: false },
  { label: 'Genre',                     required: false },
  { label: 'Mot de passe',              required: true  },
  { label: 'Confirmation mot de passe', required: true  },
]

const DEFAULT_FIELDS_GENDARMERIE: DefaultField[] = [
  { label: 'Prénom',                    required: true  },
  { label: 'Nom',                       required: true  },
  { label: 'Date de naissance',         required: true  },
  { label: 'Genre',                     required: true  },
  { label: 'Email',                     required: true  },
  { label: 'Téléphone',                 required: false },
  { label: 'Code postal',               required: true  },
  { label: 'Ville',                     required: false },
  { label: 'Responsable légal (× 1–2)', required: true, note: 'Type, prénom, nom, email, téléphone' },
  { label: 'Autorisation parentale',    required: true, note: 'Case à cocher' },
  { label: 'Mot de passe',              required: true  },
  { label: 'Confirmation mot de passe', required: true  },
]

// ── CustomFieldForm ────────────────────────────────────────

function CustomFieldForm({
  initial,
  onSave,
  onCancel,
  isPending,
}: {
  initial?: CustomField
  onSave: (field: CustomField) => void
  onCancel: () => void
  isPending: boolean
}) {
  const [label,       setLabel]       = useState(initial?.label ?? '')
  const [type,        setType]        = useState<CustomFieldType>(initial?.type ?? 'text')
  const [required,    setRequired]    = useState(initial?.required ?? false)
  const [placeholder, setPlaceholder] = useState(initial?.placeholder ?? '')
  const [optionsRaw,  setOptionsRaw]  = useState(initial?.options?.join('\n') ?? '')
  const [error,       setError]       = useState<string | null>(null)

  function submit() {
    if (!label.trim()) { setError('Le libellé est obligatoire.'); return }
    if (type === 'select') {
      const opts = optionsRaw.split('\n').map((o) => o.trim()).filter(Boolean)
      if (opts.length < 2) { setError('Ajoutez au moins 2 options (une par ligne).'); return }
    }
    setError(null)
    const field: CustomField = {
      id:          initial?.id ?? crypto.randomUUID(),
      label:       label.trim(),
      type,
      required,
      placeholder: placeholder.trim() || undefined,
      options:     type === 'select'
        ? optionsRaw.split('\n').map((o) => o.trim()).filter(Boolean)
        : undefined,
    }
    onSave(field)
  }

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex flex-col gap-3">
      <p className="text-sm font-medium text-foreground">
        {initial ? 'Modifier le champ' : 'Nouveau champ'}
      </p>

      {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}

      <div className="grid gap-1.5">
        <Label htmlFor="cf-label">Libellé *</Label>
        <Input
          id="cf-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Ex : Numéro de licence"
          disabled={isPending}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="cf-type">Type</Label>
          <select
            id="cf-type"
            value={type}
            onChange={(e) => setType(e.target.value as CustomFieldType)}
            disabled={isPending}
            className="h-9 w-full rounded-md border border-input bg-card px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {(Object.entries(FIELD_TYPE_LABELS) as [CustomFieldType, string][]).map(([val, lbl]) => (
              <option key={val} value={val}>{lbl}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="cf-placeholder">Placeholder</Label>
          <Input
            id="cf-placeholder"
            value={placeholder}
            onChange={(e) => setPlaceholder(e.target.value)}
            placeholder="Texte d'aide…"
            disabled={isPending || type === 'checkbox'}
          />
        </div>
      </div>

      {type === 'select' && (
        <div className="grid gap-1.5">
          <Label htmlFor="cf-options">Options (une par ligne) *</Label>
          <textarea
            id="cf-options"
            value={optionsRaw}
            onChange={(e) => setOptionsRaw(e.target.value)}
            rows={4}
            disabled={isPending}
            placeholder={"Option A\nOption B\nOption C"}
            className="w-full rounded-md border border-input bg-card px-2.5 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring resize-none"
          />
        </div>
      )}

      <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
        <input
          type="checkbox"
          checked={required}
          onChange={(e) => setRequired(e.target.checked)}
          disabled={isPending}
          className="h-4 w-4 accent-primary"
        />
        Champ obligatoire
      </label>

      <div className="flex gap-2 justify-end pt-1">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isPending}>
          Annuler
        </Button>
        <Button type="button" onClick={submit} disabled={isPending}>
          {isPending ? 'Enregistrement…' : initial ? 'Modifier' : 'Ajouter'}
        </Button>
      </div>
    </div>
  )
}

// ── FormulaireInscriptionTab ───────────────────────────────

export default function FormulaireInscriptionTab({ associationId, isGendarmerie, redirectAfterRegistration, onAssociationUpdated }: {
  associationId: string | null
  isGendarmerie: boolean
  redirectAfterRegistration: 'documents' | 'login'
  onAssociationUpdated: () => void
}) {
  const [fields,    setFields]    = useState<CustomField[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [feedback,  setFeedback]  = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [showAdd,   setShowAdd]   = useState(false)
  const [editing,   setEditing]   = useState<CustomField | null>(null)
  const [isPending, startTransition] = useTransition()
  const [confirmPending, setConfirmPending] = useState<null | { message: string; onConfirm: () => void }>(null)

  function saveRedirect(value: 'documents' | 'login') {
    if (!associationId) return
    startTransition(async () => {
      const res  = await apiFetch(`/admin/association/${associationId}/update`, {
        method: 'PUT',
        body: JSON.stringify({ afterRegistrationRedirect: value }),
      })
      const json = await res.json()
      if (res.ok) {
        setFeedback({ message: 'Orientation mise à jour.', type: 'success' })
        onAssociationUpdated()
      } else {
        setFeedback({ message: json.message ?? 'Erreur.', type: 'error' })
      }
    })
  }

  const load = useCallback(async () => {
    if (!associationId) { setIsLoading(false); return }
    setIsLoading(true)
    const res = await apiFetch(`/admin/association/${associationId}/custom-fields`)
    if (res.ok) {
      const json = await res.json()
      setFields(json.data?.fields ?? [])
    }
    setIsLoading(false)
  }, [associationId])

  useEffect(() => { load() }, [load])

  function deleteField(id: string) {
    setConfirmPending({
      message: 'Supprimer ce champ du formulaire d\'inscription ?',
      onConfirm: () => {
        startTransition(async () => {
          const res  = await apiFetch(`/admin/association/${associationId}/custom-fields/${id}`, { method: 'DELETE' })
          const json = await res.json()
          if (res.ok) {
            setFields((prev) => prev.filter((f) => f.id !== id))
            setFeedback({ message: 'Champ supprimé.', type: 'success' })
          } else {
            setFeedback({ message: json.message ?? 'Erreur.', type: 'error' })
          }
        })
      },
    })
  }

  function saveField(field: CustomField) {
    const isNew = editing === null
    startTransition(async () => {
      let res: Response
      if (isNew) {
        const { id: _id, ...body } = field
        res = await apiFetch(`/admin/association/${associationId}/custom-fields`, {
          method: 'POST',
          body: JSON.stringify(body),
        })
      } else {
        res = await apiFetch(`/admin/association/${associationId}/custom-fields/${field.id}`, {
          method: 'PUT',
          body: JSON.stringify(field),
        })
      }
      const json = await res.json()
      if (res.ok) {
        const saved: CustomField = json.data?.field ?? field
        if (isNew) {
          setFields((prev) => [...prev, saved])
        } else {
          setFields((prev) => prev.map((f) => f.id === field.id ? saved : f))
        }
        setFeedback({ message: isNew ? 'Champ ajouté.' : 'Champ mis à jour.', type: 'success' })
      } else {
        setFeedback({ message: json.message ?? 'Erreur.', type: 'error' })
      }
      setShowAdd(false)
      setEditing(null)
    })
  }

  function moveField(id: string, direction: 'up' | 'down') {
    const idx = fields.findIndex((f) => f.id === id)
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === fields.length - 1)) return
    const next = [...fields]
    const swap = direction === 'up' ? idx - 1 : idx + 1
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    setFields(next)
    startTransition(async () => {
      const res = await apiFetch(`/admin/association/${associationId}/custom-fields/reorder`, {
        method: 'PATCH',
        body: JSON.stringify({ ids: next.map((f) => f.id) }),
      })
      if (!res.ok) {
        setFields(fields)
        const json = await res.json()
        setFeedback({ message: json.message ?? 'Erreur lors du réordonnancement.', type: 'error' })
      }
    })
  }

  const defaultFields = isGendarmerie ? DEFAULT_FIELDS_GENDARMERIE : DEFAULT_FIELDS_GENERIC

  return (
    <div className="flex flex-col gap-5 max-w-xl">

      {/* ── Orientation après inscription ───────────────── */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
        <div>
          <p className="text-sm font-medium text-foreground">Orientation après inscription</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Que se passe-t-il une fois que le candidat a créé son compte ?
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {([
            { value: 'documents', label: 'Rediriger vers le dépôt de documents', desc: 'Le candidat est connecté automatiquement et accède directement à la liste des documents à fournir.' },
            { value: 'login',     label: "Rediriger vers la page d'accueil",     desc: "Le candidat est connecté automatiquement et redirigé vers la page d'accueil de son espace." },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={isPending}
              onClick={() => saveRedirect(opt.value)}
              className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-left transition-colors disabled:opacity-50 ${
                redirectAfterRegistration === opt.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/40 hover:bg-muted/40'
              }`}
            >
              <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                redirectAfterRegistration === opt.value ? 'border-primary' : 'border-muted-foreground/40'
              }`}>
                {redirectAfterRegistration === opt.value && (
                  <span className="h-2 w-2 rounded-full bg-primary" />
                )}
              </span>
              <div>
                <p className={`text-sm font-medium ${redirectAfterRegistration === opt.value ? 'text-primary' : 'text-foreground'}`}>
                  {opt.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Champs par défaut ────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-muted-foreground" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Champs toujours présents
          </p>
        </div>
        <div className="flex flex-col divide-y divide-border rounded-xl border border-border overflow-hidden opacity-70">
          {defaultFields.map((field) => (
            <div key={field.label} className="flex items-center gap-3 bg-muted/20 px-4 py-2.5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm text-foreground">{field.label}</p>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                    field.required ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'
                  }`}>
                    {field.required ? 'Obligatoire' : 'Optionnel'}
                  </span>
                  {field.note && (
                    <span className="text-[10px] text-muted-foreground italic">{field.note}</span>
                  )}
                </div>
              </div>
              <Lock size={12} className="text-muted-foreground/50 shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* ── Champs personnalisés ─────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-medium text-foreground">Champs personnalisés</p>
          <p className="text-xs text-muted-foreground">
            Ajoutés après les champs ci-dessus dans le formulaire d'inscription.
          </p>
        </div>
        <Button
          onClick={() => { setShowAdd(true); setEditing(null) }}
          disabled={isPending || showAdd}
          className="flex items-center gap-2 text-xs h-8 px-3"
        >
          <Plus size={13} /> Ajouter un champ
        </Button>
      </div>

      {feedback && (
        <div className={`flex items-center justify-between rounded-lg px-4 py-2 text-sm ${
          feedback.type === 'success' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'
        }`}>
          {feedback.message}
          <button onClick={() => setFeedback(null)}><X size={13} /></button>
        </div>
      )}

      {/* ── Formulaire ajout ────────────────────────────── */}
      {(showAdd || editing) && (
        <CustomFieldForm
          initial={editing ?? undefined}
          onSave={saveField}
          onCancel={() => { setShowAdd(false); setEditing(null) }}
          isPending={isPending}
        />
      )}

      {/* ── Liste ───────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 size={16} className="animate-spin" /> Chargement…
        </div>
      ) : fields.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-14 text-center">
          <ClipboardList size={34} strokeWidth={1.5} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Aucun champ personnalisé.</p>
          <p className="text-xs text-muted-foreground max-w-xs">
            Ajoutez des champs pour collecter des informations supplémentaires lors de l'inscription.
          </p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-xl border border-border overflow-hidden">
          {fields.map((field, idx) => (
            <div key={field.id} className="flex items-center gap-2 bg-card px-4 py-3">
              <div className="flex flex-col shrink-0">
                <ActionBtn onClick={() => moveField(field.id, 'up')} disabled={isPending || idx === 0} title="Monter" className="hover:bg-accent hover:text-foreground">
                  <ChevronUp size={12} />
                </ActionBtn>
                <ActionBtn onClick={() => moveField(field.id, 'down')} disabled={isPending || idx === fields.length - 1} title="Descendre" className="hover:bg-accent hover:text-foreground">
                  <ChevronDown size={12} />
                </ActionBtn>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-foreground">{field.label}</p>
                  {field.required && (
                    <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-destructive/10 text-destructive">
                      Obligatoire
                    </span>
                  )}
                  <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">
                    {FIELD_TYPE_LABELS[field.type]}
                  </span>
                </div>
                {field.placeholder && (
                  <p className="text-xs text-muted-foreground mt-0.5 italic truncate">
                    Placeholder : {field.placeholder}
                  </p>
                )}
                {field.type === 'select' && field.options && field.options.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    Choix : {field.options.join(', ')}
                  </p>
                )}
              </div>
              <ActionBtn
                onClick={() => { setEditing(field); setShowAdd(false) }}
                disabled={isPending}
                title="Modifier"
                className="hover:bg-accent hover:text-foreground"
              >
                <Pencil size={13} />
              </ActionBtn>
              <ActionBtn
                onClick={() => deleteField(field.id)}
                disabled={isPending}
                title="Supprimer"
                className="hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 size={13} />
              </ActionBtn>
            </div>
          ))}
        </div>
      )}

      {!isLoading && fields.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5">
          <AlertCircle size={13} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            Ces champs s'affichent après les champs par défaut dans le formulaire accessible via votre lien d'inscription.
          </p>
        </div>
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
