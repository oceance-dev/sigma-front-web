export type AccountRequestType = 'account_update' | 'data_access' | 'data_deletion'
export type AccountRequestStatus = 'pending' | 'escalated' | 'approved' | 'rejected'

export interface RequestedAccountChanges {
  firstname?: string
  lastname?: string
  dateOfBirth?: string
  email?: string
  phone?: string
  city_code?: string
  sexe?: 'Homme' | 'Femme'
}

// Forme complète telle que renvoyée par /account-requests (self-service) et
// /admin/account-requests (traitement admin/super-admin) — même modèle des deux côtés,
// `user`/`association` sont simplement absents ou redondants en self-service.
export interface AccountRequestItem {
  id: string
  userId: string
  associationId: string
  type: AccountRequestType
  requestedChanges: RequestedAccountChanges | null
  hasPasswordChange: boolean
  reason: string | null
  status: AccountRequestStatus
  validatedBy: string | null
  validatedAt: string | null
  rejectionReason: string | null
  escalatedBy: string | null
  escalatedAt: string | null
  escalationNote: string | null
  createdAt: string
  updatedAt: string
  user: { id: string; fullName: string; email: string } | null
  association: { id: string; name: string } | null
}

export function isFinalRequestStatus(status: AccountRequestStatus): boolean {
  return status === 'approved' || status === 'rejected'
}

export const REQUEST_TYPE_LABELS: Record<AccountRequestType, string> = {
  account_update: 'Modification de compte',
  data_access: 'Accès aux données personnelles',
  data_deletion: 'Suppression des données personnelles',
}

export const REQUEST_TYPE_CLASSES: Record<AccountRequestType, string> = {
  account_update: 'bg-blue-100 text-blue-700',
  data_access: 'bg-muted text-muted-foreground',
  data_deletion: 'bg-destructive/10 text-destructive',
}

export const REQUEST_STATUS_LABELS: Record<AccountRequestStatus, string> = {
  pending: 'En attente',
  escalated: 'Transmise au super administrateur',
  approved: 'Approuvée',
  rejected: 'Rejetée',
}

export const REQUEST_STATUS_CLASSES: Record<AccountRequestStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  escalated: 'bg-violet-100 text-violet-700',
  approved: 'bg-primary/10 text-primary',
  rejected: 'bg-destructive/10 text-destructive',
}

export const REQUEST_CHANGE_FIELD_ORDER: (keyof RequestedAccountChanges)[] = [
  'firstname', 'lastname', 'dateOfBirth', 'email', 'phone', 'city_code', 'sexe',
]

export const REQUEST_CHANGE_FIELD_LABELS: Record<keyof RequestedAccountChanges, string> = {
  firstname: 'Prénom',
  lastname: 'Nom',
  dateOfBirth: 'Date de naissance',
  email: 'Email',
  phone: 'Téléphone',
  city_code: 'Code postal',
  sexe: 'Sexe',
}

export function formatRequestChangeValue(key: keyof RequestedAccountChanges, value: string): string {
  return key === 'dateOfBirth' ? new Date(value).toLocaleDateString('fr-FR') : value
}
