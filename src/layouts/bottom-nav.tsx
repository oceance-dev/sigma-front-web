'use client'

import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useNavItems } from './use-nav-items'

export default function BottomNav() {
  const items = useNavItems()

  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <Link key={item.href} href={item.href} className={cn('bottom-nav-item', item.isActive && 'bottom-nav-item-active')}>
          {item.icon}
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
