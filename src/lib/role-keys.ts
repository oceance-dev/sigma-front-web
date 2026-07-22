export const ROLE_KEYS = {
  PENDING:    'pending',
  ADMIN:      '1',
  PRESIDENT:  '2',
  TRESORIER:  '3',
  SECRETAIRE: '4',
  MEMBER:     '5', // Cadet si association.type === 'gendarmerie', sinon Licencié
  CANDIDAT:   '6',
} as const

export type RoleKey = typeof ROLE_KEYS[keyof typeof ROLE_KEYS]

export function memberRoleLabel(associationType: string | undefined | null): string {
  return associationType === 'gendarmerie' ? 'Cadet' : 'Licencié'
}
