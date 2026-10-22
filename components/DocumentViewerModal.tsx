'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { apiFetch } from '@/src/lib/api-client'
import { tokenStore } from '@/src/lib/token-store'
import type { Document } from '@/src/types/document'
import { AlertCircle, Download, FileSpreadsheet, FileText, FileType, Loader2, X, ZoomIn, ZoomOut } from 'lucide-react'

const DocxEditorPanel = dynamic(() => import('@/components/DocxEditorPanel'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-white">
      <Loader2 size={28} className="animate-spin text-muted-foreground" />
    </div>
  ),
})

// ── Types de fichiers ──────────────────────────────────────

type FileKind = 'image' | 'pdf' | 'spreadsheet' | 'word' | 'other'

function fileKind(mimeType: string, ext: string): FileKind {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType === 'application/pdf') return 'pdf'
  if (
    mimeType === 'application/vnd.ms-excel' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    ['xls', 'xlsx', 'csv', 'ods'].includes(ext.toLowerCase())
  ) return 'spreadsheet'
  if (
    mimeType === 'application/msword' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ['doc', 'docx'].includes(ext.toLowerCase())
  ) return 'word'
  return 'other'
}

interface FileMeta { label: string; color: string; bg: string; icon: React.ReactNode }

function fileMeta(mimeType: string, ext: string): FileMeta {
  const e = ext.toLowerCase()

  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(e))
    return { label: ext.toUpperCase(), color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <FileText size={40} strokeWidth={1.2} /> }

  if (e === 'pdf')
    return { label: 'PDF', color: 'text-red-600', bg: 'bg-red-50', icon: <FileText size={40} strokeWidth={1.2} /> }

  if (['xls', 'xlsx'].includes(e))
    return { label: e.toUpperCase(), color: 'text-green-700', bg: 'bg-green-50', icon: <FileSpreadsheet size={40} strokeWidth={1.2} /> }

  if (e === 'csv')
    return { label: 'CSV', color: 'text-green-600', bg: 'bg-green-50', icon: <FileSpreadsheet size={40} strokeWidth={1.2} /> }

  if (['doc', 'docx'].includes(e))
    return { label: e.toUpperCase(), color: 'text-blue-600', bg: 'bg-blue-50', icon: <FileText size={40} strokeWidth={1.2} /> }

  if (['ppt', 'pptx'].includes(e))
    return { label: e.toUpperCase(), color: 'text-orange-600', bg: 'bg-orange-50', icon: <FileType size={40} strokeWidth={1.2} /> }

  return { label: ext ? ext.toUpperCase() : 'Fichier', color: 'text-muted-foreground', bg: 'bg-muted/40', icon: <FileText size={40} strokeWidth={1.2} /> }
}

async function fetchArrayBuffer(id: string, viewUrl?: string): Promise<ArrayBuffer | null> {
  const token = tokenStore.get()
  const url   = viewUrl ?? `/api/documents/view/${id}`
  const res   = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) return null
  return res.arrayBuffer()
}

// ── Composant ──────────────────────────────────────────────

