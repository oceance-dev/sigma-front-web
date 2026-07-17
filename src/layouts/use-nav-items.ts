'use client'

import { usePathname } from 'next/navigation'
import { useAuth } from '@/src/context/auth-context'
import { navItems } from './nav-items'

export function useNavItems() {
  const pathname          = usePathname()
  const { user, association } = useAuth()
  const isAdmin           = !!user?.isAdmin
  const isGendarmerie     = association?.type === 'gendarmerie'
  const sanitaireEnabled  = !!association?.sanitaireEnabled

  return navItems
    .filter((item) => {
      if (item.hidden) return false
      if (item.staffOnly && !isAdmin) return false
      if (item.gendarmerieOnly && !isGendarmerie) return false
      if (item.requiresSanitaire && !sanitaireEnabled) return false
      return true
    })
    .map((item) => ({
      ...item,
      isActive:
        item.href === '/dashboard'
          ? pathname === '/dashboard'
          : pathname.startsWith(item.href),
    }))
}
