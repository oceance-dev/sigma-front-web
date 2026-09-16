'use client'

import { apiFetch } from '@/src/lib/api-client'
import { useEffect, useState, useTransition } from 'react'
import { Building2, CheckCircle2, Loader2, X, XCircle, Clock, AlertCircle, Gift } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/StatCard'
import { z } from 'zod'

interface BillingAssociation {
  id: string
  name: string
  email: string
  status: string
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  stripePriceId: string | null
  subscribedAt: string | null
  subscriptionEndsAt: string | null
  hasValidSubscription: boolean
}

interface BillingStats {
  total: number
  active: number
  expiredAccess: number
  suspended: number
  cancelled: number
  pending: number
}

const STATUS_CLASSES: Record<string, string> = {
  active:    'bg-primary/10 text-primary',
  pending:   'bg-amber-100 text-amber-700',
  suspended: 'bg-destructive/10 text-destructive',
  cancelled: 'bg-muted text-muted-foreground',
}
const STATUS_LABELS: Record<string, string> = {
  active:    'Actif',
  pending:   'En attente',
  suspended: 'Suspendu',
  cancelled: 'Annulé',
}

export default function SuperAdminBillingPage() {
  const [associations, setAssociations] = useState<BillingAssociation[]>([])
  const [stats, setStats] = useState<BillingStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [grantTarget, setGrantTarget] = useState<BillingAssociation | null>(null)
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const BillingSchema = z.object({
    data: z.object({
      associations: z.array(z.object({
        id:                     z.string(),
        name:                   z.string(),
        email:                  z.string(),
        status:                 z.string(),
        stripeCustomerId:       z.string().nullable(),
        stripeSubscriptionId:   z.string().nullable(),
        stripePriceId:          z.string().nullable(),
        subscribedAt:           z.string().nullable(),
        subscriptionEndsAt:     z.string().nullable(),
        hasValidSubscription:   z.boolean(),
      })),
      stats: z.object({
        total: z.number(), active: z.number(), expiredAccess: z.number(),
        suspended: z.number(), cancelled: z.number(), pending: z.number(),
      }),
    }),
  })

  async function load() {
    setIsLoading(true)
    const res = await apiFetch('/super-admin/billing')
    if (res.ok) {
      const parsed = BillingSchema.safeParse(await res.json())
      if (parsed.success) {
        setAssociations(parsed.data.data.associations)
        setStats(parsed.data.data.stats)
      }
    }
    setIsLoading(false)
  }

  useEffect(() => { load() }, [])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Facturation</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Vue d'ensemble des abonnements de la plateforme</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard icon={<Building2 size={18} className="text-primary" />} color="bg-primary/10" label="Total" value={stats.total} />
          <StatCard icon={<CheckCircle2 size={18} className="text-green-600" />} color="bg-green-50" label="Actifs" value={stats.active} />
          <StatCard icon={<Clock size={18} className="text-amber-600" />} color="bg-amber-50" label="En attente" value={stats.pending} />
          <StatCard icon={<AlertCircle size={18} className="text-orange-600" />} color="bg-orange-50" label="Expirés" value={stats.expiredAccess} />
          <StatCard icon={<XCircle size={18} className="text-destructive" />} color="bg-destructive/10" label="Suspendus" value={stats.suspended} />
          <StatCard icon={<X size={18} className="text-muted-foreground" />} color="bg-muted" label="Annulés" value={stats.cancelled} />
        </div>
      )}

      {feedback && (
        <div className={`flex items-center justify-between rounded-lg px-4 py-2 text-sm ${feedback.type === 'success' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
          {feedback.message}
          <button onClick={() => setFeedback(null)}><X size={13} /></button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      ) : associations.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-center text-muted-foreground">
          <Building2 size={32} className="opacity-30" />
          <p className="text-sm">Aucune association trouvée.</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-xl border border-border overflow-hidden">
          {associations.map((assoc) => (
            <div key={assoc.id} className="flex items-center gap-4 bg-card px-4 py-3 hover:bg-muted/40 transition-colors">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Building2 size={16} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{assoc.name}</p>
                <p className="text-xs text-muted-foreground truncate">{assoc.email}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[assoc.status] ?? 'bg-muted text-muted-foreground'}`}>
                  {STATUS_LABELS[assoc.status] ?? assoc.status}
                </span>
                {assoc.subscriptionEndsAt && (
                  <p className="text-[10px] text-muted-foreground">
                    Fin : {new Date(assoc.subscriptionEndsAt).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>
              <button
                onClick={() => setGrantTarget(assoc)}
                className="flex items-center gap-1.5 h-7 px-2.5 rounded-md bg-primary/10 text-primary text-xs font-medium hover:bg-primary hover:text-white transition-colors shrink-0"
                title="Offrir un accès gratuit"
              >
                <Gift size={12} /> Accès gratuit
              </button>
            </div>
          ))}
        </div>
      )}

      {grantTarget && (
        <GrantAccessModal
          association={grantTarget}
          onClose={() => setGrantTarget(null)}
          onSaved={(msg) => {
            setGrantTarget(null)
            setFeedback({ message: msg, type: 'success' })
            load()
          }}
        />
      )}
    </div>
  )
}


function GrantAccessModal({ association, onClose, onSaved }: {
  association: BillingAssociation
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const [months, setMonths] = useState(3)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await apiFetch(`/super-admin/associations/${association.id}/grant-access`, {
        method: 'PATCH',
        body: JSON.stringify({ months }),
      })
      const json = await res.json()
      if (res.ok) { onSaved(json.message ?? `Accès accordé pour ${months} mois.`) }
      else setError(json.message ?? 'Une erreur est survenue.')
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-sm rounded-xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-medium text-foreground">Offrir un accès gratuit</h2>
          <button onClick={onClose} className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent">
            <X size={14} />
          </button>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-4 p-4">
          <p className="text-sm text-muted-foreground">
            Accès gratuit pour <span className="font-medium text-foreground">{association.name}</span>
          </p>
          {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="grant-months" className="text-sm font-medium text-foreground">Durée (mois)</label>
            <input
              id="grant-months"
              type="number"
              min={1}
              max={24}
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              disabled={isPending}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>Annuler</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Envoi…' : `Accorder ${months} mois`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
