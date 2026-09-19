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
  sanitaireEnabled?:         boolean
  onboardingDismissed?:      boolean
  afterRegistrationRedirect?: 'documents' | 'login'
  codeAsso?: string | null
  codeActivation?: string | null
  isTrial?: boolean
  trialEndsAt?: string | null
  createdAt: string
  updatedAt: string

  // Coordonnées/identifiants organisationnels (réservés à la vue super-admin)
  rna: string | null
  siret: string | null
  phone: string | null
  address: string

  // Facturation
  hasValidSubscription: boolean
  subscriptionEndsAt: string | null
  subscriptionCancelAtPeriodEnd: boolean
  subscribedAt: string | null

  // Agrégats super-admin
  userCount: number
  admin: { fullName: string; email: string } | null
  hasActivePayment: boolean
}

export interface AssociationMeta {
  total: number
  perPage: number
  currentPage: number
  lastPage: number
}

export interface AssociationUpdateBody {
  email?: string
  phone?: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
}
