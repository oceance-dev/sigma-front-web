'use client'

import { apiFetch } from '@/src/lib/api-client'
import { useAuth } from '@/src/context/auth-context'
import { useEffect, useState, useTransition } from 'react'
import { z } from 'zod'
import Link from 'next/link'
import {
  ArrowRight,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  FolderOpen,
  Loader2,
  Receipt,
  Shield,
  Upload,
  UserCheck,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Member } from '@/src/types/member'
import OnboardingChecklist from '@/components/OnboardingChecklist'
import EmailVerificationBanner from '@/components/EmailVerificationBanner'

// ── Helpers ────────────────────────────────────────────────

function greeting() {
  return new Date().getHours() >= 18 ? 'Bonsoir' : 'Bonjour'
}

// ── Calendrier ─────────────────────────────────────────────

const FR_DAYS   = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const FR_MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

interface CalendarEvent {
  id: string | number
  title: string
  date: string
  time?: string | null
  description?: string | null
  type?: 'training' | 'meeting' | 'ceremony' | 'other' | string
}

const EVENT_COLORS: Record<string, string> = {
  training: 'bg-blue-500',
  meeting:  'bg-purple-500',
  ceremony: 'bg-amber-500',
  other:    'bg-slate-400',
}

function dotColor(type?: string) {
  return EVENT_COLORS[type ?? 'other'] ?? EVENT_COLORS.other
}

import { toDateStr } from '@/src/lib/date-utils'

