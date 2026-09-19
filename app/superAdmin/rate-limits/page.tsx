'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Activity,
  AlertCircle,
  EyeOff,
  HelpCircle,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  Trash2,
  Unlock,
  X,
} from 'lucide-react'
import { apiFetch } from '@/src/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// ── Types ──────────────────────────────────────────────────

type RateLimitIdentity =
  | { type: 'user'; userId: string; fullName: string | null; email: string | null }
  | { type: 'email'; email: string }
  | { type: 'ip'; ip: string }
  | { type: 'unknown' }

interface RateLimitEntry {
  key: string
  points: number
  expiresAt: string | null
  expired: boolean
  throttle: string | null
  identity: RateLimitIdentity
}

const NO_THROTTLE = '__none__'

// ── Helpers ────────────────────────────────────────────────

function fmtExpiry(entry: RateLimitEntry): string {
  if (!entry.expiresAt) return '—'
  return new Date(entry.expiresAt).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

// btoa seul casse une URL (le base64 peut contenir '/' et '+') — on l'encode en plus pour
// l'utiliser comme segment de chemin.
function keyToParam(key: string): string {
  return encodeURIComponent(btoa(key))
}

function identityLabel(identity: RateLimitIdentity): string {
  switch (identity.type) {
    case 'user':    return identity.fullName ?? identity.email ?? 'cet utilisateur'
    case 'email':   return identity.email
    case 'ip':      return `l'IP ${identity.ip}`
    case 'unknown': return 'cette entrée'
  }
}

// Texte de recherche libre : tout ce qui identifie visuellement la ligne, quel que soit le
// type d'identité.
function identitySearchText(entry: RateLimitEntry): string {
  const i = entry.identity
  if (i.type === 'user') return `${i.fullName ?? ''} ${i.email ?? ''}`.toLowerCase()
  if (i.type === 'email') return i.email.toLowerCase()
  if (i.type === 'ip') return i.ip.toLowerCase()
  return entry.key.toLowerCase()
}

// ── Page ───────────────────────────────────────────────────

export default function RateLimitsPage() {
  const [entries,   setEntries]   = useState<RateLimitEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const [feedback,  setFeedback]  = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [search,    setSearch]    = useState('')
  const [throttleFilter, setThrottleFilter] = useState('')
  const [showResetAll, setShowResetAll] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const res = await apiFetch('/super-admin/rate-limits')
    if (res.ok) {
      const json = await res.json()
      setEntries(Array.isArray(json.data) ? json.data : [])
    } else {
      setError('Impossible de charger les rate limits.')
    }
    setIsLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const throttleOptions = useMemo(() => {
    const set = new Set<string>()
    entries.forEach((e) => set.add(e.throttle ?? NO_THROTTLE))
    return Array.from(set).sort((a, b) => (a === NO_THROTTLE ? 1 : b === NO_THROTTLE ? -1 : a.localeCompare(b)))
  }, [entries])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return entries.filter((e) => {
      if (throttleFilter && (e.throttle ?? NO_THROTTLE) !== throttleFilter) return false
      if (q && !identitySearchText(e).includes(q)) return false
      return true
    })
  }, [entries, search, throttleFilter])

  function unblock(entry: RateLimitEntry) {
    if (!confirm(`Débloquer ${identityLabel(entry.identity)} ?`)) return
    startTransition(async () => {
      const res = await apiFetch(`/super-admin/rate-limits/${keyToParam(entry.key)}`, { method: 'DELETE' })
      const json = await res.json().catch(() => ({}))
      if (res.ok) {
        setFeedback({ message: json.message ?? 'Entrée débloquée.', type: 'success' })
        setEntries((prev) => prev.filter((e) => e.key !== entry.key))
      } else {
        setFeedback({ message: json.message ?? 'Erreur.', type: 'error' })
      }
    })
  }

  const expiredCount = entries.filter((e) => e.expired).length
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
            <p className="text-sm text-muted-foreground mt-0.5">Visualisez et débloquez les limitations de requêtes actives</p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="secondary" onClick={load} disabled={isLoading} className="flex items-center gap-2 h-8 px-3 text-xs">
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} /> Actualiser
          </Button>
          {entries.length > 0 && (
            <Button
              onClick={() => setShowResetAll(true)}
              disabled={isPending}
              className="flex items-center gap-2 h-8 px-3 text-xs bg-destructive text-white hover:bg-destructive/90"
            >
              <Trash2 size={13} /> Tout réinitialiser
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

      {/* ── Filtres ─────────────────────────────────────── */}
      {!isLoading && !error && entries.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un nom, un email, une IP…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={throttleFilter}
            onChange={(e) => setThrottleFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">Toutes les actions</option>
            {throttleOptions.map((t) => (
              <option key={t} value={t}>{t === NO_THROTTLE ? 'Non catégorisé' : t}</option>
            ))}
          </select>
          {(search || throttleFilter) && (
            <p className="self-center text-sm text-muted-foreground">{filtered.length} résultat{filtered.length > 1 ? 's' : ''}</p>
          )}
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
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
          <Search size={36} strokeWidth={1.5} />
          <p className="text-sm">Aucun résultat pour ces filtres.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Qui</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-24">Tentatives</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-44">Expire</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((entry) => (
                <tr key={entry.key} className="bg-card hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-foreground">
                    {entry.throttle ?? <span className="text-muted-foreground italic">Non catégorisé</span>}
                  </td>
                  <td className="px-4 py-3">
                    <IdentityCell entry={entry} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold text-foreground">{entry.points}</span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {entry.expired ? (
                      <span className="font-medium text-destructive">Expiré</span>
                    ) : (
                      <span className="text-muted-foreground">{fmtExpiry(entry)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => unblock(entry)}
                      disabled={isPending}
                      title="Débloquer"
                      className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-40"
                    >
                      <Unlock size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showResetAll && (
        <ResetAllModal
          onClose={() => setShowResetAll(false)}
          onConfirmed={(msg) => {
            setShowResetAll(false)
            setFeedback({ message: msg, type: 'success' })
            setEntries([])
          }}
        />
      )}
    </div>
  )
}

// ── IdentityCell ───────────────────────────────────────────

function IdentityCell({ entry }: { entry: RateLimitEntry }) {
  const identity = entry.identity

  if (identity.type === 'user') {
    return (
      <Link
        href={`/superAdmin/users?userId=${identity.userId}`}
        className="group flex flex-col hover:underline underline-offset-2"
      >
        <span className="text-sm font-medium text-foreground group-hover:text-primary">
          {identity.fullName ?? 'Compte supprimé'}
        </span>
        {identity.email && <span className="text-xs text-muted-foreground">{identity.email}</span>}
      </Link>
    )
  }

  if (identity.type === 'email') {
    return (
      <div
        className="flex items-center gap-1.5"
        title="Email saisi avant connexion (ex : tentative d'inscription ou de renvoi de code échouée plusieurs fois)"
      >
        <Mail size={13} className="text-muted-foreground shrink-0" />
        <span className="text-sm text-foreground">{identity.email}</span>
      </div>
    )
  }

  if (identity.type === 'ip') {
    return (
      <div
        className="flex items-center gap-1.5"
        title="Action sensible (connexion, mot de passe oublié…) volontairement limitée par IP seule, pour ne pas révéler si un compte existe."
      >
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground shrink-0 flex items-center gap-1">
          <EyeOff size={10} /> Anonyme
        </span>
        <span className="font-mono text-xs text-foreground">{identity.ip}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 text-muted-foreground" title="Identité non résolue">
      <HelpCircle size={13} className="shrink-0" />
      <span className="font-mono text-[11px] break-all">{entry.key}</span>
    </div>
  )
}

// ── ResetAllModal ────────────────────────────────────────────

const RESET_CONFIRM_WORD = 'RESET'

function ResetAllModal({ onClose, onConfirmed }: {
  onClose: () => void
  onConfirmed: (message: string) => void
}) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function confirmReset() {
    setError(null)
    startTransition(async () => {
      const res = await apiFetch('/super-admin/rate-limits', { method: 'DELETE' })
      const json = await res.json().catch(() => ({}))
      if (res.ok) onConfirmed(json.message ?? 'Tous les rate limits ont été réinitialisés.')
      else setError(json.message ?? 'Une erreur est survenue.')
    })
  }

  const canConfirm = text.trim().toUpperCase() === RESET_CONFIRM_WORD

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !isPending) onClose() }}
    >
      <div className="w-full max-w-sm rounded-xl border border-destructive/30 bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-medium text-destructive">Réinitialiser tous les rate limits ?</h2>
          <button onClick={onClose} disabled={isPending} className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent disabled:opacity-40">
            <X size={14} />
          </button>
        </div>

        <div className="flex flex-col gap-3 p-4">
          <p className="text-sm text-muted-foreground">
            Cette action débloque <strong className="text-foreground">immédiatement toutes</strong> les personnes et IP actuellement limitées, sur toute la plateforme. Irréversible.
          </p>

          <div className="grid gap-1.5">
            <Label htmlFor="reset-confirm">
              Tapez <span className="font-mono font-semibold text-foreground">{RESET_CONFIRM_WORD}</span> pour confirmer
            </Label>
            <Input
              id="reset-confirm"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isPending}
              autoFocus
              autoComplete="off"
            />
          </div>

          {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>Annuler</Button>
            <Button type="button" variant="destructive" onClick={confirmReset} disabled={isPending || !canConfirm}>
              {isPending ? 'Réinitialisation…' : 'Tout réinitialiser'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
