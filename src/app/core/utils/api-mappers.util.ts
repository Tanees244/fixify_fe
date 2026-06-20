import {
  Customer,
  OnboardCustomerPayload,
  Site,
  SiteStatus,
  SubscriptionPlan,
  Ticket,
  TicketPriority,
  TicketStatus,
  WordPressPlugin,
  WordPressSiteState,
} from '../models/fixify.models';
import { OnboardCustomerRequest } from '../models/api.models';
import { EntityIdRegistry } from '../services/entity-id-registry.service';
import { formatPriceLabel } from '../constants/subscription.constants';
import { initials } from './api-user.util';

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function strId(v: unknown): string {
  if (v == null) return '';
  return String(v);
}

function parseSiteUrl(raw: Record<string, unknown>): string {
  let websiteUrl = String(raw['domain'] ?? '');
  if (websiteUrl && !websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
    websiteUrl = `https://${websiteUrl}`;
  }
  if (!websiteUrl) {
    const wp = String(raw['wpLoginUrl'] ?? '');
    try {
      if (wp) {
        const u = new URL(wp);
        websiteUrl = `${u.protocol}//${u.host}`;
      }
    } catch {
      websiteUrl = wp || '';
    }
  }
  return websiteUrl;
}

function healthFromStats(stats: Record<string, unknown> | undefined): {
  health: number;
  perf: number;
  sec: number;
  seo: number;
  up: number;
  issues: number;
  st: SiteStatus;
} {
  const secRaw = String(stats?.['securityStatus'] ?? 'secure').toLowerCase();
  const sec =
    secRaw === 'critical' ? 45 : secRaw === 'warning' ? 65 : 85;
  const pending = typeof stats?.['pendingUpdates'] === 'number' ? stats['pendingUpdates'] : 0;
  const uptimeRaw = stats?.['uptime'];
  let up = 99.5;
  if (typeof uptimeRaw === 'number') up = uptimeRaw;
  else if (typeof uptimeRaw === 'string') up = parseFloat(uptimeRaw) || 99.5;

  const perf = 72;
  const seo = 70;
  const health = Math.round((perf + sec + seo + up) / 4);
  const st: SiteStatus = health >= 80 ? 'ok' : health >= 60 ? 'warn' : 'bad';

  return { health, perf, sec, seo, up, issues: pending, st };
}

export function mapApiSubscriptionPlan(raw: unknown): SubscriptionPlan {
  const p = isRecord(raw) ? raw : {};
  const price = typeof p['price'] === 'number' ? p['price'] : 0;
  return {
    id: String(p['id'] ?? ''),
    name: String(p['name'] ?? 'Plan'),
    price,
    priceLabel: String(p['priceLabel'] ?? formatPriceLabel(price)),
    color: String(p['color'] ?? '#6b88ad'),
    features: Array.isArray(p['features']) ? p['features'].map((f) => String(f)) : [],
  };
}

export function mapOnboardCustomerRequest(data: OnboardCustomerPayload): OnboardCustomerRequest {
  const wp = data.site.wordpress;
  const siteType = data.site.type === 'cms' ? 'custom' : data.site.type || 'custom';

  return {
    name: data.name,
    email: data.email,
    company: data.company || data.name,
    phone: data.phone || '',
    plan: data.plan,
    site: {
      url: data.site.url,
      name: data.site.name || data.site.url,
      plan: data.site.plan || data.plan,
      type: siteType,
      platform: data.site.platform || 'wordpress',
      wordpress: wp
        ? {
            siteName: wp.siteName,
            siteUrl: wp.siteUrl,
            loginUrl: wp.loginUrl,
            username: wp.username,
            password: wp.password,
            authType: wp.authType,
            wpVersion: wp.wpVersion,
            enablePluginScan: wp.enablePluginScan,
            enableAutoUpdates: wp.enableAutoUpdates,
          }
        : undefined,
    },
  };
}