function MiniCalendar() {
  const today = new Date()
  const [current,  setCurrent]  = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selected, setSelected] = useState(() => toDateStr(today))
  const [events,   setEvents]   = useState<CalendarEvent[]>([])
  const [loading,  setLoading]  = useState(true)

  const year  = current.getFullYear()
  const month = current.getMonth()

  useEffect(() => {
    setLoading(true)
    apiFetch(`/events?month=${month + 1}&year=${year}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!json) return
        const list = json.data?.events ?? json.data?.items ?? json.data ?? []
        setEvents(Array.isArray(list) ? list : [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [month, year])

  const offset      = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrev  = new Date(year, month, 0).getDate()

  type Cell = { day: number; own: boolean; dateStr: string }
  const cells: Cell[] = []

  for (let i = offset - 1; i >= 0; i--) {
    const d = daysInPrev - i
    const m = month === 0 ? 12 : month
    const y = month === 0 ? year - 1 : year
    cells.push({ day: d, own: false, dateStr: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, own: true, dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` })
  }
  const tail = 42 - cells.length
  for (let d = 1; d <= tail; d++) {
    const nm = month + 2 > 12 ? 1 : month + 2
    const ny = month + 2 > 12 ? year + 1 : year
    cells.push({ day: d, own: false, dateStr: `${ny}-${String(nm).padStart(2, '0')}-${String(d).padStart(2, '0')}` })
  }

  const byDate     = events.reduce<Record<string, CalendarEvent[]>>((acc, e) => {
    const k = e.date.slice(0, 10)
    acc[k]  = [...(acc[k] ?? []), e]
    return acc
  }, {})

  const todayStr     = toDateStr(today)
  const selectedEvts = byDate[selected] ?? []
  const selDate      = new Date(`${selected}T12:00:00`)
  const selLabel     = `${FR_DAYS[(selDate.getDay() + 6) % 7]} ${selDate.getDate()} ${FR_MONTHS[selDate.getMonth()]} ${selDate.getFullYear()}`

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button onClick={() => setCurrent(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
          <ChevronLeft size={15} />
        </button>
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-primary" />
          <p className="text-sm font-semibold text-foreground capitalize">{FR_MONTHS[month]} {year}</p>
        </div>
        <button onClick={() => setCurrent(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
          <ChevronRight size={15} />
        </button>
      </div>

      <div className="p-3 flex flex-col gap-3">
        <div className="grid grid-cols-7 text-center">
          {FR_DAYS.map(d => <p key={d} className="text-[10px] font-semibold text-muted-foreground py-1">{d}</p>)}
        </div>
        <div className="grid grid-cols-7 gap-y-0.5">
          {cells.map((cell, i) => {
            const isToday    = cell.dateStr === todayStr && cell.own
            const isSelected = cell.dateStr === selected
            const hasEvts    = !!byDate[cell.dateStr]?.length
            const dot        = byDate[cell.dateStr]?.[0] ? dotColor(byDate[cell.dateStr][0].type) : ''
            return (
              <button key={i} onClick={() => setSelected(cell.dateStr)}
                className={[
                  'relative flex flex-col items-center justify-center h-8 rounded-md text-xs transition-colors',
                  !cell.own                               ? 'text-muted-foreground/35'                          : '',
                  isSelected                              ? 'bg-primary text-primary-foreground font-semibold'  : '',
                  !isSelected && isToday                  ? 'ring-1 ring-primary text-primary font-semibold'    : '',
                  !isSelected && !isToday && cell.own     ? 'hover:bg-muted/60 text-foreground'                 : '',
                ].join(' ')}
              >
                {cell.day}
                {hasEvts && <span className={`absolute bottom-0.5 h-1 w-1 rounded-full ${isSelected ? 'bg-primary-foreground/70' : dot}`} />}
              </button>
            )
          })}
        </div>
        <div className="border-t border-border pt-3 flex flex-col gap-2 min-h-[72px]">
          <p className="text-xs font-semibold text-muted-foreground capitalize">{selLabel}</p>
          {loading ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 size={12} className="animate-spin" /> Chargement…
            </div>
          ) : selectedEvts.length === 0 ? (
            <p className="text-xs text-muted-foreground">Aucun événement ce jour.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {selectedEvts.map(e => (
                <div key={e.id} className="flex items-start gap-2">
                  <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${dotColor(e.type)}`} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground leading-tight">{e.title}</p>
                    {e.time && <p className="text-[10px] text-muted-foreground">{e.time}</p>}
                    {e.description && <p className="text-[10px] text-muted-foreground truncate">{e.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Dashboard ──────────────────────────────────────────────

export default function DashboardPage() {
  return <RegularDashboard />
}

interface DashboardStats {
  docsTotal: number; foldersTotal: number
  membersTotal: number | null; cadetsTotal: number | null; pendingMembersCount: number | null
}

function RegularDashboard() {
  const { user, association } = useAuth()
  const isAdmin = !!user?.isAdmin
  const isTrial = association?.isTrial ?? false

  const [stats,          setStats]          = useState<DashboardStats | null>(null)
  const [pendingMembers, setPendingMembers] = useState<Member[]>([])
  const [reqCount,       setReqCount]       = useState<number | null>(null)
  const [isLoading,      setIsLoading]      = useState(true)
  const [isPending,      startTransition]   = useTransition()

  useEffect(() => {
    async function load() {
      const calls: Promise<unknown>[] = [
        apiFetch('/documents/users/getAllDocument?limit=1').then(r => r.json()),
        apiFetch('/folders/getAllFolder').then(r => r.json()),
        apiFetch('/document-requirements?onlyEnabled=true').then(r => r.json()),
      ]
      if (isAdmin) {
        calls.push(apiFetch('/admin/members?limit=1').then(r => r.json()))
        calls.push(apiFetch('/admin/members?limit=5&isActive=false').then(r => r.json()))
        calls.push(apiFetch('/admin/cadets').then(r => r.json()))
      }

      const MetaSchema    = z.object({ data: z.object({ meta: z.object({ total: z.number() }) }) })
      const FoldersSchema = z.object({ data: z.object({ folders: z.array(z.unknown()) }) })
      const ReqSchema     = z.object({ data: z.array(z.unknown()) })
      const MembersSchema = z.object({ data: z.object({ meta: z.object({ total: z.number() }), members: z.array(z.unknown()).optional() }) })
      const CadetsSchema  = z.object({ data: z.array(z.unknown()) })

      const results = await Promise.allSettled(calls)
      const get = (i: number) => results[i].status === 'fulfilled' ? (results[i] as PromiseFulfilledResult<unknown>).value : null

      const docsJson    = get(0)
      const foldersJson = get(1)
      const reqJson     = get(2)

      const reqParsed = ReqSchema.safeParse(reqJson)
      setReqCount(reqParsed.success ? reqParsed.data.data.length : null)

      const docsParsed    = MetaSchema.safeParse(docsJson)
      const foldersParsed = FoldersSchema.safeParse(foldersJson)

      const s: DashboardStats = {
        docsTotal:    docsParsed.success    ? docsParsed.data.data.meta.total          : 0,
        foldersTotal: foldersParsed.success ? foldersParsed.data.data.folders.length   : 0,
        membersTotal: null, cadetsTotal: null, pendingMembersCount: null,
      }

      if (isAdmin) {
        const membersParsed = MembersSchema.safeParse(get(3))
        const pendingParsed = MembersSchema.safeParse(get(4))
        const cadetsParsed  = CadetsSchema.safeParse(get(5))
        s.membersTotal        = membersParsed.success ? membersParsed.data.data.meta.total : null
        s.cadetsTotal         = cadetsParsed.success  ? cadetsParsed.data.data.length      : null
        s.pendingMembersCount = pendingParsed.success  ? pendingParsed.data.data.meta.total : null
        setPendingMembers(pendingParsed.success ? (pendingParsed.data.data.members as Member[]) ?? [] : [])
      }

      setStats(s); setIsLoading(false)
    }
    load()
  }, [isAdmin])

  function approveMember(id: string) {
    startTransition(async () => {
      const res = await apiFetch(`/admin/members/${id}/approve`, { method: 'POST' })
      if (res.ok) setPendingMembers(prev => prev.filter(m => m.id !== id))
    })
  }
  function rejectMember(id: string) {
    startTransition(async () => {
      const res = await apiFetch(`/admin/members/${id}/reject`, { method: 'POST' })
      if (res.ok) setPendingMembers(prev => prev.filter(m => m.id !== id))
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Bannière */}
      <div className="rounded-xl bg-primary px-6 py-5 text-primary-foreground">
        <p className="text-lg font-semibold">{greeting()}, {user?.firstName} 👋</p>
        <p className="mt-0.5 text-sm text-primary-foreground/80">{association?.name}</p>
      </div>

      {/* Vérification email */}
      <EmailVerificationBanner />

      {/* Onboarding */}
      {isAdmin && <OnboardingChecklist />}

      {/* Alerte essai */}
      {isTrial && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800 font-medium">Vous êtes en période d'essai — profitez de toutes les fonctionnalités gratuitement.</p>
          </div>
          <Link href="/dashboard/plan"><Button className="h-8 px-3 text-xs shrink-0 bg-amber-600 hover:bg-amber-700">Voir les plans</Button></Link>
        </div>
      )}

      {/* Stats */}
      <div className={`grid gap-3 ${isAdmin ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2'}`}>
        {isAdmin && (
          <>
            <StatCard icon={<Users size={20} className="text-blue-600" />}   color="bg-blue-50"   label="Membres" value={stats?.membersTotal ?? null} isLoading={isLoading} href="/dashboard/association" />
            <StatCard icon={<Shield size={20} className="text-purple-600" />} color="bg-purple-50" label="Cadets"  value={stats?.cadetsTotal ?? null}  isLoading={isLoading} href="/dashboard/association" />
          </>
        )}
        <StatCard icon={<FileText size={20} className="text-emerald-600" />} color="bg-emerald-50" label="Documents" value={stats?.docsTotal ?? null}    isLoading={isLoading} href="/dashboard/document" />
        <StatCard icon={<FolderOpen size={20} className="text-amber-600" />} color="bg-amber-50"   label="Dossiers"  value={stats?.foldersTotal ?? null} isLoading={isLoading} href="/dashboard/document" />
      </div>

      {/* Contenu */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MiniCalendar />
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-foreground">Accès rapide</h2>
            <div className="flex flex-col gap-1.5">
              <QuickAction href="/dashboard/document"    icon={<Upload size={15} />}     label="Uploader un document" />
              <QuickAction href="/dashboard/document"    icon={<FolderOpen size={15} />} label="Mes dossiers" />
              {isAdmin && <QuickAction href="/dashboard/association" icon={<UserCheck size={15} />} label="Gérer les membres" badge={stats?.pendingMembersCount && stats.pendingMembersCount > 0 ? stats.pendingMembersCount : undefined} />}
              <QuickAction href="/dashboard/plan"    icon={<CreditCard size={15} />} label="Mon abonnement" />
              <QuickAction href="/dashboard/billing" icon={<Receipt size={15} />}    label="Mes factures" />
            </div>
          </div>

          {reqCount !== null && reqCount > 0 && (
            <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50"><FileText size={14} className="text-amber-600" /></div>
                <p className="text-sm font-medium text-foreground">Documents requis</p>
              </div>
              <p className="text-xs text-muted-foreground">{reqCount} document{reqCount > 1 ? 's' : ''} requis par votre association.</p>
              <Link href="/dashboard/document"><Button variant="secondary" className="w-full h-8 text-xs flex items-center gap-1">Voir les exigences <ArrowRight size={12} /></Button></Link>
            </div>
          )}
        </div>
      </div>

      {/* Membres en attente */}
      {isAdmin && pendingMembers.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground">Membres en attente d'approbation</h2>
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white px-1.5">{pendingMembers.length}</span>
            </div>
            <Link href="/dashboard/association" className="flex items-center gap-1 text-xs text-primary hover:underline underline-offset-4">Voir tous <ArrowRight size={12} /></Link>
          </div>
          <div className="flex flex-col divide-y divide-border rounded-xl border border-border overflow-hidden">
            {pendingMembers.map((member) => {
              const initials = `${member.firstName[0]}${member.lastName[0]}`.toUpperCase()
              return (
                <div key={member.id} className="flex items-center gap-3 bg-card px-4 py-3">
                  <div className="h-8 w-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">{initials}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{member.fullName}</p>
                    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => approveMember(member.id)} disabled={isPending} title="Approuver"
                      className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors disabled:opacity-40"><Check size={13} /></button>
                    <button onClick={() => rejectMember(member.id)} disabled={isPending} title="Rejeter"
                      className="flex h-7 w-7 items-center justify-center rounded-md bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-colors disabled:opacity-40"><X size={13} /></button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Composants partagés ────────────────────────────────────

function StatCard({ icon, color, label, value, isLoading, href }: {
  icon: React.ReactNode; color: string; label: string; value: number | null; isLoading: boolean; href: string
}) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${color}`}>{icon}</div>
      <div>
        {isLoading ? <div className="h-6 w-12 rounded-md bg-muted animate-pulse" /> : <p className="text-xl font-bold text-foreground">{value ?? '—'}</p>}
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </Link>
  )
}

function QuickAction({ href, icon, label, badge }: { href: string; icon: React.ReactNode; label: string; badge?: number }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 hover:border-primary/40 hover:bg-muted/40 transition-all">
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <span className="flex-1 text-sm text-foreground">{label}</span>
      {badge !== undefined && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white px-1.5">{badge}</span>}
      <ArrowRight size={13} className="text-muted-foreground shrink-0" />
    </Link>
  )
}
