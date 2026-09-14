'use client'

import { useActionState } from 'react'
import {
  Building2,
  FileText,
  Folder,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Users,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Association } from '@/src/types/association'
import { StatCard } from '@/components/StatCard'
import { useStepUp } from '@/src/context/step-up-context'
import { InfoField } from './_shared'

// ── EditModal ──────────────────────────────────────────────

type EditState = { error?: string } | null

function EditModal({
  association,
  onClose,
  onSaved,
}: {
  association: Association
  onClose: () => void
  onSaved: () => void
}) {
  const { sensitiveFetch } = useStepUp()

  const [state, action, isPending] = useActionState(
    async (_prev: EditState, formData: FormData): Promise<EditState> => {
      const body = {
        name:       (formData.get('name') as string).trim(),
        email:      (formData.get('email') as string).trim() || null,
        city:       (formData.get('city') as string).trim(),
        postalCode: (formData.get('postalCode') as string).trim(),
        country:    (formData.get('country') as string).trim(),
      }
      const res = await sensitiveFetch(`/admin/association/${association.id}/update`, {
        method: 'PUT',
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const json = await res.json()
        return { error: json.message ?? 'Erreur lors de la mise à jour.' }
      }
      onSaved()
      return null
    },
    null,
  )

  const fields = [
    { id: 'name',       label: 'Nom',         defaultValue: association.name,         required: true },
    { id: 'email',      label: 'Email',       defaultValue: association.email ?? '',  required: false },
    { id: 'city',       label: 'Ville',       defaultValue: association.city,         required: true },
    { id: 'postalCode', label: 'Code postal', defaultValue: association.postalCode,   required: true },
    { id: 'country',    label: 'Pays',        defaultValue: association.country,      required: true },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-medium">Modifier l'association</h2>
          <button onClick={onClose} className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent">
            <X size={14} />
          </button>
        </div>

        <form action={action}>
          <div className="flex flex-col gap-3 p-4">
            {state?.error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
            )}
            {fields.map(({ id, label, defaultValue, required }) => (
              <div key={id} className="grid gap-1.5">
                <Label htmlFor={`edit-${id}`}>
                  {label}
                  {!required && <span className="ml-1 text-xs text-muted-foreground">(optionnel)</span>}
                </Label>
                <Input id={`edit-${id}`} name={id} defaultValue={defaultValue} required={required} disabled={isPending} />
              </div>
            ))}
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

// ── AssociationTab ─────────────────────────────────────────

export default function AssociationTab({
  association,
  responsable,
  canEdit,
  onEdit,
  showEdit,
  onCloseEdit,
  onSaved,
}: {
  association: Association | null
  responsable?: string
  canEdit: boolean
  onEdit: () => void
  showEdit: boolean
  onCloseEdit: () => void
  onSaved: () => void
}) {
  const deptCode = association?.postalCode?.slice(0, 2) ?? null

  return (
    <div className="flex flex-col gap-4">

      {/* ── Card infos ──────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card">
        {/* En-tête card */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Building2 size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Informations de l'association</p>
              <p className="text-xs text-muted-foreground">Détails et paramètres de votre association</p>
            </div>
          </div>
          {canEdit && (
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
            >
              <Pencil size={13} />
              Modifier
            </button>
          )}
        </div>

        {/* Grille infos */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-5 p-5 sm:grid-cols-2">
          {/* Colonne gauche */}
          <InfoField label="Nom" value={association?.name} />
          <InfoField label="Email" value={association?.email} icon={<Mail size={14} />} />
          <InfoField label="Adresse" value={null} />
          <InfoField
            label="Téléphone"
            value={null}
            icon={<Phone size={14} />}
          />
          <InfoField
            label="Département"
            value={deptCode ? `${deptCode}` : null}
          />
          <InfoField
            label="Code postal & ville"
            value={association ? `${association.postalCode} ${association.city}` : null}
            icon={<MapPin size={14} />}
          />
          <div /> {/* spacer */}
          <InfoField label="SIRET" value={null} />
          <div /> {/* spacer */}
          <InfoField label="Responsable" value={responsable} />
        </div>
      </div>

      {/* ── Stats ───────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={<Users size={20} className="text-primary" />} value={0} label="Membres actifs" />
        <StatCard icon={<FileText size={20} className="text-emerald-600" />} value={0} label="Documents" color="bg-emerald-50" />
        <StatCard icon={<Folder size={20} className="text-amber-600" />} value={0} label="Dossiers" color="bg-amber-50" />
      </div>

      {/* ── Modal modification ───────────────────────────── */}
      {showEdit && association && (
        <EditModal
          association={association}
          onClose={onCloseEdit}
          onSaved={onSaved}
        />
      )}
    </div>
  )
}
