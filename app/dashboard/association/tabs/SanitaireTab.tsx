'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ChevronRight,
  FileText,
  HeartPulse,
  Loader2,
  Search,
  X,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { apiFetch } from '@/src/lib/api-client'
import type { Member } from '@/src/types/member'
import type { Document } from '@/src/types/document'
import DocumentViewerModal from '@/components/DocumentViewerModal'

// ── Helpers ────────────────────────────────────────────────

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function age(iso: string | null): number | null {
  if (!iso) return null
  const b = new Date(iso)
  const d = new Date()
  let a = d.getFullYear() - b.getFullYear()
  const m = d.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && d.getDate() < b.getDate())) a--
  return a
}

// ── Cadet detail panel ─────────────────────────────────────

function CadetMedicalPanel({ cadet, onClose }: { cadet: Member; onClose: () => void }) {
  const [docs,      setDocs]      = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const [viewing,   setViewing]   = useState<Document | null>(null)

  useEffect(() => {
    setIsLoading(true)
    apiFetch(`/admin/cadets/${cadet.id}/medical-documents`)
      .then(async (r) => {
        if (!r.ok) { setError('Impossible de charger les documents médicaux.'); return }
        const json = await r.json()
        const list: Document[] = json.data?.documents ?? json.data ?? []
        setDocs(Array.isArray(list) ? list : [])
      })
      .catch(() => setError('Impossible de contacter le serveur.'))
      .finally(() => setIsLoading(false))
  }, [cadet.id])

  const yearsOld = age(cadet.dateOfBirth)

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-md bg-card border-l border-border shadow-xl flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {cadet.firstName[0]}{cadet.lastName[0]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{cadet.fullName}</p>
              <p className="text-xs text-muted-foreground truncate">
                {cadet.sexe && `${cadet.sexe} · `}
                {yearsOld !== null ? `${yearsOld} ans` : fmtDate(cadet.dateOfBirth)}
                {cadet.phone && ` · ${cadet.phone}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Contenu */}
        <div className="flex flex-col gap-3 p-4 overflow-y-auto flex-1">
          <div className="flex items-center gap-2">
            <HeartPulse size={15} className="text-primary" />
            <p className="text-sm font-medium text-foreground">Documents médicaux</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 size={14} className="animate-spin" /> Chargement…
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle size={14} />{error}
            </div>
          ) : docs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
              <FileText size={32} strokeWidth={1.5} />
              <p className="text-sm">Aucun document médical.</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border rounded-xl border border-border overflow-hidden">
              {docs.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setViewing(doc)}
                  className="flex items-center gap-3 bg-card px-4 py-3 text-left hover:bg-muted/40 transition-colors"
                >
                  <FileText size={15} className="shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{doc.originalName}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.fileSizeFormatted} · {doc.categoryLabel}
                      {doc.expirationDate && ` · Expire le ${fmtDate(doc.expirationDate)}`}
                      {doc.isExpired && <span className="ml-1 text-destructive">· Expiré</span>}
                    </p>
                  </div>
                  <ChevronRight size={14} className="shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {viewing && (
        <DocumentViewerModal
          doc={viewing}
          onClose={() => setViewing(null)}
          onDownload={() => {}}
        />
      )}
    </div>
  )
}

// ── Tab ────────────────────────────────────────────────────

export default function SanitaireTab() {
  const currentYear = new Date().getFullYear()
  const [cadets,    setCadets]    = useState<Member[]>([])
  const [year,      setYear]      = useState<number>(currentYear)
  const [search,    setSearch]    = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const [selected,  setSelected]  = useState<Member | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const res = await apiFetch(`/admin/cadets?year=${year}`)
    if (res.status === 403) {
      setError('Fonctionnalité réservée aux associations de gendarmerie.')
      setIsLoading(false)
      return
    }
    if (!res.ok) {
      setError('Impossible de charger les cadets.')
      setIsLoading(false)
      return
    }
    const json = await res.json()
    setCadets(Array.isArray(json.data) ? json.data : (json.data?.cadets ?? []))
    setIsLoading(false)
  }, [year])

  useEffect(() => { load() }, [load])

  const years = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => currentYear - i)
  }, [currentYear])

  const filtered = cadets.filter((c) => {
    const q = search.trim().toLowerCase()
    return !q || c.fullName.toLowerCase().includes(q)
  })

  return (
    <div className="flex flex-col gap-4">

      {/* Sélecteur année + badge */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {year < currentYear ? (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
            Promotion archivée
          </span>
        ) : <span />}
        <div className="flex items-center gap-2">
          <label htmlFor="sanitaire-year" className="text-xs text-muted-foreground">Promotion</label>
          <select
            id="sanitaire-year"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            disabled={isLoading}
            className="h-8 rounded-md border border-input px-2 text-sm outline-none focus-visible:border-ring"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}{y === currentYear ? ' (en cours)' : ''}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
          <AlertCircle size={14} />{error}
        </div>
      )}

      {/* Barre recherche */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher un cadet…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Contenu */}
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 size={16} className="animate-spin" /> Chargement…
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
          <HeartPulse size={36} strokeWidth={1.5} />
          <p className="text-sm">
            {search ? 'Aucun résultat.' : `Aucun cadet pour la promotion ${year}.`}
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {filtered.length} cadet{filtered.length > 1 ? 's' : ''} · Cliquez pour voir les documents médicaux
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((cadet) => {
              const initials = `${cadet.firstName[0]}${cadet.lastName[0]}`.toUpperCase()
              const yearsOld = age(cadet.dateOfBirth)
              return (
                <button
                  key={cadet.id}
                  onClick={() => setSelected(cadet)}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-left hover:border-primary/40 hover:shadow-sm transition-all"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{cadet.fullName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {cadet.sexe && `${cadet.sexe} · `}
                      {yearsOld !== null ? `${yearsOld} ans` : '—'}
                    </p>
                  </div>
                  <ChevronRight size={14} className="shrink-0 text-muted-foreground" />
                </button>
              )
            })}
          </div>
        </>
      )}

      {/* Panneau détail */}
      {selected && (
        <CadetMedicalPanel cadet={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
