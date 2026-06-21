import { Injectable, Injector, inject, signal } from '@angular/core';
import {
  AddRecommendationPayload,
  AdminSiteAction,
  MonthlyReport,
  Site,
  SiteRecommendation,
} from '../../models/fixify.models';
import { NotificationService } from '../notification.service';
import { EntityIdRegistry } from '../entity-id-registry.service';
import { SiteScreensApiService } from '../api/site-screens-api.service';
import {
  ApiReportRecord,
  MonthlyReportListItem,
} from '../../models/site-screens.models';
import { apiEnvelopeMessage } from '../../utils/api-response.util';
import { DataSessionService } from './data-session.service';
import { SitesDataService } from './sites-data.service';
import { formatNow, monthLabelFromKey } from './data.utils';

export interface FetchReportsParams {
  custId?: string;
  siteId?: string;
  year?: number;
}

export interface GenerateReportOptions {
  remarks?: string;
  autoSendToClient?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ReportsDataService {
  private readonly toast = inject(NotificationService);
  private readonly session = inject(DataSessionService);
  private readonly siteScreensApi = inject(SiteScreensApiService);
  private readonly ids = inject(EntityIdRegistry);
  private readonly injector = inject(Injector);

  readonly adminActions: AdminSiteAction[] = [];
  readonly monthlyReports: MonthlyReport[] = [];
  readonly recommendations: SiteRecommendation[] = [];
  readonly reportsTotal = signal(0);

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

  fetchReports(params: FetchReportsParams = {}, done?: () => void): void {
    if (!this.session.useApi()) {
      done?.();
      return;
    }
    this.session.beginLoad();
    this.siteScreensApi.getReports(params).subscribe({
      next: (res) => {
        const items = res.data?.items ?? [];
        this.reportsTotal.set(res.data?.total ?? items.length);
        const mapped = items.map((item) => this.mapListReportItem(item));
        this.monthlyReports.splice(0, this.monthlyReports.length, ...mapped);
        this.syncNextReportId();
        this.session.endLoad();
        done?.();
      },
      error: () => {
        this.session.endLoad();
        this.toast.error('Failed to load reports');
        done?.();
      },
    });
  }

  createMonthlyReport(
    siteId: number,
    monthKey: string,
    options?: GenerateReportOptions,
    done?: () => void
  ): MonthlyReport | null {
    const site = this.sites().sites.find((s) => s.id === siteId);
    if (!site) {
      this.toast.error('Site not found');
      done?.();
      return null;
    }

    if (!this.session.useApi()) {
      if (this.monthlyReports.some((r) => r.siteId === siteId && r.monthKey === monthKey)) {
        this.toast.show('Report already exists for this month', 'warning');
        done?.();
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
        summary: `${site.name} health report for ${monthLabelFromKey(monthKey)}. Overall score ${site.health}/100.`,
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
      this.session.bump();
      done?.();
      return report;
    }

    const apiId = this.sites().websiteApiId(siteId) ?? site.apiId;
    if (!apiId) {
      this.toast.error('Site is missing an API id');
      done?.();
      return null;
    }

    const [year, month] = monthKey.split('-').map(Number);
    this.siteScreensApi
      .generateReport({
        websiteId: apiId,
        year,
        month,
        remarks: options?.remarks,
        autoSendToClient: options?.autoSendToClient ?? false,
      })
      .subscribe({
        next: (res) => {
          const record = res.data;
          if (!record?._id) {
            this.toast.error(apiEnvelopeMessage(res, 'Failed to generate report'));
            done?.();
            return;
          }
          const report = this.mapApiReport(record, site);
          this.upsertReport(report);
          this.logAdminAction(
            site,
            `Generated ${report.month} report`,
            'generate_report',
            options?.remarks || `Monthly health report for ${site.name}`
          );
          if (res.status === 409) {
            this.toast.show(
              res.message || 'Report for this website and month already exists.',
              'warning'
            );
          } else {
            this.toast.success(`${report.month} report generated`);
          }
          this.session.bump();
          done?.();
        },
        error: (err: Error) => {
          this.toast.error(err.message || 'Failed to generate report');
          done?.();
        },
      });

    return null;
  }

  openReportDownload(report: MonthlyReport): void {
    const directUrl = report.fileUrl ? this.resolveFileUrl(report.fileUrl) : undefined;
    if (directUrl?.startsWith('http')) {
      window.open(directUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    if (!report.apiId) {
      this.toast.info('Download link not available for this report');
      return;
    }

    if (!this.session.useApi()) {
      this.toast.info('Download link not available for this report');
      return;
    }

    this.siteScreensApi.getReportDownload(report.apiId).subscribe({
      next: (res) => {
        const url = this.resolveFileUrl(
          res.data?.fileUrl ?? res.data?.url ?? report.fileUrl ?? ''
        );
        if (url.startsWith('http')) {
          window.open(url, '_blank', 'noopener,noreferrer');
          return;
        }
        this.toast.info('Download link not available for this report');
      },
      error: () => this.toast.error('Failed to get download link'),
    });
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

  loadWebsiteReports(siteId: number, year?: number, done?: () => void): void {
    if (!this.session.useApi()) {
      done?.();
      return;
    }
    const site = this.sites().sites.find((s) => s.id === siteId);
    const apiId = this.sites().websiteApiId(siteId) ?? site?.apiId;
    if (!apiId || !site) {
      done?.();
      return;
    }
    this.session.beginLoad();
    this.siteScreensApi.getReports({ siteId: apiId, year }).subscribe({
      next: (res) => {
        const items = res.data?.items ?? [];
        const kept = this.monthlyReports.filter((r) => r.siteId !== siteId);
        const mapped = items.map((item) => this.mapListReportItem(item, site));
        this.monthlyReports.splice(0, this.monthlyReports.length, ...kept, ...mapped);
        this.syncNextReportId();
        this.session.endLoad();
        done?.();
      },
      error: () => {
        this.session.endLoad();
        this.toast.error('Failed to load reports');
        done?.();
      },
    });
  }

  private upsertReport(report: MonthlyReport): void {
    const idx = this.monthlyReports.findIndex(
      (r) =>
        (report.apiId && r.apiId === report.apiId) ||
        (r.siteId === report.siteId && r.monthKey === report.monthKey)
    );
    if (idx >= 0) this.monthlyReports[idx] = report;
    else this.monthlyReports.unshift(report);
  }

  private mapListReportItem(item: MonthlyReportListItem, fallbackSite?: Site): MonthlyReport {
    const site = this.resolveSite(item.siteId, fallbackSite);
    const monthKey = this.inferMonthKey(item);
    const month = item.month || (monthKey ? monthLabelFromKey(monthKey) : 'Report');
    const siteName =
      item.siteName ||
      site?.name ||
      this.inferSiteNameFromPath(item.fileUrl ?? item.fileName) ||
      'Unknown site';
    const custId = item.custId
      ? this.ids.clientLocalId(item.custId)
      : (site?.custId ?? 0);

    return {
      id: this.nextReportId++,
      apiId: item.id,
      siteId: site?.id ?? this.ids.websiteLocalId(item.siteId),
      custId,
      siteName,
      month,
      monthKey: monthKey || '0000-00',
      health: item.health ?? site?.health ?? 0,
      perf: item.perf ?? site?.perf ?? 0,
      sec: item.sec ?? site?.sec ?? 0,
      seo: item.seo ?? site?.seo ?? 0,
      uptime: item.uptime ?? site?.up ?? 0,
      issuesFound: item.issuesFound ?? site?.issues ?? 0,
      issuesResolved: item.issuesResolved ?? 0,
      summary:
        item.summary ||
        (item.fileName ? `${siteName} report — ${item.fileName}` : `${siteName} monthly report`),
      highlights: item.highlights?.length
        ? item.highlights
        : item.fileName
          ? [item.fileName]
          : [],
      generatedAt: item.generatedAt ?? formatNow(),
      generatedBy: item.generatedBy || 'Fixify',
      fileUrl: item.fileUrl ?? undefined,
      fileName: item.fileName,
      status: item.status,
    };
  }

  private mapApiReport(item: ApiReportRecord, site: Site): MonthlyReport {
    const monthKey = `${item.year}-${String(item.month).padStart(2, '0')}`;
    return {
      id: this.nextReportId++,
      apiId: item._id,
      siteId: site.id,
      custId: site.custId,
      siteName: site.name,
      month: item.monthName ?? monthLabelFromKey(monthKey),
      monthKey,
      health: item.health ?? site.health,
      perf: item.perf ?? site.perf,
      sec: item.sec ?? site.sec,
      seo: item.seo ?? site.seo,
      uptime: item.uptime ?? site.up,
      issuesFound: item.issuesFound ?? site.issues,
      issuesResolved: item.issuesResolved ?? 0,
      summary: item.remarks || `${site.name} report — ${item.fileName}`,
      highlights: item.highlights?.length
        ? item.highlights
        : [item.fileName, item.status],
      generatedAt: item.createdAt ?? formatNow(),
      generatedBy: 'Fixify',
      fileUrl: item.fileUrl,
      fileName: item.fileName,
      status: item.status,
    };
  }

  private resolveSite(websiteApiId: string, fallbackSite?: Site): Site | undefined {
    if (fallbackSite?.apiId === websiteApiId) return fallbackSite;
    return this.sites().sites.find((s) => s.apiId === websiteApiId);
  }

  private inferMonthKey(item: MonthlyReportListItem): string {
    if (item.monthKey) return item.monthKey;
    const fromPath =
      item.fileUrl?.match(/(\d{4})\/(\d{2})\//) ?? item.fileName?.match(/(\d{4})-(\d{2})/);
    if (fromPath) return `${fromPath[1]}-${fromPath[2]}`;
    return '';
  }

  private inferSiteNameFromPath(path?: string | null): string | undefined {
    if (!path) return undefined;
    const match = path.match(/reports\/([^/]+)\//);
    return match?.[1];
  }

  private resolveFileUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return url;
  }

  private syncNextReportId(): void {
    const maxId = this.monthlyReports.reduce((max, r) => Math.max(max, r.id), 0);
    if (maxId >= this.nextReportId) this.nextReportId = maxId + 1;
  }

  private sites(): SitesDataService {
    return this.injector.get(SitesDataService);
  }
}
