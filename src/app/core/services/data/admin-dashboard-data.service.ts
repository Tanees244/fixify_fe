import { Injectable, inject, signal } from '@angular/core';
import { AdminDashboardOverviewData } from '../../models/api.models';
import { TicketPriority, TicketStatus } from '../../models/fixify.models';
import { DashboardApiService } from '../api/dashboard-api.service';
import { NotificationService } from '../notification.service';
import { DataSessionService } from './data-session.service';

export interface AdminOverviewStatCard {
  label: string;
  value: number;
  sub: string;
  color: string;
  icon: string;
}

export interface AdminOverviewHealthBucket {
  label: string;
  count: number;
  color: string;
}

export interface AdminOverviewActivityRow {
  id: string;
  ticket: string;
  title: string;
  site: string;
  customer: string;
  priority: TicketPriority;
  status: TicketStatus;
  age: string;
}

export interface AdminOverviewSnapshotItem {
  label: string;
  value: number;
  detail: string;
  color: string;
  icon: string;
  iconBg: string;
  tone: 'default' | 'warn' | 'alert' | 'ok';
}

const EMPTY_STATS: AdminOverviewStatCard[] = [
  { label: 'Total Customers', value: 0, sub: '0 active', color: 'var(--acc)', icon: 'users' },
  { label: 'Monitored Sites', value: 0, sub: 'Across all customers', color: 'var(--t1)', icon: 'globe' },
  { label: 'Open Tickets', value: 0, sub: '0 critical', color: 'var(--wn)', icon: 'clip' },
  { label: 'Avg Health Score', value: 0, sub: 'All sites combined', color: 'var(--t1)', icon: 'activity' },
];

@Injectable({ providedIn: 'root' })
export class AdminDashboardDataService {
  private readonly dashboardApi = inject(DashboardApiService);
  private readonly session = inject(DataSessionService);
  private readonly toast = inject(NotificationService);

  readonly statCards = signal<AdminOverviewStatCard[]>(EMPTY_STATS);
  readonly healthDistribution = signal<AdminOverviewHealthBucket[]>([]);
  readonly platformSnapshot = signal<AdminOverviewSnapshotItem[]>([]);
  readonly recentActivity = signal<AdminOverviewActivityRow[]>([]);
  readonly totalSiteCount = signal(0);

  fetchOverview(done?: () => void): void {
    if (!this.session.useApi()) {
      done?.();
      return;
    }

    this.session.beginLoad();
    this.dashboardApi.getAdminOverview().subscribe({
      next: (res) => {
        this.applyOverview(res.data);
        this.session.endLoad();
        done?.();
      },
      error: () => {
        this.session.endLoad();
        this.toast.error('Failed to load dashboard overview');
        done?.();
      },
    });
  }

