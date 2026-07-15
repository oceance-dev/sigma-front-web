'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/src/context/auth-context'
import Header from '@/src/layouts/header'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Activity, Building2, Home, Newspaper, Receipt, Shield, Users, Zap } from 'lucide-react'

const SA_NAV = [
  { label: 'Tableau de bord', href: '/superAdmin',              icon: Home      },
  { label: 'Associations',    href: '/superAdmin/associations', icon: Building2 },
  { label: 'Utilisateurs',    href: '/superAdmin/users',        icon: Users     },
  { label: 'Facturation',     href: '/superAdmin/billing',      icon: Receipt   },
  { label: 'Plans',           href: '/superAdmin/plans',        icon: Zap       },
  { label: 'Rôles',           href: '/superAdmin/roles',        icon: Shield    },
  { label: 'Rate Limits',     href: '/superAdmin/rate-limits',  icon: Activity  },
  { label: 'Nouveautés',      href: '/superAdmin/news',         icon: Newspaper },
]

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) { router.replace('/login'); return }
    if (!user?.isSuperAdmin) { router.replace('/dashboard'); return }
  }, [isAuthenticated, isLoading, user, router])

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated || !user?.isSuperAdmin) return null

  return (
    <>
      <Header />

      {/* Sidebar desktop */}
      <aside className="dashboard-sidebar">
        <nav className="flex flex-col gap-0.5 p-3">
          {SA_NAV.map((item) => {
            const isActive = item.href === '/superAdmin'
              ? pathname === '/superAdmin'
              : pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href} className={cn('nav-item', isActive && 'nav-item-active')}>
                <item.icon size={18} />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Bottom nav mobile */}
      <nav className="bottom-nav">
        {SA_NAV.map((item) => {
          const isActive = item.href === '/superAdmin'
            ? pathname === '/superAdmin'
            : pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href} className={cn('bottom-nav-item', isActive && 'bottom-nav-item-active')}>
              <item.icon size={20} />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <main className="dashboard-main">{children}</main>
    </>
  )
}
