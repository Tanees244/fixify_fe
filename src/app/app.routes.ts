import { Routes } from '@angular/router';
import { adminGuard, customerGuard } from './core/guards/auth.guard';

export const appRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'auth' },
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'customer',
    loadComponent: () =>
      import('./shared/components/fixify-layout/fixify-layout.component').then(
        (m) => m.FixifyLayoutComponent
      ),
    canActivate: [customerGuard],
    loadChildren: () =>
      import('./features/customer/customer.routes').then(
        (m) => m.CUSTOMER_ROUTES
      ),
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./shared/components/fixify-layout/fixify-layout.component').then(
        (m) => m.FixifyLayoutComponent
      ),
    canActivate: [adminGuard],
    loadChildren: () =>
      import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: 'sites/:id/wordpress/connect',
    loadComponent: () =>
      import('./features/wordpress-connect/wordpress-connect.component').then(
        (m) => m.WordpressConnectComponent
      ),
  },
  { path: '**', redirectTo: 'auth' },
];
