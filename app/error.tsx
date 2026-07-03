'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-background px-4 text-center">
      <p className="text-5xl font-bold text-destructive mb-4">500</p>
      <h1 className="text-xl font-semibold text-foreground mb-2">Une erreur est survenue</h1>
      <p className="text-sm text-muted-foreground max-w-xs mb-8">
        Quelque chose s'est mal passé. Vous pouvez réessayer ou revenir plus tard.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => (window.location.href = '/')}>
          Accueil
        </Button>
        <Button onClick={reset}>Réessayer</Button>
      </div>
    </div>
  )
}
