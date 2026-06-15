import { AuthUser, UserRole } from '../models/auth.models';

export interface MockAccount extends AuthUser {
  password: string;
}

export const MOCK_ACCOUNTS: MockAccount[] = [
  {
    id: '1',
    email: 'sarah@acmecorp.com',
    password: 'customer123',
    name: 'Sarah Johnson',
    role: 'customer',
    avatar: 'SJ',
    subtitle: 'Pro Plan · Owner',
    customerId: 1,
  },
  {
    id: '2',
    email: 'admin@fixify.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin',
    avatar: 'AU',
    subtitle: 'Administrator',
  },
];

export function findAccount(
  email: string,
  password: string,
  role: UserRole
): MockAccount | undefined {
  return MOCK_ACCOUNTS.find(
    (a) =>
      a.email.toLowerCase() === email.toLowerCase() &&
      a.password === password &&
      a.role === role
  );
}
