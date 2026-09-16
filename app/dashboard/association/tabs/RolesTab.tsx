'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import {
  AlertCircle,
  Check,
  Loader2,
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
import { useStepUp } from '@/src/context/step-up-context'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { ActionBtn } from './_shared'

// ── Mapping permissions ────────────────────────────────────

const PERMISSION_META: Record<string, { label: string; description: string }> = {
  // Association
  'associations.read':              { label: 'Voir l\'association',          description: 'Consulter les informations de l\'association' },
  'associations.update':            { label: 'Modifier l\'association',       description: 'Mettre à jour les informations de l\'association' },

  // Membres
  'users.read':                     { label: 'Voir tous les membres',         description: 'Consulter la liste complète des membres' },
  'users.read_own':                 { label: 'Voir son propre profil',        description: 'Consulter ses propres informations uniquement' },
  'users.create':                   { label: 'Ajouter un membre',             description: 'Créer un nouveau compte membre' },
  'users.update':                   { label: 'Modifier tous les membres',     description: 'Mettre à jour les informations de n\'importe quel membre' },
  'users.update_own':               { label: 'Modifier son propre profil',    description: 'Mettre à jour ses propres informations uniquement' },
  'users.delete':                   { label: 'Supprimer un membre',           description: 'Retirer définitivement un membre de l\'association' },

  // Rôles
  'roles.read':                     { label: 'Voir les rôles',                description: 'Consulter la liste des rôles disponibles' },
  'roles.create':                   { label: 'Créer un rôle',                 description: 'Ajouter un nouveau rôle personnalisé' },
  'roles.update':                   { label: 'Modifier un rôle',              description: 'Modifier les permissions d\'un rôle existant' },
  'roles.delete':                   { label: 'Supprimer un rôle',             description: 'Supprimer un rôle personnalisé' },
  'roles.assign':                   { label: 'Attribuer un rôle',             description: 'Assigner ou retirer un rôle à un membre' },

  // Documents
  'documents.read':                 { label: 'Voir les documents',            description: 'Consulter les documents des membres' },
  'documents.read_own':             { label: 'Voir ses propres documents',    description: 'Consulter ses propres documents uniquement' },
  'documents.create':               { label: 'Déposer un document',           description: 'Ajouter un document dans l\'espace membres' },
  'documents.update':               { label: 'Modifier un document',          description: 'Remplacer ou renommer un document existant' },
  'documents.delete':               { label: 'Supprimer un document',         description: 'Supprimer un document de l\'espace membres' },
  'documents.approve':              { label: 'Valider un document',           description: 'Approuver ou refuser un document soumis' },

  // Campagnes
  'campaigns.read':                 { label: 'Voir les campagnes',            description: 'Consulter les campagnes de recrutement' },
  'campaigns.create':               { label: 'Créer une campagne',            description: 'Lancer une nouvelle campagne de recrutement' },
  'campaigns.update':               { label: 'Modifier une campagne',         description: 'Mettre à jour les informations d\'une campagne' },
  'campaigns.delete':               { label: 'Supprimer une campagne',        description: 'Supprimer une campagne existante' },
  'campaigns.open':                 { label: 'Ouvrir une campagne',           description: 'Passer une campagne en statut ouvert' },
  'campaigns.close':                { label: 'Fermer une campagne',           description: 'Clôturer les candidatures d\'une campagne' },

  // Candidatures
  'candidatures.read':              { label: 'Voir les candidatures',         description: 'Consulter les dossiers de candidature' },
  'candidatures.update':            { label: 'Traiter une candidature',       description: 'Valider, refuser ou planifier un entretien' },

  // Inscriptions
  'registrations.read':             { label: 'Voir les inscriptions',         description: 'Consulter les demandes d\'inscription en ligne' },
  'registrations.manage':           { label: 'Gérer les inscriptions',        description: 'Activer ou configurer le système d\'inscription' },
}

const GROUP_LABELS: Record<string, string> = {
  associations:  'Association',
  users:         'Membres',
  roles:         'Rôles',
  documents:     'Documents',
  campaigns:     'Campagnes',
  candidatures:  'Candidatures',
  registrations: 'Inscriptions',
}

function permMeta(name: string) {
  return PERMISSION_META[name] ?? { label: name, description: '' }
}

// ── Types ──────────────────────────────────────────────────

interface Role {
  key: string
  name: string
  description: string | null
  permissions_list: number[]
  isActive: boolean
  isSystem: boolean
}

interface Permission {
  id: number
  name: string
  label?: string
}

// ── RoleFormModal ──────────────────────────────────────────

