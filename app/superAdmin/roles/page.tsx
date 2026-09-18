'use client'

import { apiFetch } from '@/src/lib/api-client'
import { useCallback, useEffect, useState, useTransition } from 'react'
import { Check, ChevronDown, Loader2, Pencil, Plus, Search, Shield, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useDebounce } from '@/src/hooks/useDebounce'

// ── Types ──────────────────────────────────────────────────

interface RolePermission {
  id: number
  name: string
  displayName: string
  group: string
}

interface PermissionCatalogEntry extends RolePermission {
  description: string
  isActive: boolean
}

interface RoleSetRole {
  key: string
  name: string
  description: string
  isActive: boolean
  isSystem: boolean
  permissions: RolePermission[]
}

interface AssociationRoleSet {
  associationId: string
  associationName: string
  associationSlug: string
  associationType: string
  associationStatus: string
  roleSetId: string
  roles: RoleSetRole[]
}

// ── Labels/couleurs association — mêmes conventions que app/superAdmin/associations/page.tsx ──

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
const TYPE_LABELS: Record<string, string> = {
  gendarmerie: 'Gendarmerie',
  sport:       'Sportive',
  culturelle:  'Culturelle',
  generale:    'Générale',
}
const GROUP_LABELS: Record<string, string> = {
  associations:  'Association',
  users:         'Membres',
  roles:         'Rôles',
  documents:     'Documents',
  campaigns:     'Campagnes',
  candidatures:  'Candidatures',
  registrations: 'Inscriptions',
  billing:       'Facturation',
}

function groupLabel(group: string): string {
  return GROUP_LABELS[group] ?? group.charAt(0).toUpperCase() + group.slice(1)
}

// Le POST/PATCH renvoie `roleSet` — soit directement le tableau de rôles, soit un objet qui
// l'embarque (`{ roleSetId, roles }`) selon la route. On gère les deux formes défensivement.
function extractRoles(roleSet: unknown): RoleSetRole[] {
  if (Array.isArray(roleSet)) return roleSet
  if (roleSet && typeof roleSet === 'object' && Array.isArray((roleSet as { roles?: unknown }).roles)) {
    return (roleSet as { roles: RoleSetRole[] }).roles
  }
  return []
}

// ── Page ───────────────────────────────────────────────────
//
// Le step-up 2FA (X-Step-Up-Token) est géré de façon totalement transparente par
// apiFetch + StepUpProvider (src/lib/api-client.ts, src/context/step-up-context.tsx) —
// déjà en place pour le reset de mot de passe utilisateur. Un simple appel apiFetch sur
// une route protégée suffit : la modale de code s'ouvre automatiquement si besoin et la
// requête est rejouée avec le token obtenu, sans code supplémentaire ici.

