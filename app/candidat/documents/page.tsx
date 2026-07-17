'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { apiFetch } from '@/src/lib/api-client'
import { tokenStore } from '@/src/lib/token-store'
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Lock,
  Mail,
  RefreshCw,
  Send,
  Upload,
  X,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const API = '/api/sigma'

// ── Types ──────────────────────────────────────────────────

type DocStatus = 'pending' | 'approved' | 'rejected'
type CandidatStatut = 'notStarted' | 'pending' | 'submitted' | 'appointment' | 'validated' | 'approved' | 'rejected' | 'dismiss'

interface RequirementStatus {
  uploaded: boolean
  documentId: string | null
  documentStatus: DocStatus | null
  documentName: string | null
  uploadedAt: string | null
}

interface Requirement {
  id: number
  documentTypeId: number
  name: string
  description: string | null
  category: string
  isRequired: boolean
  allowedExtensions: string[]
  maxFileSize: number
  sortOrder: number
  status: RequirementStatus
}

interface Completion {
  total: number
  completed: number
  percentage: number
  isComplete: boolean
}

interface Campaign {
  id: number
  name: string
  year: number
  status: string
  startsAt: string | null
  endsAt: string | null
}

// ── Helpers ────────────────────────────────────────────────

import { formatDate as fmtDate } from '@/src/lib/date-utils'

function fmtSize(bytes: number) {
  return bytes >= 1_000_000 ? `${(bytes / 1_000_000).toFixed(0)} Mo` : `${(bytes / 1_000).toFixed(0)} Ko`
}

// ── Page ───────────────────────────────────────────────────

