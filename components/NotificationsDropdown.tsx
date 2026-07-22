'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Sparkles, TrendingUp, Wrench, BellOff } from 'lucide-react'
import { apiFetch } from '@/src/lib/api-client'
import { relativeDate } from '@/src/lib/date-utils'
import { markNewsSeen, reportLatestNewsFromEntries } from '@/src/lib/news-notifications'

// ── Modèle générique de notification ───────────────────────
// Conçu pour agréger plusieurs sources : nouveautés aujourd'hui, puis à terme
// offres, réductions, compléments d'information… Chaque source se mappe vers
// cette forme commune et fournit un `kind` (pour le badge/icône) + un `href`.

type NotificationKind = 'feature' | 'improvement' | 'fix'
// À venir : 'offer' | 'discount' | 'info'

interface AppNotification {
  id:      string
  kind:    NotificationKind
  title:   string
  content: string
  date:    string
  href:    string
}

const KIND_CFG: Record<NotificationKind, { label: string; icon: React.ReactNode; classes: string }> = {
  feature:     { label: 'Nouveauté',    icon: <Sparkles   size={13} />, classes: 'bg-primary/10 text-primary'  },
  improvement: { label: 'Amélioration', icon: <TrendingUp size={13} />, classes: 'bg-blue-100 text-blue-700'   },
  fix:         { label: 'Correction',   icon: <Wrench     size={13} />, classes: 'bg-amber-100 text-amber-700' },
}

const MAX_ITEMS = 8

// ── Sources ────────────────────────────────────────────────

interface NewsEntry { id: number; title: string; content: string; category: NotificationKind; publishedAt: string }

async function fetchNotifications(): Promise<AppNotification[]> {
  const res = await apiFetch('/news')
  if (!res.ok) throw new Error('fetch failed')
  const json = await res.json()
  const entries: NewsEntry[] = json.data?.entries ?? json.data ?? []
  // Marque les nouveautés comme vues dès l'ouverture du panneau
  reportLatestNewsFromEntries(entries)
  markNewsSeen()
  return entries.map((e) => ({
    id:      `news-${e.id}`,
    kind:    e.category,
    title:   e.title,
    content: e.content,
    date:    e.publishedAt,
    href:    '/dashboard/news',
  }))
}

// ── Composant ──────────────────────────────────────────────

export function NotificationsDropdown({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [items,     setItems]     = useState<AppNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setIsLoading(true)
    setError(null)
    fetchNotifications()
      .then((notifs) => { if (!cancelled) setItems(notifs) })
      .catch(() => { if (!cancelled) setError('Impossible de charger les notifications.') })
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [open])

  if (!open) return null

  const visible = items.slice(0, MAX_ITEMS)

  return (
    <div
      role="menu"
      aria-label="Notifications"
      className="absolute right-0 top-full z-50 mt-2 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-card shadow-xl"
    >
      {/* En-tête */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className="text-sm font-semibold text-foreground">Notifications</p>
      </div>

      {/* Corps */}
      <div className="max-h-[380px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 size={16} className="animate-spin" /> Chargement…
          </div>
        ) : error ? (
          <p className="px-4 py-8 text-center text-sm text-destructive">{error}</p>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
            <BellOff size={28} strokeWidth={1.5} />
            <p className="text-sm">Aucune notification pour le moment.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {visible.map((n) => {
              const cfg = KIND_CFG[n.kind] ?? KIND_CFG.feature
              return (
                <li key={n.id}>
                  <Link
                    href={n.href}
                    onClick={onClose}
                    className="flex gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
                  >
                    <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${cfg.classes}`}>
                      {cfg.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-foreground">{n.title}</p>
                        <span className="shrink-0 text-[10px] text-muted-foreground">{relativeDate(n.date)}</span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.content}</p>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Pied */}
      <div className="border-t border-border">
        <Link
          href="/dashboard/news"
          onClick={onClose}
          className="block px-4 py-2.5 text-center text-xs font-medium text-primary hover:bg-muted/40"
        >
          Voir toutes les nouveautés
        </Link>
      </div>
    </div>
  )
}
