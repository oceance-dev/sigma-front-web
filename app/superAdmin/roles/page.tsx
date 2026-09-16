'use client'

import { apiFetch } from '@/src/lib/api-client'
import { useEffect, useState, useTransition } from 'react'
import { Loader2, Pencil, Plus, Shield, Trash2, Users, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Permission {
  id: number
  name: string
  group: string
  description: string
}

interface Role {
  id: number
  name: string
  displayName: string
  description: string | null
  level: number
  isSystem: boolean
  isActive: boolean
  permissions: Permission[]
}

export default function SuperAdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [allPermissions, setAllPermissions] = useState<Permission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editRole, setEditRole] = useState<Role | null>(null)
  const [viewUsersRole, setViewUsersRole] = useState<Role | null>(null)
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [isPending, startTransition] = useTransition()

  async function load() {
    setIsLoading(true)
    const [rolesRes, permsRes] = await Promise.allSettled([
      apiFetch('/super-admin/roles').then(r => r.json()),
      apiFetch('/super-admin/permissions').then(r => r.json()),
    ])
    if (rolesRes.status === 'fulfilled') {
      const d = rolesRes.value?.data
      setRoles(Array.isArray(d) ? d : d?.roles ?? [])
    }
    if (permsRes.status === 'fulfilled') {
      const d = permsRes.value?.data
      setAllPermissions(Array.isArray(d) ? d : d?.permissions ?? [])
    }
    setIsLoading(false)
  }

  useEffect(() => { load() }, [])

  function deleteRole(role: Role) {
    if (role.isSystem) return
    if (!confirm(`Supprimer le rôle "${role.displayName}" ?`)) return
    startTransition(async () => {
      const res = await apiFetch(`/super-admin/roles/${role.id}/delete`, { method: 'DELETE' })
      const json = await res.json()
      if (res.ok) { setFeedback({ message: json.message ?? 'Rôle supprimé.', type: 'success' }); load() }
      else setFeedback({ message: json.message ?? 'Erreur.', type: 'error' })
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Rôles</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gestion des rôles et permissions système</p>
        </div>
        <Button onClick={() => { setEditRole(null); setShowForm(true) }} className="flex items-center gap-2 h-9 px-4 text-sm">
          <Plus size={15} /> Nouveau rôle
        </Button>
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
      ) : roles.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-center text-muted-foreground">
          <Shield size={32} className="opacity-30" />
          <p className="text-sm">Aucun rôle configuré.</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-xl border border-border overflow-hidden">
          {roles.map((role) => (
            <div key={role.id} className="flex items-center gap-4 bg-card px-4 py-3 hover:bg-muted/40 transition-colors">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Shield size={16} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{role.displayName}</p>
                  {role.isSystem && (
                    <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">Système</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Niveau {role.level} · {role.permissions.length} permission{role.permissions.length > 1 ? 's' : ''}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => setViewUsersRole(role)}
                  className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  title="Voir les utilisateurs"
                >
                  <Users size={14} />
                </button>
                {!role.isSystem && (
                  <>
                    <button
                      onClick={() => { setEditRole(role); setShowForm(true) }}
                      className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      title="Modifier"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => deleteRole(role)}
                      disabled={isPending}
                      className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-40"
                      title="Supprimer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <RoleFormModal
          role={editRole}
          allPermissions={allPermissions}
          onClose={() => setShowForm(false)}
          onSaved={(msg) => { setShowForm(false); setFeedback({ message: msg, type: 'success' }); load() }}
        />
      )}

      {viewUsersRole && (
        <RoleUsersModal
          role={viewUsersRole}
          onClose={() => setViewUsersRole(null)}
        />
      )}
    </div>
  )
}

function RoleFormModal({ role, allPermissions, onClose, onSaved }: {
  role: Role | null
  allPermissions: Permission[]
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const isEdit = !!role
  const [selectedPerms, setSelectedPerms] = useState<Set<number>>(
    new Set(role?.permissions.map(p => p.id) ?? [])
  )
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const groups = Array.from(new Set(allPermissions.map(p => p.group))).sort()

  function togglePerm(id: number) {
    setSelectedPerms(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const get = (k: string) => (fd.get(k) as string ?? '').trim()

    startTransition(async () => {
      if (isEdit) {
        const [updateRes, permsRes] = await Promise.allSettled([
          apiFetch(`/super-admin/roles/${role!.id}/update`, {
            method: 'PUT',
            body: JSON.stringify({
              name:        get('name'),
              displayName: get('displayName'),
              description: get('description') || null,
              level:       Number(get('level')),
            }),
          }).then(r => r.json()),
          apiFetch(`/super-admin/roles/${role!.id}/permissions/update`, {
            method: 'PUT',
            body: JSON.stringify({ permissionIds: Array.from(selectedPerms) }),
          }).then(r => r.json()),
        ])
        if (updateRes.status === 'rejected' || permsRes.status === 'rejected') {
          setError('Une erreur est survenue.')
          return
        }
        onSaved('Rôle mis à jour avec succès.')
      } else {
        const res = await apiFetch('/super-admin/roles', {
          method: 'POST',
          body: JSON.stringify({
            name:          get('name'),
            displayName:   get('displayName'),
            description:   get('description') || null,
            level:         Number(get('level')),
            permissionIds: Array.from(selectedPerms),
          }),
        })
        const json = await res.json()
        if (res.ok) onSaved(json.message ?? 'Rôle créé.')
        else setError(json.message ?? 'Une erreur est survenue.')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
          <h2 className="text-sm font-medium text-foreground">{isEdit ? 'Modifier le rôle' : 'Nouveau rôle'}</h2>
          <button onClick={onClose} className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent">
            <X size={14} />
          </button>
        </div>

        <form id="role-form" onSubmit={submit} className="overflow-y-auto flex flex-col gap-4 p-4">
          {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="rf-name">Identifiant *</Label>
              <Input id="rf-name" name="name" required disabled={isPending} defaultValue={role?.name} placeholder="moderateur" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="rf-display">Nom affiché *</Label>
              <Input id="rf-display" name="displayName" required disabled={isPending} defaultValue={role?.displayName} placeholder="Modérateur" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5 col-span-2">
              <Label htmlFor="rf-desc">Description</Label>
              <Input id="rf-desc" name="description" disabled={isPending} defaultValue={role?.description ?? ''} placeholder="Rôle de modération" />
            </div>
            <div className="grid gap-1.5 col-span-1">
              <Label htmlFor="rf-level">Niveau *</Label>
              <Input id="rf-level" name="level" type="number" min={1} max={100} required disabled={isPending} defaultValue={role?.level ?? 10} />
            </div>
          </div>

          {allPermissions.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Permissions ({selectedPerms.size} sélectionnée{selectedPerms.size > 1 ? 's' : ''})
              </p>
              {groups.map(group => (
                <div key={group} className="flex flex-col gap-1.5">
                  <p className="text-xs font-medium text-foreground capitalize">{group}</p>
                  <div className="flex flex-wrap gap-2">
                    {allPermissions.filter(p => p.group === group).map(perm => (
                      <button
                        key={perm.id}
                        type="button"
                        onClick={() => togglePerm(perm.id)}
                        disabled={isPending}
                        className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                          selectedPerms.has(perm.id)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
                        }`}
                      >
                        {perm.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </form>

        <div className="flex justify-end gap-2 border-t border-border p-4 shrink-0">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>Annuler</Button>
          <Button type="submit" form="role-form" disabled={isPending}>
            {isPending ? (isEdit ? 'Mise à jour…' : 'Création…') : (isEdit ? 'Mettre à jour' : 'Créer le rôle')}
          </Button>
        </div>
      </div>
    </div>
  )
}

function RoleUsersModal({ role, onClose }: { role: Role; onClose: () => void }) {
  const [users, setUsers] = useState<{ id: string; fullName: string; email: string }[]>([])
  const [meta, setMeta] = useState<{ total: number; lastPage: number } | null>(null)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    apiFetch(`/super-admin/roles/${role.id}/user?page=${page}&limit=15`)
      .then(r => r.json())
      .then(json => {
        setUsers(json.data?.users ?? [])
        setMeta(json.data?.meta ?? null)
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [role.id, page])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
          <div>
            <h2 className="text-sm font-medium text-foreground">Utilisateurs — {role.displayName}</h2>
            {meta && <p className="text-xs text-muted-foreground">{meta.total} utilisateur{meta.total > 1 ? 's' : ''}</p>}
          </div>
          <button onClick={onClose} className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent">
            <X size={14} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 size={18} className="animate-spin text-muted-foreground" /></div>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Aucun utilisateur pour ce rôle.</p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {users.map(u => (
                <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="h-8 w-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                    {u.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{u.fullName}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {meta && meta.lastPage > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted-foreground shrink-0">
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1 || isLoading}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-accent disabled:opacity-40">‹</button>
            <span className="text-xs">{page} / {meta.lastPage}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page === meta.lastPage || isLoading}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-accent disabled:opacity-40">›</button>
          </div>
        )}
      </div>
    </div>
  )
}