function RoleFormModal({
  title,
  initial,
  onClose,
  onSaved,
}: {
  title: string
  initial?: Role
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const [name,         setName]         = useState(initial?.name ?? '')
  const [description,  setDescription]  = useState(initial?.description ?? '')
  const [isActive,     setIsActive]     = useState(initial?.isActive ?? true)
  const [selected,     setSelected]     = useState<Set<number>>(new Set(initial?.permissions_list ?? []))
  const [permissions,  setPermissions]  = useState<Permission[]>([])
  const [loadingPerms, setLoadingPerms] = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [isPending,    startTransition] = useTransition()
  const { sensitiveFetch } = useStepUp()

  useEffect(() => {
    apiFetch('/admin/role/permissions')
      .then((r) => r.json())
      .then((json) => {
        const list = Array.isArray(json.data) ? json.data : (json.data?.permissions ?? [])
        setPermissions(list)
      })
      .catch(() => {})
      .finally(() => setLoadingPerms(false))
  }, [])

  const groups = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    const g = p.name.split('.')[0]
    ;(acc[g] ??= []).push(p)
    return acc
  }, {})

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleGroup(ids: number[]) {
    setSelected((prev) => {
      const next = new Set(prev)
      const allIn = ids.every((id) => next.has(id))
      allIn ? ids.forEach((id) => next.delete(id)) : ids.forEach((id) => next.add(id))
      return next
    })
  }

  function submit() {
    if (!name.trim()) { setError('Le nom est obligatoire.'); return }
    setError(null)
    startTransition(async () => {
      const body = {
        name:             name.trim(),
        description:      description.trim() || null,
        permissions_list: Array.from(selected),
        isActive,
      }
      const url    = initial ? `/admin/role/${initial.key}` : '/admin/role'
      const method = initial ? 'PATCH' : 'POST'
      const res    = await sensitiveFetch(url, { method, body: JSON.stringify(body) })
      const json   = await res.json()
      if (res.ok) onSaved(json.message ?? (initial ? 'Rôle modifié.' : 'Rôle créé.'))
      else setError(json.message ?? 'Erreur lors de l\'enregistrement.')
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-xl max-h-[90vh] flex flex-col">

        <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
          <h2 className="text-sm font-medium">{title}</h2>
          <button onClick={onClose} className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent">
            <X size={14} />
          </button>
        </div>

        <div className="overflow-y-auto flex flex-col gap-3 p-4">
          {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          <div className="grid gap-1.5">
            <Label htmlFor="role-name">Nom *</Label>
            <Input
              id="role-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
              placeholder="ex. Trésorier"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="role-description">
              Description
              <span className="ml-1 text-xs text-muted-foreground">(optionnel)</span>
            </Label>
            <Input
              id="role-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isPending}
              placeholder="Courte description du rôle…"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2.5">
            <div>
              <p className="text-sm font-medium text-foreground">Actif</p>
              <p className="text-xs text-muted-foreground">Le rôle peut être attribué aux membres.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive((v) => !v)}
              disabled={isPending}
              className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${isActive ? 'bg-primary' : 'bg-muted'}`}
            >
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>Permissions</Label>
              <span className="text-xs text-muted-foreground">
                {selected.size} sélectionnée{selected.size !== 1 ? 's' : ''}
              </span>
            </div>

            {loadingPerms ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 size={14} className="animate-spin" /> Chargement…
              </div>
            ) : permissions.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">Aucune permission disponible.</p>
            ) : (
              <div className="flex flex-col rounded-xl border border-border overflow-hidden">
                {Object.entries(groups).map(([group, perms]) => {
                  const groupIds   = perms.map((p) => p.id)
                  const allChecked = groupIds.every((id) => selected.has(id))
                  const someChecked = groupIds.some((id) => selected.has(id))
                  return (
                    <div key={group} className="border-b border-border last:border-0">
                      <button
                        type="button"
                        onClick={() => toggleGroup(groupIds)}
                        disabled={isPending}
                        className="flex w-full items-center gap-2 px-3 py-2 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                      >
                        <div className={`h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-colors ${
                          allChecked ? 'bg-primary border-primary' : someChecked ? 'bg-primary/30 border-primary/50' : 'border-input bg-transparent'
                        }`}>
                          {allChecked && <Check size={10} className="text-white" />}
                        </div>
                        <p className="flex-1 text-xs font-semibold text-foreground">{GROUP_LABELS[group] ?? group}</p>
                        <span className="text-xs text-muted-foreground">
                          {groupIds.filter((id) => selected.has(id)).length}/{groupIds.length}
                        </span>
                      </button>
                      <div className="divide-y divide-border">
                        {perms.map((perm) => (
                          <label
                            key={perm.id}
                            className={`flex items-center gap-2.5 px-4 py-2.5 cursor-pointer transition-colors ${
                              selected.has(perm.id) ? 'bg-primary/5 hover:bg-primary/8' : 'hover:bg-muted/30'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selected.has(perm.id)}
                              onChange={() => toggle(perm.id)}
                              disabled={isPending}
                              className="h-3.5 w-3.5 shrink-0 accent-primary"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-foreground">{permMeta(perm.name).label}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{permMeta(perm.name).description}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border p-4 shrink-0">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>Annuler</Button>
          <Button type="button" onClick={submit} disabled={isPending || !name.trim()}>
            {isPending ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── RoleRow ────────────────────────────────────────────────

function RoleRow({
  role,
  onEdit,
  onDelete,
  disabled,
}: {
  role: Role
  onEdit: () => void
  onDelete: () => void
  disabled: boolean
}) {
  return (
    <div className="flex items-center gap-3 bg-card px-4 py-3 hover:bg-muted/40 transition-colors">

      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Shield size={15} className="text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-foreground">{role.name}</p>
          {role.isSystem && (
            <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">
              Système
            </span>
          )}
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
            role.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'
          }`}>
            {role.isActive ? 'Actif' : 'Inactif'}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs text-muted-foreground">
            {role.permissions_list.length} permission{role.permissions_list.length !== 1 ? 's' : ''}
          </span>
          {role.description && (
            <p className="text-xs text-muted-foreground truncate">· {role.description}</p>
          )}
        </div>
      </div>

      <div className="flex gap-1 shrink-0">
        <ActionBtn
          onClick={onEdit}
          disabled={disabled}
          title="Modifier"
          className="hover:bg-accent hover:text-foreground"
        >
          <Pencil size={13} />
        </ActionBtn>
        {!role.isSystem && (
          <ActionBtn
            onClick={onDelete}
            disabled={disabled}
            title="Supprimer"
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 size={13} />
          </ActionBtn>
        )}
      </div>
    </div>
  )
}

// ── RolesTab ───────────────────────────────────────────────

export default function RolesTab() {
  const [roles,      setRoles]      = useState<Role[]>([])
  const [isLoading,  setIsLoading]  = useState(true)
  const [error,      setError]      = useState<string | null>(null)
  const [feedback,   setFeedback]   = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [editing,    setEditing]    = useState<Role | null>(null)
  const [isPending,  startTransition] = useTransition()
  const [confirmPending, setConfirmPending] = useState<null | { message: string; onConfirm: () => void }>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const res = await apiFetch('/admin/role')
    if (res.ok) {
      const json = await res.json()
      const list: Record<string, Omit<Role, 'key'>> = json.data?.list ?? {}
      setRoles(Object.entries(list).map(([key, val]) => ({ key, ...val })))
    } else {
      setError('Impossible de charger les rôles.')
    }
    setIsLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function deleteRole(role: Role) {
    setConfirmPending({
      message: `Supprimer le rôle "${role.name}" ?`,
      onConfirm: () => {
        startTransition(async () => {
          const res  = await apiFetch(`/admin/role/${role.key}`, { method: 'DELETE' })
          const json = await res.json()
          if (res.ok) {
            setFeedback({ message: json.message ?? 'Rôle supprimé.', type: 'success' })
            load()
          } else {
            setFeedback({ message: json.message ?? 'Erreur lors de la suppression.', type: 'error' })
          }
        })
      },
    })
  }

  const systemRoles = roles.filter((r) => r.isSystem)
  const customRoles = roles.filter((r) => !r.isSystem)

  return (
    <div className="flex flex-col gap-4">

      {/* ── En-tête ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">Rôles</p>
          <p className="text-xs text-muted-foreground">Gérez les rôles attribuables aux membres de votre association.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} disabled={isPending} className="flex items-center gap-2 text-xs h-8 px-3">
          <Plus size={13} />
          Nouveau rôle
        </Button>
      </div>

      {/* ── Feedback ────────────────────────────────────── */}
      {feedback && (
        <div className={`flex items-center justify-between rounded-lg px-4 py-2 text-sm ${
          feedback.type === 'success' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'
        }`}>
          {feedback.message}
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
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 size={16} className="animate-spin" /> Chargement…
        </div>
      ) : roles.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Shield size={36} strokeWidth={1.5} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Aucun rôle configuré.</p>
          <Button onClick={() => setShowCreate(true)} variant="secondary" className="flex items-center gap-2 text-xs h-8 px-3">
            <Plus size={13} />
            Créer le premier rôle
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-5">

          {systemRoles.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rôles système</p>
              <div className="flex flex-col divide-y divide-border rounded-xl border border-border overflow-hidden">
                {systemRoles.map((role) => (
                  <RoleRow
                    key={role.key}
                    role={role}
                    onEdit={() => setEditing(role)}
                    onDelete={() => deleteRole(role)}
                    disabled={isPending}
                  />
                ))}
              </div>
            </div>
          )}

          {customRoles.length > 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rôles personnalisés</p>
              <div className="flex flex-col divide-y divide-border rounded-xl border border-border overflow-hidden">
                {customRoles.map((role) => (
                  <RoleRow
                    key={role.key}
                    role={role}
                    onEdit={() => setEditing(role)}
                    onDelete={() => deleteRole(role)}
                    disabled={isPending}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center">
              <p className="text-sm text-muted-foreground">Aucun rôle personnalisé.</p>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-1.5 text-xs text-primary hover:underline underline-offset-4"
              >
                Créer le premier rôle personnalisé
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────── */}
      {showCreate && (
        <RoleFormModal
          title="Nouveau rôle"
          onClose={() => setShowCreate(false)}
          onSaved={(msg) => { setShowCreate(false); setFeedback({ message: msg, type: 'success' }); load() }}
        />
      )}
      {editing && (
        <RoleFormModal
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
