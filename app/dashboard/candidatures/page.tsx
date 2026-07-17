'use client'

import { Suspense, lazy, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ClipboardList } from 'lucide-react'
import { useAuth } from '@/src/context/auth-context'

const CandidaturesTab   = lazy(() => import('../association/tabs/CandidaturesTab'))
const DocumentsRequisTab = lazy(() => import('../association/tabs/DocumentsRequisTab'))
const CampagnesTab       = lazy(() => import('../association/tabs/CampagnesTab'))

const TABS = [
  { id: 'candidatures',     label: 'Candidatures' },
  { id: 'documents-requis', label: 'Documents requis' },
  { id: 'campagnes',        label: 'Campagnes' },
] as const

type TabId = (typeof TABS)[number]['id']

function TabFallback() {
  return (
    <div className="flex h-40 items-center justify-center">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}

export default function CandidaturesPage() {
  const { user, association, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<TabId>(() => {
    const p = searchParams.get('tab') as TabId | null
    return p && TABS.some(t => t.id === p) ? p : 'candidatures'
  })

  useEffect(() => {
    if (isLoading) return
    const isAdmin = !!user?.isAdmin
    const isGendarmerie = association?.type === 'gendarmerie'
    if (!isAdmin || !isGendarmerie) router.replace('/dashboard')
  }, [isLoading, user, association, router])

  if (isLoading) return null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <ClipboardList size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Candidatures</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gérez les demandes d'adhésion aux cadets de la gendarmerie</p>
        </div>
      </div>

      <div className="flex gap-0 border-b border-border overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Suspense fallback={<TabFallback />}>
        {tab === 'candidatures'     && <CandidaturesTab />}
        {tab === 'documents-requis' && <DocumentsRequisTab />}
        {tab === 'campagnes'        && <CampagnesTab />}
      </Suspense>
    </div>
  )
}
