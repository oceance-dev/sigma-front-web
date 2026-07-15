'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  Check,
  ClipboardList,
  FileText,
  Link2,
  Loader2,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/src/lib/api-client'
import { useAuth } from '@/src/context/auth-context'

// ── Types ──────────────────────────────────────────────────

interface OnboardingData {
  email:                     string | null
  acceptOnlineRegistrations: boolean
  onboardingDismissed:       boolean
  isGendarmerie:             boolean
  membersTotal:              number
  campaignsTotal:            number
  customFieldsTotal:         number
  docRequirementsTotal:      number
}

interface Step {
  id:          string
  icon:        React.ReactNode
  title:       string
  description: string
  detail:      string
  cta:         string
  ctaHref:     string
  done:        boolean
  optional?:   boolean
}

// ── Hook data ──────────────────────────────────────────────

function useOnboardingData() {
  const { user, association: authAssociation } = useAuth()
  const [data,    setData]    = useState<OnboardingData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authAssociation?.id || !user?.isAdmin) { setLoading(false); return }

    const id = authAssociation.id
    Promise.allSettled([
      apiFetch(`/admin/association/${id}`).then(r => r.json()),
      apiFetch('/admin/members?limit=1').then(r => r.json()),
      apiFetch('/admin/campaigns').then(r => r.json()),
      apiFetch(`/admin/association/${id}/custom-fields`).then(r => r.json()),
      apiFetch('/document-requirements').then(r => r.json()),
    ]).then(([assocRes, membersRes, campRes, fieldsRes, docsRes]) => {
      const assoc   = assocRes.status   === 'fulfilled' ? assocRes.value?.data?.association : null
      const members = membersRes.status === 'fulfilled' ? membersRes.value?.data?.meta?.total ?? 0 : 0
      const camps   = campRes.status    === 'fulfilled' ? (campRes.value?.data?.campaigns ?? campRes.value?.data ?? []).length : 0
      const fields  = fieldsRes.status  === 'fulfilled' ? (fieldsRes.value?.data?.fields ?? fieldsRes.value?.data ?? []).length : 0
      const docs    = docsRes.status    === 'fulfilled' ? (docsRes.value?.data ?? []).length : 0

      if (!assoc) { setLoading(false); return }

      setData({
        email:                     assoc.email ?? null,
        acceptOnlineRegistrations: !!assoc.acceptOnlineRegistrations,
        onboardingDismissed:       !!assoc.onboardingDismissed,
        isGendarmerie:             authAssociation.type === 'gendarmerie',
        membersTotal:              members,
        campaignsTotal:            camps,
        customFieldsTotal:         fields,
        docRequirementsTotal:      docs,
      })
    }).finally(() => setLoading(false))
  }, [authAssociation?.id, user?.isAdmin])

  return { data, loading, isAdmin: !!user?.isAdmin, assocId: authAssociation?.id }
}

// ── Composant principal ────────────────────────────────────

