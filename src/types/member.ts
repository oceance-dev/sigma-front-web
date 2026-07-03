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
