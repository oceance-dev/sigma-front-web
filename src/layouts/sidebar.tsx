'use client'

import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useNavItems } from './use-nav-items'
import { LegalFooter } from '@/components/legal-footer'

export default function Sidebar() {
  const items = useNavItems()

  return (
    <aside className="dashboard-sidebar">
      <nav className="flex flex-col gap-0.5 p-3 flex-1">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className={cn('nav-item', item.isActive && 'nav-item-active')}>
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-3">
        <LegalFooter />
      </div>
    </aside>
  )
}
