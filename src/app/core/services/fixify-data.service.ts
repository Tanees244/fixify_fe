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
import { DataSessionService } from './data/data-session.service';
import { CustomersDataService } from './data/customers-data.service';
import { SitesDataService } from './data/sites-data.service';
import { TicketsDataService } from './data/tickets-data.service';
import { SubscriptionsDataService } from './data/subscriptions-data.service';
import { InsightsDataService } from './data/insights-data.service';
import { ReportsDataService } from './data/reports-data.service';

@Injectable({ providedIn: 'root' })
export class FixifyDataService {
  private readonly session = inject(DataSessionService);
  private readonly customersData = inject(CustomersDataService);
  private readonly sitesData = inject(SitesDataService);
  private readonly ticketsData = inject(TicketsDataService);
  private readonly subscriptionsData = inject(SubscriptionsDataService);
  private readonly insightsData = inject(InsightsDataService);
  private readonly reportsData = inject(ReportsDataService);

  readonly loading = this.session.loading;
  readonly useApi = this.session.useApi;
  readonly dataRevision = this.session.dataRevision;

  readonly customers = this.customersData.customers;
  readonly sites = this.sitesData.sites;
  readonly tickets = this.ticketsData.tickets;
  readonly processes = this.insightsData.processes;
  readonly subscriptionPlans = this.subscriptionsData.subscriptionPlans;
  readonly insights = this.insightsData.insights;
  readonly wordpressBySiteId = this.sitesData.wordpressBySiteId;
  readonly wordpressStateBySiteId = this.sitesData.wordpressStateBySiteId;
  readonly adminActions = this.reportsData.adminActions;
  readonly monthlyReports = this.reportsData.monthlyReports;
  readonly recommendations = this.reportsData.recommendations;

  loadAll(): void {
    this.initSession();
  }

  initSession(): void {
    this.subscriptionsData.initSession();
    this.insightsData.initSession();
    this.reportsData.initSession();
    this.session.init();
  }

  loadMockCoreData(): void {
    this.customersData.loadMockCustomers();
    this.sitesData.loadMockSites();
    this.ticketsData.loadMockTickets();
    this.reportsData.loadMockReports();
    this.sitesData.loadMockWordPressStates();
    this.sitesData.syncSelectedSiteAfterMockLoad();
  }

  reload(): void {
    this.customers.splice(0, this.customers.length);
    this.sites.splice(0, this.sites.length);
    this.tickets.splice(0, this.tickets.length);
  }

  clientApiIdFor(localCustomerId: number): string | undefined {
    return this.customersData.clientApiIdFor(localCustomerId);
  }

  fetchClients(done?: () => void): void {
    this.customersData.fetchClients(done);
  }

  fetchWebsites(clientProfileId?: string, done?: () => void): void {
    this.sitesData.fetchWebsites(clientProfileId, done);
  }

  fetchWebsitesForCustomer(localCustomerId: number, done?: () => void): void {
    this.sitesData.fetchWebsitesForCustomer(localCustomerId, done);
  }

  fetchCustomerWebsites(done?: () => void): void {
    if (!this.session.useApi()) {
      this.loadMockCoreData();
      done?.();
      return;
    }
    this.sitesData.fetchCustomerWebsites(done);
  }

  fetchTickets(params?: { role?: string; clientId?: string }, done?: () => void): void {
    this.ticketsData.fetchTickets(params, done);
  }

  fetchSitePerformance(site: Site | null, done?: () => void): void {
    this.sitesData.fetchSitePerformance(site, done);
  }

  fetchSiteSeo(site: Site | null, done?: () => void): void {
    this.sitesData.fetchSiteSeo(site, done);
  }

  fetchSiteUptime(site: Site | null, done?: () => void): void {
    this.sitesData.fetchSiteUptime(site, done);
  }

  fetchSiteSecurity(site: Site | null, done?: () => void): void {
    this.sitesData.fetchSiteSecurity(site, done);
  }

  fetchWordPressForSite(siteId: number, done?: () => void): void {
    this.sitesData.fetchWordPressForSite(siteId, done);
  }

  loadWebsiteDashboard(siteId: number): void {
    this.sitesData.loadWebsiteDashboard(siteId);
  }

  loadWebsiteReports(siteId: number, year?: number): void {
    this.reportsData.loadWebsiteReports(siteId, year);
  }

  mySites(): Site[] {
    return this.sitesData.mySites();
  }

  sitesForCustomer(custId: number): Site[] {
    return this.sitesData.sitesForCustomer(custId);
  }

  ticketsForCustomer(custId: number): Ticket[] {
    return this.ticketsData.ticketsForCustomer(custId);
  }

  getCustomer(id: number): Customer | undefined {
    return this.customersData.getCustomer(id);
  }

  pendingApprovals(): Customer[] {
    return this.customersData.pendingApprovals();
  }

  getPlan(id: string): SubscriptionPlan | undefined {
    return this.subscriptionsData.getPlan(id);
  }

