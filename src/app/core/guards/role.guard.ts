import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export function roleGuard(allowedRoles: string[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isLoggedIn()) {
      return router.createUrlTree(['/auth/login']);
    }

    // In a real app, decode JWT or call API to get user roles
    const token = authService.getToken();
    const roles = token ? ['user'] : []; // placeholder: replace with actual role resolution

    const hasRole = allowedRoles.some((role) => roles.includes(role));
    if (hasRole) {
      return true;
    }

    return router.createUrlTree(['/']);
  };
}
