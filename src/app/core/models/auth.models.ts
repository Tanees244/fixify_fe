export type UserRole = 'customer' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar: string;
  subtitle: string;
  customerId?: number;
  /** Mongo client profile id from API */
  clientProfileId?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
