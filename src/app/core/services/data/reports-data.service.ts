import { Injectable, Injector, inject } from '@angular/core';
import {
  AddRecommendationPayload,
  AdminSiteAction,
  MonthlyReport,
  Site,
  SiteRecommendation,
} from '../../models/fixify.models';
import { NotificationService } from '../notification.service';
import { AppContextService } from '../app-context.service';
import { DashboardApiService } from '../api/dashboard-api.service';
import { DataSessionService } from './data-session.service';
import { SitesDataService } from './sites-data.service';
import { formatNow, monthLabelFromKey } from './data.utils';

@Injectable({ providedIn: 'root' })
export class ReportsDataService {
  private readonly toast = inject(NotificationService);
  private readonly ctx = inject(AppContextService);
  private readonly session = inject(DataSessionService);
  private readonly dashboardApi = inject(DashboardApiService);
  private readonly injector = inject(Injector);

  readonly adminActions: AdminSiteAction[] = [];
  readonly monthlyReports: MonthlyReport[] = [];
  readonly recommendations: SiteRecommendation[] = [];

  private nextActionId = 100;
  private nextReportId = 100;
  private nextRecommendationId = 100;

  logAdminAction(
    site: Site,
    action: string,
    actionType: AdminSiteAction['actionType'],
    details: string
  ): AdminSiteAction {
    const entry: AdminSiteAction = {
      id: this.nextActionId++,
      siteId: site.id,
      custId: site.custId,
      siteName: site.name,
      action,
      actionType,
      performedBy: 'Fixify Admin',
      performedAt: formatNow(),
      details,
      visibleToCustomer: true,
    };
    this.adminActions.unshift(entry);
    return entry;
  }

  adminActionsForCustomer(custId: number, customerVisibleOnly = false): AdminSiteAction[] {
    return this.adminActions.filter(
      (a) => a.custId === custId && (!customerVisibleOnly || a.visibleToCustomer)
    );
  }

  adminActionsForSite(siteId: number): AdminSiteAction[] {
    return this.adminActions.filter((a) => a.siteId === siteId);
  }

  reportsForCustomer(custId: number): MonthlyReport[] {
    return [...this.monthlyReports]
      .filter((r) => r.custId === custId)
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }

  reportsForSite(siteId: number): MonthlyReport[] {
    return [...this.monthlyReports]
      .filter((r) => r.siteId === siteId)
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }

  createMonthlyReport(siteId: number, monthKey: string): MonthlyReport | null {
    const site = this.sites().sites.find((s) => s.id === siteId);
    if (!site) return null;
    if (this.monthlyReports.some((r) => r.siteId === siteId && r.monthKey === monthKey)) {
      this.toast.show('Report already exists for this month', 'warning');
      return null;
    }
    const report: MonthlyReport = {
      id: this.nextReportId++,
      siteId: site.id,
      custId: site.custId,
      siteName: site.name,
      month: monthLabelFromKey(monthKey),
      monthKey,
      health: site.health,
      perf: site.perf,
      sec: site.sec,
      seo: site.seo,
      uptime: site.up,
      issuesFound: site.issues,
      issuesResolved: Math.max(0, site.issues - 1),
      summary: `${site.name} health report for ${monthLabelFromKey(monthKey)}. Overall score ${site.health}/100 with focus areas in performance and security.`,
      highlights: [
        `Health score: ${site.health}/100`,
        `${site.issues} open issues tracked`,
        `Uptime: ${site.up}%`,
      ],
      generatedAt: formatNow(),
      generatedBy: 'Fixify Admin',
    };
    this.monthlyReports.unshift(report);
    this.logAdminAction(
      site,
      `Generated ${report.month} report`,
      'generate_report',
      `Monthly health report for ${site.name}`
    );
    this.toast.success(`${report.month} report created`);
    return report;
  }

  recommendationsForCustomer(custId: number): SiteRecommendation[] {
    return this.recommendations.filter((r) => r.custId === custId);
  }

  recommendationsForSite(siteId: number): SiteRecommendation[] {
    return this.recommendations.filter((r) => r.siteId === siteId);
  }

  addRecommendation(data: AddRecommendationPayload): void {
    const site = this.sites().sites.find((s) => s.id === data.siteId);
    if (!site) return;
    const rec: SiteRecommendation = {
      id: this.nextRecommendationId++,
      siteId: site.id,
      custId: site.custId,
      siteName: site.name,
      title: data.title,
      body: data.body,
      category: data.category,
      priority: data.priority,
      status: 'open',
      createdAt: formatNow(),
      createdBy: 'Fixify Admin',
    };
    this.recommendations.unshift(rec);
    this.toast.success('Recommendation added');
  }

  applyRecommendation(id: number): void {
    const idx = this.recommendations.findIndex((r) => r.id === id);
    if (idx < 0) return;
    const rec = this.recommendations[idx];
    this.recommendations[idx] = { ...rec, status: 'applied' };
    const site = this.sites().sites.find((s) => s.id === rec.siteId);
    if (site) {
      this.logAdminAction(
        site,
        `Applied recommendation: ${rec.title}`,
        'apply_recommendation',
        rec.body
      );
      this.sites().bumpSiteHealth(site.id, 2);
    }
    this.toast.success('Recommendation marked as applied');
  }

  dismissRecommendation(id: number): void {
    const idx = this.recommendations.findIndex((r) => r.id === id);
    if (idx >= 0) {
      this.recommendations[idx] = { ...this.recommendations[idx], status: 'dismissed' };
      this.toast.info('Recommendation dismissed');
    }
  }

  loadWebsiteReports(siteId: number, year?: number): void {
    if (!this.session.useApi()) return;
    const site = this.sites().sites.find((s) => s.id === siteId);
    const apiId = this.sites().websiteApiId(siteId) ?? site?.apiId;
    if (!apiId || !site) return;
    this.dashboardApi.getAdminWebsiteReports(apiId, { year, limit: 24 }).subscribe({
      next: (res) => {
        const reports = res.data?.reports ?? [];
        for (const item of reports) {
          const monthKey = `${item.year}-${String(item.month).padStart(2, '0')}`;
          if (this.monthlyReports.some((r) => r.siteId === siteId && r.monthKey === monthKey)) {
            continue;
          }
          this.monthlyReports.unshift({
            id: this.nextReportId++,
            siteId: site.id,
            custId: site.custId,
            siteName: site.name,
            month: monthLabelFromKey(monthKey),
            monthKey,
            health: site.health,
            perf: site.perf,
            sec: site.sec,
            seo: site.seo,
            uptime: site.up,
            issuesFound: site.issues,
            issuesResolved: 0,
            summary: item.remarks || `${site.name} report — ${item.fileName}`,
            highlights: [item.fileName, item.status],
            generatedAt: item.createdAt,
            generatedBy: 'API',
          });
        }
      },
    });
  }

  private sites(): SitesDataService {
    return this.injector.get(SitesDataService);
  }
}