export function mapApiClientToCustomer(raw: unknown, ids: EntityIdRegistry): Customer {
  const c = isRecord(raw) ? raw : {};
  const profileId = strId(c['_id'] ?? c['id']);

  let userName = String(c['companyName'] ?? 'Client');
  let userEmail = '';
  const userField = c['user'];
  if (isRecord(userField)) {
    userName = String(userField['name'] ?? userName);
    userEmail = String(userField['email'] ?? '');
  }
  const userIdField = c['userId'];
  if (isRecord(userIdField)) {
    userEmail = String(userIdField['email'] ?? userEmail);
    userName = String(userIdField['name'] ?? userName);
  }

  const st = String(c['status'] ?? 'active').toLowerCase();
  const isActive = st === 'active';
  const localId = profileId ? ids.clientLocalId(profileId) : ids.clientLocalId(String(Date.now()));

  return {
    id: localId,
    apiId: profileId,
    name: userName,
    email: userEmail,
    company: String(c['companyName'] ?? userName),
    plan: 'free',
    status: isActive ? 'active' : 'inactive',
    approvalStatus: isActive ? 'approved' : st === 'pending' ? 'pending' : 'approved',
    joined: c['createdAt']
      ? new Date(String(c['createdAt'])).toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        })
      : '—',
    avatar: initials(userName || userEmail || 'CL'),
    phone: String(c['whatsappNumber'] ?? c['phone'] ?? ''),
  };
}

export function mapApiWebsiteToSite(
  raw: unknown,
  ids: EntityIdRegistry,
  clientProfileId?: string
): Site {
  const w = isRecord(raw) ? raw : {};
  const apiId = strId(w['_id'] ?? w['id']);
  const name = String(w['name'] ?? w['domain'] ?? 'Website');
  const domain = parseSiteUrl(w) || name;
  const displayName = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

  let custApiId = clientProfileId ?? '';
  const cp = w['clientProfileId'] ?? w['clientProfile'];
  if (isRecord(cp)) {
    custApiId = strId(cp['_id'] ?? cp['id']);
  } else if (cp != null) {
    custApiId = strId(cp);
  }

  const stats = isRecord(w['stats']) ? w['stats'] : undefined;
  const metrics = healthFromStats(stats);
  const localSiteId = apiId ? ids.websiteLocalId(apiId) : ids.websiteLocalId(String(Date.now()));
  const custId = custApiId ? ids.clientLocalId(custApiId) : 0;

  return {
    id: localSiteId,
    apiId,
    name: displayName,
    domain,
    fa: name.slice(0, 2).toUpperCase(),
    health: metrics.health,
    perf: metrics.perf,
    sec: metrics.sec,
    seo: metrics.seo,
    up: metrics.up,
    st: metrics.st,
    plan: 'Standard',
    issues: metrics.issues,
    scan: stats?.['lastChecked']
      ? new Date(String(stats['lastChecked'])).toLocaleDateString()
      : '—',
    lcp: '2.8s',
    fid: '45ms',
    cls: '0.11',
    custId,
    type: 'wordpress',
    platform: 'wordpress',
  };
}

function mapApiPriority(pri: string): TicketPriority {
  const p = pri.toLowerCase();
  if (p === 'urgent' || p === 'critical') return 'critical';
  if (p === 'high') return 'high';
  if (p === 'low') return 'low';
  return 'medium';
}

function mapApiStatusToFixify(status: string): TicketStatus {
  const v = status.toLowerCase().replace(/\s/g, '_');
  if (v === 'open' || v === 'pending' || v === 'new') return 'open';
  if (v === 'in_progress' || v === 'in-progress' || v === 'inprogress') return 'inprogress';
  if (v === 'testing' || v === 'review') return 'testing';
  if (v === 'closed') return 'closed';
  if (v === 'resolved' || v === 'done') return 'resolved';
  return 'open';
}

function timeAgo(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  } catch {
    return '—';
  }
}

