'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/src/context/auth-context'
import { apiFetch } from '@/src/lib/api-client'
import { Check, ChevronRight, X, Building2, Link2, Users, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface AssocDetails {
  email:                     string | null
  acceptOnlineRegistrations: boolean
  onboardingDismissed:       boolean
  membersTotal:              number
}

export default function OnboardingChecklist() {
  const { user, association: authAssociation } = useAuth()
  const [details,  setDetails]  = useState<AssocDetails | null>(null)
  const [visible,  setVisible]  = useState(false)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!authAssociation?.id || !user?.isAdmin) { setLoading(false); return }

    Promise.all([
      apiFetch(`/admin/association/${authAssociation.id}`).then(r => r.json()),
      apiFetch('/admin/members?limit=1').then(r => r.json()),
    ]).then(([assocJson, membersJson]) => {
      const assoc = assocJson.data?.association
      if (!assoc) return

      const d: AssocDetails = {
        email:                     assoc.email ?? null,
        acceptOnlineRegistrations: !!assoc.acceptOnlineRegistrations,
        onboardingDismissed:       !!assoc.onboardingDismissed,
        membersTotal:              membersJson.data?.meta?.total ?? 0,
      }
      setDetails(d)
      setVisible(!d.onboardingDismissed)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [authAssociation?.id, user?.isAdmin])

  async function dismiss() {
    setVisible(false)
    if (!authAssociation?.id) return
    await apiFetch(`/admin/association/${authAssociation.id}/dismiss-onboarding`, { method: 'POST' })
  }

  if (!user?.isAdmin || loading || !visible || !details) return null

  const steps = [
    {
      id:          'created',
      label:       'Association créée',
      description: 'Votre espace Sigma est prêt.',
      href:        '/dashboard/association',
      icon:        <Sparkles size={15} />,
      done:        true,
    },
    {
      id:          'info',
      label:       'Renseignez votre association',
      description: 'Ajoutez l\'email et les coordonnées de votre association.',
      href:        '/dashboard/association',
      icon:        <Building2 size={15} />,
      done:        !!details.email,
    },
    {
      id:          'online',
      label:       'Activez les inscriptions en ligne',
      description: 'Partagez un lien pour recevoir des candidatures.',
      href:        '/dashboard/association',
      icon:        <Link2 size={15} />,
      done:        details.acceptOnlineRegistrations,
    },
    {
      id:          'members',
      label:       'Ajoutez vos premiers membres',
      description: 'Invitez des personnes à rejoindre votre association.',
      href:        '/dashboard/association',
      icon:        <Users size={15} />,
      done:        details.membersTotal > 1,
    },
  ]

  const completedCount = steps.filter(s => s.done).length
  const progress       = Math.round((completedCount / steps.length) * 100)

  if (completedCount === steps.length) {
    dismiss()
    return null
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">

      {/* En-tête */}
      <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-border">
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground">Premières étapes</p>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              {completedCount}/{steps.length}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <button
          onClick={dismiss}
          title="Ignorer"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors mt-0.5"
        >
          <X size={13} />
        </button>
      </div>

      {/* Étapes */}
      <div className="divide-y divide-border">
        {steps.map((step) => (
          <Link
            key={step.id}
            href={step.href}
            className={`flex items-center gap-3 px-4 py-3 transition-colors ${
              step.done ? 'opacity-50 cursor-default pointer-events-none' : 'hover:bg-muted/40'
            }`}
          >
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
              step.done
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground'
            }`}>
              {step.done ? <Check size={13} /> : step.icon}
            </div>

            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${step.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {step.label}
              </p>
              {!step.done && (
                <p className="text-xs text-muted-foreground">{step.description}</p>
              )}
            </div>

            {!step.done && <ChevronRight size={14} className="text-muted-foreground shrink-0" />}
          </Link>
        ))}
      </div>
    </div>
  )
}
