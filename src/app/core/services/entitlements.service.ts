import { Injectable, computed, inject, signal } from '@angular/core';
import { CustomerSubscription, PlanLimits } from '../models/billing.models';
import { mapCustomerSubscription } from '../utils/billing-mappers.util';
import { BillingApiService } from './api/billing-api.service';
import { AuthService } from './auth.service';

const DAY_MS = 86_400_000;

/**
 * Customer-side view of the backend `entitlements(customer)` result.
 * The backend is the source of truth and enforces every limit; this service only
 * drives UI state (locks, banners, counters). If the subscription cannot be loaded
 * (e.g. backend not deployed yet) nothing is locked.
 */
@Injectable({ providedIn: 'root' })
export class EntitlementsService {
  private readonly api = inject(BillingApiService);
  private readonly auth = inject(AuthService);

  readonly subscription = signal<CustomerSubscription | null>(null);
  private loadedFor: string | null = null;
  readonly loaded = signal(false);
  readonly loading = signal(false);

  readonly status = computed(() => this.subscription()?.status ?? null);
  readonly limits = computed<PlanLimits | null>(() => this.subscription()?.limits ?? null);
  readonly usage = computed(() => this.subscription()?.usage ?? null);
  readonly readOnly = computed(() => this.subscription()?.readOnly === true);

  readonly trialDaysLeft = computed(() => {
    const s = this.subscription();
    if (!s || s.status !== 'trialing' || !s.trialEndsAt) return null;
    return Math.max(0, Math.ceil((new Date(s.trialEndsAt).getTime() - Date.now()) / DAY_MS));
  });

  readonly graceDaysLeft = computed(() => {
    const s = this.subscription();
    if (!s || s.status !== 'past_due' || !s.graceEndsAt) return null;
    return Math.max(0, Math.ceil((new Date(s.graceEndsAt).getTime() - Date.now()) / DAY_MS));
  });

  /** Sites allowed = max_sites + extra_sites (null = unlimited). */
  readonly siteAllowance = computed(() => {
    const s = this.subscription();
    if (!s) return null;
    return s.limits.max_sites === null ? null : s.limits.max_sites + s.extraSites;
  });

  load(force = false): void {
    const user = this.auth.getCurrentUser();
    if (user?.role !== 'customer' || !this.auth.getToken()) return;
    if (this.loadedFor !== user.id) {
      this.reset();
      this.loadedFor = user.id;
    }
    if (this.loading()) return;
    if (this.loaded() && !force) return;
    this.loading.set(true);
    this.api.getSubscription().subscribe({
      next: (res) => {
        this.subscription.set(res.data ? mapCustomerSubscription(res.data) : null);
        this.loaded.set(true);
        this.loading.set(false);
      },
      error: () => {
        this.loaded.set(true);
        this.loading.set(false);
      },
    });
  }

  refresh(): void {
    this.load(true);
  }

  reset(): void {
    this.subscription.set(null);
    this.loaded.set(false);
  }

  /** Boolean feature flag; true when subscription unknown so nothing is wrongly locked. */
  can(key: 'manual_rescan' | 'reports' | 'export' | 'ai_insights'): boolean {
    if (this.readOnly()) return false;
    const l = this.limits();
    return l ? l[key] : true;
  }

  /** Feature locked purely by plan (not by expiry) — used to pick the lock tooltip. */
  lockedByPlan(key: 'manual_rescan' | 'reports' | 'export' | 'ai_insights'): boolean {
    const l = this.limits();
    return l ? !l[key] : false;
  }

  lockHint(key: 'manual_rescan' | 'reports' | 'export' | 'ai_insights' | 'automation'): string {
    if (this.readOnly()) return 'Your trial has ended — choose a plan';
    return key === 'export' ? 'Available on Business' : 'Available on Pro';
  }

  canCreateAutomation(): boolean {
    if (this.readOnly()) return false;
    const l = this.limits();
    return l ? l.automation !== 'none' : true;
  }

  // —— Quotas ——
  askAiRemaining(): number | null {
    const l = this.limits();
    const u = this.usage();
    if (!l || !u || l.ask_ai_monthly === null) return null;
    return Math.max(0, l.ask_ai_monthly - u.askAiUsed);
  }

  canAskAi(): boolean {
    if (this.readOnly()) return false;
    const rem = this.askAiRemaining();
    return rem === null || rem > 0;
  }

  ticketsRemaining(): number | null {
    const l = this.limits();
    const u = this.usage();
    if (!l || !u || l.tickets_monthly === null) return null;
    return Math.max(0, l.tickets_monthly - u.ticketsUsed);
  }

  canCreateTicket(): boolean {
    if (this.readOnly()) return false;
    const rem = this.ticketsRemaining();
    return rem === null || rem > 0;
  }

  canAddSite(currentSites?: number): boolean {
    if (this.readOnly()) return false;
    const allowed = this.siteAllowance();
    if (allowed === null || !this.subscription()) return true;
    const used = currentSites ?? this.usage()?.sitesUsed ?? 0;
    return used < allowed;
  }

  /** Reset date (end of current billing/trial period). */
  resetDate(): string | null {
    const s = this.subscription();
    return this.usage()?.periodEnd ?? s?.currentPeriodEnd ?? s?.trialEndsAt ?? null;
  }

  intervalLabel(): string {
    const m = this.limits()?.uptime_interval_min;
    return m ? `${m}-min checks` : '';
  }

  limitLabel(v: number | null): string {
    return v === null ? 'Unlimited' : String(v);
  }
}
