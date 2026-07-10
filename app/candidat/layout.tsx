'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/context/auth-context'
import Header from '@/src/layouts/header'
import { FileText } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

function CandidatSidebar() {
  const pathname = usePathname()

  return (
    <aside className="dashboard-sidebar">
      <div className="flex flex-col gap-1 p-3 flex-1">
        <Link
          href="/candidat/documents"
          className={`nav-item ${pathname === '/candidat/documents' ? 'nav-item-active' : ''}`}
        >
          <FileText size={18} />
          Mes documents
        </Link>
      </div>

      <div className="px-4 py-3 border-t border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/40">2026 — SIGMA</p>
      </div>
    </aside>
  )
}

export default function CandidatLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user, association } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) { router.replace('/login'); return }

    const roleKey       = user?.associationRoleKey ?? ''
    const isGendarmerie = association?.type === 'gendarmerie'
    const isCandidatRole = roleKey === '4' || (isGendarmerie && roleKey === '6')
    if (!isCandidatRole) router.replace('/dashboard')
  }, [isAuthenticated, isLoading, user, association, router])

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <>
      <Header />
      <CandidatSidebar />
      <main className="dashboard-main">{children}</main>
    </>
  )
}
