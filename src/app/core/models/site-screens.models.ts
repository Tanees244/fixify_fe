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
