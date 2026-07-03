'use client'

import type { ReactNode } from 'react'

// ── ActionBtn ──────────────────────────────────────────────

export function ActionBtn({
  onClick,
  disabled,
  title,
  className,
  children,
}: {
  onClick: () => void
  disabled: boolean
  title: string
  className: string
  children: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  )
}

// ── InfoField ──────────────────────────────────────────────

export function InfoField({
  label,
  value,
  icon,
}: {
  label: string
  value: string | null | undefined
  icon?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-1.5 text-sm text-foreground">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <span>{value ?? 'Non renseigné'}</span>
      </div>
    </div>
  )
}
