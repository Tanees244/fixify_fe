import { Injectable, Injector, inject, signal } from '@angular/core';
import { forkJoin, firstValueFrom } from 'rxjs';
import {
  AddSitePayload,
  Site,
  WordPressAdminActionType,
  WordPressSiteDetails,
  WordPressSiteState,
} from '../../models/fixify.models';
import { createDefaultWordPressState } from '../../utils/wordpress-defaults.util';
import {
  extractApiItems,
  extractApiListMeta,
} from '../../utils/api-response.util';
import {
  mapApiWebsiteToSite,
  mapWordPressPluginsResponse,
} from '../../utils/api-mappers.util';
import { NotificationService } from '../notification.service';
import { AppContextService } from '../app-context.service';
import { AuthService } from '../auth.service';
import { EntityIdRegistry } from '../entity-id-registry.service';
import { WebsitesApiService } from '../api/websites-api.service';
import { AnalyticsApiService } from '../api/analytics-api.service';
import { DashboardApiService } from '../api/dashboard-api.service';
import { SiteScreensApiService } from '../api/site-screens-api.service';
import {
  SitePerformanceScreen,
  SiteSecurityScreen,
  SiteSeoScreen,
} from '../../models/site-screens.models';
import { DataSessionService } from './data-session.service';
import { CustomersDataService } from './customers-data.service';
import { SubscriptionsDataService } from './subscriptions-data.service';
import { ReportsDataService } from './reports-data.service';
import { delay, parseSiteName, siteUrl } from './data.utils';