export default function DocumentViewerModal({
  doc,
  onClose,
  onDownload,
  viewUrl,
  canEdit = false,
  onSaved,
}: {
  doc: Document
  onClose: () => void
  onDownload: () => void
  viewUrl?: string
  /** Autorise l'édition en place du .docx (mode='edit' au lieu de 'view'). */
  canEdit?: boolean
  /** Appelé après une sauvegarde réussie du contenu édité, pour rafraîchir la liste. */
  onSaved?: () => void
}) {
  const [url,       setUrl]       = useState<string | null>(null)
  const [wordBytes, setWordBytes] = useState<Uint8Array | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(false)
  const [zoom,      setZoom]      = useState(1)
  const [reloadTick, setReloadTick] = useState(0)
  const kind     = fileKind(doc.mimeType, doc.extension)
  const meta     = fileMeta(doc.mimeType, doc.extension)
  const imgRef   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let blobUrl: string | null = null
    let cancelled = false

    setLoading(true)
    setError(false)

    fetchArrayBuffer(doc.id, viewUrl)
      .then((buf) => {
        if (cancelled) return
        if (!buf) { setError(true); return }
        if (kind === 'word') {
          setWordBytes(new Uint8Array(buf))
        } else {
          const blob = new Blob([buf], { type: doc.mimeType })
          blobUrl = URL.createObjectURL(blob)
          setUrl(blobUrl)
        }
      })
      .catch(() => setError(true))
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => {
      cancelled = true
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [doc.id, reloadTick])

  // Raccourcis clavier
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return }
      if (kind !== 'image') return
      if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(z + 0.25, 4))
      if (e.key === '-')                   setZoom((z) => Math.max(z - 0.25, 0.25))
      if (e.key === '0')                   setZoom(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, kind])

  // Zoom molette sur les images
  useEffect(() => {
    if (kind !== 'image' || loading) return
    const el = imgRef.current
    if (!el) return
    function onWheel(e: WheelEvent) {
      e.preventDefault()
      setZoom((z) => Math.min(Math.max(z + (e.deltaY > 0 ? -0.1 : 0.1), 0.25), 4))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [kind, loading])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/85">

      {/* ── Barre du haut ──────────────────────────────── */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-4 py-2.5">

        <div className="flex min-w-0 items-center gap-2">
          <FileText size={15} className="shrink-0 text-muted-foreground" />
          <p className="truncate text-sm font-medium text-foreground">{doc.originalName}</p>
          <span className="shrink-0 text-xs text-muted-foreground">{doc.fileSizeFormatted}</span>
        </div>

        <div className="flex shrink-0 items-center gap-1">

          {/* Zoom (images uniquement) */}
          {kind === 'image' && !loading && !error && (
            <div className="mr-1.5 flex items-center gap-1">
              <button
                onClick={() => setZoom((z) => Math.max(z - 0.25, 0.25))}
                disabled={zoom <= 0.25}
                title="Zoom arrière (−)"
                className="flex h-7 w-7 items-center justify-center rounded border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
              >
                <ZoomOut size={14} />
              </button>
              <button
                onClick={() => setZoom(1)}
                title="Réinitialiser (0)"
                className="flex h-7 min-w-[2.75rem] items-center justify-center rounded border border-border px-1.5 font-mono text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                onClick={() => setZoom((z) => Math.min(z + 0.25, 4))}
                disabled={zoom >= 4}
                title="Zoom avant (+)"
                className="flex h-7 w-7 items-center justify-center rounded border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
              >
                <ZoomIn size={14} />
              </button>
            </div>
          )}

          <button
            onClick={onDownload}
            title="Télécharger"
            className="flex h-7 w-7 items-center justify-center rounded border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Download size={14} />
          </button>

          <button
            onClick={onClose}
            title="Fermer (Échap)"
            className="flex h-7 w-7 items-center justify-center rounded border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ── Contenu ────────────────────────────────────── */}
      <div className={kind === 'word' && !loading && !error
        ? 'flex flex-1 overflow-hidden'
        : 'flex flex-1 items-center justify-center overflow-auto p-4'}
      >

        {loading && (
          <Loader2 size={32} className="animate-spin text-white/50" />
        )}

        {!loading && error && (
          <div className="flex flex-col items-center gap-4 text-center text-white/70">
            <AlertCircle size={40} strokeWidth={1.5} />
            <p className="text-sm">Impossible de charger ce document.</p>
            <button
              onClick={onDownload}
              className="flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-sm transition-colors hover:bg-white/10"
            >
              <Download size={14} /> Télécharger à la place
            </button>
          </div>
        )}

        {!loading && !error && url && kind === 'image' && (
          <div
            ref={imgRef}
            className="flex h-full w-full cursor-zoom-in select-none items-center justify-center overflow-auto"
          >
            <img
              src={url}
              alt={doc.originalName}
              draggable={false}
              onError={() => setError(true)}
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center', transition: 'transform 0.1s ease' }}
              className="max-w-none rounded shadow-2xl"
            />
          </div>
        )}

        {!loading && !error && url && kind === 'pdf' && (
          <iframe
            src={url}
            title={doc.originalName}
            className="h-full w-full rounded border-0"
          />
        )}

        {!loading && !error && wordBytes && kind === 'word' && (
          <DocxEditorPanel
            key={reloadTick}
            doc={doc}
            bytes={wordBytes}
            canEdit={canEdit}
            onSaved={() => onSaved?.()}
            onReload={() => setReloadTick((t) => t + 1)}
          />
        )}

        {/* Formats non affichables (spreadsheet, ppt…) */}
        {!loading && !error && (kind === 'spreadsheet' || kind === 'other') && (
          <div className="flex flex-col items-center gap-5 text-center">
            <div className={`flex h-24 w-24 items-center justify-center rounded-2xl ${meta.bg}`}>
              <span className={meta.color}>{meta.icon}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className={`self-center rounded-full px-2.5 py-0.5 text-xs font-bold ${meta.bg} ${meta.color}`}>
                {meta.label}
              </span>
              <p className="mt-1 text-base font-medium text-white">{doc.originalName}</p>
              <p className="text-sm text-white/60">{doc.fileSizeFormatted} · {doc.categoryLabel}</p>
            </div>
            <p className="text-xs text-white/40">
              Ce format ne peut pas être affiché dans le navigateur.
            </p>
            <button
              onClick={onDownload}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              <Download size={15} /> Télécharger
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
