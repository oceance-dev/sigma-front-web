'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  AlertCircle,
  BookOpen,
  ChevronDown,
  ExternalLink,
  HelpCircle,
  Loader2,
  Mail,
  MessageCircle,
  Play,
} from 'lucide-react'
import { apiFetch } from '@/src/lib/api-client'
import { Button } from '@/components/ui/button'

// ── Types ──────────────────────────────────────────────────

interface GuideStep {
  title: string
  content: string
}

interface HelpGuide {
  id: number
  title: string
  description: string
  steps: GuideStep[]
}

interface HelpFaq {
  id: number
  question: string
  answer: string
}

interface HelpVideo {
  id: number
  title: string
  description?: string | null
  url: string
  duration?: string | null
  thumbnail?: string | null
}

// ── Guide ──────────────────────────────────────────────────

function GuideCard({ guide }: { guide: HelpGuide }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-muted/40 transition-colors"
      >
        <p className="text-sm font-semibold text-foreground">{guide.title}</p>
        <ChevronDown
          size={15}
          className={`shrink-0 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="border-t border-border px-4 py-4 flex flex-col gap-4">
          {guide.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{guide.description}</p>
          )}
          {guide.steps?.length > 0 && (
            <div className="flex flex-col gap-3">
              {guide.steps.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </div>
                  <div className="flex flex-col gap-0.5 pt-0.5 min-w-0">
                    <p className="text-sm font-medium text-foreground">{step.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{step.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── FAQ ────────────────────────────────────────────────────

function FaqItem({ faq }: { faq: HelpFaq }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-muted/40 transition-colors"
      >
        <p className="text-sm font-medium text-foreground">{faq.question}</p>
        <ChevronDown
          size={15}
          className={`shrink-0 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="border-t border-border px-4 py-3">
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{faq.answer}</p>
        </div>
      )}
    </div>
  )
}

// ── Vidéo ──────────────────────────────────────────────────

function VideoCard({ video }: { video: HelpVideo }) {
  return (
    <a
      href={video.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:border-primary/40 hover:shadow-sm transition-all"
    >
      <div className="relative aspect-video bg-muted flex items-center justify-center overflow-hidden">
        {video.thumbnail ? (
          <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
        ) : (
          <Play size={28} className="text-muted-foreground" />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90">
            <Play size={16} className="text-foreground ml-0.5" />
          </div>
        </div>
        {video.duration && (
          <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
            {video.duration}
          </span>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-foreground leading-tight">{video.title}</p>
          <ExternalLink size={12} className="shrink-0 text-muted-foreground mt-0.5" />
        </div>
        {video.description && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{video.description}</p>
        )}
      </div>
    </a>
  )
}

// ── Section ────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-primary">{icon}</span>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <div className="flex-1 h-px bg-border" />
      </div>
      {children}
    </div>
  )
}

function Empty({ label }: { label: string }) {
  return <p className="text-sm text-muted-foreground py-1">{label}</p>
}

// ── Page ───────────────────────────────────────────────────

export default function AidePage() {
  const [guides,  setGuides]  = useState<HelpGuide[]>([])
  const [faqs,    setFaqs]    = useState<HelpFaq[]>([])
  const [videos,  setVideos]  = useState<HelpVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [guidesRes, faqsRes, videosRes] = await Promise.allSettled([
      apiFetch('/help/guides').then(r => r.json()),
      apiFetch('/help/faqs').then(r => r.json()),
      apiFetch('/help/videos').then(r => r.json()),
    ])

    const allFailed =
      guidesRes.status === 'rejected' &&
      faqsRes.status   === 'rejected' &&
      videosRes.status === 'rejected'

    if (allFailed) {
      setError('Impossible de charger les ressources d\'aide.')
    } else {
      if (guidesRes.status === 'fulfilled') setGuides(guidesRes.value.data?.guides ?? guidesRes.value.data ?? [])
      if (faqsRes.status   === 'fulfilled') setFaqs(faqsRes.value.data?.faqs     ?? faqsRes.value.data   ?? [])
      if (videosRes.status === 'fulfilled') setVideos(videosRes.value.data?.videos ?? videosRes.value.data ?? [])
    }

    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="flex flex-col gap-8 max-w-2xl">

      {/* En-tête */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <HelpCircle size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Tutoriels & Aide</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Guides et ressources pour gérer votre association</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 size={16} className="animate-spin" /> Chargement…
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle size={14} /> {error}
        </div>
      ) : (
        <div className="flex flex-col gap-8">

          {/* Guide de démarrage */}
          <Section title="Guide de démarrage" icon={<BookOpen size={16} />}>
            {guides.length === 0
              ? <Empty label="Aucun guide disponible pour le moment." />
              : guides.map(g => <GuideCard key={g.id} guide={g} />)
            }
          </Section>

          {/* FAQ */}
          <Section title="Questions fréquentes" icon={<MessageCircle size={16} />}>
            {faqs.length === 0
              ? <Empty label="Aucune question fréquente disponible pour le moment." />
              : faqs.map(f => <FaqItem key={f.id} faq={f} />)
            }
          </Section>

          {/* Vidéos */}
          <Section title="Vidéos tutoriels" icon={<Play size={16} />}>
            {videos.length === 0
              ? <Empty label="Aucune vidéo disponible pour le moment." />
              : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {videos.map(v => <VideoCard key={v.id} video={v} />)}
                </div>
              )
            }
          </Section>

          {/* Contact / Support */}
          <Section title="Contacter le support" icon={<Mail size={16} />}>
            <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Vous avez une question ou rencontrez un problème ? Notre équipe est disponible pour vous accompagner.
              </p>
              <a href="mailto:contact.sigma.cloud@gmail.com">
                <Button variant="secondary" className="h-9 text-sm flex items-center gap-2 w-fit">
                  <Mail size={14} /> Envoyer un e-mail
                </Button>
              </a>
            </div>
          </Section>

        </div>
      )}
    </div>
  )
}
