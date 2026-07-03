export type DocumentStatus   = 'pending' | 'approved' | 'rejected'
export type DocumentCategory = 'identity' | 'medical' | 'administrative' | 'other' | string
export type DocumentVisibility =
  | 'public' | 'members' | 'candidat' | 'cadet' | 'cadet_breveter' | 'staff' | 'private'

export interface DocumentUserBasic {
  id: string
  firstName: string
  lastName: string
  fullName: string
  email: string
}

export interface Document {
  id: string
  associationId: string
  userId: string
  candidatId: string | null
  folderId: number | null
  documentRequirementId: number | null
  name: string
  originalName: string
  fileName: string
  filePath: string
  fileUrl: string | null
  mimeType: string
  fileSize: number
  fileSizeFormatted: string
  extension: string
  category: DocumentCategory
  categoryLabel: string
  visibility: DocumentVisibility
  visibilityLabel: string
  allowedRoles?: string[]
  allowedUserIds?: string[]
  status: DocumentStatus
  statusLabel: string
  description: string | null
  metadata: Record<string, unknown>
  expirationDate: string | null
  documentDate: string | null
  isExpired: boolean
  isPending: boolean
  isApproved: boolean
  version: number
  validatedAt: string | null
  rejectionReason: string | null
  createdAt: string
  updatedAt: string
  user?: DocumentUserBasic
  cadet?: DocumentUserBasic
  validator?: DocumentUserBasic
}

export interface DocumentType {
  id: number
  name: string
  description: string | null
  validityDays: number | null
}

export interface DocumentMeta {
  total: number
  perPage: number
  currentPage: number
  lastPage: number
}

export const DOCUMENT_CATEGORIES: { value: string; label: string }[] = [
  { value: 'identity',       label: 'Identité' },
  { value: 'medical',        label: 'Médical' },
  { value: 'administrative', label: 'Administratif' },
  { value: 'other',          label: 'Autre' },
]

export const DOCUMENT_VISIBILITIES: { value: string; label: string }[] = [
  { value: 'private',        label: 'Privé' },
  { value: 'members',        label: 'Membres' },
  { value: 'candidat',       label: 'Candidat' },
  { value: 'cadet',          label: 'Cadet' },
  { value: 'cadet_breveter', label: 'Cadet breveté' },
  { value: 'staff',          label: 'Staff' },
  { value: 'public',         label: 'Public' },
]
