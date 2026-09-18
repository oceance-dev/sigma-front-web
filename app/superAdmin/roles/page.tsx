'use client'

import { apiFetch } from '@/src/lib/api-client'
import { useCallback, useEffect, useState } from 'react'
import { ChevronDown, Loader2, Search, Shield } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useDebounce } from '@/src/hooks/useDebounce'

// ── Types ──────────────────────────────────────────────────

interface RolePermission {
  id: number
  name: string
  displayName: string
  group: string
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

// ── Page ───────────────────────────────────────────────────
//
// Lecture seule : ce panel affiche les rôles de toutes les associations pour audit/support,
// mais leur gestion (créer/modifier/supprimer un rôle) reste la responsabilité de chaque
// admin d'association dans SON propre panel (app/dashboard/association/tabs/RolesTab.tsx) —
// donc aucune action ici, juste de la consultation.

export default function SuperAdminRolesPage() {
  const [associations, setAssociations] = useState<AssociationRoleSet[]>([])
  const [meta, setMeta] = useState<{ total: number; lastPage: number; currentPage: number } | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

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

  function handleSearch(v: string) { setSearch(v); setPage(1) }

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Rôles</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Rôles et permissions de toutes les associations — consultation seule.</p>
      </div>

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
                  <div className="divide-y divide-border border-t border-border bg-muted/10">
                    {assoc.roles.length === 0 ? (
                      <p className="px-4 py-4 text-sm text-muted-foreground">Aucun rôle configuré pour cette association.</p>
                    ) : (
                      assoc.roles.map((role) => <RoleBlock key={role.key} role={role} />)
                    )}
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
    </div>
  )
}

// ── RoleBlock ────────────────────────────────────────────────

function RoleBlock({ role }: { role: RoleSetRole }) {
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
        {role.isSystem && (
          <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">Système</span>
        )}
        {!role.isActive && (
          <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-destructive/10 text-destructive">Inactif</span>
        )}
        <span className="text-xs text-muted-foreground">
          {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
        </span>
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
