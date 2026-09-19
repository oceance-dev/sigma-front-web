'use client'

import { apiFetch } from '@/src/lib/api-client'
import { useAuth } from '@/src/context/auth-context'
import { useEffect, useState, useTransition } from 'react'
import { ChevronDown, Download, FileText, History, Loader2, Trash2, X } from 'lucide-react'
import { formatDate } from '@/src/lib/date-utils'
import {
  REQUEST_STATUS_CLASSES,
  REQUEST_STATUS_LABELS,
  REQUEST_TYPE_LABELS,
  type AccountRequestItem,
  type AccountRequestType,
} from '@/src/types/account-request'

// ── PersonalDataRequestsSection ─────────────────────────────
//
// Self-service RGPD : demander l'accès à ses données, leur suppression, ou modifier son
// compte — pour TOUT utilisateur connecté, y compris un admin d'association demandant ses
// propres données (exactement comme un membre). Se fetch elle-même (activeRequest), donc
// utilisable telle quelle depuis n'importe quel écran "mon compte" du repo — actuellement
// la modale ouverte par l'avatar du header (components/AccountModal.tsx), qui est le seul
// point d'entrée réellement utilisé, et la page /dashboard/profil.

export function PersonalDataRequestsSection({ isAdmin }: { isAdmin: boolean }) {
  const [activeRequest, setActiveRequest] = useState<AccountRequestItem | null>(null)
  const [isLoadingRequest, setIsLoadingRequest] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    let cancelled = false
    apiFetch('/account-requests?limit=1')
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return
        const latest: AccountRequestItem | undefined = json.data?.requests?.[0]
        setActiveRequest(latest && (latest.status === 'pending' || latest.status === 'escalated') ? latest : null)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setIsLoadingRequest(false) })
    return () => { cancelled = true }
  }, [])

  function submitRequest(type: AccountRequestType, reason?: string) {
    setError(null)
    startTransition(async () => {
      const res = await apiFetch('/account-requests', {
        method: 'POST',
        body: JSON.stringify(reason ? { type, reason } : { type }),
      })
      const json = await res.json()
      if (res.ok) {
        setActiveRequest(json.data.request)
      } else {
        setError(json.message ?? 'Une erreur est survenue.')
      }
    })
  }

  const disabled = isPending || isLoadingRequest || !!activeRequest

  return (
    <>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Mes données personnelles</p>
            <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">RGPD</span>
          </div>
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
          >
            <History size={12} /> Historique
          </button>
        </div>

        {activeRequest && (
          <div className="px-5 py-3 border-b border-border bg-muted/30 text-xs text-muted-foreground">
            Demande en cours : <span className="font-medium text-foreground">{REQUEST_TYPE_LABELS[activeRequest.type]}</span>, envoyée le {formatDate(activeRequest.createdAt)}.
          </div>
        )}

        {error && (
          <div className="px-5 pt-3">
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="divide-y divide-border">
          <button
            onClick={() => submitRequest('data_access', 'Demande de données complètes (avec documents)')}
            disabled={disabled}
            className="flex w-full items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors text-left disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              <Download size={15} className="text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Demander vos données complètes</p>
                <p className="text-xs text-muted-foreground">Inclut les documents associés à votre compte.</p>
              </div>
            </div>
            <span className="text-xs text-primary font-medium shrink-0 ml-4">Demander</span>
          </button>

          <button
            onClick={() => submitRequest('data_access', 'Demande de données simples (sans documents)')}
            disabled={disabled}
            className="flex w-full items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors text-left disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              <Download size={15} className="text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Demander des données simples sans documents</p>
                <p className="text-xs text-muted-foreground">Vos informations de profil, sans les pièces jointes.</p>
              </div>
            </div>
            <span className="text-xs text-primary font-medium shrink-0 ml-4">Demander</span>
          </button>

          <button
            onClick={() => submitRequest('data_deletion')}
            disabled={disabled}
            className="flex w-full items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors text-left disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              <Trash2 size={15} className="text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {isAdmin ? 'Demander la suppression de mes données' : 'Demander la suppression de mon compte'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Doit être validée par un administrateur de l&apos;association. Vos données seront anonymisées ; votre ligne de membre est conservée pour l&apos;historique d&apos;adhésion.
                </p>
              </div>
            </div>
            <span className="text-xs text-destructive font-medium shrink-0 ml-4">Demander</span>
          </button>
        </div>
      </div>

      {showHistory && <AccountRequestsHistoryModal onClose={() => setShowHistory(false)} />}
    </>
  )
}

// ── AccountRequestsHistoryModal ─────────────────────────────
//
// Suivi self-service : liste paginée de ses propres demandes RGPD. Pas d'appel au détail
// par id — comme pour le panel admin, l'objet de liste porte déjà tout ce qu'il faut à
// l'affichage (raison, motif de rejet, note d'escalade, date de traitement).

function AccountRequestsHistoryModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth()
  const [requests, setRequests] = useState<AccountRequestItem[]>([])
  const [meta, setMeta] = useState<{ total: number; lastPage: number } | null>(null)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    apiFetch(`/account-requests?page=${page}&limit=10`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return
        setRequests(json.data?.requests ?? [])
        setMeta(json.data?.meta ?? null)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [page])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
          <h2 className="text-sm font-medium text-foreground">Historique de mes demandes</h2>
          <button onClick={onClose} className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent shrink-0">
            <X size={14} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={20} className="animate-spin text-muted-foreground" />
            </div>
          ) : requests.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">Aucune demande envoyée pour le moment.</p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {requests.map((r) => {
                const isExpanded = expandedId === r.id
                return (
                  <div key={r.id}>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : r.id)}
                      className="flex w-full items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{REQUEST_TYPE_LABELS[r.type]}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</p>
                      </div>
                      <span className={`rounded px-2 py-0.5 text-xs font-medium shrink-0 ${REQUEST_STATUS_CLASSES[r.status]}`}>
                        {REQUEST_STATUS_LABELS[r.status]}
                      </span>
                      <ChevronDown size={14} className={`text-muted-foreground shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 flex flex-col gap-2 text-sm bg-muted/20">
                        {r.reason && (
                          <p className="text-muted-foreground">Motif : <span className="text-foreground">{r.reason}</span></p>
                        )}
                        {r.status === 'escalated' && (
                          <p className="rounded-lg bg-violet-50 px-3 py-2 text-xs text-violet-700">
                            Transmise au super administrateur, en attente de décision.
                          </p>
                        )}
                        {r.status === 'rejected' && (
                          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                            {r.rejectionReason ?? 'Demande rejetée.'}
                          </p>
                        )}
                        {r.status === 'approved' && r.type === 'data_access' && (
                          <p className="rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary">
                            Un email contenant vos données a été envoyé à {user?.email ?? 'votre adresse email'}.
                          </p>
                        )}
                        {r.status === 'approved' && r.type === 'data_deletion' && (
                          <p className="rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary">
                            Votre demande a été approuvée, vos données ont été anonymisées.
                          </p>
                        )}
                        {r.status === 'approved' && r.type === 'account_update' && (
                          <p className="rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary">
                            Vos informations ont été mises à jour.
                          </p>
                        )}
                        {r.validatedAt && (
                          <p className="text-xs text-muted-foreground">Traitée le {formatDate(r.validatedAt)}.</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {meta && meta.lastPage > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-sm text-muted-foreground shrink-0">
            <p>Page {page} sur {meta.lastPage}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => p - 1)} disabled={page === 1 || isLoading}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-border hover:bg-accent disabled:opacity-40">‹</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page === meta.lastPage || isLoading}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-border hover:bg-accent disabled:opacity-40">›</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
