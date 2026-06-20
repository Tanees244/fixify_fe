import { ApplicationRef, Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { AppContextService } from './app-context.service';
import { DataSessionService } from './data/data-session.service';
import { CustomersDataService } from './data/customers-data.service';
import { SitesDataService } from './data/sites-data.service';
import { TicketsDataService } from './data/tickets-data.service';
import { ReportsDataService } from './data/reports-data.service';
import { SubscriptionsDataService } from './data/subscriptions-data.service';
import { FixifyDataService } from './fixify-data.service';

@Injectable({ providedIn: 'root' })
export class RouteDataLoaderService {
  private readonly data = inject(FixifyDataService);
  private readonly session = inject(DataSessionService);
  private readonly customersData = inject(CustomersDataService);
  private readonly sitesData = inject(SitesDataService);
  private readonly ticketsData = inject(TicketsDataService);
  private readonly reportsData = inject(ReportsDataService);
  private readonly subscriptionsData = inject(SubscriptionsDataService);
  private readonly auth = inject(AuthService);
  private readonly ctx = inject(AppContextService);
  private readonly appRef = inject(ApplicationRef);
  private readonly router = inject(Router);

  private lastUrl = '';

  /** Load API data for the current route (sidebar tab, inner tab, or site manage screen). */
  loadForUrl(url: string): void {
    if (url === this.lastUrl) {
      return;
    }
    this.lastUrl = url;

    this.data.initSession();
    if (!this.auth.getToken()) {
      this.tick();
      return;
    }

    this.session.useApi.set(true);
    const path = url.split('?')[0];

    // —— Customer ——
    if (path.startsWith('/customer/dashboard')) {
      let pending = 2;
      const done = () => {
        if (--pending === 0) this.tick();
      };
      this.data.fetchCustomerWebsites(done);
      this.ticketsData.fetchTickets({ role: 'client' }, done);
      return;
    }
    if (path.startsWith('/customer/performance')) {
      this.data.fetchCustomerWebsites(() => {
        this.sitesData.fetchSitePerformance(this.ctx.selectedSite(), () => this.tick());
      });
      return;
    }
    if (path.startsWith('/customer/security')) {
      this.data.fetchCustomerWebsites(() => {
        this.sitesData.fetchSiteSecurity(this.ctx.selectedSite(), () => this.tick());
      });
      return;
    }
    if (path.startsWith('/customer/seo')) {
      this.data.fetchCustomerWebsites(() => {
        this.sitesData.fetchSiteSeo(this.ctx.selectedSite(), () => this.tick());
      });
      return;
    }
    if (path.startsWith('/customer/uptime')) {
      this.data.fetchCustomerWebsites(() => {
        this.sitesData.fetchSiteUptime(this.ctx.selectedSite(), () => this.tick());
      });
      return;
    }
    if (path.startsWith('/customer/tickets')) {
      this.ticketsData.fetchTickets({ role: 'client' }, () => this.tick());
      return;
    }
    if (path.startsWith('/customer/reports')) {
      this.data.fetchCustomerWebsites(() => {
        const site = this.ctx.selectedSite();
        if (site) {
          this.reportsData.loadWebsiteReports(site.id, new Date().getFullYear());
        }
        this.tick();
      });
      return;
    }
    if (path.startsWith('/customer/add-wordpress')) {
      this.data.fetchCustomerWebsites(() => this.tick());
      return;
    }

    // —— Admin ——
    // Overview: no bulk API calls for now (visit Customers / Sites / Tickets tabs separately)
    if (path === '/admin/overview') {
      this.tick();
      return;
    }
    if (path === '/admin/sites') {
      let pending = 2;
      const done = () => {
        if (--pending === 0) this.tick();
      };
      this.sitesData.fetchWebsites(undefined, done);
      this.customersData.fetchClients(done);
      return;
    }
    if (path === '/admin/customers') {
      let pending = 2;
      const done = () => {
        if (--pending === 0) this.tick();
      };
      this.customersData.fetchClients(done);
      this.subscriptionsData.fetchSubscriptions(done);
      return;
    }
    if (path === '/admin/tickets') {
      this.ticketsData.fetchTickets(undefined, () => this.tick());
      return;
    }
    if (path === '/admin/subscriptions') {
      let pending = 2;
      const done = () => {
        if (--pending === 0) this.tick();
      };
      this.subscriptionsData.fetchSubscriptions(done);
      this.customersData.fetchClients(done);
      return;
    }
    if (path === '/admin/reports') {
      this.sitesData.fetchWebsites(undefined, () => this.tick());
      return;
    }
    if (path.startsWith('/admin/onboard')) {
      this.subscriptionsData.fetchSubscriptions(() => this.tick());
      return;
    }

    const customerMatch = path.match(/^\/admin\/customers\/(\d+)/);
    if (customerMatch) {
      const customerId = Number(customerMatch[1]);
      const tab = new URL(url, 'http://local').searchParams.get('tab') ?? 'overview';
      this.customersData.fetchClients(() => {
        this.sitesData.fetchWebsitesForCustomer(customerId, () => {
          this.loadAdminCustomerTab(customerId, tab);
          this.tick();
        });
      });
      return;
    }

    const manageMatch = path.match(/^\/admin\/sites\/(\d+)\/manage(?:\/(\w+))?/);
    if (manageMatch) {
      const siteId = Number(manageMatch[1]);
      const screen = manageMatch[2] ?? 'overview';
      this.sitesData.fetchWebsites(undefined, () => {
        this.loadSiteManageScreen(siteId, screen);
        this.tick();
      });
      return;
    }

    this.tick();
  }

  /** Re-fetch when customer switches website in the sidebar. */
  reloadCurrentRoute(): void {
    this.lastUrl = '';
    this.loadForUrl(this.router.url);
  }

  private loadAdminCustomerTab(customerId: number, tab: string): void {
    const sites = this.sitesData.sitesForCustomer(customerId);
    const site = sites[0];
    switch (tab) {
      case 'wordpress':
        if (site) {
          this.sitesData.fetchWordPressForSite(site.id);
        }
        break;
      case 'reports':
        sites.forEach((s) => this.reportsData.loadWebsiteReports(s.id, new Date().getFullYear()));
        break;
      case 'activity':
        this.ticketsData.fetchTickets({ clientId: this.customersData.clientApiIdFor(customerId) });
        break;
      default:
        break;
    }
  }

  private loadSiteManageScreen(siteId: number, screen: string): void {
    const site = this.sitesData.sites.find((s) => s.id === siteId) ?? null;
    switch (screen) {
      case 'overview':
        this.sitesData.loadWebsiteDashboard(siteId);
        break;
      case 'plugins':
      case 'core':
      case 'theme':
      case 'maintenance':
        this.sitesData.fetchWordPressForSite(siteId);
        break;
      case 'security':
        this.sitesData.fetchSiteSecurity(site);
        break;
      case 'cache':
        this.sitesData.loadWebsiteDashboard(siteId);
        break;
      default:
        this.sitesData.loadWebsiteDashboard(siteId);
    }
  }

  private tick(): void {
    this.appRef.tick();
  }
}
