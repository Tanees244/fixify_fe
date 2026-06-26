export interface ApiEnvelope<T = unknown> {
  success?: boolean;
  status?: number;
  message?: string;
  data: T;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyResetPasswordRequest {
  email: string;
  password: string;
  otp: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface LoginResponseData {
  token: string;
  user: Record<string, unknown>;
  clientProfile?: Record<string, unknown>;
}

export interface CurrentUserResponseData {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  avatar?: string;
  subtitle?: string;
  customerId?: number | null;
  account?: Record<string, unknown>;
  user?: Record<string, unknown>;
  clientProfile?: {
    _id?: string;
    id?: string | number;
    userId?: string | number;
    companyName?: string;
    phone?: string;
    address?: string;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
  } | null;
}

export interface CreateClientRequest {
  clientName: string;
  email: string;
  whatsappNumber: string;
  address?: string;
}

export interface CreateClientResponseData {
  user: Record<string, unknown>;
  clientProfile: Record<string, unknown>;
  credentials: {
    email: string;
    password: string;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface GetClientsParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export interface GetWebsitesParams {
  page?: number;
  limit?: number;
  status?: string;
  clientId?: string;
  search?: string;
}

export interface CreateWebsiteRequest {
  /** Optional — admin only. Customers are resolved from the auth token. */
  clientProfileId?: string;
  name: string;
  type?: string;
  url: string;
  logoUrl?: string | null;
  /** Optional legacy field — use url OR wpLoginUrl. */
  wpLoginUrl?: string;
  /** Optional for wordpress. */
  wpUsername?: string;
  /** Optional for wordpress. */
  wpPassword?: string;
}

export interface WordPressConnectInfo {
  connectPageUrl: string;
  connected: boolean;
}

export interface CreateWebsiteResponseData {
  _id?: string;
  id?: string;
  name?: string;
  domain?: string;
  platform?: string;
  type?: string;
  wordpressConnected?: boolean;
  wordpressConnectRequired?: boolean;
  wordpressConnect?: WordPressConnectInfo;
  [key: string]: unknown;
}

export interface CreateTicketRequest {
  websiteId: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent' | string;
}

export interface GetTicketsParams {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  clientId?: string;
  assignedTo?: string;
  search?: string;
  role?: string;
}

export interface UpdateTicketStatusRequest {
  status: string;
}

export interface AddTicketMessageRequest {
  message: string;
  isInternal: boolean;
}

export interface PageSpeedRequest {
  url: string;
  strategy: 'mobile' | 'desktop';
}

export interface PageSpeedResponse {
  success: boolean;
  url: string;
  strategy: string;
  scores: {
    performance: number | null;
    accessibility: number | null;
    bestPractices: number | null;
    seo: number | null;
  };
  metrics: {
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    totalBlockingTime: number;
    cumulativeLayoutShift: number;
    speedIndex: number;
    timeToInteractive: number;
  };
}

export interface UptimeResponse {
  success: boolean;
  ok: boolean;
  status: number;
  responseTimeMs: number;
  url: string;
}

export interface SSLResponse {
  success: boolean;
  isSecure: boolean;
  daysUntilExpiry?: number;
}

export interface PHPVersionResponse {
  success: boolean;
  version?: string;
  isSecure: boolean;
  isSupported: boolean;
  isEOL: boolean;
}

export interface WordPressPluginsResponse {
  success: boolean;
  error?: string;
  plugins?: unknown[];
  stats: {
    total: number;
    active: number;
    inactive: number;
    updatesAvailable: number;
  };
}

export interface WordPressUpdatesResponse {
  success: boolean;
  currentVersion?: string;
  latestVersion?: string;
  updateAvailable: boolean;
  themeVersion?: string;
  themeUpdateAvailable?: boolean;
}

export interface WordPressHealthResponse {
  success: boolean;
  status: string;
  score: number;
  criticalIssues: unknown[];
  recommendedImprovements: unknown[];
}

export interface AdminWebsiteDashboardData {
  website: Record<string, unknown>;
  healthSummary: Record<string, unknown>;
  performanceInsights: Record<string, unknown>;
}

export interface CustomerDashboardSummary {
  healthy: number;
  warnings: number;
  critical: number;
  openIssues: number;
}

export interface CustomerDashboardData {
  greeting: { name: string };
  summary: CustomerDashboardSummary;
  sites: unknown[];
  teamUpdates: unknown[];
  recommendations: unknown[];
  latestInsights: unknown[];
  recentTickets: unknown[];
}

export interface AdminMonthlyReportItem {
  _id: string;
  websiteId: string;
  year: number;
  month: number;
  fileName: string;
  fileUrl: string;
  status: string;
  remarks?: string;
  fileSizeKb?: number;
  createdAt: string;
  sentAt?: string | null;
}

export interface SubscriptionPlanRequest {
  name: string;
  price: number;
  color: string;
  features: string[];
}

export interface OnboardSiteWordPressRequest {
  siteName: string;
  siteUrl: string;
  loginUrl?: string;
  username?: string;
  password?: string;
  authType?: string;
  wpVersion?: string;
  enablePluginScan: boolean;
  enableAutoUpdates: boolean;
}

export interface OnboardSiteRequest {
  url: string;
  name: string;
  plan: string;
  type: string;
  platform: string;
  wordpress?: OnboardSiteWordPressRequest;
}

export interface OnboardCustomerRequest {
  name: string;
  email: string;
  company: string;
  phone: string;
  plan: string;
  site: OnboardSiteRequest;
}
