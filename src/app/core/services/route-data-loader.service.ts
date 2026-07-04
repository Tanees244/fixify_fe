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
import { CustomerDashboardDataService } from './data/customer-dashboard-data.service';
import { AdminDashboardDataService } from './data/admin-dashboard-data.service';

@Injectable({ providedIn: 'root' })
export class RouteDataLoaderService {
  private readonly session = inject(DataSessionService);
  private readonly customersData = inject(CustomersDataService);
  private readonly sitesData = inject(SitesDataService);
  private readonly ticketsData = inject(TicketsDataService);
  private readonly reportsData = inject(ReportsDataService);
  private readonly subscriptionsData = inject(SubscriptionsDataService);
  private readonly customerDashboardData = inject(CustomerDashboardDataService);
  private readonly adminDashboardData = inject(AdminDashboardDataService);
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

    this.session.init();
    if (!this.auth.getToken()) {
      this.tick();
      return;
    }

    this.session.useApi.set(true);
    const path = url.split('?')[0];

    // —— Customer ——
    if (path.startsWith('/customer/dashboard')) {
      this.customerDashboardData.fetchDashboard(undefined, () => this.tick());
      return;
    }
    const customerConnectMatch = path.match(/^\/customer\/sites\/(\d+)\/connect$/);
    if (customerConnectMatch) {
      const siteId = Number(customerConnectMatch[1]);
      this.sitesData.ensureCustomerWebsites(() => {
        this.sitesData.fetchWordPressConnectionStatus(siteId, () => this.tick());
      });
      return;
    }
    const customerManageMatch = path.match(/^\/customer\/sites\/(\d+)\/manage(?:\/(\w+))?/);
    if (customerManageMatch) {
      const siteId = Number(customerManageMatch[1]);
      const screen = customerManageMatch[2] ?? 'overview';
      this.sitesData.ensureCustomerWebsites(() => {
        this.loadSiteManageScreen(siteId, screen);
        this.tick();
      });
      return;
    }
    if (path.startsWith('/customer/sites')) {
      this.sitesData.ensureCustomerWebsites(() => this.tick());
      return;
    }
    if (path.startsWith('/customer/performance')) {
      this.sitesData.ensureCustomerWebsites(() => {
        this.sitesData.fetchSitePerformance(this.ctx.selectedSite(), () => this.tick());
      });
      return;
    }
    if (path.startsWith('/customer/security')) {
      this.sitesData.ensureCustomerWebsites(() => {
        this.sitesData.fetchSiteSecurity(this.ctx.selectedSite(), () => this.tick());
      });
      return;
    }
    if (path.startsWith('/customer/seo')) {
      this.sitesData.ensureCustomerWebsites(() => {
        this.sitesData.fetchSiteSeo(this.ctx.selectedSite(), () => this.tick());
      });
      return;
    }
    if (path.startsWith('/customer/uptime')) {
      this.sitesData.ensureCustomerWebsites(() => {
        this.sitesData.fetchSiteUptime(this.ctx.selectedSite(), () => this.tick());
      });
      return;
    }
    if (path.startsWith('/customer/tickets')) {
      let pending = 2;
      const done = () => {
        if (--pending === 0) this.tick();
      };
      this.sitesData.ensureCustomerWebsites(done);
      this.ticketsData.fetchTickets({ role: 'client', page: 1, limit: 10 }, done);
      return;
    }
    if (path.startsWith('/customer/reports')) {
      this.sitesData.ensureCustomerWebsites(() => {
        const site = this.ctx.selectedSite();
        if (site) {
          this.reportsData.loadWebsiteReports(site.id, new Date().getFullYear(), () => this.tick());
        } else {
          this.tick();
        }
      });
      return;
    }
    if (path.startsWith('/customer/add-wordpress')) {
      let pending = 2;
      const done = () => {
        if (--pending === 0) this.tick();
      };
      this.sitesData.ensureCustomerWebsites(done);
      this.subscriptionsData.fetchSubscriptions(done);
      return;
    }

    // —— Admin ——
    if (path === '/admin/overview') {
      this.adminDashboardData.fetchOverview(() => this.tick());
      return;
    }
    if (path === '/admin/sites') {
      let pending = 2;
      const done = () => {
        if (--pending === 0) this.tick();
      };
      this.sitesData.fetchWebsites({ page: 1, limit: 10 }, done);
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
    if (path.startsWith('/admin/tickets')) {
      let pending = 2;
      const done = () => {
        if (--pending === 0) this.tick();
      };
      this.sitesData.fetchWebsites({ page: 1, limit: 100 }, done);
      this.ticketsData.fetchTickets({ page: 1, limit: 50 }, done);
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
      let pending = 3;
      const done = () => {
        if (--pending === 0) this.tick();
      };
      this.sitesData.fetchWebsites(undefined, done);
      this.customersData.fetchClients(done);
      this.reportsData.fetchReports({ year: new Date().getFullYear() }, done);
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

    const adminConnectMatch = path.match(/^\/admin\/sites\/(\d+)\/connect$/);
    if (adminConnectMatch) {
      const siteId = Number(adminConnectMatch[1]);
      this.sitesData.fetchWebsites(undefined, () => {
        this.sitesData.fetchWordPressConnectionStatus(siteId, () => this.tick());
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
    // Tickets back the overview preview and the activity tab, so always load them.
    this.ticketsData.fetchTickets({
      clientId: this.customersData.clientApiIdFor(customerId),
      limit: 50,
    });
    switch (tab) {
      case 'wordpress':
        if (site) {
          this.sitesData.fetchWordPressForSite(site.id);
        }
        break;
      case 'reports':
        sites.forEach((s) => this.reportsData.loadWebsiteReports(s.id, new Date().getFullYear()));
        break;
      default:
        break;
    }
  }

  private loadSiteManageScreen(siteId: number, screen: string): void {
    const site = this.sitesData.sites.find((s) => s.id === siteId);
    if (site?.platform === 'wordpress') {
      this.sitesData.fetchWordPressConnectionStatus(siteId, () => {
        if (this.sitesData.needsWordPressConnect(siteId)) {
          const prefix = this.router.url.startsWith('/customer') ? '/customer' : '/admin';
          this.router.navigate([prefix, 'sites', siteId, 'connect']);
          this.tick();
          return;
        }
        this.sitesData.fetchWordPressManage(siteId, screen, () => this.tick());
      });
      return;
    }
    this.sitesData.fetchWordPressManage(siteId, screen, () => this.tick());
  }

  private tick(): void {
    this.appRef.tick();
  }
}
