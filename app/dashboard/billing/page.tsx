'use client'

import { apiFetch } from '@/src/lib/api-client'
import { useEffect, useState } from 'react'
import { Download, FileX, Loader2 } from 'lucide-react'
import type { Invoice } from '@/src/types/billing'
import { formatDate } from '@/src/lib/date-utils'

// ── Helpers ────────────────────────────────────────────────

const STATUS_LABELS: Record<Invoice['status'], string> = {
  paid:           'Payée',
  open:           'En attente',
  void:           'Annulée',
  uncollectible:  'Irrécouvrable',
}

const STATUS_CLASSES: Record<Invoice['status'], string> = {
  paid:           'bg-primary/10 text-primary',
  open:           'bg-amber-100 text-amber-700',
  void:           'bg-muted text-muted-foreground',
  uncollectible:  'bg-destructive/10 text-destructive',
}

// ── Page ───────────────────────────────────────────────────

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch('/billing/invoices')
      .then((r) => r.json())
      .then((json) => setInvoices(json.data ?? []))
      .catch(() => setError('Impossible de charger les factures.'))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="heading-1">Facturation</h1>
        <p className="text-muted mt-1">Historique de vos factures.</p>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 size={16} className="animate-spin" />
          Chargement…
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
      )}

      {!isLoading && !error && invoices.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
          <FileX size={36} strokeWidth={1.5} />
          <p className="text-sm">Aucune facture pour le moment.</p>
        </div>
      )}

      {!isLoading && invoices.length > 0 && (
        <div className="flex flex-col divide-y divide-border rounded-xl border border-border overflow-hidden">
          {invoices.map((inv) => (
            <div key={inv.id} className="flex items-center gap-4 bg-card px-4 py-3 hover:bg-muted/40 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{formatDate(inv.paidAt ?? inv.createdAt)}</p>
                <p className="text-xs text-muted-foreground">{inv.stripeInvoiceId}</p>
              </div>

              <p className="text-sm font-medium text-foreground shrink-0">{inv.amountPaidFormatted}</p>

              <span className={`rounded px-2 py-0.5 text-xs font-medium shrink-0 ${STATUS_CLASSES[inv.status]}`}>
                {STATUS_LABELS[inv.status]}
              </span>

              {inv.invoicePdf && (
                <a
                  href={inv.invoicePdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  aria-label="Télécharger la facture"
                >
                  <Download size={15} />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
