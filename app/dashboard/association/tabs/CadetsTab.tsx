'use client'

import { useEffect, useState } from 'react'
import {
  AlertCircle,
  Loader2,
  Search,
  Users,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { apiFetch } from '@/src/lib/api-client'
import type { Member } from '@/src/types/member'

export default function CadetsTab() {
  const [cadets, setCadets] = useState<Member[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch('/admin/cadets')
      .then(async (r) => {
        if (r.status === 403) { setError('Fonctionnalité réservée aux associations de gendarmerie.'); return }
        const json = await r.json()
        setCadets(Array.isArray(json.data) ? json.data : [])
      })
      .catch(() => setError('Impossible de charger les cadets.'))
      .finally(() => setIsLoading(false))
  }, [])

  const filtered = cadets.filter((c) => {
    const q = search.toLowerCase()
    return (
      !q ||
      c.fullName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    )
  })

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">Cadets</p>
        <p className="text-xs text-muted-foreground">Liste des cadets de votre association.</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
          <AlertCircle size={14} />{error}
        </div>
      )}

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher un cadet…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 size={16} className="animate-spin" /> Chargement…
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
          <Users size={36} strokeWidth={1.5} />
          <p className="text-sm">{search ? 'Aucun résultat.' : 'Aucun cadet pour le moment.'}</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {filtered.length} cadet{filtered.length > 1 ? 's' : ''}
            {search && ` · "${search}"`}
          </p>
          <div className="flex flex-col divide-y divide-border rounded-xl border border-border overflow-hidden">
            {filtered.map((cadet) => {
              const initials = `${cadet.firstName[0]}${cadet.lastName[0]}`.toUpperCase()
              return (
                <div key={cadet.id} className="flex items-center gap-3 bg-card px-4 py-3 hover:bg-muted/40 transition-colors">
                  <div className="h-8 w-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{cadet.fullName}</p>
                      {cadet.sexe && (
                        <span className="text-[10px] text-muted-foreground">{cadet.sexe}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {cadet.email}
                      {cadet.dateOfBirth && ` · Né(e) le ${new Date(cadet.dateOfBirth).toLocaleDateString('fr-FR')}`}
                      {cadet.city_code && ` · ${cadet.city_code}`}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${
                    cadet.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>
                    {cadet.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
