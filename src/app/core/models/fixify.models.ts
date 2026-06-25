export type SiteStatus = 'ok' | 'warn' | 'bad';
export type TicketStatus = 'open' | 'inprogress' | 'testing' | 'resolved' | 'closed';
export type TicketPriority = 'critical' | 'high' | 'medium' | 'low';
export type InsightSeverity = 'critical' | 'high' | 'medium' | 'info';
export type AppMode = 'customer' | 'admin';
export type SubscriptionPlanId = string;

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  priceLabel: string;
  color: string;
  features: string[];
}

export interface SubscriptionPlanPayload {
  name: string;
  price: number;
  color: string;
  features: string[];
}

export type CustomerApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Customer {
  id: number;
  /** Backend client profile id */
  apiId?: string;
  name: string;
  email: string;
  company: string;
  plan: string;
  status: string;
  approvalStatus: CustomerApprovalStatus;
  joined: string;
  avatar: string;
  phone: string;
}

export interface Site {
  id: number;
  /** Backend website id */
  apiId?: string;
  /** Full site URL */
  domain?: string;
  name: string;
  fa: string;
  health: number;
  perf: number;
  sec: number;
  seo: number;
  up: number;
  st: SiteStatus;
  plan: string;
  issues: number;
  scan: string;
  lcp: string;
  fid: string;
  cls: string;
  custId: number;
  type: string;
  platform: string;
}

export interface Ticket {
  id: string;
  /** Backend ticket id */
  apiId?: string;
  /** Backend website id */
  websiteApiId?: string;
  title: string;
  site: string;
  /** Populated from API when customer list is not loaded */
  customerName?: string;
  custId: number;
  type: string;
  pri: TicketPriority;
  status: TicketStatus;
  who: string;
  ago: string;
  desc: string;
}

export interface Insight {
  id: number;
  sev: InsightSeverity;
  cat: string;
  title: string;
  body: string;
  site: string;
  action: string;
  time: string;
}

export interface Platform {
  id: string;
  label: string;
  color: string;
  bg: string;
  desc: string;
}

export interface Process {
  id: number;
  name: string;
  desc: string;
  trigger: string;
  triggerDetail: string;
  sites: string[];
  actions: string[];
  enabled: boolean;
  lastRun: string;
  nextRun: string;
  runs: number;
  success: number;
  custId: number;
}

export interface AddSitePayload {
  url: string;
  name?: string;
  plan: string;
  type: string;
  platform: string;
  wordpress?: WordPressSiteDetails;
  /** Admin only — the customer (local id) to add this website for. */
  custId?: number;
}

export interface WordPressSiteDetails {
  siteName: string;
  siteUrl: string;
  loginUrl?: string;
  username?: string;
  password?: string;
  authType?: 'password' | 'application-password';
  wpVersion?: string;
  enablePluginScan: boolean;
  enableAutoUpdates: boolean;
}

export type WordPressPluginStatus = 'ok' | 'update' | 'vulnerable';

export interface WordPressPlugin {
  id: string;
  name: string;
  version: string;
  latestVersion: string;
  status: WordPressPluginStatus;
  active: boolean;
}

export interface WordPressSiteState {
  siteId: number;
  wpVersion: string;
  latestWpVersion: string;
  phpVersion: string;
  activeTheme: string;
  themeVersion: string;
  latestThemeVersion: string;
  plugins: WordPressPlugin[];
  cachePlugin: string;
  lastCacheClear: string;
  lastCoreUpdate: string;
  sslValid: boolean;
  dbOptimized: string;
}

export type WordPressAdminActionType =
  | 'update_plugin'
  | 'update_all_plugins'
  | 'update_selected_plugins'
  | 'update_wordpress_core'
  | 'update_theme'
  | 'clear_cache'
  | 'clear_object_cache'
  | 'run_security_scan'
  | 'optimize_database'
  | 'flush_rewrite_rules'
  | 'regenerate_thumbnails';

export interface AdminSiteAction {
  id: number;
  siteId: number;
  custId: number;
  siteName: string;
  action: string;
  actionType: WordPressAdminActionType | 'generate_report' | 'apply_recommendation';
  performedBy: string;
  performedAt: string;
  details: string;
  visibleToCustomer: boolean;
}

export interface MonthlyReport {
  id: number;
  apiId?: string;
  siteId: number;
  custId: number;
  siteName: string;
  month: string;
  monthKey: string;
  health: number;
  perf: number;
  sec: number;
  seo: number;
  uptime: number;
  issuesFound: number;
  issuesResolved: number;
  summary: string;
  highlights: string[];
  generatedAt: string;
  generatedBy: string;
  fileUrl?: string;
  fileName?: string;
  status?: string;
}

export interface SiteRecommendation {
  id: number;
  siteId: number;
  custId: number;
  siteName: string;
  title: string;
  body: string;
  category: string;
  priority: TicketPriority;
  status: 'open' | 'applied' | 'dismissed';
  createdAt: string;
  createdBy: string;
}

export interface AddRecommendationPayload {
  siteId: number;
  title: string;
  body: string;
  category: string;
  priority: TicketPriority;
}

export interface OnboardCustomerPayload {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  plan: string;
  requireApproval?: boolean;
  site: AddSitePayload;
}

export interface AddCustomerPayload {
  name: string;
  email: string;
  company?: string;
  plan?: string;
  phone?: string;
  requireApproval?: boolean;
}

export interface CreateTicketPayload {
  title: string;
  desc: string;
  site: string;
  type: string;
  pri: TicketPriority;
  status?: TicketStatus;
  who?: string;
}

export interface CreateProcessPayload {
  name: string;
  desc?: string;
  trigger: string;
  day: string;
  time?: string;
  targetSites: string;
  actions: string[];
}

export type ModalType =
  | 'addSite'
  | 'addCustomer'
  | 'editCustomer'
  | 'viewCustomer'
  | 'createTicket'
  | 'viewTicket'
  | 'confirm'
  | 'createProcess'
  | 'subscriptionPlan';

export interface ModalState {
  type: ModalType;
  data?: unknown;
  title?: string;
  body?: string;
  danger?: boolean;
  sites?: Site[];
  onSubmit?: (data: unknown) => void;
  onConfirm?: () => void;
  onManage?: (customer: Customer) => void;
}