export default function OnboardingWizard() {
  const router = useRouter()
  const { data, loading, isAdmin, assocId } = useOnboardingData()
  const [open,    setOpen]    = useState(false)
  const [step,    setStep]    = useState(0)
  const [closing, setClosing] = useState(false)

  // Ouvre automatiquement au premier rendu si pas encore dismissé
  useEffect(() => {
    if (!loading && data && !data.onboardingDismissed) setOpen(true)
  }, [loading, data])

  if (!isAdmin || loading || !data) return null

  const steps: Step[] = [
    {
      id:          'welcome',
      icon:        <Sparkles size={22} className="text-primary" />,
      title:       'Bienvenue sur Sigma !',
      description: 'Votre espace est prêt. Suivez ces étapes pour configurer votre association en quelques minutes.',
      detail:      'Ce guide vous accompagne pas à pas. Vous pouvez revenir à tout moment.',
      cta:         'Commencer',
      ctaHref:     '',
      done:        true,
    },
    {
      id:          'info',
      icon:        <Building2 size={22} className="text-blue-600" />,
      title:       'Renseignez votre association',
      description: 'Complétez les informations de contact de votre association.',
      detail:      'Ajoutez un email, une adresse et les coordonnées de votre responsable légal pour que vos membres puissent vous contacter.',
      cta:         'Compléter les informations',
      ctaHref:     '/dashboard/association?tab=association',
      done:        !!data.email,
    },
    {
      id:          'inscription',
      icon:        <Link2 size={22} className="text-indigo-600" />,
      title:       'Activez les inscriptions en ligne',
      description: 'Partagez votre lien unique pour recevoir des candidatures directement.',
      detail:      'Une fois activé, vous obtenez un lien personnalisé à partager. Les candidats pourront s\'inscrire depuis n\'importe quel appareil.',
      cta:         'Activer les inscriptions',
      ctaHref:     '/dashboard/association?tab=lien-inscription',
      done:        data.acceptOnlineRegistrations,
    },
    {
      id:          'formulaire',
      icon:        <ClipboardList size={22} className="text-violet-600" />,
      title:       'Personnalisez le formulaire',
      description: 'Ajoutez vos propres champs pour collecter les informations dont vous avez besoin.',
      detail:      'Date de naissance, taille, niveau scolaire… Configurez les champs qui correspondent à vos besoins spécifiques.',
      cta:         'Personnaliser le formulaire',
      ctaHref:     '/dashboard/association?tab=formulaire-inscription',
      done:        data.customFieldsTotal > 0,
      optional:    true,
    },
    ...(data.isGendarmerie ? [{
      id:          'documents',
      icon:        <FileText size={22} className="text-amber-600" />,
      title:       'Configurez les documents requis',
      description: 'Définissez les pièces justificatives que vos candidats doivent fournir.',
      detail:      'Carte d\'identité, autorisation parentale, justificatif de domicile… Configurez la liste des documents obligatoires pour votre association.',
      cta:         'Configurer les documents',
      ctaHref:     '/dashboard/association?tab=documents-requis',
      done:        data.docRequirementsTotal > 0,
    }] : []),
    {
      id:          'campagne',
      icon:        <Calendar size={22} className="text-emerald-600" />,
      title:       'Créez votre première campagne',
      description: 'Ouvrez une campagne pour commencer à recevoir des candidatures.',
      detail:      'Une campagne définit la période durant laquelle les candidats peuvent s\'inscrire. Vous pouvez l\'ouvrir et la fermer à tout moment.',
      cta:         'Créer une campagne',
      ctaHref:     '/dashboard/association?tab=campagnes',
      done:        data.campaignsTotal > 0,
    },
    {
      id:          'membres',
      icon:        <Users size={22} className="text-rose-600" />,
      title:       'Invitez vos premiers membres',
      description: 'Ajoutez les membres de votre équipe pour collaborer ensemble.',
      detail:      'Partagez le code d\'invitation pour que vos collaborateurs puissent créer leur compte et accéder à l\'espace de gestion.',
      cta:         'Gérer les membres',
      ctaHref:     '/dashboard/association?tab=membres',
      done:        data.membersTotal > 1,
    },
  ]

  const completedCount = steps.filter(s => s.done).length
  const progress       = Math.round((completedCount / steps.length) * 100)
  const allDone        = completedCount === steps.length
  const current        = steps[step] ?? steps[0]

  async function dismiss() {
    setClosing(true)
    setTimeout(() => { setOpen(false); setClosing(false) }, 200)
    if (assocId) {
      await apiFetch(`/admin/association/${assocId}/dismiss-onboarding`, { method: 'POST' })
    }
  }

  function handleCta() {
    if (current.ctaHref) {
      router.push(current.ctaHref)
      setOpen(false)
    } else {
      goNext()
    }
  }

  function goNext() {
    if (step < steps.length - 1) setStep(s => s + 1)
    else dismiss()
  }

  function goPrev() {
    if (step > 0) setStep(s => s - 1)
  }

  // Bouton flottant quand le wizard est fermé
  if (!open) {
    if (allDone) return null
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
      >
        <Sparkles size={15} />
        Configuration {completedCount}/{steps.length}
      </button>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 ${closing ? 'opacity-0' : 'opacity-100'}`}
        onClick={dismiss}
      />

      {/* Modal */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${closing ? 'opacity-0' : 'opacity-100'}`}>
        <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden">

          {/* En-tête */}
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-border">
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">
                  Configuration · {completedCount}/{steps.length} étapes
                </p>
                <p className="text-xs font-semibold text-primary">{progress}%</p>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              {/* Dots */}
              <div className="flex items-center gap-1.5">
                {steps.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => setStep(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === step        ? 'w-6 bg-primary'             :
                      s.done            ? 'w-1.5 bg-primary/40'        :
                                          'w-1.5 bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
            </div>
            <button
              onClick={dismiss}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          {/* Corps */}
          <div className="flex flex-col gap-6 px-6 py-8">
            {/* Icône + statut */}
            <div className="flex items-start gap-4">
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 ${
                current.done ? 'border-primary/30 bg-primary/10' : 'border-border bg-muted/40'
              }`}>
                {current.done
                  ? <Check size={22} className="text-primary" />
                  : current.icon}
              </div>
              <div className="flex flex-col gap-1 pt-1">
                <div className="flex items-center gap-2">
                  <p className="text-base font-semibold text-foreground">{current.title}</p>
                  {current.optional && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">Optionnel</span>
                  )}
                  {current.done && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">Fait ✓</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{current.description}</p>
              </div>
            </div>

            {/* Détail */}
            <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
              <p className="text-sm text-foreground/80 leading-relaxed">{current.detail}</p>
            </div>

            {/* Aperçu des étapes suivantes */}
            {step < steps.length - 1 && (
              <div className="flex flex-col gap-1">
                <p className="text-xs font-medium text-muted-foreground mb-1">Prochaines étapes</p>
                {steps.slice(step + 1, step + 3).map((s) => (
                  <div key={s.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                      s.done ? 'border-primary/40 bg-primary/10' : 'border-border'
                    }`}>
                      {s.done && <Check size={9} className="text-primary" />}
                    </div>
                    <span className={s.done ? 'line-through opacity-50' : ''}>{s.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border bg-muted/20">
            <Button
              variant="ghost"
              size="sm"
              onClick={goPrev}
              disabled={step === 0}
              className="gap-1.5"
            >
              <ArrowLeft size={14} /> Précédent
            </Button>

            <div className="flex items-center gap-2">
              {!current.done && current.ctaHref && (
                <Button variant="secondary" size="sm" onClick={goNext}>
                  Passer
                </Button>
              )}
              <Button size="sm" onClick={current.done || !current.ctaHref ? goNext : handleCta} className="gap-1.5">
                {step === steps.length - 1
                  ? 'Terminer'
                  : current.done
                    ? <><ArrowRight size={14} /> Suivant</>
                    : current.ctaHref ? current.cta : <><ArrowRight size={14} /> Suivant</>}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
