'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { formatDate } from '@/src/lib/date-utils'
import {
  AlertCircle,
  BookOpen,
  HelpCircle,
  Loader2,
  MessageCircle,
  Pencil,
  Play,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { apiFetch } from '@/src/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// ── Types ──────────────────────────────────────────────────

interface GuideStep { title: string; content: string }

interface HelpGuide {
  id: number
  title: string
  description: string
  steps: GuideStep[]
  order: number
  published: boolean
  createdAt: string
}

interface HelpFaq {
  id: number
  question: string
  answer: string
  order: number
  published: boolean
  createdAt: string
}

interface HelpVideo {
  id: number
  title: string
  description?: string | null
  url: string
  duration?: string | null
  thumbnail?: string | null
  order: number
  published: boolean
  createdAt: string
}

type Tab = 'guides' | 'faqs' | 'videos'

// ── Toggle switch ──────────────────────────────────────────

function Toggle({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      disabled={disabled}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${value ? 'bg-primary' : 'bg-muted-foreground/30'}`}
    >
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${value ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  )
}

// ── Modal shell ────────────────────────────────────────────

function Modal({ title, onClose, onSubmit, disabled, children }: {
  title: string
  onClose: () => void
  onSubmit: () => void
  disabled: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
          <h2 className="text-sm font-medium text-foreground">{title}</h2>
          <button onClick={onClose} className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent">
            <X size={14} />
          </button>
        </div>
        <div className="flex flex-col gap-4 p-4 overflow-y-auto">
          {children}
        </div>
        <div className="flex justify-end gap-2 border-t border-border p-4 shrink-0">
          <Button variant="secondary" onClick={onClose} disabled={disabled}>Annuler</Button>
          <Button onClick={onSubmit} disabled={disabled}>
            {disabled ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Published row ──────────────────────────────────────────

function PublishedRow({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2.5">
      <div>
        <p className="text-sm font-medium text-foreground">Publié</p>
        <p className="text-xs text-muted-foreground">Visible par les admins d'association</p>
      </div>
      <Toggle value={value} onChange={onChange} disabled={disabled} />
    </div>
  )
}

// ── Feedback banner ────────────────────────────────────────

function Feedback({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  return (
    <div className={`flex items-center justify-between rounded-lg px-4 py-2 text-sm ${
      type === 'success' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'
    }`}>
      {message}
      <button onClick={onClose}><X size={13} /></button>
    </div>
  )
}

// ── Row actions ────────────────────────────────────────────

function RowActions({ onEdit, onDelete, disabled }: { onEdit: () => void; onDelete: () => void; disabled: boolean }) {
  return (
    <div className="flex gap-1 shrink-0">
      <button onClick={onEdit} disabled={disabled} title="Modifier"
        className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-40">
        <Pencil size={13} />
      </button>
      <button onClick={onDelete} disabled={disabled} title="Supprimer"
        className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-40">
        <Trash2 size={13} />
      </button>
    </div>
  )
}

// ── GUIDES ─────────────────────────────────────────────────

function GuideFormModal({ initial, onClose, onSaved }: {
  initial?: HelpGuide
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const [title,     setTitle]     = useState(initial?.title ?? '')
  const [description, setDesc]    = useState(initial?.description ?? '')
  const [order,     setOrder]     = useState(initial?.order ?? 1)
  const [published, setPublished] = useState(initial?.published ?? false)
  const [steps,     setSteps]     = useState<GuideStep[]>(initial?.steps ?? [{ title: '', content: '' }])
  const [error,     setError]     = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function addStep() { setSteps(s => [...s, { title: '', content: '' }]) }
  function removeStep(i: number) { setSteps(s => s.filter((_, idx) => idx !== i)) }
  function updateStep(i: number, field: keyof GuideStep, value: string) {
    setSteps(s => s.map((step, idx) => idx === i ? { ...step, [field]: value } : step))
  }

  function submit() {
    if (!title.trim()) { setError('Le titre est obligatoire.'); return }
    const cleanSteps = steps.filter(s => s.title.trim() || s.content.trim())
    setError(null)
    startTransition(async () => {
      const body = { title: title.trim(), description: description.trim(), order, published, steps: cleanSteps }
      const url    = initial ? `/super-admin/help/guides/${initial.id}` : '/super-admin/help/guides'
      const method = initial ? 'PUT' : 'POST'
      const res    = await apiFetch(url, { method, body: JSON.stringify(body) })
      const json   = await res.json()
      if (res.ok) onSaved(json.message ?? (initial ? 'Guide modifié.' : 'Guide créé.'))
      else setError(json.message ?? 'Erreur.')
    })
  }

  return (
    <Modal title={initial ? 'Modifier le guide' : 'Nouveau guide'} onClose={onClose} onSubmit={submit} disabled={isPending}>
      {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <div className="grid gap-1.5">
        <Label htmlFor="g-title">Titre *</Label>
        <Input id="g-title" value={title} onChange={e => setTitle(e.target.value)} disabled={isPending} placeholder="Ex : Configurer votre association" />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="g-desc">Description</Label>
        <textarea id="g-desc" value={description} onChange={e => setDesc(e.target.value)} rows={2} disabled={isPending}
          placeholder="Courte introduction au guide…"
          className="w-full rounded-md border border-input bg-transparent px-2.5 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring resize-none" />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="g-order">Ordre d'affichage</Label>
        <Input id="g-order" type="number" min={1} value={order} onChange={e => setOrder(Number(e.target.value))} disabled={isPending} className="w-24" />
      </div>

      {/* Étapes */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label>Étapes</Label>
          <button onClick={addStep} type="button" className="flex items-center gap-1 text-xs text-primary hover:underline">
            <Plus size={12} /> Ajouter une étape
          </button>
        </div>
        {steps.map((step, i) => (
          <div key={i} className="flex gap-2 rounded-lg border border-border p-3">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary mt-0.5">{i + 1}</div>
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <Input value={step.title} onChange={e => updateStep(i, 'title', e.target.value)} disabled={isPending} placeholder="Titre de l'étape" className="h-8 text-xs" />
              <textarea value={step.content} onChange={e => updateStep(i, 'content', e.target.value)} rows={2} disabled={isPending}
                placeholder="Description de l'étape…"
                className="w-full rounded-md border border-input bg-transparent px-2.5 py-1.5 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring resize-none" />
            </div>
            {steps.length > 1 && (
              <button onClick={() => removeStep(i)} type="button" disabled={isPending}
                className="text-muted-foreground hover:text-destructive transition-colors shrink-0 mt-0.5">
                <X size={13} />
              </button>
            )}
          </div>
        ))}
      </div>

      <PublishedRow value={published} onChange={setPublished} disabled={isPending} />
    </Modal>
  )
}

function GuidesTab({ feedback, setFeedback }: { feedback: { message: string; type: 'success' | 'error' } | null; setFeedback: (f: { message: string; type: 'success' | 'error' } | null) => void }) {
  const [guides,     setGuides]     = useState<HelpGuide[]>([])
  const [isLoading,  setIsLoading]  = useState(true)
  const [error,      setError]      = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [editing,    setEditing]    = useState<HelpGuide | null>(null)
  const [isPending,  startTransition] = useTransition()

  const load = useCallback(async () => {
    setIsLoading(true); setError(null)
    const res = await apiFetch('/super-admin/help/guides')
    if (res.ok) { const json = await res.json(); setGuides(json.data?.guides ?? json.data ?? []) }
    else setError('Impossible de charger les guides.')
    setIsLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function deleteGuide(guide: HelpGuide) {
    if (!confirm(`Supprimer "${guide.title}" ?`)) return
    startTransition(async () => {
      const res = await apiFetch(`/super-admin/help/guides/${guide.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (res.ok) { setFeedback({ message: json.message ?? 'Guide supprimé.', type: 'success' }); setGuides(p => p.filter(g => g.id !== guide.id)) }
      else setFeedback({ message: json.message ?? 'Erreur.', type: 'error' })
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowCreate(true)} className="flex items-center gap-2 h-8 px-3 text-xs">
          <Plus size={13} /> Nouveau guide
        </Button>
      </div>

      {feedback && <Feedback message={feedback.message} type={feedback.type} onClose={() => setFeedback(null)} />}

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground"><Loader2 size={16} className="animate-spin" /> Chargement…</div>
      ) : error ? (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"><AlertCircle size={14} /> {error}</div>
      ) : guides.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
          <BookOpen size={36} strokeWidth={1.5} />
          <p className="text-sm">Aucun guide pour le moment.</p>
          <Button onClick={() => setShowCreate(true)} variant="secondary" className="flex items-center gap-2 text-xs h-8 px-3"><Plus size={13} /> Créer le premier guide</Button>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-xl border border-border overflow-hidden">
          {guides.map(guide => (
            <div key={guide.id} className="flex items-start gap-3 bg-card px-4 py-4 hover:bg-muted/30 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-foreground">{guide.title}</p>
                  <span className="text-[10px] text-muted-foreground">#{guide.order}</span>
                  {!guide.published && <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold bg-muted text-muted-foreground">Brouillon</span>}
                </div>
                {guide.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{guide.description}</p>}
                <p className="text-[10px] text-muted-foreground mt-1">{guide.steps?.length ?? 0} étape{(guide.steps?.length ?? 0) > 1 ? 's' : ''} · Créé le {formatDate(guide.createdAt)}</p>
              </div>
              <RowActions onEdit={() => setEditing(guide)} onDelete={() => deleteGuide(guide)} disabled={isPending} />
            </div>
          ))}
        </div>
      )}

      {showCreate && <GuideFormModal onClose={() => setShowCreate(false)} onSaved={msg => { setShowCreate(false); setFeedback({ message: msg, type: 'success' }); load() }} />}
      {editing    && <GuideFormModal initial={editing} onClose={() => setEditing(null)} onSaved={msg => { setEditing(null); setFeedback({ message: msg, type: 'success' }); load() }} />}
    </div>
  )
}

