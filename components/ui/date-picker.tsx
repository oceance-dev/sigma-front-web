'use client'

import * as React from 'react'
import { Popover } from '@base-ui/react/popover'
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Helpers (locale FR, semaine commençant le lundi) ───────────
const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

/** ISO `YYYY-MM-DD` (celui stocké/soumis) → affichage `JJ/MM/AAAA`. */
function formatDisplay(iso: string): string {
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return ''
  return `${d}/${m}/${y}`
}

/** Découpe un ISO `YYYY-MM-DD` en composants numériques, sans passer par `Date` (évite les décalages de fuseau). */
function parseIso(iso: string): { y: number; m: number; d: number } | null {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return null
  return { y, m, d }
}

function toIso(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/** Indice (0 = lundi … 6 = dimanche) du 1ᵉʳ jour du mois. */
function firstWeekday(year: number, monthIndex: number): number {
  const jsDay = new Date(year, monthIndex, 1).getDay() // 0 = dimanche
  return (jsDay + 6) % 7
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate()
}

export interface DatePickerProps {
  id?: string
  name?: string
  /** Valeur initiale au format ISO `YYYY-MM-DD` (ou vide). */
  defaultValue?: string
  required?: boolean
  disabled?: boolean
  /** Bornes optionnelles au format ISO `YYYY-MM-DD`. */
  min?: string
  max?: string
  placeholder?: string
  className?: string
  'aria-invalid'?: boolean
  onValueChange?: (value: string) => void
}

/**
 * Sélecteur de date avec calendrier (popover). Remplace `<input type="date">`.
 * Un `<input type="hidden" name=…>` porte la valeur ISO `YYYY-MM-DD`, donc le
 * composant est transparent pour les formulaires (FormData) existants.
 */
export function DatePicker({
  id,
  name,
  defaultValue = '',
  required,
  disabled,
  min,
  max,
  placeholder = 'jj/mm/aaaa',
  className,
  onValueChange,
  ...aria
}: DatePickerProps) {
  const [value, setValue] = React.useState(defaultValue ?? '')
  const [open, setOpen] = React.useState(false)
  const [mode, setMode] = React.useState<'days' | 'years'>('days')

  // Mois affiché dans le calendrier : celui de la valeur, sinon aujourd'hui.
  const today = React.useMemo(() => new Date(), [])
  const initialView = parseIso(value)
  const [view, setView] = React.useState({
    year: initialView?.y ?? today.getFullYear(),
    month: (initialView?.m ?? today.getMonth() + 1) - 1, // 0-indexé
  })

  // Réaligne le calendrier sur la valeur à chaque ouverture.
  const handleOpenChange = (next: boolean) => {
    if (next) {
      setMode('days')
      const p = parseIso(value)
      if (p) setView({ year: p.y, month: p.m - 1 })
    }
    setOpen(next)
  }

  const commit = (iso: string) => {
    setValue(iso)
    onValueChange?.(iso)
    setOpen(false)
  }

  const isDisabled = (iso: string) => {
    if (min && iso < min) return true
    if (max && iso > max) return true
    return false
  }

  const selected = parseIso(value)
  const nbDays = daysInMonth(view.year, view.month)
  const offset = firstWeekday(view.year, view.month)
  const cells: (number | null)[] = [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: nbDays }, (_, i) => i + 1),
  ]

  const prevMonth = () =>
    setView((v) => (v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 }))
  const nextMonth = () =>
    setView((v) => (v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 }))

  return (
    <>
      {name && <input type="hidden" name={name} value={value} />}

      <Popover.Root open={open} onOpenChange={handleOpenChange} modal={false}>
        <Popover.Trigger
          id={id}
          type="button"
          disabled={disabled}
          aria-invalid={aria['aria-invalid']}
          className={cn(
            'flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-input bg-transparent px-2.5 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30',
            className,
          )}
        >
          <span className={cn('truncate', !value && 'text-muted-foreground')}>
            {value ? formatDisplay(value) : placeholder}
          </span>
          <span className="flex items-center gap-1">
            {value && !required && !disabled && (
              <span
                role="button"
                tabIndex={-1}
                aria-label="Effacer la date"
                onClick={(e) => {
                  e.stopPropagation()
                  commit('')
                }}
                className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X size={14} />
              </span>
            )}
            <Calendar size={15} className="shrink-0 text-muted-foreground" />
          </span>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Positioner side="bottom" align="start" sideOffset={6} className="z-[60]">
            <Popover.Popup className="rounded-lg border border-border bg-card p-3 text-card-foreground shadow-xl outline-none">
              {/* En-tête mois / année (clic sur le libellé → sélection d'année) */}
              <div className="mb-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={prevMonth}
                  aria-label="Mois précédent"
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setMode((m) => (m === 'days' ? 'years' : 'days'))}
                  className="rounded px-2 py-0.5 text-sm font-medium hover:bg-muted"
                >
                  {MONTHS[view.month]} {view.year}
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  aria-label="Mois suivant"
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {mode === 'years' ? (
                /* Sélection d'année */
                <div className="grid max-h-[200px] w-[224px] grid-cols-4 gap-1 overflow-y-auto">
                  {Array.from({ length: today.getFullYear() + 5 - 1920 + 1 }, (_, i) => 1920 + i)
                    .reverse()
                    .map((yr) => (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => {
                          setView((v) => ({ ...v, year: yr }))
                          setMode('days')
                        }}
                        className={cn(
                          'rounded-md py-1.5 text-sm transition-colors hover:bg-muted',
                          yr === view.year && 'bg-primary font-medium text-primary-foreground hover:bg-primary',
                        )}
                      >
                        {yr}
                      </button>
                    ))}
                </div>
              ) : (
                <>
                  {/* Jours de la semaine */}
                  <div className="mb-1 grid grid-cols-7 gap-0.5">
                    {WEEKDAYS.map((w, i) => (
                      <div key={i} className="py-1 text-center text-xs font-medium text-muted-foreground">
                        {w}
                      </div>
                    ))}
                  </div>

                  {/* Grille des jours */}
                  <div className="grid grid-cols-7 gap-0.5">
                    {cells.map((day, i) => {
                      if (day === null) return <div key={i} />
                      const iso = toIso(view.year, view.month + 1, day)
                      const isSelected =
                        !!selected && selected.y === view.year && selected.m === view.month + 1 && selected.d === day
                      const isToday =
                        today.getFullYear() === view.year &&
                        today.getMonth() === view.month &&
                        today.getDate() === day
                      const off = isDisabled(iso)
                      return (
                        <button
                          key={i}
                          type="button"
                          disabled={off}
                          onClick={() => commit(iso)}
                          className={cn(
                            'h-8 w-8 rounded-md text-sm transition-colors',
                            off && 'cursor-not-allowed opacity-30',
                            !off && !isSelected && 'hover:bg-muted',
                            isSelected && 'bg-primary font-medium text-primary-foreground',
                            !isSelected && isToday && 'font-medium text-primary ring-1 ring-primary/40',
                          )}
                        >
                          {day}
                        </button>
                      )
                    })}
                  </div>
                </>
              )}

              {/* Pied : aujourd'hui / effacer */}
              <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const iso = toIso(today.getFullYear(), today.getMonth() + 1, today.getDate())
                    if (!isDisabled(iso)) commit(iso)
                  }}
                  className="rounded px-2 py-1 text-xs font-medium text-primary hover:bg-muted"
                >
                  Aujourd&apos;hui
                </button>
                {!required && (
                  <button
                    type="button"
                    onClick={() => commit('')}
                    className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    Effacer
                  </button>
                )}
              </div>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </>
  )
}
