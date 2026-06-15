export type UserRole = 'customer' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar: string;
  subtitle: string;
  customerId?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
