'use client'

import { useEffect, useState, type ReactNode } from 'react'
import {
  AlertCircle,
  Check,
  ClipboardList,
  FileText,
  HeartPulse,
  Link2,
  Loader2,
  Mail,
  RefreshCw,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/src/lib/api-client'
import { useAuth } from '@/src/context/auth-context'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import type { Association } from '@/src/types/association'

// ── FeatureToggleRow ───────────────────────────────────────

function FeatureToggleRow({
  icon,
  title,
  description,
  enabled,
  loading,
  disabled,
  onToggle,
}: {
  icon: ReactNode
  title: string
  description: string
  enabled: boolean
  loading?: boolean
  disabled?: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        disabled={loading || disabled}
        role="switch"
        aria-checked={enabled}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${
          loading ? 'cursor-wait' : disabled ? 'cursor-not-allowed' : 'cursor-pointer'
        } ${enabled ? 'bg-primary' : 'bg-muted-foreground/30'}`}
      >
        {loading
          ? <Loader2 size={12} className="mx-auto animate-spin text-white" />
          : (
            <span
              className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                enabled ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          )}
      </button>
    </div>
  )
}

// ── CodeCard ───────────────────────────────────────────────

interface AssocCodes {
  codeAsso: string | null
}

function CodeCard({
  title,
  subtitle,
  code,
  badge,
  badgeColor,
  info,
  warning,
  copiedField,
  regenLoading,
  onCopy,
  onRegen,
}: {
  title:       string
  subtitle:    string
  code:        string | null
  badge:       string
  badgeColor:  string
  info?:       string
  warning?:    string
  copiedField: boolean
  regenLoading: boolean
  onCopy:      () => void
  onRegen:     () => void
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground">{title}</p>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeColor}`}>{badge}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
      </div>

      {/* Code */}
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0 rounded-lg border border-input bg-muted/30 px-3 py-2.5">
          {code ? (
            <p className="text-base font-mono font-semibold text-foreground tracking-widest select-all">
              {code}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic">Chargement…</p>
          )}
        </div>
        <button
          onClick={onCopy}
          disabled={!code || copiedField}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-accent transition-colors disabled:opacity-40 shrink-0"
        >
          {copiedField
            ? <><Check size={13} className="text-primary" /> Copié !</>
            : <><Link2 size={13} /> Copier</>}
        </button>
        <button
          onClick={onRegen}
          disabled={regenLoading}
          title="Régénérer le code"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground transition-colors disabled:opacity-40 shrink-0"
        >
          {regenLoading
            ? <Loader2 size={14} className="animate-spin" />
            : <RefreshCw size={14} />}
        </button>
      </div>

      {/* Infos */}
      {info && (
        <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
          <AlertCircle size={13} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">{info}</p>
        </div>
      )}
      {warning && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <AlertCircle size={13} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">{warning}</p>
        </div>
      )}
    </div>
  )
}

// ── LienInscriptionTab ─────────────────────────────────────

