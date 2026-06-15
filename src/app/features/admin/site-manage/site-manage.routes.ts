import { Routes } from '@angular/router';

export const SITE_MANAGE_ROUTES: Routes = [
  { path: '', redirectTo: 'overview', pathMatch: 'full' },
  {
    path: 'overview',
    loadComponent: () =>
      import('./screens/overview-screen.component').then((m) => m.OverviewScreenComponent),
  },
  {
    path: 'plugins',
    loadComponent: () =>
      import('./screens/plugins-screen.component').then((m) => m.PluginsScreenComponent),
  },
  {
    path: 'core',
    loadComponent: () =>
      import('./screens/core-screen.component').then((m) => m.CoreScreenComponent),
  },
  {
    path: 'theme',
    loadComponent: () =>
      import('./screens/theme-screen.component').then((m) => m.ThemeScreenComponent),
  },
  {
    path: 'cache',
    loadComponent: () =>
      import('./screens/cache-screen.component').then((m) => m.CacheScreenComponent),
  },
  {
    path: 'security',
    loadComponent: () =>
      import('./screens/security-screen.component').then((m) => m.SecurityScreenComponent),
  },
  {
    path: 'maintenance',
    loadComponent: () =>
      import('./screens/maintenance-screen.component').then((m) => m.MaintenanceScreenComponent),
  },
];
