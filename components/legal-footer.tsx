import Link from 'next/link'
import { cn } from '@/lib/utils'

const SUPPORT_EMAIL = 'contact.sigma.cloud@gmail.com'

export function LegalFooter({ className }: { className?: string }) {
  return (
    <footer className={cn('flex flex-wrap gap-x-4 gap-y-1', className)}>
      <a
        href={`mailto:${SUPPORT_EMAIL}`}
        className="text-xs text-muted-foreground hover:text-foreground hover:underline underline-offset-4 transition-colors"
      >
        Support
      </a>
      <Link
        href="/legal/mentions-legales"
        className="text-xs text-muted-foreground hover:text-foreground hover:underline underline-offset-4 transition-colors"
      >
        Mentions légales
      </Link>
      <Link
        href="/legal/cgu"
        className="text-xs text-muted-foreground hover:text-foreground hover:underline underline-offset-4 transition-colors"
      >
        CGU
      </Link>
      <Link
        href="/legal/confidentialite"
        className="text-xs text-muted-foreground hover:text-foreground hover:underline underline-offset-4 transition-colors"
      >
        Confidentialité
      </Link>
    </footer>
  )
}
