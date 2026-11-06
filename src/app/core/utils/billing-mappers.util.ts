import {
  AdminSubscriptionRow,
  AdminSubscriptionsList,
  BillingInterval,
  CustomerSubscription,
  PlanUsage,
  SubscriptionStatus,
} from '../models/billing.models';
import { mapPlanLimits } from './api-mappers.util';

const STATUSES: SubscriptionStatus[] = ['trialing', 'active', 'past_due', 'expired', 'canceled'];

function rec(v: unknown): Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
}
const str = (v: unknown): string | null => (typeof v === 'string' && v ? v : null);
const num = (v: unknown, d = 0): number => (typeof v === 'number' ? v : d);
const status = (v: unknown): SubscriptionStatus =>
  STATUSES.includes(v as SubscriptionStatus) ? (v as SubscriptionStatus) : 'active';
const interval = (v: unknown): BillingInterval => (v === 'year' ? 'year' : 'month');

export function mapUsage(raw: unknown): PlanUsage {
  const u = rec(raw);
  return {
    periodStart: str(u['periodStart']),
    periodEnd: str(u['periodEnd']),
    sitesUsed: num(u['sitesUsed']),
    ticketsUsed: num(u['ticketsUsed']),
    askAiUsed: num(u['askAiUsed']),
    fixMinutesUsed: num(u['fixMinutesUsed']),
  };
}

export function mapCustomerSubscription(raw: unknown): CustomerSubscription {
  const s = rec(raw);
  const plan = rec(s['plan']);
  const st = status(s['status']);
  return {
    status: st,
    plan: {
      id: String(plan['id'] ?? ''),
      slug: String(plan['slug'] ?? ''),
      name: String(plan['name'] ?? 'Plan'),
      color: String(plan['color'] ?? '#6b88ad'),
    },
    billingInterval: interval(s['billingInterval']),
    trialStartedAt: str(s['trialStartedAt']),
    trialEndsAt: str(s['trialEndsAt']),
    currentPeriodStart: str(s['currentPeriodStart']),
    currentPeriodEnd: str(s['currentPeriodEnd']),
    cancelAtPeriodEnd: s['cancelAtPeriodEnd'] === true,
    graceEndsAt: str(s['graceEndsAt']),
    extraSites: num(s['extraSites']),
    readOnly: typeof s['readOnly'] === 'boolean' ? (s['readOnly'] as boolean) : st === 'expired',
    limits: mapPlanLimits(s['limits']),
    usage: mapUsage(s['usage']),
  };
}

export function mapAdminSubscriptionRow(raw: unknown): AdminSubscriptionRow {
  const r = rec(raw);
  return {
    customerId: String(r['customerId'] ?? ''),
    customerName: String(r['customerName'] ?? ''),
    company: String(r['company'] ?? ''),
    email: String(r['email'] ?? ''),
    planId: String(r['planId'] ?? ''),
    planName: String(r['planName'] ?? ''),
    status: status(r['status']),
    billingInterval: interval(r['billingInterval']),
    trialEndsAt: str(r['trialEndsAt']),
    currentPeriodEnd: str(r['currentPeriodEnd']),
  };
}

export function mapAdminSubscriptionsList(raw: unknown): AdminSubscriptionsList {
  const r = rec(raw);
  const items = Array.isArray(r['items']) ? r['items'].map(mapAdminSubscriptionRow) : [];
  return {
    items,
    total: num(r['total'], items.length),
    trialsEndingSoon: num(r['trialsEndingSoon']),
  };
}
