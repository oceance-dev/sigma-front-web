'use client'

import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react'
import { Building2 } from 'lucide-react'
import { apiFetch } from '@/src/lib/api-client'
import { useAuth } from '@/src/context/auth-context'
import type { Association } from '@/src/types/association'

// ── Lazy tab imports ───────────────────────────────────────

const AssociationTab         = lazy(() => import('./tabs/AssociationTab'))
const LienInscriptionTab     = lazy(() => import('./tabs/LienInscriptionTab'))
const FormulaireInscriptionTab = lazy(() => import('./tabs/FormulaireInscriptionTab'))
const DocumentsRequisTab     = lazy(() => import('./tabs/DocumentsRequisTab'))
const CampagnesTab           = lazy(() => import('./tabs/CampagnesTab'))
const CandidaturesTab        = lazy(() => import('./tabs/CandidaturesTab'))
const MembresTab             = lazy(() => import('./tabs/MembresTab'))
const RolesTab               = lazy(() => import('./tabs/RolesTab'))
const CadetsTab              = lazy(() => import('./tabs/CadetsTab'))

// ── Tabs config ────────────────────────────────────────────

const ALL_TABS = [
  { id: 'association',            label: 'Association',         gendarmerieOnly: false, onlineOnly: false },
  { id: 'lien-inscription',       label: "Gestion d'inscription", gendarmerieOnly: false, onlineOnly: false },
  { id: 'formulaire-inscription', label: 'Formulaire',          gendarmerieOnly: false, onlineOnly: true  },
  { id: 'documents-requis',       label: 'Documents requis',    gendarmerieOnly: false, onlineOnly: false },
  { id: 'campagnes',              label: 'Campagnes',           gendarmerieOnly: false, onlineOnly: false },
  { id: 'candidatures',           label: 'Candidatures',        gendarmerieOnly: false, onlineOnly: true  },
  { id: 'membres',                label: 'Membres',             gendarmerieOnly: false, onlineOnly: false },
  { id: 'roles',                  label: 'Rôles',               gendarmerieOnly: false, onlineOnly: false },
  { id: 'cadets',                 label: 'Cadets',              gendarmerieOnly: true,  onlineOnly: false },
] as const

type TabId = (typeof ALL_TABS)[number]['id']

// ── Suspense fallback ──────────────────────────────────────

function TabFallback() {
  return (
    <div className="flex h-40 items-center justify-center">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────

export default function AssociationPage() {
  const { user, association: authAssociation } = useAuth()
  const isGendarmerie = authAssociation?.type === 'gendarmerie'
  const [tab, setTab] = useState<TabId>('association')
  const [association, setAssociation] = useState<Association | null>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [togglingOnline, setTogglingOnline] = useState(false)

  const load = useCallback(async () => {
    if (!authAssociation?.id) return
    const res = await apiFetch(`/admin/association/${authAssociation.id}`)
    if (res.ok) {
      const json = await res.json()
      setAssociation(json.data.association)
    }
  }, [authAssociation?.id])

  useEffect(() => { load() }, [load])

  const canEdit              = user?.isAdmin ?? false
  const acceptsOnline        = !!association?.acceptOnlineRegistrations
  const campaignsEnabled     = !!association?.campaignsEnabled
  const documentsEnabled     = !!association?.documentsRequisEnabled
  const tabs = ALL_TABS.filter((t) => {
    if (t.gendarmerieOnly && !isGendarmerie) return false
    if (t.onlineOnly && !acceptsOnline) return false
    if (t.id === 'campagnes' && !campaignsEnabled) return false
    if (t.id === 'documents-requis' && !documentsEnabled) return false
    return true
  })

  // Ramène vers l'onglet association si l'onglet actif devient indisponible
  useEffect(() => {
    if (!tabs.some((t) => t.id === tab)) setTab('association')
  }, [acceptsOnline, campaignsEnabled, documentsEnabled])

  async function toggleOnline() {
    if (!authAssociation?.id || !canEdit) return
    setTogglingOnline(true)
    await apiFetch(`/admin/association/${authAssociation.id}/toggle-online-registration`, {
      method: 'POST',
    })
    await load()
    setTogglingOnline(false)
  }

  return (
    <div className="flex flex-col gap-6">

      {/* ── En-tête ─────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Building2 size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="heading-1">Gestion de l'association</h1>
          <p className="text-muted mt-0.5">Gérez votre association, ses membres et les candidatures</p>
        </div>
      </div>

      {/* ── Onglets ─────────────────────────────────────── */}
      <div className="flex gap-0 border-b border-border overflow-x-auto">
        {tabs.map((t) => (
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

      {/* ── Contenu ─────────────────────────────────────── */}
      <Suspense fallback={<TabFallback />}>
        {tab === 'association' && (
          <AssociationTab
            association={association}
            responsable={user ? `${user.firstName} ${user.lastName}` : undefined}
            canEdit={canEdit}
            onEdit={() => setShowEdit(true)}
            showEdit={showEdit}
            onCloseEdit={() => setShowEdit(false)}
            onSaved={() => { setShowEdit(false); load() }}
          />
        )}

        {tab === 'lien-inscription' && (
          <LienInscriptionTab
            association={association}
            acceptsOnline={acceptsOnline}
            canEdit={canEdit}
            togglingOnline={togglingOnline}
            onToggleOnline={toggleOnline}
            isGendarmerie={isGendarmerie}
            onAssociationUpdated={load}
          />
        )}

        {tab === 'formulaire-inscription' && (
          <FormulaireInscriptionTab
            associationId={authAssociation?.id ?? null}
            isGendarmerie={isGendarmerie}
            redirectAfterRegistration={association?.afterRegistrationRedirect ?? 'login'}
            onAssociationUpdated={load}
          />
        )}

        {tab === 'documents-requis' && <DocumentsRequisTab />}

        {tab === 'membres' && <MembresTab />}

        {tab === 'roles' && <RolesTab />}

        {tab === 'cadets' && <CadetsTab />}

        {tab === 'candidatures' && <CandidaturesTab />}

        {tab === 'campagnes' && <CampagnesTab />}
      </Suspense>
    </div>
  )
}
