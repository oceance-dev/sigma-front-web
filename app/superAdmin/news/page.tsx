'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { Newspaper, Pencil, Plus, Trash2, X, Loader2, AlertCircle } from 'lucide-react'
import { apiFetch } from '@/src/lib/api-client'
import { formatDate } from '@/src/lib/date-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// ── Types ──────────────────────────────────────────────────

type NewsCategory = 'feature' | 'improvement' | 'fix'

interface NewsEntry {
  id:          number
  title:       string
  content:     string
  category:    NewsCategory
  publishedAt: string | null
  createdAt:   string
}

// ── Config catégories ──────────────────────────────────────

const CATEGORIES: { value: NewsCategory; label: string; classes: string }[] = [
  { value: 'feature',     label: 'Nouveauté',    classes: 'bg-primary/10 text-primary' },
  { value: 'improvement', label: 'Amélioration', classes: 'bg-blue-100 text-blue-700' },
  { value: 'fix',         label: 'Correction',   classes: 'bg-amber-100 text-amber-700' },
]

function CategoryBadge({ category }: { category: NewsCategory }) {
  const cfg = CATEGORIES.find((c) => c.value === category) ?? CATEGORIES[0]
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.classes}`}>{cfg.label}</span>
}


// ── Modal formulaire ───────────────────────────────────────

function NewsFormModal({ initial, onClose, onSaved }: {
  initial?: NewsEntry
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const [title,     setTitle]     = useState(initial?.title ?? '')
  const [content,   setContent]   = useState(initial?.content ?? '')
  const [category,  setCategory]  = useState<NewsCategory>(initial?.category ?? 'feature')
  const [published, setPublished] = useState(!!initial?.publishedAt)
  const [error,     setError]     = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function submit() {
    if (!title.trim())   { setError('Le titre est obligatoire.'); return }
    if (!content.trim()) { setError('Le contenu est obligatoire.'); return }
    setError(null)
    startTransition(async () => {
      const body = { title: title.trim(), content: content.trim(), category, published }
      const url    = initial ? `/super-admin/news/${initial.id}` : '/super-admin/news'
      const method = initial ? 'PUT' : 'POST'
      const res    = await apiFetch(url, { method, body: JSON.stringify(body) })
      const json   = await res.json()
      if (res.ok) onSaved(json.message ?? (initial ? 'Article modifié.' : 'Article créé.'))
      else setError(json.message ?? 'Erreur.')
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-xl flex flex-col max-h-[90vh]">

        <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
          <h2 className="text-sm font-medium text-foreground">
            {initial ? 'Modifier l\'article' : 'Nouvel article'}
          </h2>
          <button onClick={onClose} className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent">
            <X size={14} />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-4 overflow-y-auto">
          {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          <div className="grid gap-1.5">
            <Label htmlFor="news-title">Titre *</Label>
            <Input id="news-title" value={title} onChange={(e) => setTitle(e.target.value)} disabled={isPending} placeholder="Ex : Nouvelle fonctionnalité de gestion des documents" />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="news-category">Catégorie *</Label>
            <select
              id="news-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as NewsCategory)}
              disabled={isPending}
              className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="news-content">Contenu *</Label>
            <textarea
              id="news-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              disabled={isPending}
              placeholder="Décrivez les changements apportés…"
              className="w-full rounded-md border border-input bg-transparent px-2.5 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring resize-none"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2.5">
            <div>
              <p className="text-sm font-medium text-foreground">Publié</p>
              <p className="text-xs text-muted-foreground">Visible par tous les utilisateurs</p>
            </div>
            <button
              type="button"
              onClick={() => setPublished((v) => !v)}
              disabled={isPending}
              className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${published ? 'bg-primary' : 'bg-muted-foreground/30'}`}
            >
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${published ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border p-4 shrink-0">
          <Button variant="secondary" onClick={onClose} disabled={isPending}>Annuler</Button>
          <Button onClick={submit} disabled={isPending || !title.trim() || !content.trim()}>
            {isPending ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────

export default function SuperAdminNewsPage() {
  const [entries,    setEntries]    = useState<NewsEntry[]>([])
  const [isLoading,  setIsLoading]  = useState(true)
  const [error,      setError]      = useState<string | null>(null)
  const [feedback,   setFeedback]   = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [editing,    setEditing]    = useState<NewsEntry | null>(null)
  const [isPending,  startTransition] = useTransition()

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const res = await apiFetch('/super-admin/news')
    if (res.ok) {
      const json = await res.json()
      setEntries(json.data?.entries ?? json.data ?? [])
    } else {
      setError('Impossible de charger les articles.')
    }
    setIsLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function deleteEntry(entry: NewsEntry) {
    if (!confirm(`Supprimer "${entry.title}" ?`)) return
    startTransition(async () => {
      const res  = await apiFetch(`/super-admin/news/${entry.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (res.ok) {
        setFeedback({ message: json.message ?? 'Article supprimé.', type: 'success' })
        setEntries((prev) => prev.filter((e) => e.id !== entry.id))
      } else {
        setFeedback({ message: json.message ?? 'Erreur.', type: 'error' })
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">

      {/* En-tête */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Newspaper size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Nouveautés</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Informez les utilisateurs des changements de l'application</p>
          </div>
        </div>
        <Button onClick={() => setShowCreate(true)} className="flex items-center gap-2 h-8 px-3 text-xs">
          <Plus size={13} /> Nouvel article
        </Button>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`flex items-center justify-between rounded-lg px-4 py-2 text-sm ${
          feedback.type === 'success' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'
        }`}>
          {feedback.message}
          <button onClick={() => setFeedback(null)}><X size={13} /></button>
        </div>
      )}

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
          <p className="text-sm">Aucun article pour le moment.</p>
          <Button onClick={() => setShowCreate(true)} variant="secondary" className="flex items-center gap-2 text-xs h-8 px-3">
            <Plus size={13} /> Créer le premier article
          </Button>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-xl border border-border overflow-hidden">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-start gap-3 bg-card px-4 py-4 hover:bg-muted/30 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-foreground">{entry.title}</p>
                  <CategoryBadge category={entry.category} />
                  {!entry.publishedAt && (
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold bg-muted text-muted-foreground">Brouillon</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{entry.content}</p>
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  {entry.publishedAt ? `Publié le ${formatDate(entry.publishedAt)}` : `Créé le ${formatDate(entry.createdAt)}`}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => setEditing(entry)}
                  disabled={isPending}
                  title="Modifier"
                  className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-40"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => deleteEntry(entry)}
                  disabled={isPending}
                  title="Supprimer"
                  className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-40"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <NewsFormModal
          onClose={() => setShowCreate(false)}
          onSaved={(msg) => { setShowCreate(false); setFeedback({ message: msg, type: 'success' }); load() }}
        />
      )}
      {editing && (
        <NewsFormModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={(msg) => { setEditing(null); setFeedback({ message: msg, type: 'success' }); load() }}
        />
      )}
    </div>
  )
}
