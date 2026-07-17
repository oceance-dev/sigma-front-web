'use client'

import { HeartPulse } from 'lucide-react'
import SanitaireTab from '../association/tabs/SanitaireTab'

export default function SanitairePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <HeartPulse size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="heading-1">Sanitaire</h1>
          <p className="text-muted mt-0.5">Consultez rapidement les documents médicaux des cadets</p>
        </div>
      </div>

      <SanitaireTab />
    </div>
  )
}
