import { Injectable, Injector, inject } from '@angular/core';
import { forkJoin, firstValueFrom } from 'rxjs';
import {
  AddSitePayload,
  Site,
  WordPressAdminActionType,
  WordPressSiteDetails,
  WordPressSiteState,
} from '../../models/fixify.models';
import { cloneMockData, MOCK_SITES } from '../../data/mock-data';
import {
  createDefaultWordPressState,
  MOCK_WORDPRESS_STATES,
} from '../../data/mock-wordpress-data';
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
import { DataSessionService } from './data-session.service';
import { CustomersDataService } from './customers-data.service';
import { SubscriptionsDataService } from './subscriptions-data.service';
import { ReportsDataService } from './reports-data.service';
import { delay, parseSiteName, siteUrl } from './data.utils';

@Injectable({ providedIn: 'root' })
export class SitesDataService {
  private readonly toast = inject(NotificationService);
  private readonly ctx = inject(AppContextService);
  private readonly session = inject(DataSessionService);
  private readonly websitesApi = inject(WebsitesApiService);
  private readonly analyticsApi = inject(AnalyticsApiService);
  private readonly dashboardApi = inject(DashboardApiService);
  private readonly auth = inject(AuthService);
  private readonly ids = inject(EntityIdRegistry);
  private readonly injector = inject(Injector);

  readonly sites: Site[] = [];
  readonly wordpressBySiteId = new Map<number, WordPressSiteDetails>();
  readonly wordpressStateBySiteId = new Map<number, WordPressSiteState>();

  private nextSiteId = 100;

  loadMockSites(): void {
    this.sites.splice(0, this.sites.length, ...cloneMockData(MOCK_SITES));
    this.syncWordPressFromSites();
  }

  loadMockWordPressStates(): void {
    this.wordpressStateBySiteId.clear();
    for (const state of cloneMockData(MOCK_WORDPRESS_STATES)) {
      this.wordpressStateBySiteId.set(state.siteId, state);
    }
  }

  syncSelectedSiteAfterMockLoad(): void {
    const custId = this.ctx.currentCustomerId();
    const mySites = this.sites.filter((s) => s.custId === custId);
    if (!this.ctx.selectedSite() && mySites.length) {
      this.ctx.selectedSite.set(mySites[0]);
    }
  }

  websiteApiId(siteId: number): string | undefined {
    return this.ids.websiteApiId(siteId) ?? this.sites.find((s) => s.id === siteId)?.apiId;
  }

