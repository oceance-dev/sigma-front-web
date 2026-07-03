const LONG: Intl.DateTimeFormatOptions  = { day: 'numeric', month: 'long',  year: 'numeric' }
const SHORT: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', LONG)
}

export function formatDateShort(iso: string | null | undefined): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('fr-FR', SHORT)
}

export function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min  = Math.floor(diff / 60_000)
  if (min < 60) return `il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h  < 24) return `il y a ${h}h`
  return `il y a ${Math.floor(h / 24)}j`
}

export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
