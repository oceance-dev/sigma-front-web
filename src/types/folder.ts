export interface FolderBasic {
  id: number
  name: string
  slug: string
  color: string | null
  icon: string | null
  type: 'system' | 'shared' | 'private'
  visibility: 'private' | 'restricted' | 'staff' | 'members' | 'public'
  isSystem: boolean
  isPinned: boolean
}

export interface FolderPermissions {
  canView: boolean
  canUpload: boolean
  canDownload: boolean
  canDelete: boolean
  canManage: boolean
}

export interface FolderOwner {
  id: string
  firstname: string
  lastname: string
}

export interface Folder extends FolderBasic {
  associationId: string
  parentId: number | null
  ownerId: string | null
  description: string | null
  typeLabel: string
  visibilityLabel: string
  allowUpload: boolean
  allowDownload: boolean
  allowDelete: boolean
  allowedRoles?: string[]
  sortOrder: number
  isActive: boolean
  isPrivate: boolean
  isRoot: boolean
  createdAt: string
  updatedAt: string
  owner: FolderOwner | null
  parent: FolderBasic | null
  children: FolderBasic[] | null
}

export interface FolderWithPermissions extends Folder {
  documentsCount: number
  childrenCount: number
  permissions: FolderPermissions
}

export interface DocumentFile {
  id: string
  originalName: string
  mimeType?: string
  size?: number
  createdAt?: string
}
