import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, catchError, throwError } from 'rxjs';
import { AuthUser, UserProfile, UserRole } from '../models/auth.models';
import { AuthApiService } from './api/auth-api.service';
import { EntityIdRegistry } from './entity-id-registry.service';
import { initials, normalizeApiUser, roleToAppRole } from '../utils/api-user.util';
import { mapApiClientToCustomer } from '../utils/api-mappers.util';
import { isApiErrorEnvelope } from '../utils/api-response.util';

const SESSION_KEY = 'fixify_session';
const AUTH_TOKEN_KEY = 'authToken';
const CLIENT_PROFILE_KEY = 'clientProfile';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(AuthApiService);
  private readonly ids = inject(EntityIdRegistry);

  readonly user = signal<AuthUser | null>(this.readSession());

  login(email: string, password: string): Observable<AuthUser> {
    return this.api.login({ email, password }).pipe(
      map((res) => {
        if (isApiErrorEnvelope(res)) {
          throw new Error(res.message || 'Login failed');
        }
        const data = res.data;
        if (!data?.token || !data?.user) {
          throw new Error(res.message || 'Login failed');
        }

        const authUser = this.buildAuthUser(data.user, data.clientProfile);
        localStorage.setItem(AUTH_TOKEN_KEY, data.token);
        localStorage.setItem(SESSION_KEY, JSON.stringify(authUser));
        this.user.set(authUser);
        return authUser;
      }),
      catchError((err) => {
        const message =
          err?.error?.message || err?.message || 'Invalid email or password.';
        return throwError(() => new Error(message));
      })
    );
  }

  restoreSession(): Observable<AuthUser | null> {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const cached = this.readSession();
    if (!token) {
      if (cached) this.logout();
      return new Observable((sub) => {
        sub.next(null);
        sub.complete();
      });
    }
    if (cached) {
      return new Observable((sub) => {
        sub.next(cached);
        sub.complete();
      });
    }

    return this.fetchProfile().pipe(
      map((profile) => {
        const authUser = this.authUserFromProfile(profile);
        localStorage.setItem(SESSION_KEY, JSON.stringify(authUser));
        this.user.set(authUser);
        return authUser;
      }),
      catchError(() => {
        this.logout();
        return new Observable<AuthUser | null>((sub) => {
          sub.next(null);
          sub.complete();
        });
      })
    );
  }

  fetchProfile(): Observable<UserProfile> {
    return this.api.getCurrentUser().pipe(
      map((res) => {
        if (isApiErrorEnvelope(res) || !res.data) {
          throw new Error(res.message || 'Failed to load profile');
        }
        return this.mapProfileFromMe(res.data as Record<string, unknown>);
      }),
      catchError((err) => {
        const message = err?.error?.message || err?.message || 'Failed to load profile';
        return throwError(() => new Error(message));
      })
    );
  }

  forgotPassword(email: string): Observable<string> {
    return this.api.forgotPassword({ email: email.trim() }).pipe(
      map((res) => {
        if (isApiErrorEnvelope(res)) {
          throw new Error(res.message || 'Failed to send reset code');
        }
        return res.message || 'OTP has been sent to your email.';
      }),
      catchError((err) => {
        const message = err?.error?.message || err?.message || 'Failed to send reset code';
        return throwError(() => new Error(message));
      })
    );
  }

  verifyResetPassword(email: string, otp: string, password: string): Observable<string> {
    return this.api
      .verifyResetPassword({ email: email.trim(), otp: otp.trim(), password })
      .pipe(
        map((res) => {
          if (isApiErrorEnvelope(res)) {
            throw new Error(res.message || 'Failed to reset password');
          }
          return res.message || 'The password has been successfully reset.';
        }),
        catchError((err) => {
          const message = err?.error?.message || err?.message || 'Failed to reset password';
          return throwError(() => new Error(message));
        })
      );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<string> {
    return this.api.changePassword({ currentPassword, newPassword }).pipe(
      map((res) => {
        if (isApiErrorEnvelope(res)) {
          throw new Error(res.message || 'Failed to change password');
        }
        return res.message || 'Your password has been successfully changed.';
      }),
      catchError((err) => {
        const message = err?.error?.message || err?.message || 'Failed to change password';
        return throwError(() => new Error(message));
      })
    );
  }

  logout(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(CLIENT_PROFILE_KEY);
    this.user.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken() && !!this.user();
  }

  hasRole(role: UserRole): boolean {
    return this.user()?.role === role;
  }

  getCurrentUser(): AuthUser | null {
    return this.user();
  }

  syncUserFromProfile(profile: UserProfile): void {
    const authUser = this.authUserFromProfile(profile);
    localStorage.setItem(SESSION_KEY, JSON.stringify(authUser));
    this.user.set(authUser);
  }

  registerClientFromApi(raw: unknown): number {
    const customer = mapApiClientToCustomer(raw, this.ids);
    return customer.id;
  }

  private buildAuthUser(
    userRaw: Record<string, unknown>,
    clientProfileRaw?: Record<string, unknown> | null
  ): AuthUser {
    const normalized = normalizeApiUser(userRaw);
    const role = roleToAppRole(normalized.role);

    let customerId: number | undefined;
    let clientProfileId: string | undefined;

    if (clientProfileRaw && typeof clientProfileRaw === 'object') {
      clientProfileId = String(clientProfileRaw['_id'] ?? clientProfileRaw['id'] ?? '');
      if (clientProfileId) {
        customerId = this.ids.clientLocalId(clientProfileId);
        localStorage.setItem(CLIENT_PROFILE_KEY, JSON.stringify(clientProfileRaw));
      }
    } else if (role === 'customer') {
      const cpRaw = localStorage.getItem(CLIENT_PROFILE_KEY);
      if (cpRaw) {
        try {
          const cp = JSON.parse(cpRaw) as Record<string, unknown>;
          clientProfileId = String(cp['_id'] ?? cp['id'] ?? '');
          if (clientProfileId) {
            customerId = this.ids.clientLocalId(clientProfileId);
          }
        } catch {
          /* ignore */
        }
      }
    }

    return {
      id: normalized.id,
      email: normalized.email,
      name: normalized.name || normalized.email.split('@')[0],
      role,
      avatar: initials(normalized.name || normalized.email),
      subtitle: role === 'admin' ? 'Platform Admin' : 'Customer Account',
      customerId,
      clientProfileId,
    };
  }

  private mapProfileFromMe(data: Record<string, unknown>): UserProfile {
    const account = isRecord(data['account']) ? data['account'] : {};
    const clientProfile = isRecord(data['clientProfile']) ? data['clientProfile'] : null;
    const userRaw = isRecord(data['user']) ? data['user'] : data;

    const id = String(data['id'] ?? userRaw['id'] ?? account['_id'] ?? account['id'] ?? '');
    const email = String(data['email'] ?? userRaw['email'] ?? account['email'] ?? '');
    const name = String(data['name'] ?? userRaw['name'] ?? account['name'] ?? '');
    const role = String(data['role'] ?? userRaw['role'] ?? account['role'] ?? '');
    const subtitle = String(
      data['subtitle'] ??
        (roleToAppRole(role) === 'admin' ? 'Platform Admin' : 'Customer Account')
    );
    const avatar =
      String(data['avatar'] ?? '') || initials(name || email);

    if (clientProfile) {
      localStorage.setItem(CLIENT_PROFILE_KEY, JSON.stringify(clientProfile));
    }

    return {
      id,
      email,
      name,
      role,
      avatar,
      subtitle,
      accountStatus: String(account['status'] ?? data['status'] ?? ''),
      isActive: account['isActive'] !== false,
      createdAt: String(account['createdAt'] ?? data['createdAt'] ?? ''),
      updatedAt: String(account['updatedAt'] ?? data['updatedAt'] ?? ''),
      companyName: clientProfile ? String(clientProfile['companyName'] ?? '') : undefined,
      phone: clientProfile ? String(clientProfile['phone'] ?? '') : undefined,
      address: clientProfile ? String(clientProfile['address'] ?? '') : undefined,
    };
  }

  private authUserFromProfile(profile: UserProfile): AuthUser {
    const role = roleToAppRole(profile.role);
    let customerId: number | undefined;
    let clientProfileId: string | undefined;

    const cpRaw = localStorage.getItem(CLIENT_PROFILE_KEY);
    if (cpRaw) {
      try {
        const cp = JSON.parse(cpRaw) as Record<string, unknown>;
        clientProfileId = String(cp['_id'] ?? cp['id'] ?? '');
        if (clientProfileId) {
          customerId = this.ids.clientLocalId(clientProfileId);
        }
      } catch {
        /* ignore */
      }
    }

    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role,
      avatar: profile.avatar,
      subtitle: profile.subtitle,
      customerId,
      clientProfileId,
    };
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
