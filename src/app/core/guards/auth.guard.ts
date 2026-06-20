import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/auth.models';

function roleGuard(role: UserRole, loginPath: string): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const user = auth.getCurrentUser();

    if (!user) {
      return router.createUrlTree([loginPath]);
    }

    if (user.role !== role) {
      return router.createUrlTree([
        user.role === 'admin' ? '/admin/overview' : '/customer/dashboard',
      ]);
    }

    return true;
  };
}

export const customerGuard = roleGuard('customer', '/auth');
export const adminGuard = roleGuard('admin', '/auth');

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.getCurrentUser();

  if (!user) return true;

  return router.createUrlTree([
    user.role === 'admin' ? '/admin/overview' : '/customer/dashboard',
  ]);
};

export const rootRedirectGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.getCurrentUser();

  if (!user) return router.createUrlTree(['/auth']);
  return router.createUrlTree([
    user.role === 'admin' ? '/admin/overview' : '/customer/dashboard',
  ]);
};
