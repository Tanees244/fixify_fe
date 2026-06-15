import { Injectable, inject } from '@angular/core';
import {
  AddCustomerPayload,
  AddRecommendationPayload,
  AddSitePayload,
  AdminSiteAction,
  CreateProcessPayload,
  CreateTicketPayload,
  Customer,
  Insight,
  MonthlyReport,
  OnboardCustomerPayload,
  Process,
  Site,
  SiteRecommendation,
  SubscriptionPlan,
  SubscriptionPlanPayload,
  Ticket,
  WordPressAdminActionType,
  WordPressSiteDetails,
  WordPressSiteState,
} from '../models/fixify.models';
import {
  cloneMockData,
  MOCK_CUSTOMERS,
  MOCK_INSIGHTS,
  MOCK_PROCESSES,
  MOCK_SITES,
  MOCK_SUBSCRIPTION_PLANS,
  MOCK_TICKETS,
} from '../data/mock-data';
import {
  createDefaultWordPressState,
  MOCK_ADMIN_ACTIONS,
  MOCK_MONTHLY_REPORTS,
  MOCK_RECOMMENDATIONS,
  MOCK_WORDPRESS_STATES,
} from '../data/mock-wordpress-data';
import { AI_RESPONSES, AI_SUGGESTIONS } from '../constants/fixify.constants';
import { formatPriceLabel } from '../constants/subscription.constants';
import { ticketStatusLabel } from '../utils/fixify.utils';
import { NotificationService } from './notification.service';
import { AppContextService } from './app-context.service';

