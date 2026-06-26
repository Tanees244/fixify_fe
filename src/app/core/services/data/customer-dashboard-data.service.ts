import { Injectable, inject, signal } from '@angular/core';
import { CustomerDashboardData } from '../../models/api.models';
import {
  AdminSiteAction,
  Insight,
  Site,
  SiteRecommendation,
  Ticket,
} from '../../models/fixify.models';
import {
  mapApiTicketToFixify,
  mapDashboardInsightToFixify,
  mapDashboardRecommendationToFixify,
  mapDashboardSiteToFixify,
  mapDashboardTeamUpdateToFixify,
} from '../../utils/api-mappers.util';
import { DashboardApiService } from '../api/dashboard-api.service';
import { AuthService } from '../auth.service';
import { EntityIdRegistry } from '../entity-id-registry.service';
import { NotificationService } from '../notification.service';
import { DataSessionService } from './data-session.service';
import { SitesDataService } from './sites-data.service';
import { CustomersDataService } from './customers-data.service';

const EMPTY_SUMMARY = {
  healthy: 0,
  warnings: 0,
  critical: 0,
  openIssues: 0,
};

@Injectable({ providedIn: 'root' })
export class CustomerDashboardDataService {
  private readonly dashboardApi = inject(DashboardApiService);
  private readonly session = inject(DataSessionService);
  private readonly sitesData = inject(SitesDataService);
  private readonly customersData = inject(CustomersDataService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(NotificationService);
  private readonly ids = inject(EntityIdRegistry);

  readonly greetingName = signal('');
  readonly summary = signal({ ...EMPTY_SUMMARY });
  readonly teamUpdates = signal<AdminSiteAction[]>([]);
  readonly recommendations = signal<SiteRecommendation[]>([]);
  readonly latestInsights = signal<Insight[]>([]);
  readonly recentTickets = signal<Ticket[]>([]);

  fetchDashboard(siteId?: string, done?: () => void): void {
    if (!this.session.useApi()) {
      done?.();
      return;
    }

    this.session.beginLoad();
    this.dashboardApi.getCustomerDashboard(siteId).subscribe({
      next: (res) => {
        this.applyDashboard(res.data);
        this.session.endLoad();
        done?.();
      },
      error: () => {
        this.session.endLoad();
        this.toast.error('Failed to load dashboard');
        done?.();
      },
    });
  }

  private applyDashboard(data: CustomerDashboardData | undefined): void {
    if (!data) {
      this.clearDashboard();
      return;
    }

    const user = this.auth.getCurrentUser();
    if (user) {
      this.customersData.applyAuthCustomerProfile(user);
    }

    const sites = (data.sites ?? []).map((site) => mapDashboardSiteToFixify(site, this.ids));
    this.sitesData.applyCustomerDashboardSites(sites);

    const greeting = data.greeting?.name?.trim();
    this.greetingName.set(greeting || user?.name?.split(' ')[0] || 'there');

    const summary = data.summary ?? EMPTY_SUMMARY;
    this.summary.set({
      healthy: Number(summary.healthy ?? 0),
      warnings: Number(summary.warnings ?? 0),
      critical: Number(summary.critical ?? 0),
      openIssues: Number(summary.openIssues ?? 0),
    });

    this.teamUpdates.set(
      (data.teamUpdates ?? []).map((item, index) =>
        mapDashboardTeamUpdateToFixify(item, this.ids, index)
      )
    );

    this.recommendations.set(
      (data.recommendations ?? []).map((item, index) =>
        mapDashboardRecommendationToFixify(item, this.ids, index)
      )
    );

    this.latestInsights.set(
      (data.latestInsights ?? []).map((item, index) => mapDashboardInsightToFixify(item, index))
    );

    this.recentTickets.set(
      (data.recentTickets ?? []).map((item) => mapApiTicketToFixify(item, this.ids))
    );
  }

  private clearDashboard(): void {
    this.greetingName.set('');
    this.summary.set({ ...EMPTY_SUMMARY });
    this.teamUpdates.set([]);
    this.recommendations.set([]);
    this.latestInsights.set([]);
    this.recentTickets.set([]);
  }
}
