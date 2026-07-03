'use client'

import { apiFetch } from '@/src/lib/api-client'
import { useCallback, useEffect, useState } from 'react'
import { Loader2, Users } from 'lucide-react'
import type { Member } from '@/src/types/member'

export default function SuperAdminUsersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [meta, setMeta] = useState<{ total: number; lastPage: number; currentPage: number } | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async (p: number, q: string) => {
    setIsLoading(true)
    const params = new URLSearchParams({ page: String(p), limit: '20' })
    if (q) params.set('search', q)
    const res = await apiFetch(`/super-admin/users?${params}`)
    if (res.ok) {
      const json = await res.json()
      setMembers(json.data.users ?? [])
      setMeta(json.data.meta ?? null)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => { load(page, search) }, [load, page, search])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Utilisateurs</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Tous les utilisateurs de la plateforme</p>
      </div>

      <div className="flex items-center gap-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Rechercher un utilisateur…"
          className="h-9 flex-1 max-w-sm rounded-md border border-input bg-transparent px-3 text-sm placeholder:text-muted-foreground outline-none focus-visible:border-ring"
        />
        {meta && <p className="text-sm text-muted-foreground">{meta.total} utilisateur{meta.total > 1 ? 's' : ''}</p>}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      ) : members.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-center text-muted-foreground">
          <Users size={32} className="opacity-30" />
          <p className="text-sm">Aucun utilisateur trouvé.</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-xl border border-border overflow-hidden">
          {members.map((m) => {
            const initials = `${m.firstName[0]}${m.lastName[0]}`.toUpperCase()
            return (
              <div key={m.id} className="flex items-center gap-3 bg-card px-4 py-3 hover:bg-muted/40 transition-colors">
                <div className="h-9 w-9 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{m.fullName}</p>
                  <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                </div>
                <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${m.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {m.isActive ? 'Actif' : 'Inactif'}
                </span>
              </div>
            )
          })}
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
    </div>
  )
}
