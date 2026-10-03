export interface AuthUser {
  id: string;
  associationId: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  associationRoleKey: string;
  permissions: string[];
  isActive: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isEmailVerified: boolean;
}

export type AssociationType = 'gendarmerie' | 'sport' | 'culturelle' | 'generale'

export interface AuthAssociation {
  id: string;
  name: string;
  slug: string;
  status: string;
  type: AssociationType;
  isTrial: boolean;
  hasValidSubscription: boolean;
}

export interface AuthSession {
  user: AuthUser;
  association: AuthAssociation;
  accessToken: string;
}

export interface LoginApiResponse {
  data: AuthSession;
}

export interface TwoFactorChallenge {
  challengeId: string;
  expiresAt: string;
}