export function mapApiTicketToFixify(raw: unknown, ids: EntityIdRegistry): Ticket {
  const tr = isRecord(raw) ? raw : {};
  const id = strId(tr['_id'] ?? tr['id']);

  const clientProfileRaw = tr['clientProfile'] ?? tr['clientProfileId'];
  const clientProfile = isRecord(clientProfileRaw) ? clientProfileRaw : undefined;

  const websiteRaw = tr['website'] ?? tr['websiteId'];
  const website = isRecord(websiteRaw) ? websiteRaw : undefined;

  const custApiId = clientProfile
    ? strId(clientProfile['_id'] ?? clientProfile['id'])
    : strId(tr['clientProfileId']);
  const custId = custApiId ? ids.clientLocalId(custApiId) : 0;

  let customerName = '';
  if (clientProfile) {
    customerName = String(clientProfile['companyName'] ?? '');
    const userId = clientProfile['userId'];
    if (!customerName && isRecord(userId)) {
      customerName = String(userId['name'] ?? '');
    }
  }

  const websiteName = website
    ? String(website['name'] ?? website['domain'] ?? '')
    : String(tr['websiteName'] ?? '');

  const websiteApiId = website
    ? strId(website['_id'] ?? website['id'])
    : isRecord(tr['websiteId'])
      ? ''
      : strId(tr['websiteId']);

  const assigned = tr['assignedUser'];
  let who = 'Unassigned';
  if (isRecord(assigned)) {
    who = String(assigned['name'] ?? assigned['email'] ?? 'Assigned');
  }

  const pri = mapApiPriority(String(tr['priority'] ?? 'medium'));
  const status = mapApiStatusToFixify(String(tr['status'] ?? 'open'));
  const createdAt = String(tr['createdAt'] ?? new Date().toISOString());

  return {
    id: id || `TK-${Date.now()}`,
    apiId: id,
    title: String(tr['title'] ?? 'Ticket'),
    site: websiteName || '—',
    customerName: customerName || undefined,
    websiteApiId: websiteApiId || undefined,
    custId,
    type: String(tr['category'] ?? 'support'),
    pri,
    status,
    who,
    ago: timeAgo(createdAt),
    desc: String(tr['description'] ?? ''),
  };
}

export function mapWordPressPluginsResponse(
  siteId: number,
  response: { plugins?: unknown[]; stats?: { updatesAvailable?: number } },
  existing?: WordPressSiteState
): WordPressSiteState {
  const plugins: WordPressPlugin[] = (response.plugins ?? []).map((raw, idx) => {
    const p = isRecord(raw) ? raw : {};
    const version = String(p['version'] ?? '1.0.0');
    const latest = String(p['new_version'] ?? p['latestVersion'] ?? version);
    const needsUpdate = latest !== version;
    return {
      id: strId(p['slug'] ?? p['id'] ?? idx),
      name: String(p['name'] ?? p['title'] ?? 'Plugin'),
      version,
      latestVersion: latest,
      status: needsUpdate ? 'update' : 'ok',
      active: p['active'] !== false && p['status'] !== 'inactive',
    } as WordPressPlugin;
  });

  return {
    siteId,
    wpVersion: existing?.wpVersion ?? '6.4.0',
    latestWpVersion: existing?.latestWpVersion ?? '6.5.0',
    phpVersion: existing?.phpVersion ?? '8.2',
    activeTheme: existing?.activeTheme ?? 'Theme',
    themeVersion: existing?.themeVersion ?? '1.0.0',
    latestThemeVersion: existing?.latestThemeVersion ?? '1.0.0',
    plugins: plugins.length ? plugins : (existing?.plugins ?? []),
    cachePlugin: existing?.cachePlugin ?? 'Cache',
    lastCacheClear: existing?.lastCacheClear ?? '—',
    lastCoreUpdate: existing?.lastCoreUpdate ?? '—',
    sslValid: existing?.sslValid ?? true,
    dbOptimized: existing?.dbOptimized ?? '—',
  };
}

export function fixifyStatusToApi(status: TicketStatus): string {
  switch (status) {
    case 'open':
      return 'pending';
    case 'inprogress':
      return 'in_progress';
    case 'testing':
      return 'in_progress';
    case 'resolved':
      return 'resolved';
    case 'closed':
      return 'closed';
    default:
      return 'pending';
  }
}

export function fixifyPriorityToApi(pri: TicketPriority): string {
  if (pri === 'critical') return 'urgent';
  return pri;
}
