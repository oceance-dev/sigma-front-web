'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GraduationCap } from 'lucide-react'
import { useAuth } from '@/src/context/auth-context'
import CadetsTab from '../association/tabs/CadetsTab'

export default function CadetsPage() {
  const { user, association, hasPermission, isLoading } = useAuth()
  const router = useRouter()
  const isGendarmerie = association?.type === 'gendarmerie'

  useEffect(() => {
    if (isLoading) return
    const canSee = !!user?.isAdmin || hasPermission('cadets.read')
    if (!canSee) router.replace('/dashboard')
  }, [isLoading, user, association, hasPermission, router])

  if (isLoading) return null

  const labelP = isGendarmerie ? 'cadets' : 'licenciés'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <GraduationCap size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="heading-1 capitalize">{labelP}</h1>
          <p className="text-muted mt-0.5">Liste des {labelP} de votre association</p>
        </div>
      </div>

      <CadetsTab isGendarmerie={isGendarmerie} />
    </div>
  )
}
