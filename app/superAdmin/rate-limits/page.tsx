'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { Activity, AlertCircle, Clock, Loader2, RefreshCw, Trash2, X } from 'lucide-react'
import { apiFetch } from '@/src/lib/api-client'
import { Button } from '@/components/ui/button'

// ── Types ──────────────────────────────────────────────────

interface RateLimitEntry {
  key:       string
  keyB64:    string
  attempts:  number
  expiresAt: string | null
  ttl:       number | null
  isExpired: boolean
}

// ── Helpers ────────────────────────────────────────────────

function fmtExpiry(entry: RateLimitEntry): string {
  if (entry.isExpired) return 'Expiré'
  if (!entry.expiresAt) return '—'
  const d = new Date(entry.expiresAt)
  return d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function fmtTtl(ttl: number | null): string {
  if (ttl === null) return '—'
  if (ttl <= 0) return 'Expiré'
  if (ttl < 60) return `${ttl}s`
  if (ttl < 3600) return `${Math.floor(ttl / 60)}min ${ttl % 60}s`
  return `${Math.floor(ttl / 3600)}h ${Math.floor((ttl % 3600) / 60)}min`
}

// ── Page ───────────────────────────────────────────────────

export default function RateLimitsPage() {
  const [entries,   setEntries]   = useState<RateLimitEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const [feedback,  setFeedback]  = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [isPending, startTransition] = useTransition()

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const res = await apiFetch('/super-admin/rate-limits')
    if (res.ok) {
      const json = await res.json()
      const raw = json.data?.entries ?? json.data ?? []
      setEntries(Array.isArray(raw) ? raw : [])
    } else {
      setError('Impossible de charger les rate limits.')
    }
    setIsLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function deleteOne(keyB64: string, key: string) {
    if (!confirm(`Supprimer l'entrée "${key}" ?`)) return
    startTransition(async () => {
      const res = await apiFetch(`/super-admin/rate-limits/${keyB64}`, { method: 'DELETE' })
      const json = await res.json()
      if (res.ok) {
        setFeedback({ message: json.message ?? 'Entrée supprimée.', type: 'success' })
        setEntries((prev) => prev.filter((e) => e.keyB64 !== keyB64))
      } else {
        setFeedback({ message: json.message ?? 'Erreur.', type: 'error' })
      }
    })
  }

  function deleteAll() {
    if (!confirm('Vider toute la table des rate limits ?')) return
    startTransition(async () => {
      const res = await apiFetch('/super-admin/rate-limits', { method: 'DELETE' })
      const json = await res.json()
      if (res.ok) {
        setFeedback({ message: json.message ?? 'Table vidée.', type: 'success' })
        setEntries([])
      } else {
        setFeedback({ message: json.message ?? 'Erreur.', type: 'error' })
      }
    })
  }

  const expiredCount = entries.filter((e) => e.isExpired).length
  const activeCount  = entries.length - expiredCount

  return (
    <div className="flex flex-col gap-6">

      {/* ── En-tête ─────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Activity size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Rate Limits</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Visualisez et réinitialisez les limitations de requêtes</p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="secondary" onClick={load} disabled={isLoading} className="flex items-center gap-2 h-8 px-3 text-xs">
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} /> Actualiser
          </Button>
          {entries.length > 0 && (
            <Button
              onClick={deleteAll}
              disabled={isPending}
              className="flex items-center gap-2 h-8 px-3 text-xs bg-destructive text-white hover:bg-destructive/90"
            >
              <Trash2 size={13} /> Vider tout
            </Button>
          )}
        </div>
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

      {/* ── Stats ───────────────────────────────────────── */}
      {!isLoading && !error && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-2xl font-bold text-foreground">{entries.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total entrées</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-2xl font-bold text-primary">{activeCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Actives</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-2xl font-bold text-muted-foreground">{expiredCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Expirées</p>
          </div>
        </div>
      )}

      {/* ── Contenu ─────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 size={16} className="animate-spin" /> Chargement…
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle size={14} className="shrink-0" /> {error}
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
          <Activity size={36} strokeWidth={1.5} />
          <p className="text-sm">Aucune entrée de rate limit.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Clé</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-24">Tentatives</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-36">TTL restant</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-44">Expiration</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-20">Statut</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.map((entry, idx) => (
                <tr key={entry.keyB64 ?? idx} className="bg-card hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs text-foreground break-all">{entry.key}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold text-foreground">{entry.attempts}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock size={12} className="shrink-0" />
                      {fmtTtl(entry.ttl)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {fmtExpiry(entry)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      entry.isExpired
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {entry.isExpired ? 'Expirée' : 'Active'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => deleteOne(entry.keyB64, entry.key)}
                      disabled={isPending}
                      title="Supprimer"
                      className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-40"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
