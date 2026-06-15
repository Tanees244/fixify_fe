import { Routes } from '@angular/router';

export const CUSTOMER_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'performance',
    loadComponent: () =>
      import('./performance/performance.component').then((m) => m.PerformanceComponent),
  },
  {
    path: 'security',
    loadComponent: () =>
      import('./security/security.component').then((m) => m.SecurityComponent),
  },
  {
    path: 'seo',
    loadComponent: () => import('./seo/seo.component').then((m) => m.SeoComponent),
  },
  {
    path: 'uptime',
    loadComponent: () =>
      import('./uptime/uptime.component').then((m) => m.UptimeComponent),
  },
  {
    path: 'ai',
    loadComponent: () =>
      import('./ai-insights/ai-insights.component').then((m) => m.AiInsightsComponent),
  },
  {
    path: 'tickets',
    loadComponent: () =>
      import('./tickets/tickets.component').then((m) => m.TicketsComponent),
  },
  {
    path: 'reports',
    loadComponent: () =>
      import('./reports/reports.component').then((m) => m.ReportsComponent),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./settings/settings.component').then((m) => m.SettingsComponent),
  },
  {
    path: 'add-wordpress',
    loadComponent: () =>
      import('./add-wordpress/add-wordpress.component').then(
        (m) => m.AddWordpressComponent
      ),
  },
];
