'use client'

import { usePathname } from 'next/navigation'
import { useAuth } from '@/src/context/auth-context'
import { navItems } from './nav-items'

export function useNavItems() {
  const pathname          = usePathname()
  const { user, association, hasPermission } = useAuth()
  const isAdmin           = !!user?.isAdmin
  const isGendarmerie     = association?.type === 'gendarmerie'

  return navItems
    .filter((item) => {
      if (item.hidden) return false
      // staffOnly = réservé aux admins, sauf si une permission spécifique y donne accès
      if (item.staffOnly && !isAdmin && !(item.permission && hasPermission(item.permission))) return false
      if (item.gendarmerieOnly && !isGendarmerie) return false
      return true
    })
    .map((item) => ({
      ...item,
      label: item.id === 'cadets' ? (isGendarmerie ? 'Cadets' : 'Licenciés') : item.label,
      isActive:
        item.href === '/dashboard'
          ? pathname === '/dashboard'
          : pathname.startsWith(item.href),
    }))
}