  planLabel(id: string): string {
    return this.subscriptionsData.planLabel(id);
  }

  planPrice(id: string): number {
    return this.subscriptionsData.planPrice(id);
  }

  planColor(id: string): string {
    return this.subscriptionsData.planColor(id);
  }

  customersOnPlan(planId: string): number {
    return this.subscriptionsData.customersOnPlan(planId);
  }

  createSubscriptionPlan(data: SubscriptionPlanPayload): void {
    this.subscriptionsData.createSubscriptionPlan(data);
  }

  updateSubscriptionPlan(id: string, data: SubscriptionPlanPayload): void {
    this.subscriptionsData.updateSubscriptionPlan(id, data);
  }

  deleteSubscriptionPlan(id: string): boolean {
    return this.subscriptionsData.deleteSubscriptionPlan(id);
  }

  getInsights(): Insight[] {
    return this.insightsData.getInsights();
  }

  askAi(question: string): Promise<string> {
    return this.insightsData.askAi(question);
  }

  addSite(data: AddSitePayload): void {
    this.sitesData.addSite(data);
  }

  addSiteForCustomer(
    custId: number,
    data: AddSitePayload,
    opts?: { selectSite?: boolean; closeModal?: boolean; silent?: boolean }
  ): Site {
    return this.sitesData.addSiteForCustomer(custId, data, opts);
  }

  getWordPressDetails(siteId: number): WordPressSiteDetails | undefined {
    return this.sitesData.getWordPressDetails(siteId);
  }

  removeSite(id: number): void {
    this.sitesData.removeSite(id);
  }

  onboardCustomer(data: OnboardCustomerPayload): void {
    this.customersData.onboardCustomer(data);
  }

  addCustomer(data: AddCustomerPayload): void {
    this.customersData.addCustomer(data);
  }

  approveCustomer(id: number): void {
    this.customersData.approveCustomer(id);
  }

  rejectCustomer(id: number): void {
    this.customersData.rejectCustomer(id);
  }

  assignSubscription(customerId: number, plan: string): void {
    this.customersData.assignSubscription(customerId, plan);
  }

  updateCustomer(updated: Customer): void {
    this.customersData.updateCustomer(updated);
  }

  createTicket(data: CreateTicketPayload): void {
    this.ticketsData.createTicket(data);
  }

  updateTicket(id: string, changes: Partial<Ticket>): void {
    this.ticketsData.updateTicket(id, changes);
  }

  scanSite(site: Site): Promise<void> {
    return this.sitesData.scanSite(site);
  }

  createProcess(data: CreateProcessPayload): void {
    this.insightsData.createProcess(data);
  }

  toggleProcess(id: number): void {
    this.insightsData.toggleProcess(id);
  }

  initWordPressState(siteId: number, wpVersion?: string): void {
    this.sitesData.initWordPressState(siteId, wpVersion);
  }

  getWordPressState(siteId: number): WordPressSiteState | undefined {
    return this.sitesData.getWordPressState(siteId);
  }

  isWordPressSite(siteId: number): boolean {
    return this.sitesData.isWordPressSite(siteId);
  }

  wordPressSitesForCustomer(custId: number): Site[] {
    return this.sitesData.wordPressSitesForCustomer(custId);
  }

  logAdminAction(
    site: Site,
    action: string,
    actionType: AdminSiteAction['actionType'],
    details: string
  ): AdminSiteAction {
    return this.reportsData.logAdminAction(site, action, actionType, details);
  }

  adminActionsForCustomer(custId: number, customerVisibleOnly = false): AdminSiteAction[] {
    return this.reportsData.adminActionsForCustomer(custId, customerVisibleOnly);
  }

  adminActionsForSite(siteId: number): AdminSiteAction[] {
    return this.reportsData.adminActionsForSite(siteId);
  }

  reportsForCustomer(custId: number): MonthlyReport[] {
    return this.reportsData.reportsForCustomer(custId);
  }

  reportsForSite(siteId: number): MonthlyReport[] {
    return this.reportsData.reportsForSite(siteId);
  }

  createMonthlyReport(siteId: number, monthKey: string): MonthlyReport | null {
    return this.reportsData.createMonthlyReport(siteId, monthKey);
  }

  recommendationsForCustomer(custId: number): SiteRecommendation[] {
    return this.reportsData.recommendationsForCustomer(custId);
  }

  recommendationsForSite(siteId: number): SiteRecommendation[] {
    return this.reportsData.recommendationsForSite(siteId);
  }

  addRecommendation(data: AddRecommendationPayload): void {
    this.reportsData.addRecommendation(data);
  }

  applyRecommendation(id: number): void {
    this.reportsData.applyRecommendation(id);
  }

  dismissRecommendation(id: number): void {
    this.reportsData.dismissRecommendation(id);
  }

  performWordPressAction(
    siteId: number,
    actionType: WordPressAdminActionType,
    pluginId?: string
  ): Promise<void> {
    return this.sitesData.performWordPressAction(siteId, actionType, pluginId);
  }
}