  private applyOverview(data: AdminDashboardOverviewData | undefined): void {
    if (!data) {
      this.clearOverview();
      return;
    }

    const avgHealth = Number(data.avgHealthScore?.value ?? 0);
    const openTickets = Number(data.openTickets?.value ?? 0);
    const criticalTickets = Number(data.openTickets?.critical ?? 0);

    this.statCards.set([
      {
        label: 'Total Customers',
        value: Number(data.totalCustomers?.value ?? 0),
        sub: `${Number(data.totalCustomers?.active ?? 0)} active`,
        color: 'var(--acc)',
        icon: 'users',
      },
      {
        label: 'Monitored Sites',
        value: Number(data.monitoredSites?.value ?? 0),
        sub: data.monitoredSites?.detail ?? 'Across all customers',
        color: 'var(--t1)',
        icon: 'globe',
      },
      {
        label: 'Open Tickets',
        value: openTickets,
        sub: `${criticalTickets} critical`,
        color: openTickets > 3 || criticalTickets > 0 ? 'var(--er)' : 'var(--wn)',
        icon: 'clip',
      },
      {
        label: 'Avg Health Score',
        value: avgHealth,
        sub: data.avgHealthScore?.detail ?? 'All sites combined',
        color: this.scoreColor(avgHealth),
        icon: 'activity',
      },
    ]);

    const dist = data.healthDistribution;
    const buckets: AdminOverviewHealthBucket[] = [
      {
        label: dist?.healthy?.label ?? 'Healthy (80–100)',
        count: Number(dist?.healthy?.count ?? 0),
        color: 'var(--ok)',
      },
      {
        label: dist?.warning?.label ?? 'Warning (60–79)',
        count: Number(dist?.warning?.count ?? 0),
        color: 'var(--wn)',
      },
      {
        label: dist?.critical?.label ?? 'Critical (< 60)',
        count: Number(dist?.critical?.count ?? 0),
        color: 'var(--er)',
      },
    ];
    this.healthDistribution.set(buckets);
    this.totalSiteCount.set(buckets.reduce((sum, b) => sum + b.count, 0));

    this.platformSnapshot.set([
      {
        label: 'Active Clients',
        value: Number(data.totalActiveClients?.value ?? 0),
        detail: data.totalActiveClients?.change ?? 'Registered clients',
        color: 'var(--acc)',
        icon: 'users',
        iconBg: 'rgba(29,111,224,0.12)',
        tone: 'default',
      },
      {
        label: 'Active Websites',
        value: Number(data.totalActiveWebsites?.value ?? 0),
        detail: data.totalActiveWebsites?.change ?? 'Across all customers',
        color: 'var(--t1)',
        icon: 'globe',
        iconBg: 'rgba(13,30,61,0.08)',
        tone: 'default',
      },
      {
        label: 'Sites Needing Updates',
        value: Number(data.websitesNeedingUpdates?.value ?? 0),
        detail: 'WordPress / plugin updates pending',
        color: 'var(--wn)',
        icon: 'refresh',
        iconBg: 'rgba(217,119,6,0.12)',
        tone: Number(data.websitesNeedingUpdates?.value ?? 0) > 0 ? 'warn' : 'default',
      },
      {
        label: 'Security Alerts Today',
        value: Number(data.securityAlertsToday?.value ?? 0),
        detail: data.securityAlertsToday?.detail ?? 'No alerts today',
        color:
          Number(data.securityAlertsToday?.value ?? 0) > 0 ? 'var(--er)' : 'var(--ok)',
        icon: 'shield',
        iconBg:
          Number(data.securityAlertsToday?.value ?? 0) > 0
            ? 'rgba(220,38,38,0.12)'
            : 'rgba(5,150,105,0.12)',
        tone: Number(data.securityAlertsToday?.value ?? 0) > 0 ? 'alert' : 'ok',
      },
      {
        label: 'Backups (24h)',
        value: Number(data.backupsCompletedLast24h?.value ?? 0),
        detail: 'Completed in the last 24 hours',
        color: 'var(--t1)',
        icon: 'clock',
        iconBg: 'rgba(13,30,61,0.08)',
        tone: 'default',
      },
    ]);

    this.recentActivity.set(
      (data.recentActivity ?? []).map((item) => ({
        id: item.id,
        ticket: item.ticket,
        title: item.title,
        site: item.site?.trim() || '—',
        customer: item.customer?.trim() || '—',
        priority: this.mapPriority(item.priority),
        status: this.mapStatus(item.status),
        age: item.age ?? '—',
      }))
    );

    this.session.bump();
  }

  private clearOverview(): void {
    this.statCards.set(EMPTY_STATS);
    this.healthDistribution.set([]);
    this.platformSnapshot.set([]);
    this.recentActivity.set([]);
    this.totalSiteCount.set(0);
  }

  private scoreColor(score: number): string {
    return score >= 80 ? 'var(--ok)' : score >= 60 ? 'var(--wn)' : 'var(--er)';
  }

  private mapPriority(value?: string): TicketPriority {
    const p = (value ?? 'medium').toLowerCase();
    if (p === 'critical' || p === 'high' || p === 'medium' || p === 'low') return p;
    return 'medium';
  }

  private mapStatus(value?: string): TicketStatus {
    const s = (value ?? 'open').toLowerCase().replace(/[\s_-]+/g, '');
    if (s === 'inprogress') return 'inprogress';
    if (s === 'testing') return 'testing';
    if (s === 'resolved') return 'resolved';
    if (s === 'closed') return 'closed';
    return 'open';
  }
}
