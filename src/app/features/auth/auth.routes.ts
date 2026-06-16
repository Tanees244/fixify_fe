import { Routes } from '@angular/router';
import { guestGuard } from '../../core/guards/auth.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./auth-landing.component').then((m) => m.AuthLandingComponent),
    canActivate: [guestGuard],
  },
  { path: 'customer/login', redirectTo: '', pathMatch: 'full' },
  { path: 'admin/login', redirectTo: '', pathMatch: 'full' },
];