function parseSiteName(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

function buildTriggerDetail(trigger: string, day: string, time?: string): string {
  const suffix = day === '1' ? 'st' : day === '2' ? 'nd' : day === '3' ? 'rd' : 'th';
  if (trigger === 'monthly') return `Day ${day}${suffix} of month at ${time || '2:00 AM'}`;
  if (trigger === 'weekly') return `Every ${day} at ${time || '4:00 AM'}`;
  return `Daily at ${time || '2:00 AM'}`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatNow(): string {
  return (
    new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' +
    new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  );
}

function monthLabelFromKey(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

@Injectable({ providedIn: 'root' })
export class FixifyDataService {
  private readonly toast = inject(NotificationService);
  private readonly ctx = inject(AppContextService);

  readonly customers: Customer[] = [];
  readonly sites: Site[] = [];
  readonly tickets: Ticket[] = [];
  readonly processes: Process[] = [];
  readonly subscriptionPlans: SubscriptionPlan[] = [];
  readonly insights: Insight[] = cloneMockData(MOCK_INSIGHTS);
  /** In-memory WordPress connection details (UI mock — not persisted) */
  readonly wordpressBySiteId = new Map<number, WordPressSiteDetails>();
  readonly wordpressStateBySiteId = new Map<number, WordPressSiteState>();
  readonly adminActions: AdminSiteAction[] = [];
  readonly monthlyReports: MonthlyReport[] = [];
  readonly recommendations: SiteRecommendation[] = [];

  private nextSiteId = 100;
  private nextCustomerId = 100;
  private nextProcessId = 100;
  private nextPlanId = 100;
  private nextActionId = 100;
  private nextReportId = 100;
  private nextRecommendationId = 100;

  loadAll(): void {
    this.customers.splice(0, this.customers.length, ...cloneMockData(MOCK_CUSTOMERS));
    this.sites.splice(0, this.sites.length, ...cloneMockData(MOCK_SITES));
    this.tickets.splice(0, this.tickets.length, ...cloneMockData(MOCK_TICKETS));
    this.processes.splice(0, this.processes.length, ...cloneMockData(MOCK_PROCESSES));
    this.subscriptionPlans.splice(
      0,
      this.subscriptionPlans.length,
      ...cloneMockData(MOCK_SUBSCRIPTION_PLANS)
    );

    this.wordpressStateBySiteId.clear();
    for (const state of cloneMockData(MOCK_WORDPRESS_STATES)) {
      this.wordpressStateBySiteId.set(state.siteId, state);
    }
    this.adminActions.splice(0, this.adminActions.length, ...cloneMockData(MOCK_ADMIN_ACTIONS));
    this.monthlyReports.splice(0, this.monthlyReports.length, ...cloneMockData(MOCK_MONTHLY_REPORTS));
    this.recommendations.splice(0, this.recommendations.length, ...cloneMockData(MOCK_RECOMMENDATIONS));

    const custId = this.ctx.currentCustomerId();
    const mySites = this.sites.filter((s) => s.custId === custId);
    if (!this.ctx.selectedSite() && mySites.length) {
      this.ctx.selectedSite.set(mySites[0]);
    }
  }

  mySites(): Site[] {
    return this.sites.filter((s) => s.custId === this.ctx.currentCustomerId());
  }

  sitesForCustomer(custId: number): Site[] {
    return this.sites.filter((s) => s.custId === custId);
  }

  ticketsForCustomer(custId: number): Ticket[] {
    return this.tickets.filter((t) => t.custId === custId);
  }

  getCustomer(id: number): Customer | undefined {
    return this.customers.find((c) => c.id === id);
  }

  pendingApprovals(): Customer[] {
    return this.customers.filter((c) => c.approvalStatus === 'pending');
  }

  getPlan(id: string): SubscriptionPlan | undefined {
    return this.subscriptionPlans.find((p) => p.id === id);
  }

  planLabel(id: string): string {
    return this.getPlan(id)?.name ?? id;
  }

  planPrice(id: string): number {
    return this.getPlan(id)?.price ?? 0;
  }

  planColor(id: string): string {
    return this.getPlan(id)?.color ?? '#6b88ad';
  }

  customersOnPlan(planId: string): number {
    return this.customers.filter((c) => c.plan === planId).length;
  }

  createSubscriptionPlan(data: SubscriptionPlanPayload): void {
    const baseId =
      data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || `plan-${this.nextPlanId}`;
    let id = baseId;
    while (this.subscriptionPlans.some((p) => p.id === id)) {
      id = `${baseId}-${this.nextPlanId++}`;
    }
    const plan: SubscriptionPlan = {
      id,
      name: data.name.trim(),
      price: data.price,
      priceLabel: formatPriceLabel(data.price),
      color: data.color,
      features: data.features.filter((f) => f.trim()),
    };
    this.subscriptionPlans.push(plan);
    this.toast.success(`Plan "${plan.name}" created`);
    this.ctx.closeModal();
  }

  updateSubscriptionPlan(id: string, data: SubscriptionPlanPayload): void {
    const idx = this.subscriptionPlans.findIndex((p) => p.id === id);
    if (idx < 0) return;
    this.subscriptionPlans[idx] = {
      ...this.subscriptionPlans[idx],
      name: data.name.trim(),
      price: data.price,
      priceLabel: formatPriceLabel(data.price),
      color: data.color,
      features: data.features.filter((f) => f.trim()),
    };
    this.toast.success(`Plan "${data.name}" updated`);
    this.ctx.closeModal();
  }

  deleteSubscriptionPlan(id: string): boolean {
    const count = this.customersOnPlan(id);
    if (count > 0) {
      this.toast.show(
        `Cannot delete — ${count} customer${count === 1 ? '' : 's'} on this plan`,
        'warning'
      );
      return false;
    }
    const idx = this.subscriptionPlans.findIndex((p) => p.id === id);
    if (idx < 0) return false;
    const name = this.subscriptionPlans[idx].name;
    this.subscriptionPlans.splice(idx, 1);
    this.toast.info(`Plan "${name}" deleted`);
    return true;
  }

  getInsights(): Insight[] {
    return this.insights;
  }

  async askAi(question: string): Promise<string> {
    await delay(1400);
    const key =
      AI_SUGGESTIONS.find((s) => question.includes(s.slice(0, 10))) ?? question;
    return (
      AI_RESPONSES[key] ??
      `Analyzing your websites...\n\nBased on current data across your monitored sites, here is what I found regarding "${question}":\n\nYour overall portfolio health score is 74/100. The main areas needing attention are performance on shopfront.co (38) and security updates across 3 sites. I recommend prioritizing the critical WooCommerce CVE patch first, then addressing Core Web Vitals regressions.\n\nWould you like me to generate a detailed action plan?`
    );
  }

  addSite(data: AddSitePayload): void {
    this.addSiteForCustomer(this.ctx.currentCustomerId(), data, { selectSite: true, closeModal: true });
  }

  addSiteForCustomer(
    custId: number,
    data: AddSitePayload,
    opts: { selectSite?: boolean; closeModal?: boolean; silent?: boolean } = {}
  ): Site {
    const planName = this.planLabel(data.plan);
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

  getWordPressDetails(siteId: number): WordPressSiteDetails | undefined {
    return this.wordpressBySiteId.get(siteId);
  }

  removeSite(id: number): void {
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

  onboardCustomer(data: OnboardCustomerPayload): void {
    const requireApproval = data.requireApproval ?? false;
    const customer: Customer = {
      id: this.nextCustomerId++,
      name: data.name,
      email: data.email,
      company: data.company || data.name,
      plan: data.plan || 'free',
      status: requireApproval ? 'pending' : 'active',
      approvalStatus: requireApproval ? 'pending' : 'approved',
      joined: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      avatar: data.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      phone: data.phone || '',
    };
    this.customers.push(customer);
    this.addSiteForCustomer(customer.id, data.site, { silent: true });
    const msg = requireApproval
      ? `${data.name} submitted for approval with WordPress site`
      : `${data.name} onboarded with WordPress site`;
    this.toast.success(msg);
  }

  addCustomer(data: AddCustomerPayload): void {
    const requireApproval = data.requireApproval ?? false;
    const customer: Customer = {
      id: this.nextCustomerId++,
      name: data.name,
      email: data.email,
      company: data.company || data.name,
      plan: data.plan || 'free',
      status: requireApproval ? 'pending' : 'active',
      approvalStatus: requireApproval ? 'pending' : 'approved',
      joined: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      avatar: data.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      phone: data.phone || '',
    };
    this.customers.push(customer);
    const msg = requireApproval
      ? `${data.name} submitted for approval`
      : `Customer ${data.name} onboarded`;
    this.toast.success(msg);
    this.ctx.closeModal();
  }

  approveCustomer(id: number): void {
    const idx = this.customers.findIndex((c) => c.id === id);
    if (idx < 0) return;
    this.customers[idx] = {
      ...this.customers[idx],
      approvalStatus: 'approved',
      status: 'active',
    };
    this.toast.success(`${this.customers[idx].name} approved and activated`);
  }

  rejectCustomer(id: number): void {
    const idx = this.customers.findIndex((c) => c.id === id);
    if (idx < 0) return;
    this.customers[idx] = {
      ...this.customers[idx],
      approvalStatus: 'rejected',
      status: 'rejected',
    };
    this.toast.info(`${this.customers[idx].name} onboarding rejected`);
  }

  assignSubscription(customerId: number, plan: string): void {
    const idx = this.customers.findIndex((c) => c.id === customerId);
    if (idx < 0) return;
    this.customers[idx] = { ...this.customers[idx], plan };
    this.toast.success(`Subscription updated to ${this.planLabel(plan)}`);
  }

  updateCustomer(updated: Customer): void {
    const idx = this.customers.findIndex((c) => c.id === updated.id);
    if (idx >= 0) this.customers[idx] = { ...updated };
    this.toast.success(`${updated.name} updated`);
    this.ctx.closeModal();
  }

  createTicket(data: CreateTicketPayload): void {
    const ticket: Ticket = {
      id: `FX-${Math.floor(Math.random() * 900 + 100)}`,
      title: data.title,
      desc: data.desc,
      site: data.site,
      custId: this.ctx.currentCustomerId(),
      type: data.type,
      pri: data.pri,
      status: data.status || 'open',
      who: data.who || 'Unassigned',
      ago: 'just now',
    };
    this.tickets.unshift(ticket);
    this.toast.success(`Ticket ${ticket.id} created`);
    this.ctx.closeModal();
  }

  updateTicket(id: string, changes: Partial<Ticket>): void {
    const idx = this.tickets.findIndex((t) => t.id === id);
    if (idx >= 0) {
      this.tickets[idx] = { ...this.tickets[idx], ...changes };
      if (changes.status) {
        this.toast.success(`Ticket ${id} → ${ticketStatusLabel(changes.status)}`);
      }
    }
    this.ctx.closeModal();
  }

  async scanSite(site: Site): Promise<void> {
    this.ctx.scanning.set(true);
    this.toast.info(`Scanning ${site.name}…`);
    await delay(2500);
    const idx = this.sites.findIndex((s) => s.id === site.id);
    if (idx >= 0) {
      const updated: Site = {
        ...this.sites[idx],
        scan: 'just now',
        health: Math.min(
          100,
          this.sites[idx].health + Math.floor(Math.random() * 4 + 1)
        ),
      };
      this.sites[idx] = updated;
      if (this.ctx.selectedSite()?.id === site.id) {
        this.ctx.selectedSite.set(updated);
      }
    }
    this.ctx.scanning.set(false);
    this.toast.success('Scan complete — report updated');
  }

  createProcess(data: CreateProcessPayload): void {
    const process: Process = {
      id: this.nextProcessId++,
      name: data.name,
      desc: data.desc || data.name,
      trigger: data.trigger,
      triggerDetail: buildTriggerDetail(data.trigger, data.day, data.time),
      sites: data.targetSites === 'all' ? ['all'] : [data.targetSites],
      actions: data.actions,
      enabled: true,
      lastRun: 'Never',
      nextRun: 'Scheduled',
      runs: 0,
      success: 0,
      custId: this.ctx.currentCustomerId(),
    };
    this.processes.unshift(process);
    this.toast.success(`Process "${process.name}" created`);
  }

  toggleProcess(id: number): void {
    const idx = this.processes.findIndex((p) => p.id === id);
    if (idx >= 0) {
      this.processes[idx] = {
        ...this.processes[idx],
        enabled: !this.processes[idx].enabled,
      };
    }
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
      (a) =>
        a.custId === custId && (!customerVisibleOnly || a.visibleToCustomer)
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
    const site = this.sites.find((s) => s.id === siteId);
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
    const site = this.sites.find((s) => s.id === data.siteId);
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
    const site = this.sites.find((s) => s.id === rec.siteId);
    if (site) {
      this.logAdminAction(
        site,
        `Applied recommendation: ${rec.title}`,
        'apply_recommendation',
        rec.body
      );
      this.bumpSiteHealth(site.id, 2);
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

  private bumpSiteHealth(siteId: number, amount: number): void {
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

    this.ctx.scanning.set(true);
    await delay(1200);

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

    this.wordpressStateBySiteId.set(siteId, { ...state, plugins: [...state.plugins] });
    if (action) {
      this.logAdminAction(site, action, actionType, details);
      this.toast.success(action);
    }

    this.ctx.scanning.set(false);
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
}