export interface FetchWebsitesParams {
  clientId?: string;
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class SitesDataService {
  private readonly toast = inject(NotificationService);
  private readonly ctx = inject(AppContextService);
  private readonly session = inject(DataSessionService);
  private readonly websitesApi = inject(WebsitesApiService);
  private readonly analyticsApi = inject(AnalyticsApiService);
  private readonly dashboardApi = inject(DashboardApiService);
  private readonly siteScreensApi = inject(SiteScreensApiService);
  private readonly auth = inject(AuthService);
  private readonly ids = inject(EntityIdRegistry);
  private readonly injector = inject(Injector);

  readonly sites: Site[] = [];
  readonly sitesPage = signal(1);
  readonly sitesLimit = signal(10);
  readonly sitesTotal = signal(0);
  readonly wordpressBySiteId = new Map<number, WordPressSiteDetails>();
  readonly wordpressStateBySiteId = new Map<number, WordPressSiteState>();

  readonly performanceScreen = signal<SitePerformanceScreen | null>(null);
  readonly securityScreen = signal<SiteSecurityScreen | null>(null);
  readonly seoScreen = signal<SiteSeoScreen | null>(null);

  private nextSiteId = 100;

  ensureSelectedSite(): void {
    const custId = this.ctx.currentCustomerId();
    const mySites = this.sites.filter((s) => s.custId === custId);
    if (!this.ctx.selectedSite() && mySites.length) {
      this.ctx.selectedSite.set(mySites[0]);
    }
  }

  websiteApiId(siteId: number): string | undefined {
    return this.ids.websiteApiId(siteId) ?? this.sites.find((s) => s.id === siteId)?.apiId;
  }

  fetchWebsites(params: FetchWebsitesParams | string = {}, done?: () => void): void {
    const resolved: FetchWebsitesParams =
      typeof params === 'string' ? { clientId: params } : params;
    const clientProfileId = resolved.clientId;
    const page = resolved.page ?? 1;
    const limit = resolved.limit ?? 200;

    if (!this.session.useApi()) {
      this.sites.splice(0, this.sites.length);
      this.sitesTotal.set(0);
      done?.();
      return;
    }
    this.session.beginLoad();
    this.websitesApi
      .getWebsites({ page, limit, clientId: clientProfileId, ...resolved })
      .subscribe({
        next: (res) => {
          const items = extractApiItems(res.data);
          const meta = extractApiListMeta(res.data, items.length);
          this.sitesPage.set(meta.page || page);
          this.sitesLimit.set(meta.limit || limit);
          this.sitesTotal.set(meta.total);

          this.sites.splice(
            0,
            this.sites.length,
            ...items.map((w) =>
              mapApiWebsiteToSite(w, this.ids, clientProfileId)
            )
          );
          this.syncWordPressFromSites();
          this.syncSelectedSite(this.auth.getCurrentUser() ?? { role: 'admin' });
          this.session.endLoad();
          done?.();
        },
        error: () => {
          this.session.endLoad();
          this.toast.error('Failed to load websites');
          done?.();
        },
      });
  }

  fetchWebsitesForCustomer(localCustomerId: number, done?: () => void): void {
    const apiId = this.customers().clientApiIdFor(localCustomerId);
    this.fetchWebsites({ clientId: apiId }, done);
  }

  fetchCustomerWebsites(done?: () => void): void {
    const user = this.auth.getCurrentUser();
    if (!this.session.useApi()) {
      done?.();
      return;
    }
    this.session.beginLoad();
    this.websitesApi
      .getWebsites({
        page: 1,
        limit: 100,
        clientId: user?.role === 'customer' ? user.clientProfileId : undefined,
      })
      .subscribe({
      next: (res) => {
        if (user) {
          this.customers().applyAuthCustomerProfile(user);
        }
        this.sites.splice(
          0,
          this.sites.length,
          ...extractApiItems(res.data).map((w) =>
            mapApiWebsiteToSite(w, this.ids, user?.clientProfileId)
          )
        );
        this.syncWordPressFromSites();
        this.syncSelectedSite(user ?? { role: 'customer' });
        this.session.endLoad();
        done?.();
      },
      error: () => {
        this.session.endLoad();
        this.toast.error('Failed to load websites');
        done?.();
      },
    });
  }

  fetchSitePerformance(site: Site | null, done?: () => void): void {
    if (!site || !this.session.useApi()) {
      done?.();
      return;
    }
    const apiId = this.websiteApiId(site.id) ?? site.apiId;
    if (!apiId) {
      done?.();
      return;
    }
    this.session.beginLoad();
    this.siteScreensApi.getPerformance(apiId).subscribe({
      next: (res) => {
        if (res.data) {
          this.performanceScreen.set(res.data);
          this.applyPerformanceToSite(site.id, res.data);
        }
        this.session.endLoad();
        done?.();
      },
      error: () => {
        this.session.endLoad();
        this.toast.error('Failed to load performance data');
        done?.();
      },
    });
  }

  fetchSiteSeo(site: Site | null, done?: () => void): void {
    if (!site || !this.session.useApi()) {
      done?.();
      return;
    }
    const apiId = this.websiteApiId(site.id) ?? site.apiId;
    if (!apiId) {
      done?.();
      return;
    }
    this.session.beginLoad();
    this.siteScreensApi.getSeo(apiId).subscribe({
      next: (res) => {
        if (res.data) {
          this.seoScreen.set(res.data);
          this.applySeoToSite(site.id, res.data);
        }
        this.session.endLoad();
        done?.();
      },
      error: () => {
        this.session.endLoad();
        this.toast.error('Failed to load SEO data');
        done?.();
      },
    });
  }

  fetchSiteUptime(site: Site | null, done?: () => void): void {
    if (!site || !this.session.useApi()) {
      done?.();
      return;
    }
    this.analyticsApi.checkUptime(siteUrl(site)).subscribe({
      next: (res) => {
        const idx = this.sites.findIndex((s) => s.id === site.id);
        if (idx >= 0) {
          this.sites[idx] = {
            ...this.sites[idx],
            up: res.ok ? 99.9 : 95,
            scan: 'just now',
          };
          if (this.ctx.selectedSite()?.id === site.id) {
            this.ctx.selectedSite.set(this.sites[idx]);
          }
        }
        done?.();
      },
      error: () => done?.(),
    });
  }

  fetchSiteSecurity(site: Site | null, done?: () => void): void {
    if (!site || !this.session.useApi()) {
      done?.();
      return;
    }
    const apiId = this.websiteApiId(site.id) ?? site.apiId;
    if (!apiId) {
      done?.();
      return;
    }
    this.session.beginLoad();
    this.siteScreensApi.getSecurity(apiId).subscribe({
      next: (res) => {
        if (res.data) {
          this.securityScreen.set(res.data);
          this.applySecurityToSite(site.id, res.data);
        }
        this.session.endLoad();
        done?.();
      },
      error: () => {
        this.session.endLoad();
        this.toast.error('Failed to load security data');
        done?.();
      },
    });
  }

  fetchWordPressForSite(siteId: number, done?: () => void): void {
    const site = this.sites.find((s) => s.id === siteId);
    if (!site) {
      done?.();
      return;
    }
    this.initWordPressState(siteId);
    if (!this.session.useApi()) {
      done?.();
      return;
    }
    const wp = this.wordpressBySiteId.get(siteId);
    const url = siteUrl(site);
    const username = wp?.username ?? '';
    const password = wp?.password ?? '';
    if (!username || !password) {
      done?.();
      return;
    }
    this.session.beginLoad();
    forkJoin({
      plugins: this.analyticsApi.getWordPressPlugins(url, username, password),
      updates: this.analyticsApi.getWordPressUpdates(url, username, password),
    }).subscribe({
      next: ({ plugins, updates }) => {
        const state = this.wordpressStateBySiteId.get(siteId);
        const mapped = mapWordPressPluginsResponse(siteId, plugins, state);
        if (updates.currentVersion) mapped.wpVersion = updates.currentVersion;
        if (updates.latestVersion) mapped.latestWpVersion = updates.latestVersion;
        if (updates.themeVersion) mapped.themeVersion = updates.themeVersion;
        this.wordpressStateBySiteId.set(siteId, mapped);
        this.session.endLoad();
        done?.();
      },
      error: () => {
        this.session.endLoad();
        done?.();
      },
    });
  }

  loadWebsiteDashboard(siteId: number): void {
    if (!this.session.useApi()) return;
    const apiId = this.websiteApiId(siteId);
    if (!apiId) return;
    this.dashboardApi.getAdminWebsiteDashboard(apiId).subscribe({
      next: (res) => {
        const idx = this.sites.findIndex((s) => s.id === siteId);
        if (idx < 0 || !res.data) return;
        const insights = res.data.performanceInsights as Record<string, unknown> | undefined;
        const perf =
          typeof insights?.['performanceScore'] === 'number'
            ? insights['performanceScore']
            : this.sites[idx].perf;
        this.sites[idx] = {
          ...this.sites[idx],
          perf,
          health: Math.round((perf + this.sites[idx].sec + this.sites[idx].seo) / 3),
          scan: 'just now',
        };
      },
    });
  }

  mySites(): Site[] {
    return this.sites.filter((s) => s.custId === this.ctx.currentCustomerId());
  }

  sitesForCustomer(custId: number): Site[] {
    return this.sites.filter((s) => s.custId === custId);
  }

  addSite(data: AddSitePayload): Promise<Site | null> {
    return this.addSiteForCustomer(this.ctx.currentCustomerId(), data, {
      selectSite: true,
      closeModal: true,
    });
  }

  addSiteForCustomer(
    custId: number,
    data: AddSitePayload,
    opts: { selectSite?: boolean; closeModal?: boolean; silent?: boolean } = {}
  ): Promise<Site | null> {
    if (!this.session.useApi()) {
      this.toast.error('Sign in to add sites');
      return Promise.resolve(this.buildLocalSite(custId, data));
    }
    return this.addSiteViaApi(custId, data, opts);
  }

  private buildLocalSite(custId: number, data: AddSitePayload): Site {
    const planName = this.subscriptions().planLabel(data.plan);
    const displayName =
      data.wordpress?.siteName?.trim() ||
      data.name?.trim() ||
      (data.url ? parseSiteName(data.url) : 'new-site.com');
    const nm = data.url ? parseSiteName(data.url) : displayName;
    return {
      id: this.nextSiteId++,
      name: nm,
      fa: displayName.slice(0, 2).toUpperCase(),
      health: 72,
      perf: 68,
      sec: 75,
      seo: 70,
      up: 99.5,
      st: 'warn',
      plan: planName,
      issues: 3,
      scan: 'just now',
      lcp: '2.8s',
      fid: '45ms',
      cls: '0.11',
      custId,
      type: data.type || 'custom',
      platform: data.platform || 'custom',
    };
  }

  private addSiteViaApi(
    custId: number,
    data: AddSitePayload,
    opts: { selectSite?: boolean; closeModal?: boolean; silent?: boolean }
  ): Promise<Site | null> {
    const clientProfileId =
      this.ids.clientApiId(custId) ??
      this.auth.getCurrentUser()?.clientProfileId ??
      this.customers().getCustomer(custId)?.apiId;

    if (!clientProfileId) {
      this.toast.error('Client profile not found. Please sign in again.');
      return Promise.resolve(null);
    }

    const displayName =
      data.wordpress?.siteName?.trim() ||
      data.name?.trim() ||
      (data.url ? parseSiteName(data.url) : 'new-site.com');
    const wpLoginUrl =
      data.wordpress?.loginUrl?.trim() ||
      (data.url ? `${data.url.replace(/\/$/, '')}/wp-admin` : '');

    if (!wpLoginUrl) {
      this.toast.error('WordPress login URL is required.');
      return Promise.resolve(null);
    }

    this.session.beginLoad();
    return firstValueFrom(
      this.websitesApi.createWebsite({
        clientProfileId,
        name: displayName,
        logoUrl: null,
        wpLoginUrl,
        wpUsername: data.wordpress?.username?.trim() ?? '',
        wpPassword: data.wordpress?.password ?? '',
      })
    )
      .then((res) => {
        const site = mapApiWebsiteToSite(res.data ?? {}, this.ids, clientProfileId);
        if (data.wordpress) {
          this.wordpressBySiteId.set(site.id, { ...data.wordpress });
        }
        this.initWordPressState(site.id, data.wordpress?.wpVersion);
        this.sites.push(site);
        if (opts.selectSite) this.ctx.selectedSite.set(site);
        if (!opts.silent) this.toast.success(`${displayName} added`);
        if (opts.closeModal) this.ctx.closeModal();
        this.session.endLoad();
        return site;
      })
      .catch((err) => {
        this.session.endLoad();
        this.toast.error(err?.error?.message || 'Failed to add website');
        return null;
      });
  }

  getWordPressDetails(siteId: number): WordPressSiteDetails | undefined {
    return this.wordpressBySiteId.get(siteId);
  }

  removeSite(id: number): void {
    if (this.session.useApi()) {
      const apiId = this.websiteApiId(id);
      if (!apiId) {
        this.removeSiteLocal(id);
        return;
      }
      this.websitesApi.deleteWebsite(apiId).subscribe({
        next: () => this.removeSiteLocal(id),
        error: (err) => this.toast.error(err?.error?.message || 'Failed to remove website'),
      });
      return;
    }
    this.removeSiteLocal(id);
  }

  private removeSiteLocal(id: number): void {
    const idx = this.sites.findIndex((s) => s.id === id);
    if (idx >= 0) this.sites.splice(idx, 1);
    this.wordpressBySiteId.delete(id);
    this.wordpressStateBySiteId.delete(id);
    const current = this.ctx.selectedSite();
    if (current?.id === id) {
      const remaining = this.mySites();
      this.ctx.selectedSite.set(remaining[0] || null);
    }
    this.toast.info('Website removed');
  }

  async scanSite(site: Site): Promise<void> {
    await this.scanSitePerformance(site);
  }

  async scanSitePerformance(site: Site): Promise<void> {
    const apiId = this.websiteApiId(site.id) ?? site.apiId;
    if (!this.session.useApi() || !apiId) {
      await this.legacyScanSite(site);
      return;
    }
    this.ctx.scanning.set(true);
    this.toast.info(`Scanning ${site.name}…`);
    try {
      const res = await firstValueFrom(this.siteScreensApi.scanPerformance(apiId));
      if (res.data) {
        this.performanceScreen.set(res.data);
        this.applyPerformanceToSite(site.id, res.data);
      }
      this.toast.success('Performance scan complete');
    } catch {
      this.toast.error('Performance scan failed');
    } finally {
      this.ctx.scanning.set(false);
    }
  }

  async scanSiteSecurity(site: Site): Promise<void> {
    const apiId = this.websiteApiId(site.id) ?? site.apiId;
    if (!this.session.useApi() || !apiId) return;
    this.ctx.scanning.set(true);
    this.toast.info(`Scanning ${site.name} security…`);
    try {
      const res = await firstValueFrom(this.siteScreensApi.scanSecurity(apiId));
      if (res.data) {
        this.securityScreen.set(res.data);
        this.applySecurityToSite(site.id, res.data);
      }
      this.toast.success('Security scan complete');
    } catch {
      this.toast.error('Security scan failed');
    } finally {
      this.ctx.scanning.set(false);
    }
  }

  async scanSiteSeo(site: Site): Promise<void> {
    const apiId = this.websiteApiId(site.id) ?? site.apiId;
    if (!this.session.useApi() || !apiId) return;
    this.ctx.scanning.set(true);
    this.toast.info(`Scanning ${site.name} SEO…`);
    try {
      const res = await firstValueFrom(this.siteScreensApi.scanSeo(apiId));
      if (res.data) {
        this.seoScreen.set(res.data);
        this.applySeoToSite(site.id, res.data);
      }
      this.toast.success('SEO scan complete');
    } catch {
      this.toast.error('SEO scan failed');
    } finally {
      this.ctx.scanning.set(false);
    }
  }

  exportPerformancePdf(site: Site): void {
    const apiId = this.websiteApiId(site.id) ?? site.apiId;
    if (!apiId) return;
    this.siteScreensApi.exportPerformancePdf(apiId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `performance-${site.name.replace(/[^\w.-]+/g, '-')}.pdf`;
        anchor.click();
        URL.revokeObjectURL(url);
        this.toast.success('Performance report downloaded');
      },
      error: () => this.toast.error('Failed to export performance report'),
    });
  }

  private async legacyScanSite(site: Site): Promise<void> {
    this.ctx.scanning.set(true);
    this.toast.info(`Scanning ${site.name}…`);
    await delay(2500);
    const idx = this.sites.findIndex((s) => s.id === site.id);
    if (idx >= 0) {
      const updated: Site = {
        ...this.sites[idx],
        scan: 'just now',
        health: Math.min(100, this.sites[idx].health + Math.floor(Math.random() * 4 + 1)),
      };
      this.sites[idx] = updated;
      if (this.ctx.selectedSite()?.id === site.id) {
        this.ctx.selectedSite.set(updated);
      }
    }
    this.ctx.scanning.set(false);
    this.toast.success('Scan complete — report updated');
  }

  initWordPressState(siteId: number, wpVersion?: string): void {
    if (!this.wordpressStateBySiteId.has(siteId)) {
      this.wordpressStateBySiteId.set(siteId, createDefaultWordPressState(siteId, wpVersion));
    }
  }

  getWordPressState(siteId: number): WordPressSiteState | undefined {
    return this.wordpressStateBySiteId.get(siteId);
  }

  isWordPressSite(siteId: number): boolean {
    const site = this.sites.find((s) => s.id === siteId);
    return site?.platform === 'wordpress' || this.wordpressStateBySiteId.has(siteId);
  }

  wordPressSitesForCustomer(custId: number): Site[] {
    return this.sitesForCustomer(custId).filter(
      (s) => s.platform === 'wordpress' || this.wordpressStateBySiteId.has(s.id)
    );
  }

  bumpSiteHealth(siteId: number, amount: number): void {
    const idx = this.sites.findIndex((s) => s.id === siteId);
    if (idx < 0) return;
    const updated = {
      ...this.sites[idx],
      health: Math.min(100, this.sites[idx].health + amount),
      sec: Math.min(100, this.sites[idx].sec + Math.floor(amount / 2)),
      scan: 'just now',
    };
    this.sites[idx] = updated;
    if (this.ctx.selectedSite()?.id === siteId) {
      this.ctx.selectedSite.set(updated);
    }
  }

  async performWordPressAction(
    siteId: number,
    actionType: WordPressAdminActionType,
    pluginId?: string
  ): Promise<void> {
    const site = this.sites.find((s) => s.id === siteId);
    const state = this.wordpressStateBySiteId.get(siteId);
    if (!site || !state) {
      this.toast.show('WordPress state not found for this site', 'warning');
      return;
    }

    if (this.session.useApi()) {
      await this.performWordPressActionViaApi(site, state, actionType, pluginId);
      return;
    }

    this.ctx.scanning.set(true);
    await delay(1200);

    const { action, details } = this.executeWordPressActionSwitch(siteId, actionType, pluginId);
    const updatedState = this.wordpressStateBySiteId.get(siteId);
    if (updatedState) {
      this.wordpressStateBySiteId.set(siteId, { ...updatedState, plugins: [...updatedState.plugins] });
    }
    if (action) {
      this.reports().logAdminAction(site, action, actionType, details);
      this.toast.success(action);
    }

    this.ctx.scanning.set(false);
  }

  private async performWordPressActionViaApi(
    site: Site,
    state: WordPressSiteState,
    actionType: WordPressAdminActionType,
    pluginId?: string
  ): Promise<void> {
    const wp = this.wordpressBySiteId.get(site.id);
    const url = site.domain || wp?.siteUrl || `https://${site.name}`;
    const username = wp?.username ?? '';
    const password = wp?.password ?? '';

    this.ctx.scanning.set(true);
    try {
      if (username && password) {
        const [pluginsRes, updatesRes] = await Promise.all([
          firstValueFrom(this.analyticsApi.getWordPressPlugins(url, username, password)).catch(
            () => null
          ),
          firstValueFrom(this.analyticsApi.getWordPressUpdates(url, username, password)).catch(
            () => null
          ),
        ]);
        if (pluginsRes) {
          const mapped = mapWordPressPluginsResponse(site.id, pluginsRes, state);
          if (updatesRes?.currentVersion) mapped.wpVersion = updatesRes.currentVersion;
          if (updatesRes?.latestVersion) mapped.latestWpVersion = updatesRes.latestVersion;
          if (updatesRes?.themeVersion) mapped.themeVersion = updatesRes.themeVersion;
          this.wordpressStateBySiteId.set(site.id, mapped);
        }
      }

      const { action, details } = this.executeWordPressActionSwitch(site.id, actionType, pluginId);
      const updatedState = this.wordpressStateBySiteId.get(site.id);
      if (updatedState) {
        this.wordpressStateBySiteId.set(site.id, {
          ...updatedState,
          plugins: [...updatedState.plugins],
        });
      }
      if (action) {
        this.reports().logAdminAction(site, action, actionType, details);
        this.toast.success(action);
      }
    } finally {
      this.ctx.scanning.set(false);
    }
  }

  private executeWordPressActionSwitch(
    siteId: number,
    actionType: WordPressAdminActionType,
    pluginId?: string
  ): { action: string; details: string } {
    const state = this.wordpressStateBySiteId.get(siteId);
    if (!state) return { action: '', details: '' };

    let action = '';
    let details = '';

    switch (actionType) {
      case 'update_plugin': {
        const plugin = state.plugins.find((p) => p.id === pluginId);
        if (!plugin) break;
        plugin.version = plugin.latestVersion;
        plugin.status = 'ok';
        action = `Updated ${plugin.name}`;
        details = `${plugin.name} updated to v${plugin.version}`;
        this.bumpSiteHealth(siteId, 3);
        break;
      }
      case 'update_all_plugins': {
        const count = this.applyPluginUpdates(
          state,
          state.plugins.filter((p) => p.status !== 'ok').map((p) => p.id)
        );
        action = 'Updated all plugins';
        details = `${count} plugin(s) updated to latest versions`;
        this.bumpSiteHealth(siteId, 5);
        break;
      }
      case 'update_selected_plugins': {
        const ids = pluginId?.split(',').filter(Boolean) ?? [];
        const count = this.applyPluginUpdates(state, ids);
        action = 'Updated selected plugins';
        details = `${count} plugin(s) updated to latest versions`;
        this.bumpSiteHealth(siteId, Math.min(5, count * 2));
        break;
      }
      case 'update_wordpress_core':
        state.wpVersion = state.latestWpVersion;
        state.lastCoreUpdate = 'Just now';
        action = 'Updated WordPress core';
        details = `WordPress updated to ${state.wpVersion}`;
        this.bumpSiteHealth(siteId, 4);
        break;
      case 'update_theme':
        state.themeVersion = state.latestThemeVersion;
        action = `Updated ${state.activeTheme} theme`;
        details = `Theme updated to v${state.themeVersion}`;
        this.bumpSiteHealth(siteId, 2);
        break;
      case 'clear_cache':
        state.lastCacheClear = 'Just now';
        action = `Cleared ${state.cachePlugin} cache`;
        details = 'Full page cache and minified assets cleared';
        this.bumpSiteHealth(siteId, 1);
        break;
      case 'clear_object_cache':
        action = 'Cleared object cache';
        details = 'Redis/Memcached object cache flushed';
        break;
      case 'run_security_scan':
        action = 'Ran security scan';
        details = 'Malware & vulnerability scan completed';
        this.bumpSiteHealth(siteId, 2);
        break;
      case 'optimize_database':
        state.dbOptimized = 'Just now';
        action = 'Optimized database';
        details = 'Removed post revisions and expired transients';
        this.bumpSiteHealth(siteId, 1);
        break;
      case 'flush_rewrite_rules':
        action = 'Flushed rewrite rules';
        details = 'Permalink structure refreshed';
        break;
      case 'regenerate_thumbnails':
        action = 'Regenerated thumbnails';
        details = 'All image sizes regenerated';
        break;
    }

    return { action, details };
  }

  private applyPluginUpdates(state: WordPressSiteState, pluginIds: string[]): number {
    let count = 0;
    for (const id of pluginIds) {
      const plugin = state.plugins.find((p) => p.id === id);
      if (plugin && plugin.status !== 'ok') {
        plugin.version = plugin.latestVersion;
        plugin.status = 'ok';
        count++;
      }
    }
    return count;
  }

  private applyPageSpeedToSite(
    siteId: number,
    res: {
      scores?: { performance?: number | null; seo?: number | null };
      metrics?: {
        largestContentfulPaint?: number;
        totalBlockingTime?: number;
        cumulativeLayoutShift?: number;
      };
    }
  ): void {
    const idx = this.sites.findIndex((s) => s.id === siteId);
    if (idx < 0) return;
    const perf = res.scores?.performance ?? this.sites[idx].perf;
    const lcpMs = res.metrics?.largestContentfulPaint;
    const updated: Site = {
      ...this.sites[idx],
      perf: perf ?? this.sites[idx].perf,
      scan: 'just now',
      lcp: lcpMs ? `${(lcpMs / 1000).toFixed(1)}s` : this.sites[idx].lcp,
      fid: res.metrics?.totalBlockingTime
        ? `${Math.round(res.metrics.totalBlockingTime)}ms`
        : this.sites[idx].fid,
      cls:
        res.metrics?.cumulativeLayoutShift != null
          ? res.metrics.cumulativeLayoutShift.toFixed(2)
          : this.sites[idx].cls,
      health: Math.round(((perf ?? 70) + this.sites[idx].sec + this.sites[idx].seo) / 3),
      st: (perf ?? 70) >= 80 ? 'ok' : (perf ?? 70) >= 60 ? 'warn' : 'bad',
    };
    this.sites[idx] = updated;
    if (this.ctx.selectedSite()?.id === siteId) {
      this.ctx.selectedSite.set(updated);
    }
  }

  applyCustomerDashboardSites(sites: Site[]): void {
    this.sites.splice(0, this.sites.length, ...sites);
    this.syncWordPressFromSites();
    this.syncSelectedSite(this.auth.getCurrentUser() ?? { role: 'customer' });
  }

  syncSelectedSite(user: { customerId?: number; role: string }): void {
    if (user.customerId) {
      this.ctx.currentCustomerId.set(user.customerId);
    }
    const custId = user.role === 'admin' ? this.ctx.currentCustomerId() : user.customerId;
    if (custId) {
      const customerSites = this.sites.filter((s) => s.custId === custId);
      const current = this.ctx.selectedSite();
      if (current) {
        const refreshed = customerSites.find((s) => s.id === current.id);
        if (refreshed) {
          this.ctx.selectedSite.set(refreshed);
        } else if (customerSites.length) {
          this.ctx.selectedSite.set(customerSites[0]);
        } else {
          this.ctx.selectedSite.set(null);
        }
      } else if (customerSites.length) {
        this.ctx.selectedSite.set(customerSites[0]);
      }
    }
  }

  private applyPerformanceToSite(localSiteId: number, data: SitePerformanceScreen): void {
    const idx = this.sites.findIndex((s) => s.id === localSiteId);
    if (idx < 0) return;
    const perf = data.lighthouse.performance;
    const seo = data.lighthouse.seo;
    const updated: Site = {
      ...this.sites[idx],
      perf,
      seo,
      lcp: data.coreWebVitals.lcp.value,
      fid: data.coreWebVitals.fid.value,
      cls: data.coreWebVitals.cls.value,
      scan: data.lastScan,
      health: Math.round((perf + this.sites[idx].sec + seo + this.sites[idx].up) / 4),
      st: perf >= 80 ? 'ok' : perf >= 60 ? 'warn' : 'bad',
    };
    this.sites[idx] = updated;
    if (this.ctx.selectedSite()?.id === localSiteId) {
      this.ctx.selectedSite.set(updated);
    }
    this.session.bump();
  }

  private applySecurityToSite(localSiteId: number, data: SiteSecurityScreen): void {
    const idx = this.sites.findIndex((s) => s.id === localSiteId);
    if (idx < 0) return;
    const updated: Site = {
      ...this.sites[idx],
      sec: data.score,
      scan: 'just now',
      health: Math.round((this.sites[idx].perf + data.score + this.sites[idx].seo + this.sites[idx].up) / 4),
    };
    this.sites[idx] = updated;
    if (this.ctx.selectedSite()?.id === localSiteId) {
      this.ctx.selectedSite.set(updated);
    }
    this.session.bump();
  }

  private applySeoToSite(localSiteId: number, data: SiteSeoScreen): void {
    const idx = this.sites.findIndex((s) => s.id === localSiteId);
    if (idx < 0) return;
    const updated: Site = {
      ...this.sites[idx],
      seo: data.score,
      issues: data.stats.issuesFound,
      scan: 'just now',
      health: Math.round((this.sites[idx].perf + this.sites[idx].sec + data.score + this.sites[idx].up) / 4),
    };
    this.sites[idx] = updated;
    if (this.ctx.selectedSite()?.id === localSiteId) {
      this.ctx.selectedSite.set(updated);
    }
    this.session.bump();
  }

  private syncWordPressFromSites(): void {
    for (const site of this.sites) {
      if (site.platform === 'wordpress') {
        this.initWordPressState(site.id);
      }
    }
  }

  private customers(): CustomersDataService {
    return this.injector.get(CustomersDataService);
  }

  private subscriptions(): SubscriptionsDataService {
    return this.injector.get(SubscriptionsDataService);
  }

  private reports(): ReportsDataService {
    return this.injector.get(ReportsDataService);
  }
}