export default function SuperAdminRolesPage() {
  const [associations, setAssociations] = useState<AssociationRoleSet[]>([])
  const [meta, setMeta] = useState<{ total: number; lastPage: number; currentPage: number } | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const [permissions, setPermissions] = useState<PermissionCatalogEntry[]>([])

  const [formTarget, setFormTarget] = useState<{ associationId: string; associationName: string; role: RoleSetRole | null } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ associationId: string; associationName: string; role: RoleSetRole } | null>(null)
  const [isMutating, startMutation] = useTransition()

  const debouncedSearch = useDebounce(search)

  const load = useCallback(async (p: number, q: string) => {
    setIsLoading(true)
    setError(null)
    const params = new URLSearchParams({ page: String(p), limit: '20' })
    if (q) params.set('search', q)
    const res = await apiFetch(`/super-admin/roles?${params}`)
    if (res.ok) {
      const json = await res.json()
      setAssociations(json.data.associations ?? [])
      setMeta(json.data.meta ?? null)
    } else {
      setError('Impossible de charger les rôles.')
    }
    setIsLoading(false)
  }, [])

  useEffect(() => { load(page, debouncedSearch) }, [load, page, debouncedSearch])

  // Catalogue des permissions assignables — global, indépendant de la pagination/recherche,
  // chargé une seule fois.
  useEffect(() => {
    apiFetch('/super-admin/roles/permissions')
      .then((r) => r.json())
      .then((json) => setPermissions(json.data ?? []))
      .catch(() => {})
  }, [])

  function handleSearch(v: string) { setSearch(v); setPage(1) }

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function updateAssociationRoles(associationId: string, roles: RoleSetRole[]) {
    setAssociations((prev) => prev.map((a) => (a.associationId === associationId ? { ...a, roles } : a)))
  }

  function confirmDelete() {
    if (!deleteTarget) return
    const { associationId, role } = deleteTarget
    startMutation(async () => {
      const res = await apiFetch(`/super-admin/roles/${associationId}/${role.key}`, { method: 'DELETE' })
      const json = await res.json().catch(() => ({}))
      if (res.ok) {
        updateAssociationRoles(associationId, extractRoles(json.data?.roleSet))
        setFeedback({ message: json.message ?? 'Rôle supprimé.', type: 'success' })
      } else {
        setFeedback({ message: json.message ?? 'Une erreur est survenue.', type: 'error' })
      }
      setDeleteTarget(null)
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Rôles</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Rôles et permissions de toutes les associations.</p>
      </div>

      {feedback && (
        <div className={`flex items-center justify-between rounded-lg px-4 py-2 text-sm ${feedback.type === 'success' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
          {feedback.message}
          <button onClick={() => setFeedback(null)}><X size={13} /></button>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Rechercher une association…"
            className="pl-9"
          />
        </div>
        {meta && <p className="text-sm text-muted-foreground">{meta.total} association{meta.total > 1 ? 's' : ''}</p>}
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      ) : associations.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-center text-muted-foreground">
          <Shield size={32} className="opacity-30" />
          <p className="text-sm">Aucune association trouvée.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {associations.map((assoc) => {
            const isOpen = expanded.has(assoc.associationId)
            return (
              <div key={assoc.associationId} className="rounded-xl border border-border overflow-hidden">
                <button
                  onClick={() => toggle(assoc.associationId)}
                  className="flex w-full items-center gap-3 bg-card px-4 py-3 hover:bg-muted/40 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{assoc.associationName}</p>
                    <p className="text-xs text-muted-foreground">{assoc.roles.length} rôle{assoc.roles.length > 1 ? 's' : ''}</p>
                  </div>
                  <span className="rounded px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground shrink-0">
                    {TYPE_LABELS[assoc.associationType] ?? assoc.associationType}
                  </span>
                  <span className={`rounded px-2 py-0.5 text-xs font-medium shrink-0 ${STATUS_CLASSES[assoc.associationStatus] ?? 'bg-muted text-muted-foreground'}`}>
                    {STATUS_LABELS[assoc.associationStatus] ?? assoc.associationStatus}
                  </span>
                  <ChevronDown size={16} className={`text-muted-foreground shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                  <div className="border-t border-border bg-muted/10">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rôles</p>
                      <Button
                        size="xs"
                        onClick={() => setFormTarget({ associationId: assoc.associationId, associationName: assoc.associationName, role: null })}
                        className="flex items-center gap-1"
                      >
                        <Plus size={12} /> Ajouter un rôle
                      </Button>
                    </div>
                    <div className="divide-y divide-border">
                      {assoc.roles.length === 0 ? (
                        <p className="px-4 py-4 text-sm text-muted-foreground">Aucun rôle configuré pour cette association.</p>
                      ) : (
                        assoc.roles.map((role) => (
                          <RoleBlock
                            key={role.key}
                            role={role}
                            onEdit={() => setFormTarget({ associationId: assoc.associationId, associationName: assoc.associationName, role })}
                            onDelete={() => setDeleteTarget({ associationId: assoc.associationId, associationName: assoc.associationName, role })}
                          />
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {meta && meta.lastPage > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>Page {page} sur {meta.lastPage}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => p - 1)} disabled={page === 1 || isLoading}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-accent disabled:opacity-40">‹</button>
            <span className="text-xs">{page} / {meta.lastPage}</span>
            <button onClick={() => setPage((p) => p + 1)} disabled={page === meta.lastPage || isLoading}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-accent disabled:opacity-40">›</button>
          </div>
        </div>
      )}

      {formTarget && (
        <RoleFormModal
          associationId={formTarget.associationId}
          associationName={formTarget.associationName}
          initial={formTarget.role}
          permissions={permissions}
          onClose={() => setFormTarget(null)}
          onSaved={(roles, msg) => {
            updateAssociationRoles(formTarget.associationId, roles)
            setFormTarget(null)
            setFeedback({ message: msg, type: 'success' })
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        message={deleteTarget
          ? `Supprimer le rôle « ${deleteTarget.role.name} » de ${deleteTarget.associationName} ? Les membres qui l'utilisent perdront ce rôle. Cette action est irréversible.`
          : ''}
        confirmLabel={isMutating ? 'Suppression…' : 'Supprimer'}
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

// ── RoleBlock ────────────────────────────────────────────────

function RoleBlock({ role, onEdit, onDelete }: { role: RoleSetRole; onEdit: () => void; onDelete: () => void }) {
  const groups = role.permissions.reduce<Record<string, RolePermission[]>>((acc, p) => {
    ;(acc[p.group] ??= []).push(p)
    return acc
  }, {})
  const groupNames = Object.keys(groups).sort()

  return (
    <div className="px-4 py-3 flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Shield size={14} className="text-primary shrink-0" />
        <p className="text-sm font-medium text-foreground">{role.name}</p>
        {role.isSystem ? (
          <span
            className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground"
            title="Rôle système, non modifiable"
          >
            Système
          </span>
        ) : null}
        {!role.isActive && (
          <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-destructive/10 text-destructive">Inactif</span>
        )}
        <span className="text-xs text-muted-foreground">
          {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
        </span>

        {!role.isSystem && (
          <div className="ml-auto flex gap-1 shrink-0">
            <button
              onClick={onEdit}
              title="Modifier"
              className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={onDelete}
              title="Supprimer"
              className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {role.description && <p className="text-xs text-muted-foreground">{role.description}</p>}

      {role.permissions.length > 0 && (
        <div className="flex flex-col gap-1.5 mt-1">
          {groupNames.map((group) => (
            <div key={group} className="flex flex-wrap items-start gap-1.5">
              <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mt-0.5">
                {groupLabel(group)}
              </span>
              <div className="flex flex-wrap gap-1">
                {groups[group].map((perm) => (
                  <span key={perm.id} title={perm.name} className="rounded-full bg-primary/5 px-2 py-0.5 text-[11px] text-foreground">
                    {perm.displayName}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── RoleFormModal ────────────────────────────────────────────

function RoleFormModal({ associationId, associationName, initial, permissions, onClose, onSaved }: {
  associationId: string
  associationName: string
  initial: RoleSetRole | null
  permissions: PermissionCatalogEntry[]
  onClose: () => void
  onSaved: (roles: RoleSetRole[], message: string) => void
}) {
  const isEdit = !!initial
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [isActive, setIsActive] = useState(initial?.isActive ?? true)
  const [selected, setSelected] = useState<Set<number>>(new Set(initial?.permissions.map((p) => p.id) ?? []))
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const assignable = permissions.filter((p) => p.isActive)
  const groups = assignable.reduce<Record<string, PermissionCatalogEntry[]>>((acc, p) => {
    ;(acc[p.group] ??= []).push(p)
    return acc
  }, {})
  const groupNames = Object.keys(groups).sort()

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleGroup(ids: number[]) {
    setSelected((prev) => {
      const next = new Set(prev)
      const allIn = ids.every((id) => next.has(id))
      if (allIn) ids.forEach((id) => next.delete(id))
      else ids.forEach((id) => next.add(id))
      return next
    })
  }

  function submit() {
    if (name.trim().length < 2) { setError('Le nom doit contenir au moins 2 caractères.'); return }
    if (!description.trim()) { setError('La description est obligatoire.'); return }
    setError(null)
    startTransition(async () => {
      const body = {
        name: name.trim(),
        description: description.trim(),
        permissions_list: Array.from(selected),
        isActive,
      }
      const url = isEdit ? `/super-admin/roles/${associationId}/${initial!.key}` : `/super-admin/roles/${associationId}`
      const res = await apiFetch(url, { method: isEdit ? 'PATCH' : 'POST', body: JSON.stringify(body) })
      const json = await res.json().catch(() => ({}))
      if (res.ok) {
        onSaved(extractRoles(json.data?.roleSet), json.message ?? (isEdit ? 'Rôle mis à jour.' : 'Rôle créé.'))
      } else {
        setError(json.message ?? 'Une erreur est survenue.')
      }
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !isPending) onClose() }}
    >
      <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
          <div className="min-w-0">
            <h2 className="text-sm font-medium text-foreground truncate">{isEdit ? `Modifier « ${initial!.name} »` : 'Nouveau rôle'}</h2>
            <p className="text-xs text-muted-foreground truncate">{associationName}</p>
          </div>
          <button onClick={onClose} disabled={isPending} className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent shrink-0 disabled:opacity-40">
            <X size={14} />
          </button>
        </div>

        <div className="overflow-y-auto flex flex-col gap-3 p-4">
          {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          <div className="grid gap-1.5">
            <Label htmlFor="role-name">Nom *</Label>
            <Input id="role-name" value={name} onChange={(e) => setName(e.target.value)} disabled={isPending} placeholder="ex. Trésorier adjoint" />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="role-description">Description *</Label>
            <Input id="role-description" value={description} onChange={(e) => setDescription(e.target.value)} disabled={isPending} placeholder="Courte description du rôle…" />
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
              <span className="text-xs text-muted-foreground">{selected.size} sélectionnée{selected.size !== 1 ? 's' : ''}</span>
            </div>

            {assignable.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">Aucune permission disponible.</p>
            ) : (
              <div className="flex flex-col rounded-xl border border-border overflow-hidden">
                {groupNames.map((group) => {
                  const ids = groups[group].map((p) => p.id)
                  const allChecked = ids.every((id) => selected.has(id))
                  const someChecked = ids.some((id) => selected.has(id))
                  return (
                    <div key={group} className="border-b border-border last:border-0">
                      <button
                        type="button"
                        onClick={() => toggleGroup(ids)}
                        disabled={isPending}
                        className="flex w-full items-center gap-2 px-3 py-2 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                      >
                        <div className={`h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-colors ${
                          allChecked ? 'bg-primary border-primary' : someChecked ? 'bg-primary/30 border-primary/50' : 'border-input bg-transparent'
                        }`}>
                          {allChecked && <Check size={10} className="text-white" />}
                        </div>
                        <p className="flex-1 text-xs font-semibold text-foreground">{groupLabel(group)}</p>
                        <span className="text-xs text-muted-foreground">{ids.filter((id) => selected.has(id)).length}/{ids.length}</span>
                      </button>
                      <div className="divide-y divide-border">
                        {groups[group].map((perm) => (
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
                              <p className="text-xs font-medium text-foreground">{perm.displayName}</p>
                              {perm.description && <p className="text-[10px] text-muted-foreground mt-0.5">{perm.description}</p>}
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
          <Button type="button" onClick={submit} disabled={isPending}>
            {isPending ? (isEdit ? 'Mise à jour…' : 'Création…') : (isEdit ? 'Mettre à jour' : 'Créer le rôle')}
          </Button>
        </div>
      </div>
    </div>
  )
}
