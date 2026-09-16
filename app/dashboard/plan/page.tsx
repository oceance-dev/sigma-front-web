'use client'

import { apiFetch } from '@/src/lib/api-client'
import { useAuth } from '@/src/context/auth-context'
import { useStepUp } from '@/src/context/step-up-context'
import { useEffect, useState, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, ExternalLink, Loader2, RefreshCw, X, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BillingPlan } from '@/src/types/billing'

// ── Helpers ────────────────────────────────────────────────

function formatAmount(cents: number, interval: 'month' | 'year') {
  const amount = (cents / 100).toFixed(2).replace('.', ',') + ' €'
  return interval === 'month' ? `${amount} / mois` : `${amount} / an`
}

// ── Page ───────────────────────────────────────────────────

export default function PlanPage() {
  const { association } = useAuth()
  const searchParams = useSearchParams()
  const justPaid = searchParams.get('success') === 'true'

  const [plans, setPlans] = useState<BillingPlan[]>([])
  const [isLoadingPlans, setIsLoadingPlans] = useState(true)
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false)
  const [showChangePlan, setShowChangePlan] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(justPaid ? 'Paiement reçu. Votre abonnement sera activé sous peu.' : null)
  const [isPending, startTransition] = useTransition()
  const { sensitiveFetch } = useStepUp()

  const isActive = association?.hasValidSubscription ?? false
  const isTrial = association?.isTrial ?? false
  const isExpired = !isActive && !isTrial

  useEffect(() => {
    apiFetch('/billing/plans')
      .then((r) => r.json())
      .then((json) => setPlans(json.data.plans ?? []))
      .catch(() => {})
      .finally(() => setIsLoadingPlans(false))
  }, [])

  // ── Actions ──────────────────────────────────────────────

  function checkout(priceId: string) {
    setError(null)
    startTransition(async () => {
      try {
        const res = await sensitiveFetch('/billing/checkout', {
          method: 'POST',
          body: JSON.stringify({
            priceId,
            successRedirect: `${window.location.origin}/dashboard/plan?success=true`,
            cancelRedirect: `${window.location.origin}/dashboard/plan`,
          }),
        })
        const json = await res.json()
        if (!res.ok) { setError(json.message ?? 'Erreur lors du paiement.'); return }
        window.location.href = json.data.url
      } catch {
        setError('Impossible de contacter le serveur.')
      }
    })
  }

  function openPortal() {
    startTransition(async () => {
      const res = await apiFetch('/billing/portal')
      const json = await res.json()
      if (!res.ok) { setError(json.message ?? 'Erreur portail Stripe.'); return }
      window.open(json.data.url, '_blank')
    })
  }

  function cancelSubscription() {
    setError(null)
    startTransition(async () => {
      const res = await sensitiveFetch('/billing/cancel', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) { setError(json.message ?? 'Erreur lors de l\'annulation.'); return }
      setCancelAtPeriodEnd(true)
      setSuccess(json.message)
    })
  }

  function resumeSubscription() {
    setError(null)
    startTransition(async () => {
      const res = await sensitiveFetch('/billing/resume', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) { setError(json.message ?? 'Erreur lors de la réactivation.'); return }
      setCancelAtPeriodEnd(false)
      setSuccess(json.message)
    })
  }

  function changePlan(newPriceId: string) {
    setError(null)
    startTransition(async () => {
      const res = await sensitiveFetch('/billing/change-plan', {
        method: 'POST',
        body: JSON.stringify({ newPriceId }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.message ?? 'Erreur lors du changement de plan.'); return }
      setShowChangePlan(false)
      setSuccess(json.message)
    })
  }

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 max-w-2xl">

      <div>
        <h1 className="heading-1">Abonnement</h1>
        <p className="text-muted mt-1">Gérez votre abonnement Sigma.</p>
      </div>

      {/* ── Notifications ───────────────────────────────── */}
      {success && (
        <div className="flex items-start justify-between gap-3 rounded-lg bg-primary/10 px-4 py-3 text-sm text-primary">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0" />
            {success}
          </div>
          <button onClick={() => setSuccess(null)}><X size={14} /></button>
        </div>
      )}
      {error && (
        <div className="flex items-start justify-between gap-3 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
          <button onClick={() => setError(null)}><X size={14} /></button>
        </div>
      )}

      {/* ── Statut actuel ───────────────────────────────── */}
      <StatusBanner isTrial={isTrial} isActive={isActive} isExpired={isExpired} cancelAtPeriodEnd={cancelAtPeriodEnd} />

      {/* ── Abonné actif ────────────────────────────────── */}
      {isActive && (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-medium text-foreground">Actions</h2>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={openPortal} disabled={isPending} className="flex items-center gap-2">
              <ExternalLink size={15} />
              Gérer via Stripe
            </Button>

            {!cancelAtPeriodEnd ? (
              <Button
                variant="secondary"
                disabled={isPending}
                onClick={() => {
                  if (confirm('Annuler votre abonnement ? Vous gardez l\'accès jusqu\'à la fin de la période en cours.')) {
                    cancelSubscription()
                  }
                }}
                className="text-destructive hover:bg-destructive/10"
              >
                Annuler l'abonnement
              </Button>
            ) : (
              <Button variant="secondary" onClick={resumeSubscription} disabled={isPending} className="flex items-center gap-2">
                <RefreshCw size={15} />
                Réactiver l'abonnement
              </Button>
            )}

            <Button variant="secondary" onClick={() => setShowChangePlan((v) => !v)} disabled={isPending}>
              Changer de plan
            </Button>
          </div>

          {/* ── Changer de plan ─────────────────────────── */}
          {showChangePlan && (
            <div className="mt-2 flex flex-col gap-3 border-t border-border pt-4">
              <p className="text-sm text-muted-foreground">Choisissez un nouveau plan — la différence sera proratisée immédiatement.</p>
              {isLoadingPlans ? (
                <Loader2 size={16} className="animate-spin text-muted-foreground" />
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {plans.map((plan) => (
                    <div key={plan.priceId} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div>
                        <p className="text-sm font-medium">{plan.label}</p>
                        <p className="text-xs text-muted-foreground">{formatAmount(plan.amount, plan.interval)}</p>
                      </div>
                      <Button onClick={() => changePlan(plan.priceId)} disabled={isPending} className="text-xs h-7 px-3">
                        Choisir
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Plans (essai ou expiré) ─────────────────────── */}
      {(isTrial || isExpired) && (
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-foreground">
            {isExpired ? 'Choisissez un plan pour rétablir votre accès' : 'Passez à un plan payant'}
          </h2>

          {isLoadingPlans ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 size={16} className="animate-spin" />
              Chargement des plans…
            </div>
          ) : plans.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun plan disponible pour le moment.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.priceId}
                  plan={plan}
                  onSubscribe={() => checkout(plan.priceId)}
                  disabled={isPending}
                />
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  )
}

// ── StatusBanner ───────────────────────────────────────────

function StatusBanner({
  isTrial, isActive, isExpired, cancelAtPeriodEnd,
}: {
  isTrial: boolean
  isActive: boolean
  isExpired: boolean
  cancelAtPeriodEnd: boolean
}) {
  if (isActive && !cancelAtPeriodEnd) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
        <div className="h-2 w-2 rounded-full bg-primary" />
        <p className="text-sm font-medium text-primary">Abonnement actif</p>
      </div>
    )
  }
  if (isActive && cancelAtPeriodEnd) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <div className="h-2 w-2 rounded-full bg-amber-500" />
        <p className="text-sm font-medium text-amber-700">Résiliation programmée — accès actif jusqu'à la fin de la période</p>
      </div>
    )
  }
  if (isTrial) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
        <Zap size={16} className="text-blue-600 shrink-0" />
        <p className="text-sm font-medium text-blue-700">Période d'essai en cours</p>
      </div>
    )
  }
  if (isExpired) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
        <div className="h-2 w-2 rounded-full bg-destructive" />
        <p className="text-sm font-medium text-destructive">Accès expiré — choisissez un plan pour continuer</p>
      </div>
    )
  }
  return null
}

// ── PlanCard ───────────────────────────────────────────────

function PlanCard({
  plan,
  onSubscribe,
  disabled,
}: {
  plan: BillingPlan
  onSubscribe: () => void
  disabled: boolean
}) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 hover:border-primary/40 transition-colors">
      <div>
        <p className="font-medium text-foreground">{plan.label}</p>
        <p className="mt-1 text-2xl font-bold text-foreground">
          {(plan.amount / 100).toFixed(2).replace('.', ',')} €
          <span className="ml-1 text-sm font-normal text-muted-foreground">
            / {plan.interval === 'month' ? 'mois' : 'an'}
          </span>
        </p>
      </div>

      {plan.features.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {plan.features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 size={14} className="text-primary shrink-0" />
              {f}
            </li>
          ))}
        </ul>
      )}

      <Button onClick={onSubscribe} disabled={disabled} className="w-full mt-auto">
        Souscrire
      </Button>
    </div>
  )
}
