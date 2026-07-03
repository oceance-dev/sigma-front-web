import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft size={15} />
          Retour
        </Link>
        <div className="prose prose-sm max-w-none text-foreground">
          {children}
        </div>
        <footer className="mt-12 pt-6 border-t border-border flex flex-wrap gap-x-5 gap-y-1">
          <Link href="/legal/mentions-legales" className="text-xs text-muted-foreground hover:text-foreground hover:underline underline-offset-4">Mentions légales</Link>
          <Link href="/legal/cgu" className="text-xs text-muted-foreground hover:text-foreground hover:underline underline-offset-4">CGU</Link>
          <Link href="/legal/confidentialite" className="text-xs text-muted-foreground hover:text-foreground hover:underline underline-offset-4">Confidentialité</Link>
        </footer>
      </div>
    </div>
  )
}
