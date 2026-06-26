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

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar: string;
  subtitle: string;
  accountStatus?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  companyName?: string;
  phone?: string;
  address?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
