'use client'

import { apiFetch } from '@/src/lib/api-client'
import { tokenStore } from '@/src/lib/token-store'
import { useAuth } from '@/src/context/auth-context'
import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from 'react'
import {
  ChevronRight,
  ChevronDown,
  Download,
  FileText,
  Folder,
  FolderOpen,
  Globe,
  Grid2x2,
  List,
  Loader2,
  Lock,
  MoreVertical,
  Pencil,
  Pin,
  Plus,
  ShieldAlert,
  Trash2,
  Upload,
  UserCheck,
  Users,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { FolderBasic, FolderPermissions, FolderWithPermissions } from '@/src/types/folder'
import type { Document, DocumentType } from '@/src/types/document'
import { DOCUMENT_CATEGORIES } from '@/src/types/document'
import type { Member } from '@/src/types/member'
import DocumentViewerModal from '@/components/DocumentViewerModal'

// ── Constantes ─────────────────────────────────────────────

const FOLDER_VISIBILITY_OPTIONS = [
  { value: 'private',    label: 'Privé' },
  { value: 'restricted', label: 'Restreint' },
  { value: 'staff',      label: 'Staff' },
  { value: 'members',    label: 'Tous les membres' },
  { value: 'public',     label: 'Public' },
]

const STATUS_CLASSES = {
  pending:  'bg-amber-100 text-amber-700',
  approved: 'bg-primary/10 text-primary',
  rejected: 'bg-destructive/10 text-destructive',
} as const

const STATUS_LABELS = {
  pending:  'En attente',
  approved: 'Approuvé',
  rejected: 'Refusé',
} as const

// ── Sélecteur de visibilité ────────────────────────────────

const VISIBILITY_PRESETS = [
  {
    value: 'private',
    label: 'Privé',
    desc: 'Visible uniquement par vous',
    Icon: Lock,
    color: 'text-slate-500',
    bg: 'bg-slate-50 border-slate-200',
    active: 'border-slate-500 bg-slate-50',
  },
  {
    value: 'restricted',
    label: 'Administration',
    desc: 'Admin, Président, Directeur des formations',
    Icon: ShieldAlert,
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200',
    active: 'border-amber-500 bg-amber-50',
  },
  {
    value: 'staff',
    label: 'Staff',
    desc: 'Tous les membres du bureau',
    Icon: UserCheck,
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200',
    active: 'border-blue-500 bg-blue-50',
  },
  {
    value: 'members',
    label: 'Membres',
    desc: 'Tous les membres actifs de l\'association',
    Icon: Users,
    color: 'text-primary',
    bg: 'bg-primary/5 border-primary/20',
    active: 'border-primary bg-primary/5',
  },
  {
    value: 'public',
    label: 'Public',
    desc: 'Accessible à tous sans restriction',
    Icon: Globe,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 border-emerald-200',
    active: 'border-emerald-500 bg-emerald-50',
  },
] as const

interface PickedMember { id: string; fullName: string; email: string }

function VisibilityPicker({
  defaultValue = 'private',
  defaultRoles = [],
}: {
  defaultValue?: string
  defaultRoles?: string[]
}) {
  const [selected,      setSelected]      = useState(defaultValue)
  const [showRoles,     setShowRoles]     = useState(defaultRoles.length > 0)
  const [roleInput,     setRoleInput]     = useState('')
  const [roles,         setRoles]         = useState<string[]>(defaultRoles)
  const [showMembers,   setShowMembers]   = useState(false)
  const [memberSearch,  setMemberSearch]  = useState('')
  const [memberResults, setMemberResults] = useState<PickedMember[]>([])
  const [isSearching,   setIsSearching]   = useState(false)
  const [pickedMembers, setPickedMembers] = useState<PickedMember[]>([])
  const [showDropdown,  setShowDropdown]  = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fermer le dropdown au clic extérieur
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Recherche debounced de membres actifs
  useEffect(() => {
    const q = memberSearch.trim()
    if (!q) { setMemberResults([]); return }
    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const params = new URLSearchParams({ isActive: 'true', search: q, limit: '8' })
        const res = await apiFetch(`/admin/members?${params}`)
        if (res.ok) {
          const json = await res.json()
          const list: Member[] = json.data?.members ?? json.data?.items ?? json.data ?? []
          setMemberResults(
            list
              .filter((m) => m.isActive && !pickedMembers.some((p) => p.id === m.id))
              .map((m) => ({ id: m.id, fullName: m.fullName, email: m.email }))
          )
          setShowDropdown(true)
        }
      } finally {
        setIsSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [memberSearch, pickedMembers])

  function addRole() {
    const trimmed = roleInput.trim()
    if (trimmed && !roles.includes(trimmed)) setRoles((r) => [...r, trimmed])
    setRoleInput('')
  }

  function removeRole(r: string) { setRoles((prev) => prev.filter((x) => x !== r)) }

  function addMember(m: PickedMember) {
    setPickedMembers((prev) => [...prev, m])
    setMemberSearch('')
    setMemberResults([])
    setShowDropdown(false)
  }

  function removeMember(id: string) { setPickedMembers((prev) => prev.filter((m) => m.id !== id)) }

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name="visibility"     value={selected} />
      <input type="hidden" name="allowedRoles"   value={JSON.stringify(roles)} />
      <input type="hidden" name="allowedUserIds" value={JSON.stringify(pickedMembers.map((m) => m.id))} />

      {/* ── Presets ──────────────────────────────────── */}
      <div className="flex flex-col gap-1.5">
        {VISIBILITY_PRESETS.map(({ value, label, desc, Icon, color, active }) => (
          <label
            key={value}
            className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
              selected === value ? active : 'border-border hover:bg-muted/40'
            }`}
          >
            <input
              type="radio"
              value={value}
              checked={selected === value}
              onChange={() => setSelected(value)}
              className="hidden"
            />
            <Icon size={15} className={selected === value ? color : 'text-muted-foreground'} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${selected === value ? 'text-foreground' : 'text-muted-foreground'}`}>
                {label}
              </p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
            <div className={`h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
              selected === value ? 'border-primary' : 'border-border'
            }`}>
              {selected === value && <div className="h-2 w-2 rounded-full bg-primary" />}
            </div>
          </label>
        ))}
      </div>

      {/* ── Rôles spécifiques ────────────────────────── */}
      <button
        type="button"
        onClick={() => setShowRoles((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors self-start mt-0.5"
      >
        <ChevronDown size={12} className={`transition-transform ${showRoles ? 'rotate-180' : ''}`} />
        Restreindre à des rôles spécifiques
        {roles.length > 0 && (
          <span className="ml-1 rounded-full bg-primary/10 text-primary px-1.5 py-0.5 text-[10px] font-medium">
            {roles.length}
          </span>
        )}
      </button>

      {showRoles && (
        <div className="rounded-lg border border-border bg-muted/20 p-3 flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            En plus du niveau d'accès, ces rôles pourront également voir le document.
          </p>
          {roles.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {roles.map((r) => (
                <span key={r} className="flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-xs font-medium text-foreground">
                  {r}
                  <button type="button" onClick={() => removeRole(r)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addRole() } }}
              placeholder="Ex: Directeur des formations…"
              className="flex-1 h-8 rounded-md border border-input bg-transparent px-2.5 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring"
            />
            <button
              type="button"
              onClick={addRole}
              disabled={!roleInput.trim()}
              className="h-8 rounded-md border border-border px-2.5 text-xs font-medium text-foreground hover:bg-accent disabled:opacity-40 transition-colors"
            >
              Ajouter
            </button>
          </div>
        </div>
      )}

      {/* ── Membres spécifiques ──────────────────────── */}
      <button
        type="button"
        onClick={() => setShowMembers((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors self-start"
      >
        <ChevronDown size={12} className={`transition-transform ${showMembers ? 'rotate-180' : ''}`} />
        Partager avec des membres spécifiques
        {pickedMembers.length > 0 && (
          <span className="ml-1 rounded-full bg-primary/10 text-primary px-1.5 py-0.5 text-[10px] font-medium">
            {pickedMembers.length}
          </span>
        )}
      </button>

      {showMembers && (
        <div className="rounded-lg border border-border bg-muted/20 p-3 flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            Ces membres actifs auront accès au document indépendamment de leur rôle.
          </p>

          {/* Chips membres sélectionnés */}
          {pickedMembers.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {pickedMembers.map((m) => (
                <span key={m.id} className="flex items-center gap-1.5 rounded-full border border-border bg-card pl-1.5 pr-2 py-0.5 text-xs font-medium text-foreground">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary shrink-0">
                    {m.fullName.charAt(0).toUpperCase()}
                  </span>
                  {m.fullName}
                  <button type="button" onClick={() => removeMember(m.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Recherche */}
          <div ref={dropdownRef} className="relative">
            <div className="relative">
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                onFocus={() => memberResults.length > 0 && setShowDropdown(true)}
                placeholder="Rechercher un membre actif…"
                className="w-full h-8 rounded-md border border-input bg-transparent pl-2.5 pr-8 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring"
              />
              {isSearching && (
                <Loader2 size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* Dropdown résultats */}
            {showDropdown && memberResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-30 mt-1 rounded-lg border border-border bg-card shadow-lg max-h-44 overflow-y-auto">
                {memberResults.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); addMember(m) }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 hover:bg-accent transition-colors text-left"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                      {m.fullName.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{m.fullName}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{m.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Aucun résultat */}
            {showDropdown && memberSearch.trim() && !isSearching && memberResults.length === 0 && (
              <div className="absolute top-full left-0 right-0 z-30 mt-1 rounded-lg border border-border bg-card px-3 py-2.5 shadow-lg">
                <p className="text-xs text-muted-foreground">Aucun membre actif trouvé.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function slugify(name: string) {
  return name.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// ── Download helper ────────────────────────────────────────

async function downloadDocument(id: string) {
  const tokenRes = await apiFetch(`/documents/users/download-url/${id}`)
  if (!tokenRes.ok) return
  const { data } = await tokenRes.json()
  const basePath = new URL(process.env.NEXT_PUBLIC_API_URL!).pathname
  const relativePath = data.url.startsWith(basePath) ? data.url.slice(basePath.length) : data.url
  const fullUrl = `/api/sigma${relativePath}`
  const dlRes = await apiFetch(fullUrl)
  if (dlRes.headers.get('Content-Type')?.includes('application/json')) {
    const json = await dlRes.json()
    window.open(json.data.url, '_blank')
  } else {
    window.open(fullUrl, '_blank')
  }
}

// ── Types locaux ───────────────────────────────────────────

interface FolderFormData {
  name: string; description: string; visibility: string
  icon: string; allowUpload: boolean; allowDownload: boolean; allowDelete: boolean; isPinned: boolean
  memberIds: string[]
}

const DEFAULT_FOLDER_FORM: FolderFormData = {
  name: '', description: '', visibility: 'members',
  icon: 'folder', allowUpload: true, allowDownload: true, allowDelete: false, isPinned: false,
  memberIds: [],
}

interface ExplorerState {
  currentFolderId: number | null
  currentFolder: FolderWithPermissions | null
  folders: FolderWithPermissions[]
  documents: Document[]
  breadcrumb: FolderBasic[]
  isLoading: boolean
  error: string | null
}

const INITIAL: ExplorerState = {
  currentFolderId: null, currentFolder: null, folders: [], documents: [],
  breadcrumb: [], isLoading: true, error: null,
}

// ── Page ───────────────────────────────────────────────────

export default function DocumentPage() {
  const { user } = useAuth()
  const isAdmin = user?.isAdmin ?? false

  const [state, setState] = useState<ExplorerState>(INITIAL)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [editingFolder, setEditingFolder] = useState<FolderWithPermissions | null>(null)
  const [deletingFolder, setDeletingFolder] = useState<FolderWithPermissions | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [editingDoc, setEditingDoc] = useState<Document | null>(null)
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null)
  const [isPending, startTransition] = useTransition()

  // ── Chargement ───────────────────────────────────────────

  const loadRoot = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }))
    try {
      const res = await apiFetch('/folders/getAllFolder?includeDocuments=true')
      if (!res.ok) throw new Error()
      const json = await res.json()
      setState({ currentFolderId: null, currentFolder: null,
        folders: json.data.folders ?? [], documents: json.data.documents ?? [],
        breadcrumb: [], isLoading: false, error: null })
    } catch {
      setState((s) => ({ ...s, isLoading: false, error: 'Impossible de charger les dossiers.' }))
    }
  }, [])

  const loadFolder = useCallback(async (id: number) => {
    setState((s) => ({ ...s, isLoading: true, error: null }))
    try {
      const folderRes = await apiFetch(`/folders/${id}?includeDocuments=true`)
      if (!folderRes.ok) throw new Error()
      const folderJson = await folderRes.json()
      const subFolders: FolderWithPermissions[] =
        folderJson.data.folders ??
        (folderJson.data.folder?.children as FolderWithPermissions[] | null) ??
        []
      setState({
        currentFolderId: id,
        currentFolder: folderJson.data.folder,
        folders: subFolders,
        documents: folderJson.data.documents ?? [],
        breadcrumb: folderJson.data.path ?? [],
        isLoading: false,
        error: null,
      })
    } catch {
      setState((s) => ({ ...s, isLoading: false, error: 'Impossible de charger ce dossier.' }))
    }
  }, [])

  const reload = useCallback(() => {
    state.currentFolderId === null ? loadRoot() : loadFolder(state.currentFolderId)
  }, [state.currentFolderId, loadRoot, loadFolder])

  const navigateTo = useCallback((id: number | null) => {
    id === null ? loadRoot() : loadFolder(id)
  }, [loadRoot, loadFolder])

  useEffect(() => { loadRoot() }, [loadRoot])

  function deleteDocument(id: string) {
    if (!confirm('Supprimer ce document ?')) return
    startTransition(async () => {
      const res = await apiFetch(`/documents/users/delete-document/${id}`, { method: 'DELETE' })
      if (res.ok) reload()
    })
  }

  const { isLoading, error, folders, documents, breadcrumb, currentFolder, currentFolderId } = state
  const totalDocs = documents.length + folders.reduce((acc, f) => acc + f.documentsCount, 0)
  const isEmpty = !isLoading && !error && folders.length === 0 && documents.length === 0

  return (
    <div className="flex flex-col gap-0">

      {/* ── Card principale ─────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card">

        {/* ── En-tête ─────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 p-5 border-b border-border">
          <div>
            <h1 className="text-xl font-bold text-foreground">Gestion des Documents</h1>

            {/* Breadcrumb */}
            <div className="flex items-center gap-1 mt-1 text-sm flex-wrap">
              <button onClick={() => navigateTo(null)} className="flex items-center gap-1 text-primary hover:underline underline-offset-4 font-medium">
                <Folder size={14} />
                Racine
              </button>
              {breadcrumb.map((crumb) => (
                <span key={crumb.id} className="flex items-center gap-1">
                  <ChevronRight size={13} className="text-muted-foreground" />
                  <button onClick={() => navigateTo(crumb.id)} className="text-primary hover:underline underline-offset-4 font-medium">
                    {crumb.name}
                  </button>
                </span>
              ))}
              {currentFolder && (
                <span className="flex items-center gap-1">
                  <ChevronRight size={13} className="text-muted-foreground" />
                  <span className="text-foreground font-medium">{currentFolder.name}</span>
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-1">
              {totalDocs} document{totalDocs > 1 ? 's' : ''}
            </p>
          </div>

          {/* Actions header */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Toggle vue */}
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button onClick={() => setViewMode('list')} title="Vue liste"
                className={`flex h-9 w-9 items-center justify-center transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-accent'}`}>
                <List size={16} />
              </button>
              <button onClick={() => setViewMode('grid')} title="Vue grille"
                className={`flex h-9 w-9 items-center justify-center transition-colors ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-accent'}`}>
                <Grid2x2 size={16} />
              </button>
            </div>

            <Button variant="secondary" onClick={() => setShowCreateFolder(true)} disabled={isLoading} title="Nouveau dossier" className="flex items-center gap-2">
              <Folder size={15} />
              <span className="hidden sm:inline">Nouveau dossier</span>
            </Button>
            <Button onClick={() => setShowUpload(true)} disabled={isLoading} title="Ajouter un document" className="flex items-center gap-2">
              <Plus size={15} />
              <span className="hidden sm:inline">Ajouter un document</span>
            </Button>
          </div>
        </div>

        {/* ── Corps ───────────────────────────────────── */}
        <div className="p-5 flex flex-col gap-6">

          {isLoading && (
            <div className="flex items-center gap-2 py-8 justify-center text-sm text-muted-foreground">
              <Loader2 size={15} className="animate-spin" /> Chargement…
            </div>
          )}
          {error && <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
          {isEmpty && (
            <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
              <FolderOpen size={40} strokeWidth={1.5} />
              <p className="text-sm">Ce dossier est vide.</p>
            </div>
          )}

          {/* ── Dossiers ──────────────────────────────── */}
          {!isLoading && folders.length > 0 && (
            <section className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dossiers</p>

              {viewMode === 'list' ? (
                <div className="flex flex-col divide-y divide-border rounded-xl border border-border overflow-hidden">
                  {folders.map((folder) => (
                    <FolderRow key={folder.id} folder={folder}
                      onClick={() => navigateTo(folder.id)}
                      onEdit={() => setEditingFolder(folder)}
                      onDelete={() => setDeletingFolder(folder)}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {folders.map((folder) => (
                    <FolderCard key={folder.id} folder={folder}
                      onClick={() => navigateTo(folder.id)}
                      onEdit={() => setEditingFolder(folder)}
                      onDelete={() => setDeletingFolder(folder)}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ── Documents ─────────────────────────────── */}
          {!isLoading && documents.length > 0 && (
            <section className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Documents</p>
              <div className="flex flex-col divide-y divide-border rounded-xl border border-border overflow-hidden">
                {documents.map((doc) => (
                  <DocumentRow key={doc.id} doc={doc}
                    onView={() => setViewingDoc(doc)}
                    onDownload={() => downloadDocument(doc.id)}
                    onEdit={() => setEditingDoc(doc)}
                    onDelete={() => deleteDocument(doc.id)}
                    disabled={isPending}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── Section admin ──────────────────────────── */}
          {isAdmin && <AdminSection />}
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────── */}
      {showCreateFolder && (
        <FolderFormModal title="Nouveau dossier" initial={DEFAULT_FOLDER_FORM}
          onClose={() => setShowCreateFolder(false)}
          onSubmit={async (data) => {
            const res = await apiFetch('/folders/create-folder', {
              method: 'POST',
              body: JSON.stringify({ ...data, slug: slugify(data.name), parentId: currentFolderId }),
            })
            if (!res.ok) { const j = await res.json(); throw new Error(j.message) }
            setShowCreateFolder(false); reload()
          }}
        />
      )}

      {editingFolder && (
        <FolderFormModal title={`Modifier "${editingFolder.name}"`}
          initial={{ name: editingFolder.name, description: editingFolder.description ?? '',
            visibility: editingFolder.visibility,
            icon: editingFolder.icon ?? 'folder', allowUpload: editingFolder.allowUpload,
            allowDownload: editingFolder.allowDownload, allowDelete: editingFolder.allowDelete,
            isPinned: editingFolder.isPinned, memberIds: [] }}
          onClose={() => setEditingFolder(null)}
          onSubmit={async (data) => {
            const res = await apiFetch(`/folders/update/${editingFolder.id}`, { method: 'PUT', body: JSON.stringify(data) })
            if (!res.ok) { const j = await res.json(); throw new Error(j.message) }
            setEditingFolder(null); reload()
          }}
        />
      )}

      {deletingFolder && (
        <DeleteFolderModal folder={deletingFolder}
          onClose={() => setDeletingFolder(null)}
          onDeleted={() => { setDeletingFolder(null); reload() }}
        />
      )}

      {showUpload && (
        <UploadDocumentModal folderId={currentFolderId}
          onClose={() => setShowUpload(false)}
          onUploaded={() => { setShowUpload(false); reload() }}
        />
      )}

      {editingDoc && (
        <EditDocumentModal doc={editingDoc}
          onClose={() => setEditingDoc(null)}
          onSaved={() => { setEditingDoc(null); reload() }}
        />
      )}

      {viewingDoc && (
        <DocumentViewerModal
          doc={viewingDoc}
          onClose={() => setViewingDoc(null)}
          onDownload={() => downloadDocument(viewingDoc.id)}
        />
      )}
    </div>
  )
}

// ── FolderRow (vue liste) ──────────────────────────────────

function FolderRow({ folder, onClick, onEdit, onDelete }: {
  folder: FolderWithPermissions; onClick: () => void; onEdit: () => void; onDelete: () => void
}) {
  const color = folder.isPrivate ? '#94a3b8' : (folder.color ?? '#F59E0B')

  return (
    <div className="group flex items-center gap-3 bg-card px-4 py-3 hover:bg-muted/40 transition-colors">
      <button onClick={onClick} className="flex items-center gap-3 flex-1 min-w-0 text-left">
        <div className="relative shrink-0">
          <FolderIconComp icon={folder.icon} color={color} size={28} />
          {folder.isPrivate && (
            <Lock size={10} className="absolute -bottom-0.5 -right-0.5 text-slate-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground truncate">{folder.name}</p>
            {folder.isPinned && <Pin size={11} className="text-muted-foreground shrink-0" />}
          </div>
          {folder.description && (
            <p className="text-xs text-muted-foreground truncate">{folder.description}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {folder.documentsCount} doc{folder.documentsCount !== 1 ? 's' : ''}
          </p>
        </div>
      </button>

      <FolderMenu
        onOpen={onClick}
        onEdit={folder.permissions?.canManage && !folder.isSystem ? onEdit : undefined}
        onDelete={folder.permissions?.canDelete && !folder.isSystem ? onDelete : undefined}
      />
    </div>
  )
}

// ── FolderCard (vue grille) ────────────────────────────────

function FolderCard({ folder, onClick, onEdit, onDelete }: {
  folder: FolderWithPermissions; onClick: () => void; onEdit: () => void; onDelete: () => void
}) {
  const color = folder.isPrivate ? '#94a3b8' : (folder.color ?? '#F59E0B')

  return (
    <div className="group relative flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm">
      <div className="absolute right-3 top-3">
        <FolderMenu
          onOpen={onClick}
          onEdit={folder.permissions?.canManage && !folder.isSystem ? onEdit : undefined}
          onDelete={folder.permissions?.canDelete && !folder.isSystem ? onDelete : undefined}
        />
      </div>
      <button onClick={onClick} className="flex flex-col gap-2 text-left">
        <div className="relative">
          <FolderIconComp icon={folder.icon} color={color} size={32} />
          {folder.isPrivate && <Lock size={11} className="absolute -bottom-0.5 -right-0.5 text-slate-500" />}
        </div>
        <div className="min-w-0 pr-6">
          <p className="truncate text-sm font-medium text-foreground">{folder.name}</p>
          <p className="text-xs text-muted-foreground">
            {folder.documentsCount} doc{folder.documentsCount !== 1 ? 's' : ''}
          </p>
        </div>
        <PermissionBadges perms={folder.permissions} />
      </button>
    </div>
  )
}

// ── FolderMenu (⋮) ────────────────────────────────────────

function FolderMenu({ onOpen, onEdit, onDelete }: {
  onOpen: () => void
  onEdit?: () => void
  onDelete?: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative shrink-0">
      <button onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
        className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
        <MoreVertical size={15} />
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-30 w-40 rounded-xl border border-border bg-card shadow-lg py-1">
          <button onClick={() => { setOpen(false); onOpen() }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors">
            <FolderOpen size={14} /> Ouvrir
          </button>
          {onEdit && (
            <button onClick={() => { setOpen(false); onEdit() }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors">
              <Pencil size={14} /> Modifier
            </button>
          )}
          {onDelete && (
            <button onClick={() => { setOpen(false); onDelete() }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors">
              <Trash2 size={14} /> Supprimer
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── DocumentRow ────────────────────────────────────────────

function DocumentRow({ doc, onView, onDownload, onEdit, onDelete, disabled }: {
  doc: Document; onView: () => void; onDownload: () => void; onEdit: () => void; onDelete: () => void; disabled: boolean
}) {
  const [downloading, setDownloading] = useState(false)

  async function handleDownload() {
    setDownloading(true)
    await onDownload()
    setDownloading(false)
  }

  return (
    <div className="flex items-center gap-3 bg-card px-4 py-3 hover:bg-muted/40 transition-colors">
      <FileText size={16} className="shrink-0 text-muted-foreground" />
      <button onClick={onView} className="flex-1 min-w-0 text-left hover:text-primary transition-colors">
        <p className="text-sm text-foreground truncate hover:text-primary">{doc.originalName}</p>
        <p className="text-xs text-muted-foreground">
          {doc.fileSizeFormatted} · {doc.categoryLabel}
          {doc.isExpired && <span className="ml-1 text-destructive">· Expiré</span>}
        </p>
      </button>
      {doc.status === 'rejected' && (
        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${STATUS_CLASSES.rejected}`}>
          {STATUS_LABELS.rejected}
        </span>
      )}
      <div className="flex gap-1 shrink-0">
        <button onClick={handleDownload} disabled={disabled || downloading} title="Télécharger"
          className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40">
          {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
        </button>
        <button onClick={onEdit} disabled={disabled} title="Modifier"
          className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40">
          <Pencil size={13} />
        </button>
        <button onClick={onDelete} disabled={disabled} title="Supprimer"
          className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

// ── UploadDocumentModal ────────────────────────────────────

type UploadState = { error?: string } | null

function UploadDocumentModal({ folderId, onClose, onUploaded }: {
  folderId: number | null; onClose: () => void; onUploaded: () => void
}) {
  const [state, action, isPending] = useActionState(
    async (_prev: UploadState, formData: FormData): Promise<UploadState> => {
      const file = formData.get('file') as File
      if (!file || file.size === 0) return { error: 'Veuillez sélectionner un fichier.' }
      const fd = new FormData()
      fd.append('file', file)
      if (folderId) fd.append('folderId', String(folderId))
      const name = (formData.get('name') as string).trim()
      if (name) fd.append('name', name)
      fd.append('category', formData.get('category') as string)
      fd.append('visibility', formData.get('visibility') as string)
      const desc = (formData.get('description') as string).trim()
      if (desc) fd.append('description', desc)
      const docDate = formData.get('documentDate') as string
      if (docDate) fd.append('documentDate', docDate)
      const expiry = formData.get('expirationDate') as string
      if (expiry) fd.append('expirationDate', expiry)
      const allowedRoles = formData.get('allowedRoles') as string
      if (allowedRoles && allowedRoles !== '[]') fd.append('allowedRoles', allowedRoles)
      const allowedUserIds = formData.get('allowedUserIds') as string
      if (allowedUserIds && allowedUserIds !== '[]') fd.append('allowedUserIds', allowedUserIds)

      const token = tokenStore.get()
      const res = await fetch('/api/sigma/documents/users/upload-document', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      })
      if (!res.ok) { const j = await res.json(); return { error: j.message ?? 'Erreur upload.' } }
      onUploaded()
      return null
    },
    null,
  )

  return (
    <Modal title="Ajouter un document" onClose={onClose}>
      <form action={action}>
        <div className="flex flex-col gap-4 p-4 max-h-[75vh] overflow-y-auto">
          {state?.error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}
          <div className="grid gap-1.5">
            <Label htmlFor="up-file">Fichier *</Label>
            <input id="up-file" name="file" type="file" required disabled={isPending}
              className="text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-input file:bg-transparent file:px-3 file:py-1 file:text-xs file:font-medium file:text-foreground hover:file:bg-accent" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="up-name">Nom <span className="text-xs text-muted-foreground">(optionnel)</span></Label>
            <Input id="up-name" name="name" placeholder="Nom du fichier par défaut" disabled={isPending} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="up-cat">Catégorie</Label>
            <select id="up-cat" name="category" defaultValue="other" disabled={isPending}
              className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
              {DOCUMENT_CATEGORIES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="up-date">Date du document</Label>
              <Input id="up-date" name="documentDate" type="date" disabled={isPending} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="up-exp">Expiration</Label>
              <Input id="up-exp" name="expirationDate" type="date" disabled={isPending} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="up-desc">Description</Label>
            <textarea id="up-desc" name="description" rows={2} disabled={isPending}
              className="w-full rounded-md border border-input bg-transparent px-2.5 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring resize-none" />
          </div>
          <div className="grid gap-2">
            <Label>Accès au document</Label>
            <VisibilityPicker defaultValue="private" />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border p-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>Annuler</Button>
          <Button type="submit" disabled={isPending} className="flex items-center gap-2">
            {isPending ? <><Loader2 size={14} className="animate-spin" />Upload…</> : <><Upload size={14} />Uploader</>}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ── EditDocumentModal ──────────────────────────────────────

type EditDocState = { error?: string } | null

function EditDocumentModal({ doc, onClose, onSaved }: {
  doc: Document; onClose: () => void; onSaved: () => void
}) {
  const [state, action, isPending] = useActionState(
    async (_prev: EditDocState, formData: FormData): Promise<EditDocState> => {
      const allowedRolesRaw   = formData.get('allowedRoles')   as string
      const allowedUserIdsRaw = formData.get('allowedUserIds') as string
      const allowedRoles   = allowedRolesRaw   && allowedRolesRaw   !== '[]' ? JSON.parse(allowedRolesRaw)   : undefined
      const allowedUserIds = allowedUserIdsRaw && allowedUserIdsRaw !== '[]' ? JSON.parse(allowedUserIdsRaw) : undefined
      const body = {
        name:           (formData.get('name') as string).trim() || undefined,
        description:    (formData.get('description') as string).trim() || null,
        category:       formData.get('category') as string,
        visibility:     formData.get('visibility') as string,
        documentDate:   (formData.get('documentDate') as string) || null,
        expirationDate: (formData.get('expirationDate') as string) || null,
        ...(allowedRoles   !== undefined && { allowedRoles }),
        ...(allowedUserIds !== undefined && { allowedUserIds }),
      }
      const res = await apiFetch(`/documents/users/update-document/${doc.id}`, { method: 'PUT', body: JSON.stringify(body) })
      if (!res.ok) { const j = await res.json(); return { error: j.message ?? 'Erreur.' } }
      onSaved(); return null
    },
    null,
  )

  return (
    <Modal title={`Modifier "${doc.originalName}"`} onClose={onClose}>
      <form action={action}>
        <div className="flex flex-col gap-4 p-4 max-h-[75vh] overflow-y-auto">
          {state?.error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}
          <div className="grid gap-1.5">
            <Label htmlFor="ed-name">Nom</Label>
            <Input id="ed-name" name="name" defaultValue={doc.name} disabled={isPending} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ed-cat">Catégorie</Label>
            <select id="ed-cat" name="category" defaultValue={doc.category} disabled={isPending}
              className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
              {DOCUMENT_CATEGORIES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="ed-date">Date document</Label>
              <Input id="ed-date" name="documentDate" type="date" defaultValue={doc.documentDate ?? ''} disabled={isPending} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ed-exp">Expiration</Label>
              <Input id="ed-exp" name="expirationDate" type="date" defaultValue={doc.expirationDate ?? ''} disabled={isPending} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ed-desc">Description</Label>
            <textarea id="ed-desc" name="description" rows={2} defaultValue={doc.description ?? ''} disabled={isPending}
              className="w-full rounded-md border border-input bg-transparent px-2.5 py-2 text-sm focus-visible:outline-none focus-visible:border-ring resize-none" />
          </div>
          <div className="grid gap-2">
            <Label>Accès au document</Label>
            <VisibilityPicker defaultValue={doc.visibility} defaultRoles={doc.allowedRoles ?? []} />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border p-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>Annuler</Button>
          <Button type="submit" disabled={isPending}>{isPending ? 'Enregistrement…' : 'Enregistrer'}</Button>
        </div>
      </form>
    </Modal>
  )
}

// ── AdminSection ───────────────────────────────────────────

function AdminSection() {
  const [stats, setStats] = useState<Record<string, unknown> | null>(null)
  const [types, setTypes] = useState<DocumentType[]>([])
  const [showTypes, setShowTypes] = useState(false)
  const [showCreateType, setShowCreateType] = useState(false)
  const [editingType, setEditingType] = useState<DocumentType | null>(null)
  const [isPending, startTransition] = useTransition()

  const loadTypes = useCallback(async () => {
    const res = await apiFetch('/documents/types/custom')
    if (res.ok) {
      const json = await res.json()
      const list = Array.isArray(json.data)
        ? json.data
        : (json.data?.types ?? json.data?.documentTypes ?? json.data?.items ?? [])
      setTypes(list)
    }
  }, [])

  useEffect(() => {
    apiFetch('/staffApp/stats-documents').then((r) => r.json()).then((j) => setStats(j.data?.stats ?? null)).catch(() => {})
  }, [])

  useEffect(() => { if (showTypes) loadTypes() }, [showTypes, loadTypes])

  function deleteType(id: number) {
    if (!confirm('Supprimer ce type ?')) return
    startTransition(async () => {
      const res = await apiFetch(`/documents/types/${id}`, { method: 'DELETE' })
      if (res.ok) loadTypes()
    })
  }

  return (
    <section className="flex flex-col gap-3 border-t border-border pt-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Administration</p>

      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Object.entries(stats).map(([key, val]) => (
            <div key={key} className="rounded-xl border border-border bg-muted/30 p-3">
              <p className="text-xl font-bold text-foreground">{String(val)}</p>
              <p className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <button onClick={() => setShowTypes((v) => !v)}
            className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Types personnalisés {showTypes ? '▲' : '▼'}
          </button>
          {showTypes && (
            <Button onClick={() => setShowCreateType(true)} className="h-7 px-3 text-xs flex items-center gap-1">
              <Plus size={12} /> Ajouter
            </Button>
          )}
        </div>

        {showTypes && (
          <div className="flex flex-col divide-y divide-border rounded-xl border border-border overflow-hidden">
            {types.length === 0
              ? <p className="px-4 py-3 text-sm text-muted-foreground">Aucun type personnalisé.</p>
              : types.map((t) => (
                <div key={t.id} className="flex items-center gap-3 bg-card px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{t.name}</p>
                    {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
                    {t.validityDays && <p className="text-xs text-muted-foreground">Validité : {t.validityDays}j</p>}
                  </div>
                  <button onClick={() => setEditingType(t)} className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"><Pencil size={13} /></button>
                  <button onClick={() => deleteType(t.id)} disabled={isPending} className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"><Trash2 size={13} /></button>
                </div>
              ))}
          </div>
        )}
      </div>

      {showCreateType && <DocumentTypeModal title="Nouveau type" onClose={() => setShowCreateType(false)} onSaved={() => { setShowCreateType(false); loadTypes() }} />}
      {editingType && <DocumentTypeModal title={`Modifier "${editingType.name}"`} initial={editingType} onClose={() => setEditingType(null)} onSaved={() => { setEditingType(null); loadTypes() }} />}
    </section>
  )
}

// ── DocumentTypeModal ──────────────────────────────────────

type TypeState = { error?: string } | null

function DocumentTypeModal({ title, initial, onClose, onSaved }: {
  title: string; initial?: DocumentType; onClose: () => void; onSaved: () => void
}) {
  const [state, action, isPending] = useActionState(
    async (_prev: TypeState, formData: FormData): Promise<TypeState> => {
      const body = {
        name: (formData.get('name') as string).trim(),
        description: (formData.get('description') as string).trim() || null,
        validityDays: formData.get('validityDays') ? Number(formData.get('validityDays')) : null,
      }
      const url = initial ? `/documents/types/${initial.id}` : '/documents/types/create'
      const res = await apiFetch(url, { method: initial ? 'PUT' : 'POST', body: JSON.stringify(body) })
      if (!res.ok) { const j = await res.json(); return { error: j.message ?? 'Erreur.' } }
      onSaved(); return null
    },
    null,
  )

  return (
    <Modal title={title} onClose={onClose}>
      <form action={action}>
        <div className="flex flex-col gap-3 p-4">
          {state?.error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>}
          <div className="grid gap-1.5"><Label htmlFor="dt-name">Nom *</Label><Input id="dt-name" name="name" defaultValue={initial?.name} required disabled={isPending} /></div>
          <div className="grid gap-1.5"><Label htmlFor="dt-desc">Description</Label><Input id="dt-desc" name="description" defaultValue={initial?.description ?? ''} disabled={isPending} /></div>
          <div className="grid gap-1.5"><Label htmlFor="dt-val">Validité (jours)</Label><Input id="dt-val" name="validityDays" type="number" min={1} defaultValue={initial?.validityDays ?? ''} disabled={isPending} placeholder="Pas de limite" /></div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border p-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>Annuler</Button>
          <Button type="submit" disabled={isPending}>{isPending ? 'Enregistrement…' : 'Enregistrer'}</Button>
        </div>
      </form>
    </Modal>
  )
}

// ── FolderFormModal ────────────────────────────────────────

function FolderFormModal({ title, initial, onClose, onSubmit }: {
  title: string; initial: FolderFormData; onClose: () => void; onSubmit: (d: FolderFormData) => Promise<void>
}) {
  const [form, setForm] = useState<FolderFormData>(initial)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const set = (patch: Partial<FolderFormData>) => setForm((f) => ({ ...f, ...patch }))

  const [pickedMembers, setPickedMembers] = useState<PickedMember[]>([])
  const [memberSearch, setMemberSearch] = useState('')
  const [memberResults, setMemberResults] = useState<PickedMember[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const q = memberSearch.trim()
    if (!q) { setMemberResults([]); setShowDropdown(false); return }
    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const params = new URLSearchParams({ isActive: 'true', search: q, limit: '8' })
        const res = await apiFetch(`/admin/members?${params}`)
        if (res.ok) {
          const json = await res.json()
          const list: Member[] = json.data?.members ?? json.data?.items ?? json.data ?? []
          setMemberResults(
            list
              .filter((m) => m.isActive && !pickedMembers.some((p) => p.id === m.id))
              .map((m) => ({ id: m.id, fullName: m.fullName, email: m.email }))
          )
          setShowDropdown(true)
        }
      } finally { setIsSearching(false) }
    }, 300)
    return () => clearTimeout(timer)
  }, [memberSearch, pickedMembers])

  function addMember(m: PickedMember) {
    setPickedMembers((prev) => [...prev, m])
    setMemberSearch('')
    setMemberResults([])
    setShowDropdown(false)
  }

  function removeMember(id: string) { setPickedMembers((prev) => prev.filter((m) => m.id !== id)) }

  function handleSubmit(e: FormEvent) {
    e.preventDefault(); setError(null)
    const finalForm = { ...form, memberIds: pickedMembers.map((m) => m.id) }
    startTransition(async () => {
      try { await onSubmit(finalForm) } catch (err) { setError(err instanceof Error ? err.message : 'Erreur.') }
    })
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4 p-4 max-h-[70vh] overflow-y-auto">
          {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <div className="grid gap-1.5"><Label htmlFor="f-name">Nom *</Label><Input id="f-name" value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Mon dossier" required disabled={isPending} /></div>
          <div className="grid gap-1.5"><Label htmlFor="f-desc">Description</Label><Input id="f-desc" value={form.description} onChange={(e) => set({ description: e.target.value })} disabled={isPending} /></div>
          <div className="grid gap-1.5">
            <Label htmlFor="f-vis">Visibilité</Label>
            <select id="f-vis" value={form.visibility} onChange={(e) => set({ visibility: e.target.value })} disabled={isPending}
              className="h-9 w-full rounded-md border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
              {FOLDER_VISIBILITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label>Membres ayant accès</Label>
            {pickedMembers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-1">
                {pickedMembers.map((m) => (
                  <span key={m.id} className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    {m.fullName}
                    <button type="button" onClick={() => removeMember(m.id)} className="ml-0.5 hover:text-destructive transition-colors"><X size={11} /></button>
                  </span>
                ))}
              </div>
            )}
            <div className="relative" ref={dropdownRef}>
              <div className="relative">
                <Input
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Rechercher un membre…"
                  disabled={isPending}
                  className="pr-7"
                />
                {isSearching && <Loader2 size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />}
              </div>
              {showDropdown && memberResults.length > 0 && (
                <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-card shadow-lg overflow-hidden">
                  {memberResults.map((m) => (
                    <button key={m.id} type="button" onMouseDown={() => addMember(m)}
                      className="flex w-full flex-col px-3 py-2 text-left hover:bg-muted/60 transition-colors">
                      <span className="text-sm font-medium">{m.fullName}</span>
                      <span className="text-xs text-muted-foreground">{m.email}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Permissions</Label>
            {([
              { key: 'allowUpload', label: 'Upload autorisé' },
              { key: 'allowDownload', label: 'Téléchargement autorisé' },
              { key: 'allowDelete', label: 'Suppression autorisée' },
              { key: 'isPinned', label: 'Épingler' },
            ] as { key: keyof FolderFormData; label: string }[]).map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={form[key] as boolean} onChange={(e) => set({ [key]: e.target.checked })} disabled={isPending} className="h-4 w-4 accent-primary" />
                {label}
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border p-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>Annuler</Button>
          <Button type="submit" disabled={isPending || !form.name.trim()}>{isPending ? 'Enregistrement…' : 'Enregistrer'}</Button>
        </div>
      </form>
    </Modal>
  )
}

// ── DeleteFolderModal ──────────────────────────────────────

function DeleteFolderModal({ folder, onClose, onDeleted }: {
  folder: FolderWithPermissions; onClose: () => void; onDeleted: () => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [notEmpty, setNotEmpty] = useState<{ documentsCount: number; childrenCount: number } | null>(null)
  const [isPending, startTransition] = useTransition()

  function doDelete(force = false) {
    setError(null)
    startTransition(async () => {
      const params = new URLSearchParams()
      if (force) params.set('force', 'true')
      params.set('moveDocumentsToRoot', 'true')
      const res = await apiFetch(`/folders/delete/${folder.id}?${params}`, { method: 'DELETE' })
      if (res.status === 400) { const j = await res.json(); setNotEmpty({ documentsCount: j.documentsCount ?? 0, childrenCount: j.childrenCount ?? 0 }); return }
      if (!res.ok) { const j = await res.json(); setError(j.message ?? 'Erreur.'); return }
      onDeleted()
    })
  }

  return (
    <Modal title="Supprimer le dossier" onClose={onClose}>
      <div className="flex flex-col gap-4 p-4">
        {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        {!notEmpty
          ? <p className="text-sm">Supprimer <span className="font-medium">"{folder.name}"</span> ? Cette action est irréversible.</p>
          : <div className="flex flex-col gap-1">
              <p className="text-sm">Dossier non vide : {notEmpty.documentsCount} doc{notEmpty.documentsCount !== 1 ? 's' : ''}{notEmpty.childrenCount > 0 ? `, ${notEmpty.childrenCount} sous-dossier${notEmpty.childrenCount !== 1 ? 's' : ''}` : ''}.</p>
              <p className="text-sm text-muted-foreground">Les documents seront déplacés à la racine.</p>
            </div>
        }
      </div>
      <div className="flex justify-end gap-2 border-t border-border p-4">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>Annuler</Button>
        <Button type="button" onClick={() => doDelete(!!notEmpty)} disabled={isPending} className="bg-destructive text-white hover:bg-destructive/90">
          {isPending ? 'Suppression…' : notEmpty ? 'Confirmer' : 'Supprimer'}
        </Button>
      </div>
    </Modal>
  )
}

// ── Primitives ─────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-medium text-foreground">{title}</h2>
          <button onClick={onClose} className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"><X size={14} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function FolderIconComp({ icon, color, size = 20 }: { icon: string | null; color: string; size?: number }) {
  const props = { size, color, strokeWidth: 1.8 }
  if (icon === 'folder-shared') return <FolderOpen {...props} />
  if (icon === 'lock') return <Lock {...props} />
  return <Folder {...props} />
}

function PermissionBadges({ perms }: { perms: FolderPermissions | undefined }) {
  if (!perms) return null
  return (
    <div className="flex flex-wrap gap-1">
      {perms.canUpload && <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-primary/10 text-primary">Upload</span>}
      {perms.canDownload && <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-primary/10 text-primary">Download</span>}
      {perms.canManage && <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-primary/10 text-primary">Gérer</span>}
    </div>
  )
}
