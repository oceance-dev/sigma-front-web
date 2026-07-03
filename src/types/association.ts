export type AssociationStatus = 'active' | 'pending' | 'suspended' | 'cancelled'

export type CustomFieldType = 'text' | 'email' | 'tel' | 'date' | 'textarea' | 'select' | 'checkbox'

export interface CustomField {
  id: string
  label: string
  type: CustomFieldType
  required: boolean
  placeholder?: string
  options?: string[]
  sort_order?: number
}

export interface Association {
  id: string
  name: string
  slug: string
  email: string | null
  city: string
  postalCode: string
  country: string
  status: AssociationStatus
  acceptOnlineRegistrations?: boolean
  documentsRequisEnabled?:   boolean
  campaignsEnabled?:         boolean
  onboardingDismissed?:      boolean
  afterRegistrationRedirect?: 'documents' | 'login'
  codeAsso?: string | null
  codeActivation?: string | null
  createdAt: string
  updatedAt: string
}

export interface AssociationMeta {
  total: number
  perPage: number
  currentPage: number
  lastPage: number
}

export interface AssociationUpdateBody {
  name?: string
  email?: string
  city?: string
  postalCode?: string
  country?: string
}
