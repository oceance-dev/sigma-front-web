'use client'

import { usePathname } from 'next/navigation'
import { useAuth } from '@/src/context/auth-context'
import { navItems } from './nav-items'

export function useNavItems() {
  const pathname = usePathname()
  const { user }  = useAuth()
  const isAdmin   = !!user?.isAdmin

  return navItems
    .filter((item) => !item.hidden && (!item.staffOnly || isAdmin))
    .map((item) => ({
      ...item,
      isActive:
        item.href === '/dashboard'
          ? pathname === '/dashboard'
          : pathname.startsWith(item.href),
    }))
}