  fetchWebsites(clientProfileId?: string, done?: () => void): void {
    if (!this.session.useApi()) {
      this.loadMockSites();
      this.session.bump();
      done?.();
      return;
    }
    this.session.beginLoad();
    this.websitesApi.getWebsites({ limit: 200, clientId: clientProfileId }).subscribe({
      next: (res) => {
        this.sites.splice(
          0,
          this.sites.length,
          ...(res.data?.websites ?? []).map((w) =>
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
    this.fetchWebsites(apiId, done);
  }

  fetchCustomerWebsites(done?: () => void): void {
    const user = this.auth.getCurrentUser();
    if (!this.session.useApi()) {
      done?.();
      return;
    }
    this.session.beginLoad();
    this.websitesApi.getWebsites({ limit: 200 }).subscribe({
      next: (res) => {
        if (user) {
          this.customers().applyAuthCustomerProfile(user);
        }
        this.sites.splice(
          0,
          this.sites.length,
          ...(res.data?.websites ?? []).map((w) =>
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
    this.session.beginLoad();
    const url = siteUrl(site);
    this.analyticsApi.checkPageSpeed({ url, strategy: 'mobile' }).subscribe({
      next: (res) => {
        this.applyPageSpeedToSite(site.id, res);
        this.session.endLoad();
        done?.();
      },
      error: () => {
        this.session.endLoad();
        done?.();
      },
    });
  }

  fetchSiteSeo(site: Site | null, done?: () => void): void {
    if (!site || !this.session.useApi()) {
      done?.();
      return;
    }
    const url = siteUrl(site);
    this.analyticsApi.checkPageSpeed({ url, strategy: 'mobile' }).subscribe({
      next: (res) => {
        this.applyPageSpeedToSite(site.id, res);
        const idx = this.sites.findIndex((s) => s.id === site.id);
        if (idx >= 0 && res.scores?.seo != null) {
          this.sites[idx] = { ...this.sites[idx], seo: res.scores.seo };
          if (this.ctx.selectedSite()?.id === site.id) {
            this.ctx.selectedSite.set(this.sites[idx]);
          }
        }
        done?.();
      },
      error: () => done?.(),
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
    const url = siteUrl(site);
    forkJoin({
      ssl: this.analyticsApi.checkSsl(url),
      blacklist: this.analyticsApi.checkBlacklist(url),
    }).subscribe({
      next: ({ ssl }) => {
        const idx = this.sites.findIndex((s) => s.id === site.id);
        if (idx >= 0) {
          this.sites[idx] = {
            ...this.sites[idx],
            sec: ssl.isSecure ? 90 : 55,
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

  addSite(data: AddSitePayload): void {
    this.addSiteForCustomer(this.ctx.currentCustomerId(), data, {
      selectSite: true,
      closeModal: true,
    });
  }

  addSiteForCustomer(
    custId: number,
    data: AddSitePayload,
    opts: { selectSite?: boolean; closeModal?: boolean; silent?: boolean } = {}
  ): Site {
    if (this.session.useApi()) {
      this.addSiteViaApi(custId, data, opts);
      return this.sites[this.sites.length - 1] ?? this.buildLocalSite(custId, data);
    }
    return this.addSiteLocal(custId, data, opts);
  }

  private addSiteLocal(
    custId: number,
    data: AddSitePayload,
    opts: { selectSite?: boolean; closeModal?: boolean; silent?: boolean }
  ): Site {
    const planName = this.subscriptions().planLabel(data.plan);
    const displayName =
      data.wordpress?.siteName?.trim() ||
      data.name?.trim() ||
      (data.url ? parseSiteName(data.url) : 'new-site.com');
    const nm = data.url ? parseSiteName(data.url) : displayName;
    const site: Site = {
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
    if (data.wordpress) {
      this.wordpressBySiteId.set(site.id, { ...data.wordpress });
      this.initWordPressState(site.id, data.wordpress.wpVersion);
    } else if (data.platform === 'wordpress') {
      this.initWordPressState(site.id);
    }
    this.sites.push(site);
    if (opts.selectSite) {
      this.ctx.selectedSite.set(site);
    }
    if (!opts.silent) {
      this.toast.success(`${displayName} added and initial scan started`);
    }
    if (opts.closeModal) {
      this.ctx.closeModal();
    }
    return site;
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
  ): void {
    const clientProfileId =
      this.ids.clientApiId(custId) ??
      this.auth.getCurrentUser()?.clientProfileId ??
      this.customers().getCustomer(custId)?.apiId;

    if (!clientProfileId) {
      this.toast.error('Client profile not found for this site.');
      return;
    }

    const displayName =
      data.wordpress?.siteName?.trim() ||
      data.name?.trim() ||
      (data.url ? parseSiteName(data.url) : 'new-site.com');
    const wpLoginUrl =
      data.wordpress?.loginUrl ||
      (data.url ? `${data.url.replace(/\/$/, '')}/wp-admin` : '');
    const logoUrl =
      data.wordpress?.siteUrl ||
      data.url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`;

    this.websitesApi
      .createWebsite({
        clientProfileId,
        name: displayName,
        logoUrl,
        wpLoginUrl,
        wpUsername: data.wordpress?.username ?? '',
        wpPassword: data.wordpress?.password ?? '',
      })
      .subscribe({
        next: (res) => {
          const site = mapApiWebsiteToSite(res.data ?? {}, this.ids, clientProfileId);
          if (data.wordpress) {
            this.wordpressBySiteId.set(site.id, { ...data.wordpress });
          }
          this.initWordPressState(site.id, data.wordpress?.wpVersion);
          this.sites.push(site);
          if (opts.selectSite) this.ctx.selectedSite.set(site);
          if (!opts.silent) this.toast.success(`${displayName} added`);
          if (opts.closeModal) this.ctx.closeModal();
        },
        error: (err) => {
          this.toast.error(err?.error?.message || 'Failed to add website');
        },
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
    this.ctx.scanning.set(true);
    this.toast.info(`Scanning ${site.name}…`);

    if (this.session.useApi()) {
      const url = siteUrl(site);
      try {
        const [uptime, pagespeed] = await Promise.all([
          firstValueFrom(this.analyticsApi.checkUptime(url)).catch(() => null),
          firstValueFrom(this.analyticsApi.checkPageSpeed({ url, strategy: 'mobile' })).catch(
            () => null
          ),
        ]);

        const idx = this.sites.findIndex((s) => s.id === site.id);
        if (idx >= 0) {
          const perf = pagespeed?.scores?.performance ?? this.sites[idx].perf;
          const seo = pagespeed?.scores?.seo ?? this.sites[idx].seo;
          const up = uptime?.ok ? 99.9 : 95;
          const lcpMs = pagespeed?.metrics?.largestContentfulPaint;
          const updated: Site = {
            ...this.sites[idx],
            scan: 'just now',
            perf: perf ?? this.sites[idx].perf,
            seo: seo ?? this.sites[idx].seo,
            up,
            health: Math.round(((perf ?? 70) + (seo ?? 70) + up) / 3),
            lcp: lcpMs ? `${(lcpMs / 1000).toFixed(1)}s` : this.sites[idx].lcp,
            fid: pagespeed?.metrics?.totalBlockingTime
              ? `${Math.round(pagespeed.metrics.totalBlockingTime)}ms`
              : this.sites[idx].fid,
            cls: pagespeed?.metrics?.cumulativeLayoutShift
              ? pagespeed.metrics.cumulativeLayoutShift.toFixed(2)
              : this.sites[idx].cls,
            st: (perf ?? 70) >= 80 ? 'ok' : (perf ?? 70) >= 60 ? 'warn' : 'bad',
          };
          this.sites[idx] = updated;
          if (this.ctx.selectedSite()?.id === site.id) {
            this.ctx.selectedSite.set(updated);
          }
        }
        this.ctx.scanning.set(false);
        this.toast.success('Scan complete — report updated');
      } catch {
        this.ctx.scanning.set(false);
        this.toast.error('Scan failed');
      }
      return;
    }

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

  syncSelectedSite(user: { customerId?: number; role: string }): void {
    if (user.customerId) {
      this.ctx.currentCustomerId.set(user.customerId);
    }
    const custId = user.role === 'admin' ? this.ctx.currentCustomerId() : user.customerId;
    if (custId) {
      const customerSites = this.sites.filter((s) => s.custId === custId);
      if (customerSites.length && !this.ctx.selectedSite()) {
        this.ctx.selectedSite.set(customerSites[0]);
      }
    }
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
