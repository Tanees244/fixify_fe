import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, tap, catchError, throwError } from 'rxjs';
import { AuthUser, UserRole } from '../models/auth.models';
import { AuthApiService } from './api/auth-api.service';
import { EntityIdRegistry } from './entity-id-registry.service';
import { initials, normalizeApiUser, roleToAppRole } from '../utils/api-user.util';
import { mapApiClientToCustomer } from '../utils/api-mappers.util';

const SESSION_KEY = 'fixify_session';
const AUTH_TOKEN_KEY = 'authToken';
const CLIENT_PROFILE_KEY = 'clientProfile';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(AuthApiService);
  private readonly ids = inject(EntityIdRegistry);

  readonly user = signal<AuthUser | null>(this.readSession());

  login(email: string, password: string): Observable<AuthUser> {
    return this.api.login({ email, password }).pipe(
      map((res) => {
        const data = res.data;
        if (!data?.token || !data?.user) {
          throw new Error(res.message || 'Login failed');
        }

        const normalized = normalizeApiUser(data.user);
        const role = roleToAppRole(normalized.role);

        localStorage.setItem(AUTH_TOKEN_KEY, data.token);

        let customerId: number | undefined;
        let clientProfileId: string | undefined;

        if (data.clientProfile && typeof data.clientProfile === 'object') {
          const cp = data.clientProfile as Record<string, unknown>;
          clientProfileId = String(cp['_id'] ?? cp['id'] ?? '');
          if (clientProfileId) {
            customerId = this.ids.clientLocalId(clientProfileId);
            localStorage.setItem(CLIENT_PROFILE_KEY, JSON.stringify(data.clientProfile));
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

        const authUser: AuthUser = {
          id: normalized.id,
          email: normalized.email,
          name: normalized.name || normalized.email.split('@')[0],
          role,
          avatar: initials(normalized.name || normalized.email),
          subtitle: role === 'admin' ? 'Platform Admin' : 'Customer Account',
          customerId,
          clientProfileId,
        };

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

    return this.api.getCurrentUser().pipe(
      map((res) => {
        const data = res.data;
        if (!data?.user) return null;

        const normalized = normalizeApiUser(data.user);
        const role = roleToAppRole(normalized.role);

        let customerId: number | undefined;
        let clientProfileId: string | undefined;
        if (data.clientProfile) {
          clientProfileId = String(data.clientProfile._id ?? data.clientProfile.id ?? '');
          if (clientProfileId) {
            customerId = this.ids.clientLocalId(clientProfileId);
            localStorage.setItem(CLIENT_PROFILE_KEY, JSON.stringify(data.clientProfile));
          }
        }

        const authUser: AuthUser = {
          id: normalized.id,
          email: normalized.email,
          name: normalized.name || normalized.email.split('@')[0],
          role,
          avatar: initials(normalized.name || normalized.email),
          subtitle: role === 'admin' ? 'Platform Admin' : 'Customer Account',
          customerId,
          clientProfileId,
        };

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

  /** Map client profile from login/create response into local customer id */
  registerClientFromApi(raw: unknown): number {
    const customer = mapApiClientToCustomer(raw, this.ids);
    return customer.id;
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