export default function LienInscriptionTab({
  association,
  acceptsOnline,
  canEdit,
  togglingOnline,
  onToggleOnline,
  isGendarmerie,
  onAssociationUpdated,
}: {
  association: Association | null
  acceptsOnline: boolean
  canEdit: boolean
  togglingOnline: boolean
  onToggleOnline: () => void
  isGendarmerie: boolean
  onAssociationUpdated: () => void
}) {
  const { association: authAssociation } = useAuth()
  const [origin,           setOrigin]           = useState('')
  const [codes,            setCodes]            = useState<AssocCodes>({
    codeAsso: association?.codeAsso ?? null,
  })
  const [copiedLink,        setCopiedLink]        = useState(false)
  const [copiedAssoc,       setCopiedAssoc]       = useState(false)
  const [regenAssoc,        setRegenAssoc]        = useState(false)
  const [documentsEnabled,  setDocumentsEnabled]  = useState(association?.documentsRequisEnabled ?? false)
  const [campagnesEnabled,  setCampagnesEnabled]  = useState(association?.campaignsEnabled ?? false)
  const [sanitaireEnabled,  setSanitaireEnabled]  = useState(association?.sanitaireEnabled ?? false)
  const [togglingDocs,      setTogglingDocs]      = useState(false)
  const [togglingCampaigns, setTogglingCampaigns] = useState(false)
  const [togglingSanitaire, setTogglingSanitaire] = useState(false)
  const [toggleError,       setToggleError]       = useState<string | null>(null)
  const [confirmPending, setConfirmPending] = useState<null | { message: string; onConfirm: () => void }>(null)

  useEffect(() => { setOrigin(window.location.origin) }, [])

  // Sync quand l'association est chargée après le premier render
  useEffect(() => {
    setCodes({ codeAsso: association?.codeAsso ?? null })
    setDocumentsEnabled(association?.documentsRequisEnabled ?? false)
    setCampagnesEnabled(association?.campaignsEnabled ?? false)
    setSanitaireEnabled(association?.sanitaireEnabled ?? false)
  }, [association?.codeAsso, association?.documentsRequisEnabled, association?.campaignsEnabled, association?.sanitaireEnabled])

  const assocId   = authAssociation?.id  ?? null
  const slug      = authAssociation?.slug ?? null
  const assocName = authAssociation?.name ?? ''
  const assocType = authAssociation?.type ?? null
  const url       = slug && origin ? `${origin}/sigin/${encodeURIComponent(slug)}` : null

  async function regenerate() {
    if (!assocId) return
    setRegenAssoc(true)
    try {
      const res = await apiFetch(`/admin/association/${assocId}/code`, { method: 'POST' })
      if (res.ok) {
        const json = await res.json()
        setCodes({ codeAsso: json.data?.code ?? null })
      }
    } finally {
      setRegenAssoc(false)
    }
  }

  async function toggleFeature(feature: 'documents' | 'campaigns' | 'sanitaire') {
    if (!assocId || !canEdit) return
    setToggleError(null)
    const setLoading =
      feature === 'documents'  ? setTogglingDocs :
      feature === 'campaigns'  ? setTogglingCampaigns :
                                 setTogglingSanitaire
    const route =
      feature === 'documents'  ? `/admin/association/${assocId}/toggle-documents-requis` :
      feature === 'campaigns'  ? `/admin/association/${assocId}/toggle-campaigns` :
                                 `/admin/association/${assocId}/toggle-sanitaire`
    setLoading(true)
    try {
      const res  = await apiFetch(route, { method: 'POST' })
      const json = await res.json()
      if (res.ok) {
        if (feature === 'documents')      setDocumentsEnabled(json.data?.documentsRequisEnabled ?? !documentsEnabled)
        else if (feature === 'campaigns') setCampagnesEnabled(json.data?.campaignsEnabled ?? !campagnesEnabled)
        else                              setSanitaireEnabled(json.data?.sanitaireEnabled ?? !sanitaireEnabled)
        onAssociationUpdated()
      } else {
        setToggleError(json.message ?? 'Une erreur est survenue.')
      }
    } catch {
      setToggleError('Impossible de contacter le serveur.')
    } finally {
      setLoading(false)
    }
  }

  function copyLink() {
    if (!url) return
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    })
  }

  function copyAssocCode() {
    if (!codes.codeAsso) return
    navigator.clipboard.writeText(codes.codeAsso).then(() => {
      setCopiedAssoc(true)
      setTimeout(() => setCopiedAssoc(false), 2000)
    })
  }

  function share() {
    if (!url || !navigator.share) return
    navigator.share({
      title: `Rejoindre ${assocName || 'notre association'}`,
      text:  assocType === 'gendarmerie'
        ? 'Candidatez pour rejoindre les cadets de la gendarmerie.'
        : `Inscrivez-vous pour rejoindre ${assocName || 'notre association'}.`,
      url,
    })
  }

  const canShare  = typeof navigator !== 'undefined' && !!navigator.share
  const description = assocType === 'gendarmerie'
    ? 'Partagez ce lien ou ces codes avec les personnes souhaitant candidater comme cadets de la gendarmerie.'
    : "Partagez ce lien ou ces codes avec les personnes souhaitant rejoindre votre association."

  // ── État désactivé ─────────────────────────────────────
  if (!acceptsOnline) {
    return (
      <div className="flex flex-col gap-5 max-w-xl">
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card px-6 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/60">
            <Link2 size={24} className="text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-foreground">Inscriptions en ligne désactivées</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Activez les inscriptions en ligne pour partager un lien de candidature
              et des codes d'invitation avec vos futurs membres.
            </p>
          </div>

          <div className="w-full rounded-xl border border-border bg-muted/20 px-4 py-3 flex flex-col gap-2 text-left">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Une fois activé, vous pourrez
            </p>
            {[
              'Partager un lien d\'inscription personnalisé',
              'Générer des codes d\'invitation (association + usage unique)',
              'Personnaliser le formulaire d\'inscription (onglet Formulaire)',
              'Configurer les documents requis pour les candidats',
              ...(isGendarmerie ? ['Créer et gérer des campagnes de recrutement'] : []),
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <Check size={13} className="text-primary shrink-0" />
                <span className="text-xs text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>

          {canEdit && (
            <Button onClick={onToggleOnline} disabled={togglingOnline} className="flex items-center gap-2">
              {togglingOnline
                ? <><Loader2 size={14} className="animate-spin" /> Activation…</>
                : <><Check size={14} /> Activer les inscriptions en ligne</>}
            </Button>
          )}
        </div>
      </div>
    )
  }

  // ── État activé ────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5 max-w-xl">

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">Lien d'inscription et codes d'accès</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
          Activées
        </span>
      </div>

      {!slug ? (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Slug de l'association introuvable. Vérifiez la configuration de votre association.
        </div>
      ) : (
        <div className="flex flex-col gap-4">

          {/* ── URL + actions ─────────────────────────── */}
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">Lien d'inscription</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Partagez ce lien pour rediriger directement les candidats vers le formulaire.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0 rounded-lg border border-input bg-muted/40 px-3 py-2">
                <p className="text-sm text-foreground font-mono break-all select-all">{url}</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={copyLink} variant="secondary" className="flex items-center gap-2 h-8 px-3 text-xs">
                {copiedLink
                  ? <><Check size={13} className="text-primary" /> Copié !</>
                  : <><Link2 size={13} /> Copier le lien</>}
              </Button>
              {canShare && (
                <Button onClick={share} variant="secondary" className="flex items-center gap-2 h-8 px-3 text-xs">
                  <Mail size={13} /> Partager
                </Button>
              )}
            </div>
          </div>

          {/* ── Code de l'association ─────────────────── */}
          <CodeCard
            title="Code de l'association"
            subtitle="Identifiant court de votre association à partager avec vos futurs membres."
            badge="Permanent"
            badgeColor="bg-blue-100 text-blue-700"
            code={codes.codeAsso}
            copiedField={copiedAssoc}
            regenLoading={regenAssoc}
            onCopy={copyAssocCode}
            onRegen={regenerate}
            info="Ce code identifie votre association. Partagez-le avec un candidat pour qu'il rejoigne directement votre espace lors de son inscription."
          />

          {/* ── Comment ça marche ─────────────────────── */}
          <div className="rounded-xl border border-border bg-muted/20 p-4 flex flex-col gap-2.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Comment ça marche</p>
            <ul className="flex flex-col gap-2">
              {[
                'Partagez le lien, le code de l\'association ou un code d\'invitation.',
                assocType === 'gendarmerie'
                  ? 'Le candidat remplit le formulaire avec ses informations et saisit le code reçu.'
                  : 'Le candidat s\'inscrit avec ses informations et saisit le code reçu.',
                'Sa candidature apparaît dans l\'onglet ' + (assocType === 'gendarmerie' ? 'Candidatures' : 'Membres') + ' pour validation.',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ul>
          </div>

          {/* ── Fonctionnalités optionnelles ─────────── */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground">Fonctionnalités</p>
            <p className="text-xs text-muted-foreground">Activez les options complémentaires de votre système d'inscription.</p>

            {toggleError && (
              <div className="flex items-center justify-between rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {toggleError}
                <button onClick={() => setToggleError(null)}><X size={13} /></button>
              </div>
            )}

            <FeatureToggleRow
              icon={<ClipboardList size={16} className="text-primary" />}
              title="Campagnes de recrutement"
              description="Créez et gérez des campagnes d'adhésion pour les cadets."
              enabled={campagnesEnabled}
              loading={togglingCampaigns}
              disabled={!canEdit}
              onToggle={() => toggleFeature('campaigns')}
            />

            <FeatureToggleRow
              icon={<FileText size={16} className="text-primary" />}
              title="Documents requis"
              description="Demandez aux candidats de fournir des documents lors de leur inscription."
              enabled={documentsEnabled}
              loading={togglingDocs}
              disabled={!canEdit}
              onToggle={() => toggleFeature('documents')}
            />

            {isGendarmerie && (
              <FeatureToggleRow
                icon={<HeartPulse size={16} className="text-primary" />}
                title="Sanitaire"
                description="Consultez rapidement les informations médicales des cadets de la promotion en cours."
                enabled={sanitaireEnabled}
                loading={togglingSanitaire}
                disabled={!canEdit}
                onToggle={() => toggleFeature('sanitaire')}
              />
            )}
          </div>

          {/* ── Désactiver ────────────────────────────── */}
          {canEdit && (
            <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">Désactiver les inscriptions</p>
                <p className="text-xs text-muted-foreground">
                  Le lien et les codes ne seront plus accessibles aux candidats.
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  setConfirmPending({
                    message: 'Désactiver les inscriptions en ligne ? Le lien et les codes ne fonctionneront plus.',
                    onConfirm: onToggleOnline,
                  })
                }}
                disabled={togglingOnline}
                className="shrink-0 h-8 px-3 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
              >
                {togglingOnline ? <Loader2 size={13} className="animate-spin" /> : 'Désactiver'}
              </Button>
            </div>
          )}

        </div>
      )}

      <ConfirmDialog
        open={!!confirmPending}
        message={confirmPending?.message ?? ''}
        onConfirm={() => { confirmPending?.onConfirm(); setConfirmPending(null) }}
        onCancel={() => setConfirmPending(null)}
        danger
      />
    </div>
  )
}