export default function CandidatDocumentsPage() {
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [completion,   setCompletion]   = useState<Completion | null>(null)
  const [campaign,     setCampaign]     = useState<Campaign | null>(null)
  const [nextCampaign, setNextCampaign] = useState<Campaign | null>(null)
  const [statut,       setStatut]       = useState<CandidatStatut | null>(null)
  const [canSubmit,    setCanSubmit]    = useState(false)
  const [isLoading,    setIsLoading]    = useState(true)
  const [feedback,     setFeedback]     = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [uploadingId,  setUploadingId]  = useState<number | null>(null)
  const [isPending,    startTransition] = useTransition()

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const [reqRes, campRes, statusRes] = await Promise.all([
        apiFetch('/candidatures/doc-requirements'),
        apiFetch('/candidatures/active-campaign'),
        apiFetch('/candidatures/get-status'),
      ])

      if (reqRes.ok) {
        const json = await reqRes.json()
        setRequirements(json.data?.requirements ?? [])
        setCompletion(json.data?.completion ?? null)
      }

      if (campRes.ok) {
        const json = await campRes.json()
        setCampaign(json.data?.campaign ?? null)
        setNextCampaign(json.data?.nextCampaign ?? null)
      }

      if (statusRes.ok) {
        const json = await statusRes.json()
        setStatut(json.data?.statut ?? null)
      }

      // Vérifier si soumission possible
      const canRes = await apiFetch('/candidatures/can-submit')
      if (canRes.ok) {
        const json = await canRes.json()
        setCanSubmit(json.data?.canSubmit ?? false)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Upload ─────────────────────────────────────────────────

  async function handleUpload(req: Requirement, file: File) {
    if (file.size > req.maxFileSize) {
      setFeedback({ message: `Fichier trop volumineux (max ${fmtSize(req.maxFileSize)}).`, type: 'error' })
      return
    }
    setUploadingId(req.id)
    setFeedback(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('documentRequirementId', String(req.id))
      fd.append('category', req.category)

      const token = tokenStore.get()
      const res = await fetch(`${API}/candidatures/upload-my-document`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      })
      const json = await res.json()

      if (res.ok) {
        setFeedback({ message: 'Document envoyé avec succès.', type: 'success' })
        load()
      } else {
        setFeedback({ message: json.message ?? 'Erreur lors de l\'upload.', type: 'error' })
      }
    } catch {
      setFeedback({ message: 'Impossible de joindre le serveur.', type: 'error' })
    } finally {
      setUploadingId(null)
    }
  }

  async function handleReplace(req: Requirement, file: File) {
    if (!req.status.documentId) return
    if (file.size > req.maxFileSize) {
      setFeedback({ message: `Fichier trop volumineux (max ${fmtSize(req.maxFileSize)}).`, type: 'error' })
      return
    }
    setUploadingId(req.id)
    setFeedback(null)
    try {
      const fd = new FormData()
      fd.append('file', file)

      const token = tokenStore.get()
      const res = await fetch(`${API}/candidatures/replace-my-document/${req.status.documentId}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      })
      const json = await res.json()

      if (res.ok) {
        setFeedback({ message: 'Document remplacé avec succès.', type: 'success' })
        load()
      } else {
        setFeedback({ message: json.message ?? 'Erreur lors du remplacement.', type: 'error' })
      }
    } catch {
      setFeedback({ message: 'Impossible de joindre le serveur.', type: 'error' })
    } finally {
      setUploadingId(null)
    }
  }

  // ── Soumission ─────────────────────────────────────────────

  function submit() {
    startTransition(async () => {
      const res  = await apiFetch('/candidatures/submit', { method: 'POST' })
      const json = await res.json()
      if (res.ok) {
        setFeedback({ message: (json.message ?? 'Candidature soumise avec succès.') + ' Un email de confirmation vous a été envoyé.', type: 'success' })
        setStatut('submitted')
        load()
      } else {
        setFeedback({ message: json.message ?? 'Impossible de soumettre la candidature.', type: 'error' })
      }
    })
  }

  // ── Render ─────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  const remaining = (completion?.total ?? 0) - (completion?.completed ?? 0)
  // Garde-fou local : tous les documents obligatoires doivent avoir été fournis
  const missingRequired = requirements.filter((r) => r.isRequired && !r.status.uploaded).length
  const canReallySubmit = canSubmit && missingRequired === 0

  return (
    <div className="flex flex-col gap-5 max-w-2xl">

      {/* ── Bannière campagne ─────────────────────────── */}
      <CampaignBanner campaign={campaign} nextCampaign={nextCampaign} statut={statut} />

      {/* ── Bannière rendez-vous ──────────────────────── */}
      {statut === 'appointment' && (
        <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Calendar size={18} className="text-primary" />
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-semibold text-primary">Vous avez un rendez-vous</p>
            <p className="text-xs text-muted-foreground">
              Votre dossier a été examiné et un rendez-vous d'accueil a été planifié.
              Consultez vos emails pour connaître les détails (date, heure, lieu).
            </p>
          </div>
        </div>
      )}

      {/* ── Titre ────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Documents requis</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Téléchargez les documents et formulaires nécessaires pour valider votre inscription
        </p>
      </div>

      {/* ── Feedback ─────────────────────────────────── */}
      {feedback && (
        <div className={`flex items-center justify-between rounded-lg px-4 py-3 text-sm ${
          feedback.type === 'success' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'
        }`}>
          {feedback.message}
          <button onClick={() => setFeedback(null)}><X size={13} /></button>
        </div>
      )}

      {/* ── Progression ──────────────────────────────── */}
      {completion && (
        <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <p className="font-medium text-foreground">Progression du dossier</p>
            <p className="font-semibold text-foreground">
              {completion.completed} / {completion.total}
            </p>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${completion.percentage}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {remaining > 0
              ? `${remaining} document${remaining > 1 ? 's' : ''} restant${remaining > 1 ? 's' : ''}`
              : 'Tous les documents ont été envoyés ✓'}
          </p>
        </div>
      )}

      {/* ── Bannière confidentialité ──────────────────── */}
      <div className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <Lock size={15} className="text-slate-500 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600">
          <strong>Confidentialité :</strong> vos documents de candidature sont strictement confidentiels. Ils ne seront
          consultés que par l'administration de l'association — <strong>Administrateur, Président et Directeur des formations</strong>.
        </p>
      </div>

      {/* ── Bannière info ─────────────────────────────── */}
      <div className="flex items-start gap-2.5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
        <AlertCircle size={15} className="text-blue-600 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">
          Assurez-vous que vos documents sont lisibles et à jour. Les formats acceptés sont <strong>PDF, JPEG et PNG</strong>.
        </p>
      </div>

      {/* ── Liste des documents ───────────────────────── */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-foreground">Documents à fournir</p>

        {requirements.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <FileText size={32} strokeWidth={1.5} />
            <p className="text-sm">Aucune exigence documentaire configurée.</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border rounded-xl border border-border overflow-hidden">
            {requirements.map((req) => (
              <RequirementRow
                key={req.id}
                req={req}
                isUploading={uploadingId === req.id}
                disabled={!!uploadingId || isPending}
                uploadBlocked={!campaign}
                onUpload={(file) => handleUpload(req, file)}
                onReplace={(file) => handleReplace(req, file)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Bouton soumettre ──────────────────────────── */}
      {statut === 'notStarted' || statut === 'pending' ? (
        canReallySubmit ? (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Dossier complet !</p>
              <p className="text-xs text-muted-foreground">Vous pouvez maintenant soumettre votre candidature.</p>
            </div>
            <Button onClick={submit} disabled={isPending || !campaign} className="flex items-center gap-2 shrink-0">
              <Send size={15} />
              {isPending ? 'Soumission…' : 'Soumettre'}
            </Button>
          </div>
        ) : (completion && completion.completed > 0) || missingRequired > 0 ? (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
            <Loader2 size={14} />
            {missingRequired > 0
              ? `Il reste ${missingRequired} document${missingRequired > 1 ? 's' : ''} obligatoire${missingRequired > 1 ? 's' : ''} à fournir pour pouvoir soumettre.`
              : 'Complétez tous les documents requis pour pouvoir soumettre.'}
          </div>
        ) : null
      ) : statut === 'submitted' ? (
        <div className="flex items-center gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <Clock size={16} className="text-primary shrink-0" />
          <div>
            <p className="text-sm font-medium text-primary">Candidature soumise</p>
            <p className="text-xs text-muted-foreground">Votre dossier est en cours d'examen par l'équipe.</p>
          </div>
        </div>
      ) : statut === 'appointment' ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <Calendar size={16} className="text-primary shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium text-primary">Rendez-vous planifié</p>
            <p className="text-xs text-muted-foreground">
              Un rendez-vous d'accueil a été planifié. Vérifiez vos emails pour les détails.
            </p>
          </div>
        </div>
      ) : statut === 'approved' ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-emerald-700">Candidature approuvée !</p>
            <p className="text-xs text-muted-foreground">Félicitations, vous avez été accepté(e) comme cadet.</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Mail size={12} className="text-emerald-600 shrink-0" />
              <p className="text-xs text-emerald-700">Un email de confirmation vous a été envoyé.</p>
            </div>
          </div>
        </div>
      ) : statut === 'rejected' ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
          <XCircle size={16} className="text-destructive shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-destructive">Candidature refusée</p>
            <p className="text-xs text-muted-foreground">Votre dossier n'a pas été retenu pour cette campagne.</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Mail size={12} className="text-destructive shrink-0" />
              <p className="text-xs text-destructive">Un email vous a été envoyé avec les détails.</p>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  )
}

// ── Bannière campagne ──────────────────────────────────────

function CampaignBanner({
  campaign,
  nextCampaign,
  statut,
}: {
  campaign: Campaign | null
  nextCampaign: Campaign | null
  statut: CandidatStatut | null
}) {
  if (statut === 'submitted' || statut === 'approved' || statut === 'appointment') return null

  if (campaign) {
    return (
      <div className="flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5">
        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        <p className="text-sm text-emerald-800">
          Campagne <strong>{campaign.name}</strong> ouverte
          {campaign.endsAt && ` · Clôture le ${fmtDate(campaign.endsAt)}`}
        </p>
      </div>
    )
  }

  if (nextCampaign?.startsAt) {
    return (
      <div className="flex items-center gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5">
        <Calendar size={14} className="text-amber-600 shrink-0" />
        <p className="text-sm text-amber-800">
          Prochaine campagne <strong>{nextCampaign.name}</strong> — ouverture le {fmtDate(nextCampaign.startsAt)}
        </p>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5">
      <AlertCircle size={14} className="text-destructive shrink-0" />
      <p className="text-sm text-destructive">
        Aucune campagne de candidature ouverte pour le moment. Les inscriptions sont fermées.
      </p>
    </div>
  )
}

// ── Ligne document ─────────────────────────────────────────

function RequirementRow({
  req,
  isUploading,
  disabled,
  uploadBlocked,
  onUpload,
  onReplace,
}: {
  req: Requirement
  isUploading: boolean
  disabled: boolean
  uploadBlocked: boolean
  onUpload: (f: File) => void
  onReplace: (f: File) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { uploaded, documentStatus, documentName, uploadedAt } = req.status
  const accept = req.allowedExtensions.map((e) => `.${e}`).join(',')

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (uploaded) onReplace(file)
    else onUpload(file)
    e.target.value = ''
  }

  const statusBadge = uploaded ? (
    documentStatus === 'approved' ? (
      <span className="shrink-0 flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700">
        <CheckCircle2 size={11} /> Approuvé
      </span>
    ) : documentStatus === 'rejected' ? (
      <span className="shrink-0 flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium bg-destructive/10 text-destructive">
        <XCircle size={11} /> Refusé
      </span>
    ) : (
      <span className="shrink-0 flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700">
        <Clock size={11} /> En attente
      </span>
    )
  ) : null

  return (
    <div className={`flex items-start gap-3 bg-card px-4 py-3.5 transition-colors hover:bg-muted/30 ${
      uploaded && documentStatus === 'rejected' ? 'border-l-2 border-destructive' : ''
    }`}>
      {/* Icône */}
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg mt-0.5 ${
        uploaded && documentStatus === 'approved' ? 'bg-emerald-100' :
        uploaded && documentStatus === 'rejected' ? 'bg-destructive/10' :
        uploaded ? 'bg-amber-100' : 'bg-muted'
      }`}>
        {uploaded && documentStatus === 'approved' ? (
          <CheckCircle2 size={18} className="text-emerald-600" />
        ) : uploaded && documentStatus === 'rejected' ? (
          <AlertTriangle size={18} className="text-destructive" />
        ) : uploaded ? (
          <Clock size={18} className="text-amber-600" />
        ) : (
          <FileText size={18} className="text-muted-foreground" />
        )}
      </div>

      {/* Infos */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-foreground">{req.name}</p>
          {req.isRequired && (
            <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold bg-destructive/10 text-destructive">
              Requis
            </span>
          )}
          {statusBadge}
        </div>

        {req.description && (
          <p className="text-xs text-muted-foreground mt-0.5">{req.description}</p>
        )}

        {uploaded && documentName && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {documentName}
            {uploadedAt && ` · Envoyé le ${fmtDate(uploadedAt)}`}
          </p>
        )}

        {uploaded && documentStatus === 'rejected' && (
          <div className="flex flex-col gap-0.5 mt-1">
            <p className="text-xs text-destructive font-medium">
              Document refusé — veuillez en envoyer un nouveau.
            </p>
            <div className="flex items-center gap-1">
              <Mail size={11} className="text-destructive shrink-0" />
              <p className="text-xs text-destructive">Un email vous a été envoyé avec les raisons du refus.</p>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-1">
          {req.allowedExtensions.join(', ').toUpperCase()} · max {fmtSize(req.maxFileSize)}
        </p>
      </div>

      {/* Action */}
      <div className="shrink-0 mt-0.5">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />
        {uploadBlocked ? (
          <span
            title="Aucune campagne active — les dépôts de documents sont fermés"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium bg-muted text-muted-foreground cursor-not-allowed select-none"
          >
            <Lock size={12} /> Fermé
          </span>
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors disabled:opacity-40 ${
              uploaded && documentStatus === 'rejected'
                ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                : uploaded
                ? 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            {isUploading ? (
              <><Loader2 size={12} className="animate-spin" /> Envoi…</>
            ) : uploaded ? (
              <><RefreshCw size={12} /> Remplacer</>
            ) : (
              <><Upload size={12} /> Envoyer</>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
