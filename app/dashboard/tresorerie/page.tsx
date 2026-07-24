'use client'

import { useCallback, useEffect, useState, useTransition, type FormEvent } from 'react'
import {
  ArrowDownLeft, ArrowUpRight, Ban, ChevronLeft, ChevronRight,
  Download, FileText, Loader2, Pencil, Plus, Search, SlidersHorizontal,
  Trash2, TrendingDown, TrendingUp, Wallet, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiFetch } from '@/src/lib/api-client'
import { formatDateShort } from '@/src/lib/date-utils'
import {
  EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS,
  type BudgetLine, type Transaction, type TransactionMeta, type TransactionType, type TreasuryStats,
} from '@/src/types/tresorerie'

// ── Helpers ────────────────────────────────────────────────

const YEAR = new Date().getFullYear()

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

function categoryLabel(type: TransactionType, id: string) {
  const list = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  return list.find(c => c.id === id)?.label ?? id
}

const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES]

const FR_MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

// ── Tabs ───────────────────────────────────────────────────

type Tab = 'overview' | 'transactions' | 'budget' | 'rapport'
const TABS: { id: Tab; label: string }[] = [
  { id: 'overview',      label: 'Vue d\'ensemble' },
  { id: 'transactions',  label: 'Mouvements' },
  { id: 'budget',        label: 'Budget' },
  { id: 'rapport',       label: 'Rapport AG' },
]

// ── Page ───────────────────────────────────────────────────

export default function TresoreriePage() {
  const [tab, setTab] = useState<Tab>('overview')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-foreground">Trésorerie</h1>
        <p className="text-sm text-muted-foreground">
          Suivi financier de votre association — exercice {YEAR}
        </p>
      </div>

      {/* Nav tabs */}
      <div className="flex gap-1 border-b border-border">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview'     && <OverviewTab />}
      {tab === 'transactions' && <TransactionsTab />}
      {tab === 'budget'       && <BudgetTab />}
      {tab === 'rapport'      && <RapportTab />}
    </div>
  )
}

// ── Vue d'ensemble ─────────────────────────────────────────

