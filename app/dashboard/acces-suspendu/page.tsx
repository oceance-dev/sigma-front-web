'use client'

import { ShieldOff } from 'lucide-react'
import { useAuth } from '@/src/context/auth-context'

export default function AccesSuspenduPage() {
  const { association } = useAuth()

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <ShieldOff size={22} className="text-destructive" />
      </div>
      <div>
        <h1 className="text-xl font-semibold">Accès suspendu</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          L'abonnement de <span className="font-medium text-foreground">{association?.name ?? 'votre association'}</span> a expiré.
          Contactez votre administrateur pour rétablir l'accès.
        </p>
      </div>
    </div>
  )
}
