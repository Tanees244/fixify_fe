export interface SitePerformanceScreen {
  siteId: string;
  siteName: string;
  lastScan: string;
  scanning: boolean;
  lighthouse: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
  coreWebVitals: {
    lcp: { value: string; status: string };
    fid: { value: string; status: string };
    cls: { value: string; status: string };
  };
  history: number[];
  pages: Array<{
    url: string;
    score: number;
    lcp: string;
    fid: string;
    cls: string;
  }>;
}

export interface SiteSecurityScreen {
  siteId: string;
  siteName: string;
  score: number;
  criticalCount: number;
  vulnerabilities: Array<{
    key: string;
    title: string;
    severity: string;
    type: string;
    fix: string;
  }>;
  checklist: Array<{ label: string; ok: boolean }>;
  ssl: {
    valid: boolean;
    issuer: string;
    issued: string;
    expires: string;
    protocol: string;
    daysRemaining: number;
  };
}

export interface SiteSeoScreen {
  siteId: string;
  siteName: string;
  score: number;
  stats: {
    issuesFound: number;
    highImpactCount: number;
    pagesIndexed: number | null;
    pagesTotal: number;
    backlinks: number | null;
  };
  signals: Array<{ label: string; score: number }>;
  keywords: Array<Record<string, unknown>>;
  issues: Array<{
    key: string;
    title: string;
    impact: string;
    category: string;
  }>;
}

export interface GenerateReportRequest {
  websiteId: string;
  year: number;
  month: number;
  remarks?: string;
  autoSendToClient?: boolean;
}

export interface ApiReportRecord {
  _id: string;
  websiteId: string;
  year: number;
  month: number;
  monthName?: string;
  remarks?: string;
  autoSendToClient?: boolean;
  status: string;
  fileName: string;
  fileUrl?: string;
  fileSizeKb?: number;
  sentAt?: string | null;
  health?: number;
  perf?: number;
  sec?: number;
  seo?: number;
  uptime?: number;
  issuesFound?: number;
  issuesResolved?: number;
  highlights?: string[];
  createdAt?: string;
  updatedAt?: string;
}

/** GET /api/reports list item (FE MonthlyReport shape) */
export interface MonthlyReportListItem {
  id: string;
  siteId: string;
  custId?: string;
  siteName?: string;
  month?: string;
  monthKey?: string;
  health?: number;
  perf?: number;
  sec?: number;
  seo?: number;
  uptime?: number;
  issuesFound?: number;
  issuesResolved?: number;
  summary?: string;
  highlights?: string[];
  generatedAt?: string;
  generatedBy?: string;
  fileUrl?: string | null;
  fileName?: string;
  status?: string;
}

export interface ReportDownloadMeta {
  fileUrl?: string;
  fileName?: string;
  url?: string;
}

export interface UptimeHistoryDay {
  day: number;
  status: 'up' | 'degraded' | 'incident' | string;
}

export interface UptimeEndpoint {
  url: string;
  responseMs: number;
  status: string;
}

export interface UptimeResponseTrend {
  min: number;
  avg: number;
  max: number;
  points: number[];
}

export interface UptimeDashboard {
  siteId: string;
  site: string;
  checkInterval: string;
  uptime30d: number;
  avgResponseMs: number;
  avgResponseTargetMs: number;
  incidents30d: number;
  status: string;
  lastChecked: string;
  history90d: UptimeHistoryDay[];
  historyLegend?: Record<string, string>;
  responseTrend: UptimeResponseTrend;
  endpoints: UptimeEndpoint[];
}

// —— WordPress site management (GET /api/sites/{id}/wordpress/*) ——

export interface WpConnectionStatus {
  siteId: string;
  connected: boolean;
  connectPageUrl: string | null;
  reachable?: boolean;
  wpVersion?: string;
  agentVersion?: string;
  connectedAt?: string | null;
}

export interface WpApiPlugin {
  id: string;
  name: string;
  version: string;
  latestVersion: string;
  status: string;
  active: boolean;
}

export interface WpOverviewScreen {
  siteId: string;
  siteName: string;
  wordpress: { version: string; latestVersion: string; status: string; upToDate: boolean };
  plugins: { total: number; updatesPending: number; status: string };
  php: { version: string; status: string; isSupported: boolean };
  theme: { name: string; version: string };
}

export interface WpPluginsScreen {
  siteId: string;
  siteName: string;
  stats: { installed: number; updatesNeeded: number; active: number };
  plugins: WpApiPlugin[];
}

export interface WpCoreScreen {
  siteId: string;
  siteName: string;
  installed: { version: string; label: string };
  latest: { version: string; label: string };
  updateAvailable: boolean;
  environment: {
    phpVersion: string;
    lastCoreUpdate: string | null;
    ssl: string;
    sslValid: boolean;
    activeTheme: string;
  };
  status: string;
  runningVersion: string;
}

export interface WpThemeScreen {
  siteId: string;
  siteName: string;
  activeTheme: string;
  installed: { version: string; label: string };
  latest: { version: string; label: string };
  updateAvailable: boolean;
  upToDate: boolean;
  status: string;
  runningVersion: string;
}

export interface WpCacheScreen {
  siteId: string;
  siteName: string;
  cachePlugin: string;
  lastCacheClear: string | null;
  pageCache: { description: string };
  objectCache: { description: string };
}

export interface WpSecurityScreen {
  siteId: string;
  siteName: string;
  scanCoverage: string[];
  posture: {
    wordpress: string;
    ssl: string;
    sslValid: boolean;
    vulnerablePlugins: number;
    pendingUpdates: number;
    blacklisted: boolean;
    healthStatus: string;
    healthScore: number;
  };
}

export interface WpMaintenanceTask {
  lastRun: string | null;
  description: string;
}

export interface WpMaintenanceScreen {
  siteId: string;
  siteName: string;
  optimizeDatabase: WpMaintenanceTask;
  flushPermalinks: WpMaintenanceTask;
  regenerateThumbnails: WpMaintenanceTask;
}
