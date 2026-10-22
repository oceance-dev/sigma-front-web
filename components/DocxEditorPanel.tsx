'use client'

import { useRef, useState } from 'react'
import { DocxEditor, type DocxEditorRef } from '@docx-editor.dev/react'
import '@docx-editor.dev/core/styles/editor.css'
import { apiFetch } from '@/src/lib/api-client'
import type { Document } from '@/src/types/document'
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react'

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

type SaveStatus =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'conflict' }
  | { kind: 'error'; message: string }

export default function DocxEditorPanel({
  doc,
  bytes,
  canEdit,
  onSaved,
  onReload,
}: {
  doc: Document
  bytes: Uint8Array
  canEdit: boolean
  onSaved?: (version: number) => void
  onReload?: () => void
}) {
  const editorRef = useRef<DocxEditorRef>(null)
  const [status, setStatus]   = useState<SaveStatus>({ kind: 'idle' })
  const [version, setVersion] = useState(doc.version)

  async function handleSave() {
    const out = await editorRef.current?.save()
    if (!out) return

    setStatus({ kind: 'saving' })

    const fd = new FormData()
    fd.append('file', new Blob([out], { type: DOCX_MIME }), doc.originalName)
    fd.append('version', String(version))

    const res = await apiFetch(`/documents/users/update-content/${doc.id}`, {
      method: 'PUT',
      body: fd,
    })

    if (res.status === 409) { setStatus({ kind: 'conflict' }); return }
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setStatus({ kind: 'error', message: j.message ?? 'Erreur lors de la sauvegarde.' })
      return
    }

    const { data } = await res.json()
    setVersion(data.version)
    setStatus({ kind: 'idle' })
    onSaved?.(data.version)
  }

  return (
    <div className="flex h-full w-full flex-col bg-white">
      {status.kind === 'conflict' && (
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          <span className="flex items-center gap-2">
            <AlertTriangle size={14} />
            Ce document a été modifié entre-temps par quelqu&apos;un d&apos;autre. Rechargez-le avant de continuer.
          </span>
          {onReload && (
            <button
              onClick={onReload}
              className="flex shrink-0 items-center gap-1.5 rounded border border-amber-300 px-2 py-1 text-xs font-medium hover:bg-amber-100"
            >
              <RefreshCw size={12} /> Recharger
            </button>
          )}
        </div>
      )}

      {status.kind === 'error' && (
        <div className="flex shrink-0 items-center gap-2 border-b border-destructive/20 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          <AlertTriangle size={14} />
          {status.message}
        </div>
      )}

      <div className="relative min-h-0 flex-1">
        <DocxEditor
          ref={editorRef}
          document={bytes}
          mode={canEdit ? 'edit' : 'view'}
          title={doc.originalName}
          onSave={canEdit ? handleSave : undefined}
          className="h-full w-full"
        />

        {status.kind === 'saving' && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  )
}
