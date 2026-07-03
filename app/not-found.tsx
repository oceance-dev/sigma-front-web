import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { LegalFooter } from '@/components/legal-footer'
import { cn } from '@/lib/utils'

export default function NotFound() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-background px-4 text-center">
      <p className="text-5xl font-bold text-primary mb-4">404</p>
      <h1 className="text-xl font-semibold text-foreground mb-2">Page introuvable</h1>
      <p className="text-sm text-muted-foreground max-w-xs mb-8">
        La page que vous cherchez n'existe pas ou a été déplacée.
      </p>
      <Link href="/" className={cn(buttonVariants({ variant: 'outline' }))}>
        Retour à l'accueil
      </Link>
      <LegalFooter className="mt-12 justify-center" />
    </div>
  )
}
