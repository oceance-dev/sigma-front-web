'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import {
  Archive,
  Ban,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Search,
  Users,
  X,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/src/lib/api-client'
import { ROLE_KEYS } from '@/src/lib/role-keys'
import type { Member, MemberMeta } from '@/src/types/member'
import { useDebounce } from '@/src/hooks/useDebounce'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { ActionBtn } from './_shared'

// ── Constants ──────────────────────────────────────────────

const MEMBER_STATUS_OPTIONS = [
  { value: '',      label: 'Tous les statuts' },
  { value: 'true',  label: 'Actifs' },
  { value: 'false', label: 'En attente / Inactifs' },
]

// ── MemberRow ──────────────────────────────────────────────

function MemberRow({
  member,
  roleName,
  onAction,
  onView,
  disabled,
}: {
  member: Member
  roleName?: string
  onAction: (type: 'approve' | 'reject' | 'suspend' | 'delete') => void
  onView: () => void
  disabled: boolean
}) {
  const initials = `${member.firstName[0]}${member.lastName[0]}`.toUpperCase()

  return (
    <div className="flex items-center gap-3 bg-card px-4 py-3 hover:bg-muted/40 transition-colors">

      {/* Avatar */}
      <div className="h-8 w-8 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
        {initials}
      </div>

      {/* Infos */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-foreground">{member.fullName}</p>
          {roleName && (
            <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">
              {roleName}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {member.email}
          {member.phone && ` · ${member.phone}`}
          {member.lastLoginAt && ` · Connexion ${new Date(member.lastLoginAt).toLocaleDateString('fr-FR')}`}
        </p>
      </div>

      {/* Statut */}
      <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${
        member.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
      }`}>
        {member.isActive ? 'Actif' : 'Inactif'}
      </span>

      {/* Actions */}
      <div className="flex gap-1 shrink-0">
        <ActionBtn
          onClick={onView}
          disabled={disabled}
          title="Voir / modifier le rôle"
          className="hover:bg-accent hover:text-foreground"
        >
          <Eye size={14} />
        </ActionBtn>
        {!member.isActive && (
          <ActionBtn
            onClick={() => onAction('approve')}
            disabled={disabled}
            title="Approuver"
            className="hover:bg-primary/10 hover:text-primary"
          >
            <Check size={14} />
          </ActionBtn>
        )}
        {!member.isActive && (
          <ActionBtn
            onClick={() => onAction('reject')}
            disabled={disabled}
            title="Rejeter"
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            <X size={14} />
          </ActionBtn>
        )}
        {member.isActive && (
          <ActionBtn
            onClick={() => onAction('suspend')}
            disabled={disabled}
            title="Suspendre"
            className="hover:bg-amber-100 hover:text-amber-700"
          >
            <Ban size={14} />
          </ActionBtn>
        )}
        <ActionBtn
          onClick={() => onAction('delete')}
          disabled={disabled}
          title="Archiver"
          className="hover:bg-destructive/10 hover:text-destructive"
        >
          <Archive size={14} />
        </ActionBtn>
      </div>
    </div>
  )
}

// ── MemberDetailModal ──────────────────────────────────────

function MemberDetailModal({ member, roleMap, onClose, onSaved }: {
  member: Member
  roleMap: Record<string, string>
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const [selectedRole, setSelectedRole] = useState(member.associationRoleKey ?? '')
  const [error,        setError]        = useState<string | null>(null)
  const [isPending,    startTransition] = useTransition()

  const hasChanged = selectedRole !== (member.associationRoleKey ?? '')

  function save() {
    if (!hasChanged) return
    setError(null)
    startTransition(async () => {
      const res  = await apiFetch(`/admin/members/${member.id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ roleKey: selectedRole }),
      })
      const json = await res.json()
      if (res.ok) onSaved(json.message ?? 'Rôle mis à jour.')
      else setError(json.message ?? 'Erreur lors de la mise à jour.')
    })
  }

  const initials = `${member.firstName[0]}${member.lastName[0]}`.toUpperCase()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-sm rounded-xl border border-border bg-card shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-medium text-foreground">Détail du membre</h2>
          <button onClick={onClose} className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent">
            <X size={14} />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-4">

          {/* Identité */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{member.fullName}</p>
              <p className="text-xs text-muted-foreground truncate">{member.email}</p>
              {member.phone && <p className="text-xs text-muted-foreground">{member.phone}</p>}
            </div>
          </div>

          {/* Statut */}
          <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
            <span className="text-xs text-muted-foreground">Statut</span>
            <span className={`rounded px-2 py-0.5 text-xs font-medium ${
              member.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {member.isActive ? 'Actif' : 'Inactif'}
            </span>
          </div>

          {/* Rôle */}
          <div className="grid gap-1.5">
            <Label htmlFor="member-role">Rôle</Label>
            <select
              id="member-role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              disabled={isPending}
              className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
            >
              <option value="">— Aucun rôle —</option>
              {Object.entries(roleMap).map(([key, name]) => (
                <option key={key} value={key}>{name}</option>
              ))}
            </select>
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-border p-4">
          <Button variant="secondary" onClick={onClose} disabled={isPending}>Fermer</Button>
          <Button onClick={save} disabled={isPending || !hasChanged}>
            {isPending ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── MembresTab ─────────────────────────────────────────────

export default function MembresTab() {
  const [members,  setMembers]  = useState<Member[]>([])
  const [meta,     setMeta]     = useState<MemberMeta | null>(null)
  const [roleMap,  setRoleMap]  = useState<Record<string, string>>({})
  const [search,   setSearch]   = useState('')
  const [isActive, setIsActive] = useState('')
  const [page,     setPage]     = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [confirmPending, setConfirmPending] = useState<null | { message: string; onConfirm: () => void }>(null)
  const [viewingMember, setViewingMember] = useState<Member | null>(null)

  const debouncedSearch = useDebounce(search)

  useEffect(() => {
    apiFetch('/admin/role').then((r) => r.json()).then((json) => {
      const list: Record<string, { name: string }> = json.data?.list ?? {}
      const map: Record<string, string> = {}
      Object.entries(list).forEach(([key, val]) => { map[key] = val.name })
      setRoleMap(map)
    }).catch(() => {})
  }, [])

  const load = useCallback(async (p: number, q: string, active: string) => {
    setIsLoading(true)
    const params = new URLSearchParams({ page: String(p), limit: '15' })
    if (q) params.set('search', q)
    if (active !== '') params.set('isActive', active)
    const res = await apiFetch(`/admin/members?${params}`)
    if (res.ok) {
      const json = await res.json()
      // Exclure les candidats — ils appartiennent à l'onglet Candidatures
      const all: Member[] = json.data.members ?? []
      setMembers(all.filter((m) => m.associationRoleKey !== ROLE_KEYS.CANDIDAT))
      setMeta(json.data.meta ?? null)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => { load(page, debouncedSearch, isActive) }, [load, page, debouncedSearch, isActive])

  function handleSearch(value: string) { setSearch(value); setPage(1) }
  function handleFilter(value: string) { setIsActive(value); setPage(1) }

  function action(id: string, type: 'approve' | 'reject' | 'suspend' | 'delete') {
    const labels = { approve: 'approuver', reject: 'rejeter', suspend: 'suspendre', delete: 'archiver' }
    if (type === 'approve') {
      startTransition(async () => {
        const res = await apiFetch(`/admin/members/${id}/${type}`, { method: 'POST' })
        const json = await res.json()
        if (res.ok) {
          setFeedback({ message: json.message, type: 'success' })
          load(page, debouncedSearch, isActive)
        } else {
          setFeedback({ message: json.message ?? 'Une erreur est survenue.', type: 'error' })
        }
      })
    } else {
      setConfirmPending({
        message: `Voulez-vous ${labels[type]} ce membre ?`,
        onConfirm: () => {
          startTransition(async () => {
            const res = await apiFetch(`/admin/members/${id}/${type}`, { method: 'POST' })
            const json = await res.json()
            if (res.ok) {
              setFeedback({ message: json.message, type: 'success' })
              load(page, debouncedSearch, isActive)
            } else {
              setFeedback({ message: json.message ?? 'Une erreur est survenue.', type: 'error' })
            }
          })
        },
      })
    }
  }

  return (
    <div className="flex flex-col gap-4">

      {/* ── En-tête ─────────────────────────────────────── */}
      <div>
        <p className="text-sm font-medium text-foreground">Membres</p>
        <p className="text-xs text-muted-foreground">Gérez les membres de votre association.</p>
      </div>

      {/* ── Feedback ────────────────────────────────────── */}
      {feedback && (
        <div className={`flex items-center justify-between rounded-lg px-4 py-2 text-sm ${
          feedback.type === 'success' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'
        }`}>
          {feedback.message}
          <button onClick={() => setFeedback(null)}><X size={13} /></button>
        </div>
      )}

      {/* ── Filtres ─────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un membre…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={isActive}
          onChange={(e) => handleFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {MEMBER_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* ── Liste ───────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 size={16} className="animate-spin" /> Chargement…
        </div>
      ) : members.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
          <Users size={36} strokeWidth={1.5} />
          <p className="text-sm">Aucun membre trouvé.</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-xl border border-border overflow-hidden">
          {members.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              roleName={roleMap[member.associationRoleKey]}
              onAction={(type) => action(member.id, type)}
              onView={() => setViewingMember(member)}
              disabled={isPending}
            />
          ))}
        </div>
      )}

      {/* ── Pagination ──────────────────────────────────── */}
      {meta && meta.lastPage > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>{meta.total} membre{meta.total > 1 ? 's' : ''}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1 || isLoading}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-accent disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs">{page} / {meta.lastPage}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page === meta.lastPage || isLoading}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-accent disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmPending}
        message={confirmPending?.message ?? ''}
        onConfirm={() => { confirmPending?.onConfirm(); setConfirmPending(null) }}
        onCancel={() => setConfirmPending(null)}
        danger
      />

      {viewingMember && (
        <MemberDetailModal
          member={viewingMember}
          roleMap={roleMap}
          onClose={() => setViewingMember(null)}
          onSaved={(msg) => {
            setViewingMember(null)
            setFeedback({ message: msg, type: 'success' })
            load(page, debouncedSearch, isActive)
          }}
        />
      )}
    </div>
  )
}
