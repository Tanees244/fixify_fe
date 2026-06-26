import { TicketPriority, TicketStatus, InsightSeverity, SiteStatus } from '../models/fixify.models';
import { BadgeVariant } from '../../shared/components/badge/badge.component';

export function scoreColor(s: number): string {
  return s >= 80 ? '#059669' : s >= 60 ? '#d97706' : '#dc2626';
}

export function scoreBadge(s: number): BadgeVariant {
  return s >= 80 ? 'bok' : s >= 60 ? 'bwn' : 'ber';
}

export function siteStatusColor(s: SiteStatus): string {
  return ({ ok: '#059669', warn: '#d97706', bad: '#dc2626' })[s] || '#9590b8';
}

export function priorityColor(p: TicketPriority): string {
  return ({ critical: '#dc2626', high: '#d97706', medium: '#2563eb', low: '#9590b8' })[p];
}

export function priorityBadge(p: TicketPriority): BadgeVariant {
  const map: Record<TicketPriority, BadgeVariant> = {
    critical: 'ber',
    high: 'bwn',
    medium: 'bbl',
    low: 'bgr',
  };
  return map[p];
}

export function ticketStatusBadge(s: TicketStatus): BadgeVariant {
  const map: Record<TicketStatus, BadgeVariant> = {
    open: 'bbl',
    inprogress: 'bwn',
    testing: 'bac',
    resolved: 'bok',
    closed: 'bgr',
  };
  return map[s] ?? 'bgr';
}

export function ticketStatusLabel(s: TicketStatus | string): string {
  return ({
    open: 'Open',
    inprogress: 'In Progress',
    testing: 'Testing',
    resolved: 'Resolved',
    closed: 'Closed',
  })[s] || s;
}

/** Maps a backend ticket status (e.g. "in_progress") to the FE union. */
export function apiTicketStatus(s: string | undefined | null): TicketStatus {
  switch ((s ?? '').toLowerCase().replace(/[\s-]/g, '_')) {
    case 'in_progress':
    case 'inprogress':
      return 'inprogress';
    case 'resolved':
      return 'resolved';
    case 'closed':
      return 'closed';
    case 'testing':
      return 'testing';
    default:
      return 'open';
  }
}

/** Maps the FE status union back to the backend's expected value. */
export function ticketStatusToApi(s: TicketStatus): string {
  return s === 'inprogress' ? 'in_progress' : s;
}

/** Title-cases a backend category for display + badge matching. */
export function prettyTicketCategory(c: string | undefined | null): string {
  const key = (c ?? '').toLowerCase();
  const map: Record<string, string> = {
    performance: 'Performance',
    security: 'Security',
    seo: 'SEO',
    bug: 'Bug',
    uptime: 'Uptime',
  };
  if (map[key]) return map[key];
  return key ? key.charAt(0).toUpperCase() + key.slice(1) : 'General';
}

export function normalizeTicketPriority(p: string | undefined | null): TicketPriority {
  const key = (p ?? '').toLowerCase();
  if (key === 'critical' || key === 'urgent') return 'critical';
  if (key === 'high') return 'high';
  if (key === 'low') return 'low';
  return 'medium';
}

export function severityBadge(s: InsightSeverity): BadgeVariant {
  const map: Record<InsightSeverity, BadgeVariant> = {
    critical: 'ber',
    high: 'bwn',
    medium: 'bbl',
    info: 'bok',
  };
  return map[s] ?? 'bgr';
}

export function severityBg(s: InsightSeverity): string {
  return ({ critical: '#fef2f2', high: '#fffbeb', medium: '#eff6ff', info: '#f0fdf4' })[s] || '#f0f0f0';
}

export function severityIcon(s: InsightSeverity): string {
  return ({ critical: '🔴', high: '🟠', medium: '🔵', info: '🟢' })[s] || '⚪';
}

export function suggestLoginUrl(siteUrl: string): string {
  const trimmed = siteUrl.trim().replace(/\/$/, '');
  if (!trimmed) return '';
  if (trimmed.includes('/wp-admin') || trimmed.includes('/wp-login.php')) {
    return trimmed;
  }
  return `${trimmed}/wp-admin`;
}

export function planColor(p: string): string {
  const map: Record<string, string> = {
    free: '#6b88ad',
    standard: '#1d6fe0',
    pro: '#059669',
    Free: '#6b88ad',
    Standard: '#1d6fe0',
    Pro: '#059669',
  };
  return map[p] ?? '#6b88ad';
}

export function formatDateLong(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

/** Humanized relative time from an epoch-ms timestamp, e.g. "just now", "2h ago". */
export function relativeTime(ms: number): string {
  const diff = Date.now() - ms;
  if (diff < 45000) return 'just now';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}
