'use client'

import { apiFetch } from '@/src/lib/api-client'
import { useCallback, useEffect, useState, useTransition } from 'react'
import { KeyRound, Loader2, Trash2, Users, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/src/context/auth-context'
import { DeletionCodeModal } from '@/components/DeletionCodeModal'
import type { Member, MemberDetailResponse } from '@/src/types/member'

export default function SuperAdminUsersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [meta, setMeta] = useState<{ total: number; lastPage: number; currentPage: number } | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [detailTarget, setDetailTarget] = useState<Member | null>(null)
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const load = useCallback(async (p: number, q: string) => {
    setIsLoading(true)
    const params = new URLSearchParams({ page: String(p), limit: '20' })
    if (q) params.set('search', q)
    const res = await apiFetch(`/super-admin/users?${params}`)
    if (res.ok) {
      const json = await res.json()
      setMembers(json.data.users ?? [])
      setMeta(json.data.meta ?? null)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => { load(page, search) }, [load, page, search])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Utilisateurs</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Tous les utilisateurs de la plateforme</p>
      </div>

      {feedback && (
        <div className={`flex items-center justify-between rounded-lg px-4 py-2 text-sm ${feedback.type === 'success' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
          {feedback.message}
          <button onClick={() => setFeedback(null)}><X size={13} /></button>
        </div>
      )}

      <div className="flex items-center gap-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Rechercher un utilisateur…"
          className="h-9 flex-1 max-w-sm rounded-md border border-input bg-transparent px-3 text-sm placeholder:text-muted-foreground outline-none focus-visible:border-ring"
        />
        {meta && <p className="text-sm text-muted-foreground">{meta.total} utilisateur{meta.total > 1 ? 's' : ''}</p>}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={20} className="animate-spin text-muted-foreground" />
        </div>
      ) : members.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-center text-muted-foreground">
          <Users size={32} className="opacity-30" />
          <p className="text-sm">Aucun utilisateur trouvé.</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-xl border border-border overflow-hidden">
          {members.map((m) => {
            const initials = `${m.firstName[0]}${m.lastName[0]}`.toUpperCase()
            return (
              <div
                key={m.id}
                role="button"
                tabIndex={0}
                onClick={() => setDetailTarget(m)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDetailTarget(m) } }}
                className="flex items-center gap-3 bg-card px-4 py-3 hover:bg-muted/40 transition-colors cursor-pointer outline-none focus-visible:bg-muted/40"
              >
                <div className="h-9 w-9 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{m.fullName}</p>
                  <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                </div>
                <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${m.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {m.isActive ? 'Actif' : 'Inactif'}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {meta && meta.lastPage > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>Page {page} sur {meta.lastPage}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1 || isLoading}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-accent disabled:opacity-40">‹</button>
            <span className="text-xs">{page} / {meta.lastPage}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page === meta.lastPage || isLoading}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-accent disabled:opacity-40">›</button>
          </div>
        </div>
      )}

      {detailTarget && (
        <UserDetailModal
          userId={detailTarget.id}
          onClose={() => setDetailTarget(null)}
          onFeedback={(f) => setFeedback(f)}
          onDeleted={(id, message) => {
            setDetailTarget(null)
            setMembers((prev) => prev.filter((m) => m.id !== id))
            setMeta((prev) => (prev ? { ...prev, total: Math.max(0, prev.total - 1) } : prev))
            setFeedback({ message, type: 'success' })
          }}
        />
      )}
    </div>
  )
}

function UserDetailModal({ userId, onClose, onFeedback, onDeleted }: {
  userId: string
  onClose: () => void
  onFeedback: (feedback: { message: string; type: 'success' | 'error' }) => void
  onDeleted: (userId: string, message: string) => void
}) {
  const { user: currentUser } = useAuth()
  const [data, setData] = useState<MemberDetailResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isConfirmingReset, setIsConfirmingReset] = useState(false)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

  useEffect(() => {
    let cancelled = false
    apiFetch(`/super-admin/users/${userId}`).then(async (res) => {
      const json = await res.json()
      if (cancelled) return
      if (res.ok) setData(json.data)
      else setError(json.message ?? 'Utilisateur introuvable.')
      setIsLoading(false)
    })
    return () => { cancelled = true }
  }, [userId])

  const user = data?.user
  const isPendingCandidate = !data?.role && !!user?.associationId
  const isSelf = !!currentUser && currentUser.id === userId

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-medium text-foreground truncate">{user?.fullName ?? 'Détail utilisateur'}</h2>
          <button onClick={onClose} className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent shrink-0">
            <X size={14} />
          </button>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={20} className="animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          ) : user && data && (
            <div className="flex flex-col gap-4 text-sm">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="text-foreground truncate max-w-[60%]">{user.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Téléphone</span>
                  <span className="text-foreground">{user.phone ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Date de naissance</span>
                  <span className="text-foreground">
                    {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('fr-FR') : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Sexe</span>
                  <span className="text-foreground">{user.sexe ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Ville</span>
                  <span className="text-foreground">{user.city_code || '—'}</span>
                </div>
              </div>

              <div className="flex flex-col gap-1 border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Statut</span>
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${user.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {user.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Membre</span>
                  <span className="text-foreground">{user.membre ? 'Oui' : 'Non'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Rôle</span>
                  <span className="text-foreground">
                    {data.role?.name ?? (isPendingCandidate ? 'Candidat en attente' : '—')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Association</span>
                  <span className="text-foreground truncate max-w-[60%]">
                    {data.association?.name ?? (user.isSuperAdmin ? 'Aucune (super admin plateforme)' : '—')}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1 border-t border-border pt-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Dernière connexion</span>
                  <span className="text-foreground">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('fr-FR') : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Email vérifié</span>
                  <span className="text-foreground">{user.isEmailVerified ? 'Oui' : 'Non'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Compte verrouillé</span>
                  {user.isLocked ? (
                    <span className="rounded px-2 py-0.5 text-xs font-medium bg-destructive/10 text-destructive">Verrouillé</span>
                  ) : (
                    <span className="text-foreground">Non</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Créé le</span>
                  <span className="text-foreground">{new Date(user.createdAt).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 border-t border-destructive/20 pt-4">
                <p className="text-xs font-semibold text-destructive uppercase tracking-wider">Zone dangereuse</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setIsConfirmingReset(true)}
                    disabled={isSelf}
                    title={isSelf ? 'Vous ne pouvez pas réinitialiser votre propre mot de passe depuis cet écran.' : undefined}
                  >
                    <KeyRound size={14} /> Réinitialiser le mot de passe
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setIsConfirmingDelete(true)}
                    disabled={isSelf}
                    title={isSelf ? 'Vous ne pouvez pas supprimer votre propre compte depuis cet écran.' : undefined}
                  >
                    <Trash2 size={14} /> Supprimer l’utilisateur
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

    {isConfirmingReset && user && (
      <ResetPasswordModal
        userId={userId}
        userName={user.fullName}
        onClose={() => setIsConfirmingReset(false)}
        onSuccess={(msg) => {
          setIsConfirmingReset(false)
          onClose()
          onFeedback({ message: msg, type: 'success' })
        }}
      />
    )}

    {isConfirmingDelete && user && (
      <DeletionCodeModal
        title="Supprimer l’utilisateur"
        warningText={
          <>
            Vous êtes sur le point de supprimer le compte de{' '}
            <span className="font-medium text-foreground">{user.fullName}</span> (désactivation
            immédiate, données conservées). Un code de confirmation vous sera envoyé par email, à
            vous, pas à l&apos;utilisateur.
          </>
        }
        requestCode={() => apiFetch(`/super-admin/users/${userId}/deletion-code`, { method: 'POST' })}
        confirmDeletion={(code) => apiFetch(`/super-admin/users/${userId}`, {
          method: 'DELETE',
          body: JSON.stringify({ code }),
        })}
        onDeleted={(msg) => { setIsConfirmingDelete(false); onDeleted(userId, msg) }}
        onCancel={() => setIsConfirmingDelete(false)}
      />
    )}
    </>
  )
}

function ResetPasswordModal({ userId, userName, onClose, onSuccess }: {
  userId: string
  userName: string
  onClose: () => void
  onSuccess: (message: string) => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function confirmReset() {
    setError(null)
    startTransition(async () => {
      const res = await apiFetch(`/super-admin/users/${userId}/reset-password`, { method: 'POST' })
      const json = await res.json().catch(() => ({}))
      if (res.ok) onSuccess(json.message ?? 'Email envoyé à l\'utilisateur.')
      else setError(json.message ?? 'Une erreur est survenue.')
    })
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !isPending) onClose() }}>
      <div className="w-full max-w-sm rounded-xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-medium text-foreground">Réinitialiser le mot de passe</h2>
          <button onClick={onClose} disabled={isPending} className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent shrink-0 disabled:opacity-40">
            <X size={14} />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-4">
          <p className="text-sm text-muted-foreground">
            Un mot de passe provisoire va être généré et envoyé par email à{' '}
            <span className="font-medium text-foreground">{userName}</span>. Cette action va :
          </p>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            <li>déconnecter immédiatement toutes ses sessions actives ;</li>
            <li>lui envoyer un nouveau mot de passe provisoire par email (vous ne le verrez jamais) ;</li>
            <li>le forcer à changer ce mot de passe à sa prochaine connexion.</li>
          </ul>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
              Annuler
            </Button>
            <Button type="button" variant="destructive" onClick={confirmReset} disabled={isPending}>
              {isPending ? 'Envoi…' : 'Confirmer la réinitialisation'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
