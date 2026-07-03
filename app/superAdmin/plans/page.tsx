'use client'

import { apiFetch } from '@/src/lib/api-client'
import { useEffect, useState, useTransition } from 'react'
import { Loader2, Pencil, Plus, Trash2, X, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Plan {
  id: number
  name: string
  slug: string
  stripePriceId: string
  priceCents: number
  priceFormatted: string
  interval: 'month' | 'year'
  intervalCount: number
  isActive: boolean
  features: string[]
}

const INTERVAL_LABELS: Record<string, string> = {
  month: 'Mensuel',
  year:  'Annuel',
}

export default function SuperAdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editPlan, setEditPlan] = useState<Plan | null>(null)
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [isPending, startTransition] = useTransition()

  async function load() {
    setIsLoading(true)
    const res = await apiFetch('/super-admin/plans')
    if (res.ok) {
      const json = await res.json()
      setPlans(json.data?.plans ?? json.data ?? [])
    }
    setIsLoading(false)
  }

  useEffect(() => { load() }, [])

  function togglePlan(plan: Plan) {
    startTransition(async () => {
      const res = await apiFetch(`/super-admin/plans/${plan.id}/toggle`, { method: 'PATCH' })
      const json = await res.json()
      if (res.ok) { setFeedback({ message: json.message ?? 'Statut mis à jour.', type: 'success' }); load() }
      else setFeedback({ message: json.message ?? 'Erreur.', type: 'error' })
    })
  }

  function deletePlan(plan: Plan) {
    if (!confirm(`Supprimer le plan "${plan.name}" ?`)) return
    startTransition(async () => {
      const res = await apiFetch(`/super-admin/plans/${plan.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (res.ok) { setFeedback({ message: json.message ?? 'Plan supprimé.', type: 'success' }); load() }
      else setFeedback({ message: json.message ?? 'Erreur.', type: 'error' })
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Plans</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gestion des plans d'abonnement</p>
        </div>
        <Button onClick={() => { setEditPlan(null); setShowForm(true) }} className="flex items-center gap-2 h-9 px-4 text-sm">
          <Plus size={15} /> Nouveau plan
        </Button>
      </div>

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
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-center text-muted-foreground">
          <Zap size={32} className="opacity-30" />
          <p className="text-sm">Aucun plan configuré.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.id} className={`relative flex flex-col gap-4 rounded-xl border bg-card p-5 ${plan.isActive ? 'border-border' : 'border-border opacity-60'}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-foreground">{plan.name}</p>
                  <p className="text-xs text-muted-foreground">{INTERVAL_LABELS[plan.interval] ?? plan.interval} · {plan.intervalCount > 1 ? `${plan.intervalCount}x` : ''}</p>
                </div>
                <span className={`rounded px-2 py-0.5 text-xs font-medium shrink-0 ${plan.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {plan.isActive ? 'Actif' : 'Inactif'}
                </span>
              </div>

              <p className="text-2xl font-bold text-foreground">{plan.priceFormatted}</p>

              {plan.features.length > 0 && (
                <ul className="flex flex-col gap-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex gap-2 mt-auto pt-2 border-t border-border">
                <button
                  onClick={() => { setEditPlan(plan); setShowForm(true) }}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <Pencil size={12} /> Modifier
                </button>
                <button
                  onClick={() => togglePlan(plan)}
                  disabled={isPending}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-40"
                >
                  {plan.isActive ? 'Désactiver' : 'Activer'}
                </button>
                <button
                  onClick={() => deletePlan(plan)}
                  disabled={isPending}
                  className="ml-auto flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <PlanFormModal
          plan={editPlan}
          onClose={() => setShowForm(false)}
          onSaved={(msg) => { setShowForm(false); setFeedback({ message: msg, type: 'success' }); load() }}
        />
      )}
    </div>
  )
}

function PlanFormModal({ plan, onClose, onSaved }: {
  plan: Plan | null
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const isEdit = !!plan
  const [features, setFeatures] = useState<string[]>(plan?.features ?? [''])
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const get = (k: string) => (fd.get(k) as string ?? '').trim()

    startTransition(async () => {
      const body = {
        name:         get('name'),
        slug:         get('slug'),
        stripePriceId: get('stripePriceId'),
        priceCents:   Number(get('priceCents')),
        interval:     get('interval'),
        intervalCount: Number(get('intervalCount')),
        isActive:     fd.get('isActive') === 'on',
        features:     features.filter(Boolean),
      }

      const url = isEdit ? `/super-admin/plans/${plan!.id}` : '/super-admin/plans'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await apiFetch(url, { method, body: JSON.stringify(body) })
      const json = await res.json()

      if (res.ok) { onSaved(json.message ?? (isEdit ? 'Plan mis à jour.' : 'Plan créé.')) }
      else setError(json.message ?? 'Une erreur est survenue.')
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
          <h2 className="text-sm font-medium text-foreground">{isEdit ? 'Modifier le plan' : 'Nouveau plan'}</h2>
          <button onClick={onClose} className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent">
            <X size={14} />
          </button>
        </div>

        <form id="plan-form" onSubmit={submit} className="overflow-y-auto flex flex-col gap-4 p-4">
          {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="pf-name">Nom *</Label>
              <Input id="pf-name" name="name" required disabled={isPending} defaultValue={plan?.name} placeholder="Plan Mensuel" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="pf-slug">Slug *</Label>
              <Input id="pf-slug" name="slug" required disabled={isPending} defaultValue={plan?.slug} placeholder="mensuel" />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="pf-stripe">Stripe Price ID *</Label>
            <Input id="pf-stripe" name="stripePriceId" required disabled={isPending} defaultValue={plan?.stripePriceId} placeholder="price_stripe_xxx" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5 col-span-1">
              <Label htmlFor="pf-price">Prix (centimes) *</Label>
              <Input id="pf-price" name="priceCents" type="number" required disabled={isPending} defaultValue={plan?.priceCents} placeholder="2900" />
            </div>
            <div className="grid gap-1.5 col-span-1">
              <Label htmlFor="pf-interval">Intervalle *</Label>
              <select id="pf-interval" name="interval" disabled={isPending} defaultValue={plan?.interval ?? 'month'}
                className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring">
                <option value="month">Mois</option>
                <option value="year">Année</option>
              </select>
            </div>
            <div className="grid gap-1.5 col-span-1">
              <Label htmlFor="pf-ic">Nb intervalles</Label>
              <Input id="pf-ic" name="intervalCount" type="number" min={1} disabled={isPending} defaultValue={plan?.intervalCount ?? 1} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input id="pf-active" name="isActive" type="checkbox" defaultChecked={plan?.isActive ?? true} disabled={isPending}
              className="h-4 w-4 rounded border border-input accent-primary" />
            <Label htmlFor="pf-active">Plan actif</Label>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Fonctionnalités</Label>
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={f}
                  onChange={(e) => setFeatures((prev) => prev.map((v, j) => j === i ? e.target.value : v))}
                  disabled={isPending}
                  placeholder={`Fonctionnalité ${i + 1}`}
                  className="flex-1"
                />
                {features.length > 1 && (
                  <button type="button" onClick={() => setFeatures((prev) => prev.filter((_, j) => j !== i))}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                    <X size={13} />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => setFeatures((prev) => [...prev, ''])}
              className="flex items-center gap-1.5 text-xs text-primary hover:underline underline-offset-4 w-fit">
              <Plus size={12} /> Ajouter une fonctionnalité
            </button>
          </div>
        </form>

        <div className="flex justify-end gap-2 border-t border-border p-4 shrink-0">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>Annuler</Button>
          <Button type="submit" form="plan-form" disabled={isPending}>
            {isPending ? (isEdit ? 'Mise à jour…' : 'Création…') : (isEdit ? 'Mettre à jour' : 'Créer le plan')}
          </Button>
        </div>
      </div>
    </div>
  )
}
