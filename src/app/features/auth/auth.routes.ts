import { Routes } from '@angular/router';
import { guestGuard } from '../../core/guards/auth.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./auth-landing.component').then((m) => m.AuthLandingComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'customer/login',
    loadComponent: () =>
      import('./customer-login.component').then((m) => m.CustomerLoginComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./admin-login.component').then((m) => m.AdminLoginComponent),
    canActivate: [guestGuard],
  },
];
