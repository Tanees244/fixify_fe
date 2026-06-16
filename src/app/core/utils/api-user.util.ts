import { UserRole } from '../models/auth.models';

export interface NormalizedApiUser {
  id: string;
  email: string;
  role: string;
  name: string;
  isActive: boolean;
}

export function normalizeApiUser(raw: unknown): NormalizedApiUser {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid user payload');
  }
  const o = raw as Record<string, unknown>;
  const idRaw = o['_id'] ?? o['id'];
  if (idRaw == null || idRaw === '') {
    throw new Error('User id missing');
  }
  return {
    id: String(idRaw),
    email: String(o['email'] ?? ''),
    role: String(o['role'] ?? 'client'),
    name: String(o['name'] ?? ''),
    isActive: Boolean(o['isActive']),
  };
}

export function roleToAppRole(role: string | undefined): UserRole {
  const r = (role || '').toLowerCase().trim();
  if (r === 'admin' || r === 'superadmin' || r === 'super_admin') {
    return 'admin';
  }
  return 'customer';
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