// ── FAQ ────────────────────────────────────────────────────

function FaqFormModal({ initial, onClose, onSaved }: {
  initial?: HelpFaq
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const [question,  setQuestion]  = useState(initial?.question ?? '')
  const [answer,    setAnswer]    = useState(initial?.answer ?? '')
  const [order,     setOrder]     = useState(initial?.order ?? 1)
  const [published, setPublished] = useState(initial?.published ?? false)
  const [error,     setError]     = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function submit() {
    if (!question.trim()) { setError('La question est obligatoire.'); return }
    if (!answer.trim())   { setError('La réponse est obligatoire.');  return }
    setError(null)
    startTransition(async () => {
      const body = { question: question.trim(), answer: answer.trim(), order, published }
      const url    = initial ? `/super-admin/help/faqs/${initial.id}` : '/super-admin/help/faqs'
      const method = initial ? 'PUT' : 'POST'
      const res    = await apiFetch(url, { method, body: JSON.stringify(body) })
      const json   = await res.json()
      if (res.ok) onSaved(json.message ?? (initial ? 'FAQ modifiée.' : 'FAQ créée.'))
      else setError(json.message ?? 'Erreur.')
    })
  }

  return (
    <Modal title={initial ? 'Modifier la FAQ' : 'Nouvelle question FAQ'} onClose={onClose} onSubmit={submit} disabled={isPending}>
      {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <div className="grid gap-1.5">
        <Label htmlFor="faq-q">Question *</Label>
        <Input id="faq-q" value={question} onChange={e => setQuestion(e.target.value)} disabled={isPending} placeholder="Ex : Comment ajouter un membre ?" />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="faq-a">Réponse *</Label>
        <textarea id="faq-a" value={answer} onChange={e => setAnswer(e.target.value)} rows={5} disabled={isPending}
          placeholder="Réponse détaillée…"
          className="w-full rounded-md border border-input bg-transparent px-2.5 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring resize-none" />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="faq-order">Ordre d'affichage</Label>
        <Input id="faq-order" type="number" min={1} value={order} onChange={e => setOrder(Number(e.target.value))} disabled={isPending} className="w-24" />
      </div>

      <PublishedRow value={published} onChange={setPublished} disabled={isPending} />
    </Modal>
  )
}

function FaqsTab({ feedback, setFeedback }: { feedback: { message: string; type: 'success' | 'error' } | null; setFeedback: (f: { message: string; type: 'success' | 'error' } | null) => void }) {
  const [faqs,       setFaqs]       = useState<HelpFaq[]>([])
  const [isLoading,  setIsLoading]  = useState(true)
  const [error,      setError]      = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [editing,    setEditing]    = useState<HelpFaq | null>(null)
  const [isPending,  startTransition] = useTransition()

  const load = useCallback(async () => {
    setIsLoading(true); setError(null)
    const res = await apiFetch('/super-admin/help/faqs')
    if (res.ok) { const json = await res.json(); setFaqs(json.data?.faqs ?? json.data ?? []) }
    else setError('Impossible de charger les FAQ.')
    setIsLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function deleteFaq(faq: HelpFaq) {
    if (!confirm(`Supprimer "${faq.question}" ?`)) return
    startTransition(async () => {
      const res = await apiFetch(`/super-admin/help/faqs/${faq.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (res.ok) { setFeedback({ message: json.message ?? 'FAQ supprimée.', type: 'success' }); setFaqs(p => p.filter(f => f.id !== faq.id)) }
      else setFeedback({ message: json.message ?? 'Erreur.', type: 'error' })
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowCreate(true)} className="flex items-center gap-2 h-8 px-3 text-xs">
          <Plus size={13} /> Nouvelle question
        </Button>
      </div>

      {feedback && <Feedback message={feedback.message} type={feedback.type} onClose={() => setFeedback(null)} />}

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground"><Loader2 size={16} className="animate-spin" /> Chargement…</div>
      ) : error ? (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"><AlertCircle size={14} /> {error}</div>
      ) : faqs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
          <MessageCircle size={36} strokeWidth={1.5} />
          <p className="text-sm">Aucune FAQ pour le moment.</p>
          <Button onClick={() => setShowCreate(true)} variant="secondary" className="flex items-center gap-2 text-xs h-8 px-3"><Plus size={13} /> Créer la première FAQ</Button>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-xl border border-border overflow-hidden">
          {faqs.map(faq => (
            <div key={faq.id} className="flex items-start gap-3 bg-card px-4 py-4 hover:bg-muted/30 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-foreground">{faq.question}</p>
                  <span className="text-[10px] text-muted-foreground">#{faq.order}</span>
                  {!faq.published && <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold bg-muted text-muted-foreground">Brouillon</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{faq.answer}</p>
                <p className="text-[10px] text-muted-foreground mt-1">Créé le {formatDate(faq.createdAt)}</p>
              </div>
              <RowActions onEdit={() => setEditing(faq)} onDelete={() => deleteFaq(faq)} disabled={isPending} />
            </div>
          ))}
        </div>
      )}

      {showCreate && <FaqFormModal onClose={() => setShowCreate(false)} onSaved={msg => { setShowCreate(false); setFeedback({ message: msg, type: 'success' }); load() }} />}
      {editing    && <FaqFormModal initial={editing} onClose={() => setEditing(null)} onSaved={msg => { setEditing(null); setFeedback({ message: msg, type: 'success' }); load() }} />}
    </div>
  )
}

// ── VIDÉOS ─────────────────────────────────────────────────

function VideoFormModal({ initial, onClose, onSaved }: {
  initial?: HelpVideo
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const [title,       setTitle]       = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [url,         setUrl]         = useState(initial?.url ?? '')
  const [duration,    setDuration]    = useState(initial?.duration ?? '')
  const [thumbnail,   setThumbnail]   = useState(initial?.thumbnail ?? '')
  const [order,       setOrder]       = useState(initial?.order ?? 1)
  const [published,   setPublished]   = useState(initial?.published ?? false)
  const [error,       setError]       = useState<string | null>(null)
  const [isPending,   startTransition] = useTransition()

  function submit() {
    if (!title.trim()) { setError('Le titre est obligatoire.'); return }
    if (!url.trim())   { setError('L\'URL est obligatoire.');   return }
    setError(null)
    startTransition(async () => {
      const body = {
        title: title.trim(),
        description: description.trim() || null,
        url: url.trim(),
        duration: duration.trim() || null,
        thumbnail: thumbnail.trim() || null,
        order,
        published,
      }
      const endpoint = initial ? `/super-admin/help/videos/${initial.id}` : '/super-admin/help/videos'
      const method   = initial ? 'PUT' : 'POST'
      const res      = await apiFetch(endpoint, { method, body: JSON.stringify(body) })
      const json     = await res.json()
      if (res.ok) onSaved(json.message ?? (initial ? 'Vidéo modifiée.' : 'Vidéo créée.'))
      else setError(json.message ?? 'Erreur.')
    })
  }

  return (
    <Modal title={initial ? 'Modifier la vidéo' : 'Nouvelle vidéo'} onClose={onClose} onSubmit={submit} disabled={isPending}>
      {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <div className="grid gap-1.5">
        <Label htmlFor="v-title">Titre *</Label>
        <Input id="v-title" value={title} onChange={e => setTitle(e.target.value)} disabled={isPending} placeholder="Ex : Prise en main de Sigma" />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="v-url">URL de la vidéo *</Label>
        <Input id="v-url" value={url} onChange={e => setUrl(e.target.value)} disabled={isPending} placeholder="https://youtube.com/watch?v=..." />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="v-desc">Description</Label>
        <textarea id="v-desc" value={description} onChange={e => setDescription(e.target.value)} rows={2} disabled={isPending}
          placeholder="Courte description du contenu…"
          className="w-full rounded-md border border-input bg-transparent px-2.5 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring resize-none" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="v-duration">Durée</Label>
          <Input id="v-duration" value={duration} onChange={e => setDuration(e.target.value)} disabled={isPending} placeholder="3:24" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="v-order">Ordre</Label>
          <Input id="v-order" type="number" min={1} value={order} onChange={e => setOrder(Number(e.target.value))} disabled={isPending} />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="v-thumb">URL miniature</Label>
        <Input id="v-thumb" value={thumbnail} onChange={e => setThumbnail(e.target.value)} disabled={isPending} placeholder="https://img.youtube.com/vi/.../hqdefault.jpg" />
      </div>

      <PublishedRow value={published} onChange={setPublished} disabled={isPending} />
    </Modal>
  )
}

function VideosTab({ feedback, setFeedback }: { feedback: { message: string; type: 'success' | 'error' } | null; setFeedback: (f: { message: string; type: 'success' | 'error' } | null) => void }) {
  const [videos,     setVideos]     = useState<HelpVideo[]>([])
  const [isLoading,  setIsLoading]  = useState(true)
  const [error,      setError]      = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [editing,    setEditing]    = useState<HelpVideo | null>(null)
  const [isPending,  startTransition] = useTransition()

  const load = useCallback(async () => {
    setIsLoading(true); setError(null)
    const res = await apiFetch('/super-admin/help/videos')
    if (res.ok) { const json = await res.json(); setVideos(json.data?.videos ?? json.data ?? []) }
    else setError('Impossible de charger les vidéos.')
    setIsLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function deleteVideo(video: HelpVideo) {
    if (!confirm(`Supprimer "${video.title}" ?`)) return
    startTransition(async () => {
      const res = await apiFetch(`/super-admin/help/videos/${video.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (res.ok) { setFeedback({ message: json.message ?? 'Vidéo supprimée.', type: 'success' }); setVideos(p => p.filter(v => v.id !== video.id)) }
      else setFeedback({ message: json.message ?? 'Erreur.', type: 'error' })
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowCreate(true)} className="flex items-center gap-2 h-8 px-3 text-xs">
          <Plus size={13} /> Nouvelle vidéo
        </Button>
      </div>

      {feedback && <Feedback message={feedback.message} type={feedback.type} onClose={() => setFeedback(null)} />}

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground"><Loader2 size={16} className="animate-spin" /> Chargement…</div>
      ) : error ? (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"><AlertCircle size={14} /> {error}</div>
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
          <Play size={36} strokeWidth={1.5} />
          <p className="text-sm">Aucune vidéo pour le moment.</p>
          <Button onClick={() => setShowCreate(true)} variant="secondary" className="flex items-center gap-2 text-xs h-8 px-3"><Plus size={13} /> Ajouter la première vidéo</Button>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-xl border border-border overflow-hidden">
          {videos.map(video => (
            <div key={video.id} className="flex items-start gap-3 bg-card px-4 py-4 hover:bg-muted/30 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-foreground">{video.title}</p>
                  <span className="text-[10px] text-muted-foreground">#{video.order}</span>
                  {video.duration && <span className="text-[10px] text-muted-foreground">{video.duration}</span>}
                  {!video.published && <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold bg-muted text-muted-foreground">Brouillon</span>}
                </div>
                {video.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{video.description}</p>}
                <p className="text-[10px] text-muted-foreground mt-1 truncate">{video.url}</p>
              </div>
              <RowActions onEdit={() => setEditing(video)} onDelete={() => deleteVideo(video)} disabled={isPending} />
            </div>
          ))}
        </div>
      )}

      {showCreate && <VideoFormModal onClose={() => setShowCreate(false)} onSaved={msg => { setShowCreate(false); setFeedback({ message: msg, type: 'success' }); load() }} />}
      {editing    && <VideoFormModal initial={editing} onClose={() => setEditing(null)} onSaved={msg => { setEditing(null); setFeedback({ message: msg, type: 'success' }); load() }} />}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'guides', label: 'Guides',  icon: <BookOpen     size={15} /> },
  { id: 'faqs',   label: 'FAQ',     icon: <MessageCircle size={15} /> },
  { id: 'videos', label: 'Vidéos',  icon: <Play          size={15} /> },
]

export default function SuperAdminAidePage() {
  const [activeTab, setActiveTab] = useState<Tab>('guides')
  const [feedback, setFeedback]   = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  return (
    <div className="flex flex-col gap-6">

      {/* En-tête */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <HelpCircle size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Tutoriels & Aide</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gérez les ressources d'aide pour les admins d'association</p>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setFeedback(null) }}
            className={[
              'flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenu */}
      {activeTab === 'guides' && <GuidesTab feedback={feedback} setFeedback={setFeedback} />}
      {activeTab === 'faqs'   && <FaqsTab   feedback={feedback} setFeedback={setFeedback} />}
      {activeTab === 'videos' && <VideosTab  feedback={feedback} setFeedback={setFeedback} />}

    </div>
  )
}
