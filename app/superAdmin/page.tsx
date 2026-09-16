'use client'

import { apiFetch } from '@/src/lib/api-client'
import { useEffect, useState, useTransition } from 'react'
import { Building2, Check, CheckCircle2, Clock, Loader2, RefreshCw, Users, X, XCircle } from 'lucide-react'
import type { Association } from '@/src/types/association'
import { relativeDate } from '@/src/lib/date-utils'
import { StatCard } from '@/components/StatCard'
import { z } from 'zod'

interface AssocStats { total: number; active: number; pending: number; suspended: number; cancelled: number; expiredAccess: number }
interface UserStats  { total: number; active: number; inactive: number; pending: number }

export default function SuperAdminPage() {
  const [assocStats,   setAssocStats]   = useState<AssocStats | null>(null)
  const [userStats,    setUserStats]    = useState<UserStats | null>(null)
  const [pendingAssoc, setPendingAssoc] = useState<Association[]>([])
  const [isLoading,    setIsLoading]    = useState(true)
  const [tick,         setTick]         = useState(0)
  const [isPending,    startTransition] = useTransition()

  const BillingSchema  = z.object({ data: z.object({ stats: z.object({ total: z.number(), active: z.number(), pending: z.number(), suspended: z.number(), cancelled: z.number(), expiredAccess: z.number() }) }) })
  const MetaSchema     = z.object({ data: z.object({ meta: z.object({ total: z.number() }) }) })
  const PendingSchema  = z.object({ data: z.object({ associations: z.array(z.unknown()) }) })

  useEffect(() => {
    setIsLoading(true)
    Promise.allSettled([
      apiFetch('/super-admin/billing').then(r => r.json()),
      apiFetch('/super-admin/users?limit=1').then(r => r.json()),
      apiFetch('/super-admin/users?limit=1&isActive=false').then(r => r.json()),
      apiFetch('/super-admin/associations?limit=5&status=pending').then(r => r.json()),
    ]).then(([billingRes, totalRes, inactiveRes, pendingRes]) => {
      const billing  = billingRes.status  === 'fulfilled' ? BillingSchema.safeParse(billingRes.value)   : null
      const total    = totalRes.status    === 'fulfilled' ? MetaSchema.safeParse(totalRes.value)        : null
      const inactive = inactiveRes.status === 'fulfilled' ? MetaSchema.safeParse(inactiveRes.value)     : null
      const pending  = pendingRes.status  === 'fulfilled' ? PendingSchema.safeParse(pendingRes.value)   : null

      if (billing?.success)  setAssocStats(billing.data.data.stats)
      const totalN    = total?.success    ? total.data.data.meta.total    : 0
      const inactiveN = inactive?.success ? inactive.data.data.meta.total : 0
      setUserStats({ total: totalN, active: totalN - inactiveN, inactive: inactiveN, pending: 0 })
      if (pending?.success)  setPendingAssoc(pending.data.data.associations as Association[])
      setIsLoading(false)
    })
  }, [tick])

  function approve(id: string) {
    startTransition(async () => {
      const res = await apiFetch(`/super-admin/associations/${id}/approve`, { method: 'POST' })
      if (res.ok) setPendingAssoc(prev => prev.filter(a => a.id !== id))
    })
  }

  function reject(id: string) {
    if (!confirm('Rejeter cette association ?')) return
    startTransition(async () => {
      const res = await apiFetch(`/super-admin/associations/${id}/reject`, { method: 'POST' })
      if (res.ok) setPendingAssoc(prev => prev.filter(a => a.id !== id))
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Vue d'ensemble de la plateforme</p>
        <button
          onClick={() => setTick(n => n + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          title="Rafraîchir"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Associations */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <Building2 size={18} className="text-foreground" />
              <h2 className="text-base font-bold text-foreground">Associations</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard icon={<Building2 size={18} className="text-primary" />}          color="bg-primary/10"     label="Total"               value={assocStats?.total ?? 0} />
              <StatCard icon={<CheckCircle2 size={18} className="text-green-600" />}     color="bg-green-50"       label="Actives"             value={assocStats?.active ?? 0} />
              <StatCard icon={<Clock size={18} className="text-amber-600" />}             color="bg-amber-50"       label="En attente"          value={assocStats?.pending ?? 0} />
              <StatCard icon={<XCircle size={18} className="text-destructive" />}        color="bg-destructive/10" label="Rejetées/Suspendues" value={(assocStats?.suspended ?? 0) + (assocStats?.cancelled ?? 0)} />
            </div>
          </section>

          {/* Utilisateurs */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <Users size={18} className="text-foreground" />
              <h2 className="text-base font-bold text-foreground">Utilisateurs</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard icon={<Users size={18} className="text-primary" />}              color="bg-primary/10" label="Total"      value={userStats?.total ?? 0} />
              <StatCard icon={<CheckCircle2 size={18} className="text-green-600" />}    color="bg-green-50"   label="Actifs"     value={userStats?.active ?? 0} />
              <StatCard icon={<XCircle size={18} className="text-slate-500" />}         color="bg-slate-100"  label="Inactifs"   value={userStats?.inactive ?? 0} />
              <StatCard icon={<Clock size={18} className="text-amber-600" />}            color="bg-amber-50"   label="En attente" value={userStats?.pending ?? 0} />
            </div>
          </section>

          {/* Activité récente */}
          <section className="flex flex-col gap-4">
            <h2 className="text-base font-bold text-foreground">Activité récente</h2>
            {pendingAssoc.length === 0 ? (
              <div className="rounded-xl border border-border bg-card px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">Aucune association en attente d'approbation.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Associations en attente d'approbation</p>
                <div className="flex flex-col divide-y divide-border rounded-xl border border-border overflow-hidden">
                  {pendingAssoc.map(assoc => (
                    <div key={assoc.id} className="flex items-center gap-3 bg-card px-4 py-3 hover:bg-muted/40 transition-colors">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Building2 size={15} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{assoc.name}</p>
                        <p className="text-xs text-muted-foreground">{assoc.city} · {assoc.email ?? '—'} · {relativeDate(assoc.createdAt)}</p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button onClick={() => approve(assoc.id)} disabled={isPending} title="Approuver"
                          className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors disabled:opacity-40">
                          <Check size={13} />
                        </button>
                        <button onClick={() => reject(assoc.id)} disabled={isPending} title="Rejeter"
                          className="flex h-7 w-7 items-center justify-center rounded-md bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-colors disabled:opacity-40">
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}

