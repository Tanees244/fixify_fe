import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  { path: '', redirectTo: 'overview', pathMatch: 'full' },
  {
    path: 'overview',
    loadComponent: () =>
      import('./overview/overview.component').then((m) => m.OverviewComponent),
  },
  {
    path: 'sites',
    loadComponent: () =>
      import('./sites/sites.component').then((m) => m.SitesComponent),
  },
  {
    path: 'sites/:siteId/manage',
    loadComponent: () =>
      import('./site-manage/site-manage-shell.component').then(
        (m) => m.SiteManageShellComponent
      ),
    loadChildren: () =>
      import('./site-manage/site-manage.routes').then((m) => m.SITE_MANAGE_ROUTES),
  },
  {
    path: 'customers',
    loadComponent: () =>
      import('./customers/customers.component').then((m) => m.CustomersComponent),
  },
  {
    path: 'customers/:id',
    loadComponent: () =>
      import('./customers/customer-detail/customer-detail.component').then(
        (m) => m.CustomerDetailComponent
      ),
  },
  {
    path: 'onboard',
    loadComponent: () =>
      import('./onboard/onboard-customer.component').then(
        (m) => m.AdminOnboardCustomerComponent
      ),
  },
  {
    path: 'subscriptions',
    loadComponent: () =>
      import('./subscriptions/subscriptions.component').then(
        (m) => m.SubscriptionsComponent
      ),
  },
  {
    path: 'tickets',
    pathMatch: 'full',
    loadComponent: () =>
      import('./tickets/tickets.component').then((m) => m.TicketsComponent),
  },
  {
    path: 'tickets/:id',
    loadComponent: () =>
      import('../tickets/ticket-detail.component').then((m) => m.TicketDetailComponent),
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
];
