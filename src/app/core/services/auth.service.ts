import { Injectable, signal } from '@angular/core';
import { findAccount } from '../data/mock-auth';
import { AuthUser, UserRole } from '../models/auth.models';

const SESSION_KEY = 'fixify_session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly user = signal<AuthUser | null>(this.readSession());

  login(email: string, password: string, role: UserRole): AuthUser | null {
    const account = findAccount(email, password, role);
    if (!account) return null;

    const user: AuthUser = {
      id: account.id,
      email: account.email,
      name: account.name,
      role: account.role,
      avatar: account.avatar,
      subtitle: account.subtitle,
      customerId: account.customerId,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    this.user.set(user);
    return user;
  }

  logout(): void {
    localStorage.removeItem(SESSION_KEY);
    this.user.set(null);
  }

  isLoggedIn(): boolean {
    return !!this.user();
  }

  hasRole(role: UserRole): boolean {
    return this.user()?.role === role;
  }

  getCurrentUser(): AuthUser | null {
    return this.user();
  }

  private readSession(): AuthUser | null {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }
}
