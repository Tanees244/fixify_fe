import { Injectable, inject } from '@angular/core';
import {
  AuthApiService,
  AnalyticsApiService,
  ClientsApiService,
  DashboardApiService,
  TicketsApiService,
  WebsitesApiService,
} from './api';

/** @deprecated Use domain *ApiService classes directly. Facade for backward compatibility. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly auth = inject(AuthApiService);
  private readonly clients = inject(ClientsApiService);
  private readonly websites = inject(WebsitesApiService);
  private readonly tickets = inject(TicketsApiService);
  private readonly analytics = inject(AnalyticsApiService);
  private readonly dashboard = inject(DashboardApiService);

  login = this.auth.login.bind(this.auth);
  getCurrentUser = this.auth.getCurrentUser.bind(this.auth);

  createClient = this.clients.createClient.bind(this.clients);
  getClients = this.clients.getClients.bind(this.clients);
  getClientById = this.clients.getClientById.bind(this.clients);
  deleteClient = this.clients.deleteClient.bind(this.clients);
  activateClient = this.clients.activateClient.bind(this.clients);
  deactivateClient = this.clients.deactivateClient.bind(this.clients);

  getWebsites = this.websites.getWebsites.bind(this.websites);
  createWebsite = this.websites.createWebsite.bind(this.websites);
  activateWebsite = this.websites.activateWebsite.bind(this.websites);
  deactivateWebsite = this.websites.deactivateWebsite.bind(this.websites);
  deleteWebsite = this.websites.deleteWebsite.bind(this.websites);

  createTicket = this.tickets.createTicket.bind(this.tickets);
  getTickets = this.tickets.getTickets.bind(this.tickets);
  getTicketById = this.tickets.getTicketById.bind(this.tickets);
  updateTicketStatus = this.tickets.updateTicketStatus.bind(this.tickets);
  addTicketMessage = this.tickets.addTicketMessage.bind(this.tickets);
  getTicketMessages = this.tickets.getTicketMessages.bind(this.tickets);

  getAdminWebsiteDashboard = this.dashboard.getAdminWebsiteDashboard.bind(this.dashboard);
  getAdminWebsiteReports = this.dashboard.getAdminWebsiteReports.bind(this.dashboard);

  checkPageSpeed = this.analytics.checkPageSpeed.bind(this.analytics);
  checkUptime = this.analytics.checkUptime.bind(this.analytics);
  checkSsl = this.analytics.checkSsl.bind(this.analytics);
  checkPhpVersion = this.analytics.checkPhpVersion.bind(this.analytics);
  getWordPressPlugins = this.analytics.getWordPressPlugins.bind(this.analytics);
  getWordPressUpdates = this.analytics.getWordPressUpdates.bind(this.analytics);
  getWordPressSiteHealth = this.analytics.getWordPressSiteHealth.bind(this.analytics);
  checkBlacklist = this.analytics.checkBlacklist.bind(this.analytics);
  checkGtMetrix = this.analytics.checkGtMetrix.bind(this.analytics);
}
