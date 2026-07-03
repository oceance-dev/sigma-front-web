import type { ReactNode } from 'react'

interface StatCardProps {
  icon:   ReactNode
  label:  string
  value:  number | string | null | undefined
  color?: string
  size?:  'sm' | 'md'
}

export function StatCard({ icon, label, value, color = 'bg-primary/10', size = 'md' }: StatCardProps) {
  const iconSize  = size === 'sm' ? 'h-9 w-9 rounded-xl'  : 'h-10 w-10 rounded-lg'
  const textSize  = size === 'sm' ? 'text-xl font-bold'   : 'text-2xl font-bold'

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
      <div className={`flex shrink-0 items-center justify-center ${iconSize} ${color}`}>
        {icon}
      </div>
      <div>
        <p className={`${textSize} text-foreground leading-tight`}>{value ?? '—'}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}