function OverviewTab() {
  const [stats,   setStats]   = useState<TreasuryStats | null>(null)
  const [recent,  setRecent]  = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      apiFetch(`/tresorerie/stats?year=${YEAR}`).then(r => r.ok ? r.json() : null),
      apiFetch('/tresorerie/transactions?limit=5').then(r => r.ok ? r.json() : null),
    ]).then(([statsRes, txRes]) => {
      if (statsRes.status === 'fulfilled' && statsRes.value) setStats(statsRes.value.data)
      if (txRes.status   === 'fulfilled' && txRes.value)   setRecent(txRes.value.data?.transactions ?? [])
      setLoading(false)
    })
  }, [])

  if (loading) return <CenteredSpinner />

  const balance    = stats?.balance ?? 0
  const mIncome    = stats?.currentMonthIncome  ?? 0
  const mExpense   = stats?.currentMonthExpense ?? 0
  const yResult    = (stats?.yearIncome ?? 0) - (stats?.yearExpense ?? 0)
  const monthly    = stats?.monthlyData ?? []
  const maxVal     = Math.max(...monthly.flatMap(m => [m.income, m.expense]), 1)

  return (
    <div className="flex flex-col gap-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard icon={<Wallet size={18} />}       color="bg-primary/10 text-primary"          label="Solde actuel"          value={fmt(balance)}      />
        <KpiCard icon={<ArrowDownLeft size={18} />} color="bg-emerald-100 text-emerald-600"     label="Revenus ce mois"       value={fmt(mIncome)}      />
        <KpiCard icon={<ArrowUpRight size={18} />}  color="bg-rose-100 text-rose-600"           label="Dépenses ce mois"      value={fmt(mExpense)}     />
        <KpiCard icon={yResult >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                 color={yResult >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}
                 label="Résultat annuel" value={fmt(yResult)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Graphique mensuel */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Évolution {YEAR}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" />Revenus</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-400" />Dépenses</span>
            </div>
          </div>
          {monthly.length === 0 ? (
            <EmptyState icon={<TrendingUp size={28} />} text="Aucune donnée pour l'exercice en cours" />
          ) : (
            <div className="flex items-end gap-1.5 h-40">
              {monthly.map(m => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full flex flex-col justify-end gap-0.5 flex-1">
                    <div className="w-full bg-emerald-400/80 rounded-t-sm" style={{ height: `${(m.income / maxVal) * 100}%`, minHeight: m.income > 0 ? 2 : 0 }} />
                    <div className="w-full bg-rose-400/80 rounded-t-sm"    style={{ height: `${(m.expense / maxVal) * 100}%`, minHeight: m.expense > 0 ? 2 : 0 }} />
                  </div>
                  <p className="text-[9px] text-muted-foreground">{FR_MONTHS[m.month - 1]}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Répartition dépenses */}
        <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
          <p className="text-sm font-semibold text-foreground">Dépenses par catégorie</p>
          {recent.filter(t => t.type === 'expense').length === 0 ? (
            <EmptyState icon={<FileText size={24} />} text="Aucune dépense enregistrée" small />
          ) : (
            <CategoryBreakdown transactions={recent} type="expense" />
          )}
        </div>
      </div>

      {/* Transactions récentes */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <p className="text-sm font-semibold text-foreground">Derniers mouvements</p>
        </div>
        {recent.length === 0
          ? <div className="py-10"><EmptyState icon={<Wallet size={28} />} text="Aucun mouvement enregistré" /></div>
          : <div className="divide-y divide-border">{recent.map(t => <TxRow key={t.id} tx={t} />)}</div>
        }
      </div>
    </div>
  )
}

// ── Mouvements ─────────────────────────────────────────────

function TransactionsTab() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [meta,         setMeta]         = useState<TransactionMeta | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [page,         setPage]         = useState(1)
  const [search,       setSearch]       = useState('')
  const [filterType,   setFilterType]   = useState<'' | 'income' | 'expense'>('')
  const [showForm,     setShowForm]     = useState(false)
  const [editing,      setEditing]      = useState<Transaction | null>(null)
  const [deleting,     setDeleting]     = useState<Transaction | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '15', year: String(YEAR) })
    if (search)     params.set('search', search)
    if (filterType) params.set('type',   filterType)
    const res = await apiFetch(`/tresorerie/transactions?${params}`)
    if (res.ok) {
      const json = await res.json()
      setTransactions(json.data?.transactions ?? [])
      setMeta(json.data?.meta ?? null)
    }
    setLoading(false)
  }, [page, search, filterType])

  useEffect(() => { load() }, [load])

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Rechercher…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="pl-8" />
          </div>
          <select
            value={filterType}
            onChange={e => { setFilterType(e.target.value as '' | 'income' | 'expense'); setPage(1) }}
            className="h-9 rounded-md border border-input bg-card px-2.5 text-sm text-foreground outline-none focus-visible:border-ring"
          >
            <option value="">Tous</option>
            <option value="income">Entrées</option>
            <option value="expense">Sorties</option>
          </select>
        </div>
        <Button size="sm" onClick={() => { setEditing(null); setShowForm(true) }} className="gap-1.5 shrink-0">
          <Plus size={15} /> Nouveau mouvement
        </Button>
      </div>

      {/* Liste */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="py-16"><CenteredSpinner /></div>
        ) : transactions.length === 0 ? (
          <div className="py-16"><EmptyState icon={<SlidersHorizontal size={28} />} text="Aucun mouvement trouvé" /></div>
        ) : (
          <div className="divide-y divide-border">
            {transactions.map(tx => (
              <TxRow key={tx.id} tx={tx}
                onEdit={() => { setEditing(tx); setShowForm(true) }}
                onDelete={() => setDeleting(tx)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.lastPage > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">{meta.total} mouvement{meta.total !== 1 ? 's' : ''}</p>
          <div className="flex items-center gap-1">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-accent disabled:opacity-40">
              <ChevronLeft size={14} />
            </button>
            <span className="px-2 text-muted-foreground">{page}/{meta.lastPage}</span>
            <button disabled={page === meta.lastPage} onClick={() => setPage(p => p + 1)}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-accent disabled:opacity-40">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <TransactionModal
          initial={editing}
          onClose={() => { setShowForm(false); setEditing(null) }}
          onSaved={() => { setShowForm(false); setEditing(null); load() }}
        />
      )}
      {deleting && (
        <DeleteModal
          tx={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => { setDeleting(null); load() }}
        />
      )}
    </div>
  )
}

// ── Budget ─────────────────────────────────────────────────

function BudgetTab() {
  const [lines,   setLines]   = useState<BudgetLine[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [value,   setValue]   = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    apiFetch(`/tresorerie/budget?year=${YEAR}`)
      .then(r => r.ok ? r.json() : null)
      .then(json => { if (json) setLines(json.data?.budget ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function savebudget(categoryId: string) {
    startTransition(async () => {
      await apiFetch(`/tresorerie/budget/${categoryId}`, {
        method: 'PUT',
        body: JSON.stringify({ year: YEAR, plannedAmount: parseFloat(value) }),
      })
      setEditing(null)
    })
  }

  const incomeLines  = lines.filter(l => l.type === 'income')
  const expenseLines = lines.filter(l => l.type === 'expense')
  const totalPlanned = lines.reduce((s, l) => s + (l.type === 'income' ? l.plannedAmount : -l.plannedAmount), 0)
  const totalActual  = lines.reduce((s, l) => s + (l.type === 'income' ? l.actualAmount  : -l.actualAmount),  0)

  if (loading) return <CenteredSpinner />

  return (
    <div className="flex flex-col gap-6">
      {/* Résumé */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Résultat prévisionnel</p>
          <p className={`text-xl font-bold mt-0.5 ${totalPlanned >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmt(totalPlanned)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Résultat réalisé</p>
          <p className={`text-xl font-bold mt-0.5 ${totalActual >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmt(totalActual)}</p>
        </div>
      </div>

      {/* Produits */}
      <BudgetSection title="Produits (Revenus)" lines={incomeLines} color="emerald"
        editing={editing} value={value} isPending={isPending}
        onEdit={(id, v) => { setEditing(id); setValue(String(v)) }}
        onSave={savebudget} onCancel={() => setEditing(null)} onChange={setValue}
      />

      {/* Charges */}
      <BudgetSection title="Charges (Dépenses)" lines={expenseLines} color="rose"
        editing={editing} value={value} isPending={isPending}
        onEdit={(id, v) => { setEditing(id); setValue(String(v)) }}
        onSave={savebudget} onCancel={() => setEditing(null)} onChange={setValue}
      />
    </div>
  )
}

function BudgetSection({ title, lines, color, editing, value, isPending, onEdit, onSave, onCancel, onChange }: {
  title: string; lines: BudgetLine[]; color: 'emerald' | 'rose'
  editing: string | null; value: string; isPending: boolean
  onEdit: (id: string, v: number) => void; onSave: (id: string) => void
  onCancel: () => void; onChange: (v: string) => void
}) {
  const total = lines.reduce((s, l) => s + l.plannedAmount, 0)

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className={`text-sm font-bold ${color === 'emerald' ? 'text-emerald-600' : 'text-rose-600'}`}>{fmt(total)}</p>
      </div>
      {lines.length === 0 ? (
        <div className="py-8"><EmptyState icon={<FileText size={22} />} text="Aucune ligne de budget configurée" small /></div>
      ) : (
        <div className="divide-y divide-border">
          {lines.map(l => {
            const pct = l.plannedAmount > 0 ? Math.min((l.actualAmount / l.plannedAmount) * 100, 100) : 0
            const over = l.actualAmount > l.plannedAmount
            return (
              <div key={l.categoryId} className="px-5 py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-medium text-foreground">{l.categoryLabel}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{fmt(l.actualAmount)}</span>
                      <span>/</span>
                      {editing === l.categoryId ? (
                        <form onSubmit={e => { e.preventDefault(); onSave(l.categoryId) }} className="flex items-center gap-1">
                          <input autoFocus type="number" min="0" step="0.01" value={value}
                            onChange={e => onChange(e.target.value)}
                            className="w-24 h-6 rounded border border-ring px-1.5 text-xs text-foreground bg-card outline-none"
                          />
                          <button type="submit" disabled={isPending} className="text-primary hover:text-primary/80 font-medium">OK</button>
                          <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground"><X size={12} /></button>
                        </form>
                      ) : (
                        <button onClick={() => onEdit(l.categoryId, l.plannedAmount)} className="hover:text-foreground flex items-center gap-0.5">
                          {fmt(l.plannedAmount)} <Pencil size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${over ? 'bg-rose-500' : color === 'emerald' ? 'bg-emerald-500' : 'bg-rose-400'}`}
                         style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Rapport AG ─────────────────────────────────────────────

function RapportTab() {
  const [stats,   setStats]   = useState<TreasuryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    apiFetch(`/tresorerie/stats?year=${YEAR}`)
      .then(r => r.ok ? r.json() : null)
      .then(json => { if (json) setStats(json.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function exportCsv() {
    startTransition(async () => {
      const res = await apiFetch(`/tresorerie/export?year=${YEAR}`)
      if (res.ok) {
        const blob = await res.blob()
        const url  = URL.createObjectURL(blob)
        const a    = Object.assign(document.createElement('a'), { href: url, download: `tresorerie-${YEAR}.csv` })
        a.click(); URL.revokeObjectURL(url)
      }
    })
  }

  if (loading) return <CenteredSpinner />

  const yIncome  = stats?.yearIncome  ?? 0
  const yExpense = stats?.yearExpense ?? 0
  const yResult  = yIncome - yExpense
  const now      = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Rapport financier — Exercice {YEAR}</p>
          <p className="text-xs text-muted-foreground">Généré le {now}</p>
        </div>
        <Button size="sm" variant="secondary" onClick={exportCsv} disabled={isPending} className="gap-1.5">
          <Download size={14} /> Exporter CSV
        </Button>
      </div>

      {/* Compte de résultat simplifié */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-muted/30">
          <p className="text-sm font-semibold text-foreground">Compte de résultat simplifié</p>
        </div>
        <div className="divide-y divide-border">
          <RapportLine label="Total des produits (revenus)" value={yIncome} bold color="emerald" />
          <RapportLine label="Total des charges (dépenses)" value={yExpense} bold color="rose" />
          <RapportLine label={yResult >= 0 ? 'Excédent de l\'exercice' : 'Déficit de l\'exercice'} value={yResult} bold color={yResult >= 0 ? 'emerald' : 'rose'} total />
        </div>
      </div>

      {/* Produits détaillés */}
      <ReportSection title="Détail des produits" type="income" year={YEAR} />

      {/* Charges détaillées */}
      <ReportSection title="Détail des charges" type="expense" year={YEAR} />

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
        Ce rapport est indicatif. Pour une comptabilité certifiée, faites appel à un commissaire aux comptes ou un expert-comptable associatif.
      </div>
    </div>
  )
}

function RapportLine({ label, value, bold, color, total }: { label: string; value: number; bold?: boolean; color?: 'emerald' | 'rose'; total?: boolean }) {
  return (
    <div className={`flex items-center justify-between px-5 py-3 ${total ? 'bg-muted/30' : ''}`}>
      <p className={`text-sm ${bold ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{label}</p>
      <p className={`text-sm font-bold ${color === 'emerald' ? 'text-emerald-600' : color === 'rose' ? 'text-rose-600' : 'text-foreground'}`}>
        {fmt(Math.abs(value))}
      </p>
    </div>
  )
}

function ReportSection({ title, type, year }: { title: string; type: 'income' | 'expense'; year: number }) {
  const [rows,    setRows]    = useState<{ category: string; total: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch(`/tresorerie/stats/by-category?type=${type}&year=${year}`)
      .then(r => r.ok ? r.json() : null)
      .then(json => { if (json) setRows(json.data ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [type, year])

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-3 border-b border-border bg-muted/30">
        <p className="text-sm font-semibold text-foreground">{title}</p>
      </div>
      {loading ? (
        <div className="py-6"><CenteredSpinner /></div>
      ) : rows.length === 0 ? (
        <div className="py-6"><EmptyState icon={<FileText size={20} />} text="Aucune donnée" small /></div>
      ) : (
        <div className="divide-y divide-border">
          {rows.map(r => (
            <div key={r.category} className="flex items-center justify-between px-5 py-2.5">
              <p className="text-sm text-muted-foreground">{categoryLabel(type, r.category)}</p>
              <p className="text-sm font-medium text-foreground">{fmt(r.total)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Transaction Modal ───────────────────────────────────────

function TransactionModal({ initial, onClose, onSaved }: {
  initial: Transaction | null; onClose: () => void; onSaved: () => void
}) {
  const isEdit = !!initial
  const [type, setType]   = useState<'income' | 'expense'>(initial?.type ?? 'expense')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(null)
    const fd    = new FormData(e.currentTarget)
    const body  = {
      type,
      amount:        parseFloat(fd.get('amount') as string),
      category:      fd.get('category') as string,
      label:         fd.get('label') as string,
      date:          fd.get('date') as string,
      paymentMethod: fd.get('paymentMethod') as string,
      notes:         fd.get('notes') as string || undefined,
    }
    startTransition(async () => {
      const url    = isEdit ? `/tresorerie/transactions/${initial!.id}` : '/tresorerie/transactions'
      const method = isEdit ? 'PUT' : 'POST'
      const res    = await apiFetch(url, { method, body: JSON.stringify(body) })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.message ?? 'Une erreur est survenue.')
        return
      }
      onSaved()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <p className="font-semibold text-foreground">{isEdit ? 'Modifier le mouvement' : 'Nouveau mouvement'}</p>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"><X size={15} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4 p-5 max-h-[70vh] overflow-y-auto">
            {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

            {/* Type */}
            <div className="grid gap-1.5">
              <Label>Type</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['income', 'expense'] as const).map(t => (
                  <button key={t} type="button" onClick={() => setType(t)}
                    className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                      type === t
                        ? t === 'income' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-rose-500 bg-rose-50 text-rose-700'
                        : 'border-border text-muted-foreground hover:bg-muted/40'
                    }`}>
                    {t === 'income' ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
                    {t === 'income' ? 'Entrée' : 'Sortie'}
                  </button>
                ))}
              </div>
            </div>

            {/* Montant + Date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="amount">Montant (€) *</Label>
                <Input id="amount" name="amount" type="number" min="0.01" step="0.01"
                  defaultValue={initial?.amount} placeholder="0,00" required disabled={isPending} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="date">Date *</Label>
                <Input id="date" name="date" type="date"
                  defaultValue={initial?.date ?? new Date().toISOString().slice(0, 10)} required disabled={isPending} />
              </div>
            </div>

            {/* Libellé */}
            <div className="grid gap-1.5">
              <Label htmlFor="label">Libellé *</Label>
              <Input id="label" name="label" placeholder="Ex: Cotisations membres 2026"
                defaultValue={initial?.label} required disabled={isPending} />
            </div>

            {/* Catégorie */}
            <div className="grid gap-1.5">
              <Label htmlFor="category">Catégorie *</Label>
              <select id="category" name="category" defaultValue={initial?.category ?? ''} required disabled={isPending}
                className="h-9 w-full rounded-md border border-input bg-card px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                <option value="" disabled>Choisir une catégorie</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>

            {/* Mode de paiement */}
            <div className="grid gap-1.5">
              <Label htmlFor="paymentMethod">Mode de règlement</Label>
              <select id="paymentMethod" name="paymentMethod" defaultValue={initial?.paymentMethod ?? 'transfer'} disabled={isPending}
                className="h-9 w-full rounded-md border border-input bg-card px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                {PAYMENT_METHODS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </div>

            {/* Notes */}
            <div className="grid gap-1.5">
              <Label htmlFor="notes">Notes (optionnel)</Label>
              <textarea id="notes" name="notes" rows={2} defaultValue={initial?.notes}
                disabled={isPending} placeholder="Informations complémentaires…"
                className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none" />
            </div>
          </div>

          <div className="flex justify-end gap-2 px-5 py-4 border-t border-border">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>Annuler</Button>
            <Button type="submit" disabled={isPending}>{isPending ? 'Enregistrement…' : isEdit ? 'Modifier' : 'Ajouter'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Delete Modal ───────────────────────────────────────────

function DeleteModal({ tx, onClose, onDeleted }: { tx: Transaction; onClose: () => void; onDeleted: () => void }) {
  const [isPending, startTransition] = useTransition()
  function doDelete() {
    startTransition(async () => {
      await apiFetch(`/tresorerie/transactions/${tx.id}`, { method: 'DELETE' })
      onDeleted()
    })
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-xl p-6 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
        <p className="text-sm text-foreground">Supprimer <span className="font-medium">"{tx.label}"</span> ({fmt(tx.amount)}) ? Cette action est irréversible.</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isPending}>Annuler</Button>
          <Button variant="destructive" size="sm" onClick={doDelete} disabled={isPending}>
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <><Trash2 size={14} /> Supprimer</>}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Sous-composants partagés ───────────────────────────────

function KpiCard({ icon, color, label, value }: { icon: React.ReactNode; color: string; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${color}`}>{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold text-foreground leading-tight">{value}</p>
      </div>
    </div>
  )
}

function TxRow({ tx, onEdit, onDelete }: { tx: Transaction; onEdit?: () => void; onDelete?: () => void }) {
  const isIncome = tx.type === 'income'
  return (
    <div className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors group">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isIncome ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
        {isIncome ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{tx.label}</p>
        <p className="text-xs text-muted-foreground">{categoryLabel(tx.type, tx.category)} · {formatDateShort(tx.date)}</p>
      </div>
      <p className={`text-sm font-semibold shrink-0 ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
        {isIncome ? '+' : '-'}{fmt(tx.amount)}
      </p>
      {(onEdit || onDelete) && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit   && <button onClick={onEdit}   className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"><Pencil size={13} /></button>}
          {onDelete && <button onClick={onDelete} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-destructive"><Trash2 size={13} /></button>}
        </div>
      )}
    </div>
  )
}

function CategoryBreakdown({ transactions, type }: { transactions: Transaction[]; type: TransactionType }) {
  const filtered = transactions.filter(t => t.type === type)
  const total    = filtered.reduce((s, t) => s + t.amount, 0)
  const byCategory = filtered.reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + t.amount; return acc
  }, {})
  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 5)
  return (
    <div className="flex flex-col gap-2">
      {sorted.map(([cat, amount]) => (
        <div key={cat} className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground truncate">{categoryLabel(type, cat)}</span>
            <span className="font-medium text-foreground shrink-0">{fmt(amount)}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-rose-400" style={{ width: `${total > 0 ? (amount / total) * 100 : 0}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ icon, text, small }: { icon: React.ReactNode; text: string; small?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-2 text-center text-muted-foreground ${small ? 'py-4' : 'py-8'}`}>
      <div className="opacity-30">{icon}</div>
      <p className="text-sm">{text}</p>
    </div>
  )
}

function CenteredSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 size={22} className="animate-spin text-muted-foreground" />
    </div>
  )
}
