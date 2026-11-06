export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'expired' | 'canceled';
export type BillingInterval = 'month' | 'year';

/** `null` = unlimited for quota keys; for extra_site_price `null` = not allowed. */
export interface PlanLimits {
  max_sites: number | null;
  scan_frequency: 'weekly' | 'daily';
  seo_frequency: 'monthly' | 'weekly' | 'daily';
  manual_rescan: boolean;
  uptime_interval_min: number;
  uptime_endpoints: number | null;
  wp_manage: 'view' | 'view_update_alerts';
  automation: 'none' | 'monthly_plugin_updates' | 'weekly_custom';
  ai_insights: boolean;
  ask_ai_monthly: number | null;
  tickets_monthly: number | null;
  ticket_sla_hours: number;
  fix_hours_monthly: number;
  reports: boolean;
  export: boolean;
  extra_site_price: number | null;
}

export type PlanLimitKey = keyof PlanLimits;

export const DEFAULT_PLAN_LIMITS: PlanLimits = {
  max_sites: 1,
  scan_frequency: 'weekly',
  seo_frequency: 'monthly',
  manual_rescan: false,
  uptime_interval_min: 15,
  uptime_endpoints: 1,
  wp_manage: 'view',
  automation: 'none',
  ai_insights: true,
  ask_ai_monthly: 0,
  tickets_monthly: 2,
  ticket_sla_hours: 48,
  fix_hours_monthly: 0,
  reports: false,
  export: false,
  extra_site_price: null,
};

export interface PlanUsage {
  periodStart: string | null;
  periodEnd: string | null;
  sitesUsed: number;
  ticketsUsed: number;
  askAiUsed: number;
  fixMinutesUsed: number;
}

export interface SubscriptionPlanRef {
  id: string;
  slug: string;
  name: string;
  color: string;
}

export interface CustomerSubscription {
  status: SubscriptionStatus;
  plan: SubscriptionPlanRef;
  billingInterval: BillingInterval;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  graceEndsAt: string | null;
  extraSites: number;
  readOnly: boolean;
  limits: PlanLimits;
  usage: PlanUsage;
}

export interface AdminSubscriptionRow {
  customerId: string;
  customerName: string;
  company: string;
  email: string;
  planId: string;
  planName: string;
  status: SubscriptionStatus;
  billingInterval: BillingInterval;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
}

export interface AdminSubscriptionsList {
  items: AdminSubscriptionRow[];
  total: number;
  trialsEndingSoon: number;
}

export interface LimitField {
  key: PlanLimitKey;
  label: string;
  kind: 'number' | 'bool' | 'select';
  options?: { value: string; label: string }[];
  /** supports the "unlimited" checkbox (stored as null) */
  unlimited?: boolean;
  /** for this key null means "not allowed" instead of unlimited */
  nullMeansNotAllowed?: boolean;
}

export const LIMIT_FIELDS: LimitField[] = [
  { key: 'max_sites', label: 'Websites', kind: 'number', unlimited: true },
  {
    key: 'scan_frequency',
    label: 'Performance + Security scan',
    kind: 'select',
    options: [
      { value: 'weekly', label: 'Weekly' },
      { value: 'daily', label: 'Daily' },
    ],
  },
  {
    key: 'seo_frequency',
    label: 'SEO scan',
    kind: 'select',
    options: [
      { value: 'monthly', label: 'Monthly' },
      { value: 'weekly', label: 'Weekly' },
      { value: 'daily', label: 'Daily' },
    ],
  },
  { key: 'manual_rescan', label: 'Manual re-scan', kind: 'bool' },
  { key: 'uptime_interval_min', label: 'Uptime interval (min)', kind: 'number' },
  { key: 'uptime_endpoints', label: 'Monitored endpoints / site', kind: 'number', unlimited: true },
  {
    key: 'wp_manage',
    label: 'WordPress Manage',
    kind: 'select',
    options: [
      { value: 'view', label: 'View only' },
      { value: 'view_update_alerts', label: 'View + update alerts' },
    ],
  },
  {
    key: 'automation',
    label: 'Automation Processes',
    kind: 'select',
    options: [
      { value: 'none', label: 'None' },
      { value: 'monthly_plugin_updates', label: 'Monthly plugin updates' },
      { value: 'weekly_custom', label: 'Weekly + custom' },
    ],
  },
  { key: 'ai_insights', label: 'AI Insights', kind: 'bool' },
  { key: 'ask_ai_monthly', label: 'Ask AI questions / month', kind: 'number', unlimited: true },
  { key: 'tickets_monthly', label: 'Tickets / month', kind: 'number', unlimited: true },
  { key: 'ticket_sla_hours', label: 'Ticket response target (h)', kind: 'number' },
  { key: 'fix_hours_monthly', label: 'Included fix time (h/month)', kind: 'number' },
  { key: 'reports', label: 'Monthly reports', kind: 'bool' },
  { key: 'export', label: 'Export (Performance, Reports)', kind: 'bool' },
  {
    key: 'extra_site_price',
    label: 'Extra site price (USD/mo)',
    kind: 'number',
    unlimited: true,
    nullMeansNotAllowed: true,
  },
];
