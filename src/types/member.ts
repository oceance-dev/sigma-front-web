import type { Association } from '@/src/types/association'

export interface Member {
  id: string
  associationId: string | null
  email: string
  firstName: string
  lastName: string
  fullName: string
  dateOfBirth: string | null
  phone: string | null
  city_code: string
  sexe: 'Homme' | 'Femme' | null
  associationRoleKey: string
  permissions: string[]
  isActive: boolean
  isSuperAdmin: boolean
  isAdmin: boolean
  emailVerifiedAt: string | null
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export interface MemberMeta {
  total: number
  perPage: number
  currentPage: number
  lastPage: number
}

export interface MemberRole {
  key: string
  name: string
}

// Détail super-admin (GET /super-admin/users/:id) : forme propre plutôt qu'une
// extension de Member, car associationRoleKey y est nullable (candidat sans rôle)
// alors qu'il ne l'est pas sur Member (liste des membres d'une association).
export interface MemberDetail {
  id: string
  associationId: string | null
  email: string
  firstName: string
  lastName: string
  fullName: string
  dateOfBirth: string | null
  phone: string | null
  city_code: string
  sexe: 'Homme' | 'Femme' | null
  membre: boolean
  associationRoleKey: string | null
  isActive: boolean
  isSuperAdmin: boolean
  isAdmin: boolean
  isEmailVerified: boolean
  emailVerifiedAt: string | null
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string

  // Champs étendus, réservés à cette vue super-admin
  roleId: string | null
  lastLoginIp: string | null
  failedLoginAttempts: number
  isLocked: boolean
  lockedUntil: string | null
  mustChangePassword: boolean
  passwordChangedAt: string | null
}

export interface MemberDetailResponse {
  user: MemberDetail
  role: MemberRole | null
  association: Association | null
}
