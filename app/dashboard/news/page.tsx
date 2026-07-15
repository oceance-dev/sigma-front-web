'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, Loader2, Newspaper } from 'lucide-react'
import { apiFetch } from '@/src/lib/api-client'

// ── Types ──────────────────────────────────────────────────

type NewsCategory = 'feature' | 'improvement' | 'fix'

interface NewsEntry {
  id:          number
  title:       string
  content:     string
  category:    NewsCategory
  publishedAt: string
}

// ── Config catégories ──────────────────────────────────────

const CATEGORIES: Record<NewsCategory, { label: string; classes: string; dot: string }> = {
  feature:     { label: 'Nouveauté',    classes: 'bg-primary/10 text-primary',      dot: 'bg-primary' },
  improvement: { label: 'Amélioration', classes: 'bg-blue-100 text-blue-700',       dot: 'bg-blue-500' },
  fix:         { label: 'Correction',   classes: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-500' },
}

function CategoryBadge({ category }: { category: NewsCategory }) {
  const cfg = CATEGORIES[category] ?? CATEGORIES.feature
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.classes}`}>{cfg.label}</span>
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ── Page ───────────────────────────────────────────────────

export default function NewsPage() {
  const [entries,   setEntries]   = useState<NewsEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    const res = await apiFetch('/news')
    if (res.ok) {
      const json = await res.json()
      setEntries(json.data?.entries ?? json.data ?? [])
    } else {
      setError('Impossible de charger les nouveautés.')
    }
    setIsLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Grouper par mois/année
  const groups = entries.reduce<{ label: string; items: NewsEntry[] }[]>((acc, entry) => {
    const label = new Date(entry.publishedAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    const existing = acc.find((g) => g.label === label)
    if (existing) existing.items.push(entry)
    else acc.push({ label, items: [entry] })
    return acc
  }, [])

  return (
    <div className="flex flex-col gap-6 max-w-2xl">

      {/* En-tête */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Newspaper size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Nouveautés</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Les dernières mises à jour de l'application</p>
        </div>
      </div>

      {/* Contenu */}
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 size={16} className="animate-spin" /> Chargement…
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle size={14} /> {error}
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
          <Newspaper size={36} strokeWidth={1.5} />
          <p className="text-sm">Aucune nouveauté pour le moment.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map((group) => (
            <div key={group.label} className="flex flex-col gap-4">

              {/* Mois */}
              <div className="flex items-center gap-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider capitalize">
                  {group.label}
                </p>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Articles du mois */}
              <div className="flex flex-col gap-4">
                {group.items.map((entry) => (
                  <div key={entry.id} className="flex gap-4">
                    {/* Dot timeline */}
                    <div className="flex flex-col items-center pt-1 shrink-0">
                      <div className={`h-2.5 w-2.5 rounded-full ${CATEGORIES[entry.category]?.dot ?? 'bg-primary'}`} />
                      <div className="w-px flex-1 bg-border mt-2" />
                    </div>

                    {/* Contenu */}
                    <div className="flex flex-col gap-2 pb-4 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CategoryBadge category={entry.category} />
                        <span className="text-xs text-muted-foreground">{fmtDate(entry.publishedAt)}</span>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{entry.title}</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{entry.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
