import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { BillingApiService } from '../../../core/services/api/billing-api.service';
import { EntitlementsService } from '../../../core/services/entitlements.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SubscriptionPlan } from '../../../core/models/fixify.models';
import { mapApiSubscriptionPlan } from '../../../core/utils/api-mappers.util';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { PlanPickerComponent, PlanPick } from '../../../shared/components/plan-picker/plan-picker.component';
import { StatCardsSkeletonComponent } from '../../../shared/components/stat-cards-skeleton/stat-cards-skeleton.component';
import { tw } from '../../../shared/ui/tw';

@Component({
  selector: 'app-customer-billing',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, BadgeComponent, PlanPickerComponent, StatCardsSkeletonComponent],
  template: `
    <div data-allow>
      <div [class]="ui.pageHeader">
        <div>
          <div [class]="ui.pageTitle">Billing</div>
          <div [class]="ui.pageSub">Your plan, usage and invoices</div>
        </div>
      </div>

      @if (ent.subscription(); as s) {
        <div [class]="ui.grid3 + ' ' + ui.u" style="margin-bottom: 22px">
          <div [class]="ui.statCard">
            <div [class]="ui.statLbl">Current plan</div>
            <div [class]="ui.statVal" [style.color]="s.plan.color">{{ s.plan.name }}</div>
            <div [class]="ui.statSub">Billed {{ s.billingInterval === 'year' ? 'yearly' : 'monthly' }}</div>
          </div>
          <div [class]="ui.statCard">
            <div [class]="ui.statLbl">Status</div>
            <div style="margin-top: 6px">
              <app-badge [variant]="statusVariant(s.status)">{{ statusLabel(s.status) }}</app-badge>
            </div>
            <div [class]="ui.statSub">
              @if (s.status === 'trialing') {
                {{ ent.trialDaysLeft() }} days left · ends {{ s.trialEndsAt | date: 'mediumDate' }}
              } @else if (s.cancelAtPeriodEnd) {
                Access until {{ s.currentPeriodEnd | date: 'mediumDate' }}
              }
            </div>
          </div>
          <div [class]="ui.statCard">
            <div [class]="ui.statLbl">Next billing date</div>
            <div [class]="ui.statVal">
              {{ s.status === 'active' || s.status === 'past_due' ? (s.currentPeriodEnd | date: 'mediumDate') : '—' }}
            </div>
            <div [class]="ui.statSub">{{ s.extraSites }} extra site{{ s.extraSites === 1 ? '' : 's' }}</div>
          </div>
        </div>

        <div [class]="ui.card + ' ' + ui.cardPad + ' ' + ui.u" style="margin-bottom: 22px">
          <div style="font-weight: 700; font-size: 15px; margin-bottom: 14px">Usage this period</div>
          <div style="display: flex; flex-direction: column; gap: 14px">
            @for (r of usageRows(); track r.label) {
              <div>
                <div style="display: flex; justify-content: space-between; font-size: 12.5px; margin-bottom: 5px">
                  <span style="color: var(--t2)">{{ r.label }}</span>
                  <span style="font-weight: 600">{{ r.used }} / {{ r.limit }}</span>
                </div>
                <div style="height: 8px; border-radius: 99px; background: var(--bd); overflow: hidden">
                  <div
                    style="height: 100%; border-radius: 99px"
                    [style.width.%]="r.pct"
                    [style.background]="r.pct >= 100 ? 'var(--er)' : r.pct >= 80 ? 'var(--wn)' : 'var(--acc)'"
                  ></div>
                </div>
              </div>
            }
          </div>
          @if (ent.resetDate(); as d) {
            <div style="font-size: 12px; color: var(--t3); margin-top: 12px">Resets {{ d | date: 'mediumDate' }}</div>
          }
        </div>

        <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 26px">
          <button type="button" [class]="ui.btn + ' ' + ui.btnPrimary" [disabled]="busy()" (click)="showPlans.set(!showPlans())">
            {{ showPlans() ? 'Hide plans' : 'Change plan' }}
          </button>
          <button
            type="button"
            [class]="ui.btn + ' ' + ui.btnGhost"
            [disabled]="busy()"
            (click)="openPortal()"
          >
            Manage billing
          </button>
          @if (s.cancelAtPeriodEnd && s.status !== 'expired') {
            <button type="button" [class]="ui.btn + ' ' + ui.btnPrimary" [disabled]="busy()" (click)="resume()">
              Resume plan
            </button>
          }
          @if (s.status === 'active' && !s.cancelAtPeriodEnd) {
            <button type="button" [class]="ui.btn + ' ' + ui.btnGhost" [disabled]="busy()" (click)="cancel()">
              Cancel plan
            </button>
          }
        </div>
      } @else if (ent.loading()) {
        <div [class]="ui.u" style="margin-bottom: 22px" aria-busy="true" aria-label="Loading billing">
          <app-stat-cards-skeleton [count]="3" [gridClass]="ui.grid3" />
        </div>
        <div [class]="ui.card + ' ' + ui.cardPad + ' ' + ui.u" style="margin-bottom: 22px">
          <div [class]="ui.skelCell" style="height: 16px; width: 30%; margin-bottom: 18px"></div>
          @for (i of [1, 2, 3, 4]; track i) {
            <div style="margin-bottom: 14px">
              <div [class]="ui.skelCell" style="height: 12px; width: 100%; margin-bottom: 8px"></div>
              <div [class]="ui.skelBlock" style="height: 8px; width: 100%"></div>
            </div>
          }
        </div>
      } @else {
        <div [class]="ui.card + ' ' + ui.cardPad" style="margin-bottom: 22px; color: var(--t3)">
          Billing information is not available yet.
        </div>
      }

      @if (showPlans() || (ent.loaded() && !ent.subscription())) {
        <app-plan-picker
          [plans]="plans()"
          [currentPlanId]="currentPlanId()"
          [initialInterval]="ent.subscription()?.billingInterval ?? 'month'"
          [busy]="busy()"
          [busyPlanId]="busyPlanId()"
          [ctaLabel]="ent.subscription()?.status === 'active' ? 'Switch to this plan' : 'Choose plan'"
          (picked)="choose($event)"
        />
      }
    </div>
  `,
})
export class BillingComponent implements OnInit {
  protected readonly ui = tw;
  protected readonly ent = inject(EntitlementsService);
  private readonly api = inject(BillingApiService);
  private readonly toast = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);

  readonly plans = signal<SubscriptionPlan[]>([]);
  readonly showPlans = signal(false);
  readonly busy = signal(false);
  readonly busyPlanId = signal<string | null>(null);

  ngOnInit(): void {
    this.ent.refresh();
    this.api.getPublicPlans().subscribe({
      next: (res) => this.plans.set((res.data?.items ?? []).map(mapApiSubscriptionPlan)),
    });
    const checkout = this.route.snapshot.queryParamMap.get('checkout');
    if (checkout === 'success') this.toast.success('Payment received — your plan is active');
    if (checkout === 'cancel') this.toast.info('Checkout canceled');
    if (this.route.snapshot.queryParamMap.get('portal') === 'mock') {
      this.toast.info('Demo mode: the Stripe billing portal is not available.');
    }
  }

  currentPlanId(): string | null {
    const s = this.ent.subscription();
    return s && s.status === 'active' ? s.plan.id : null;
  }

  statusLabel(s: string): string {
    return { trialing: 'Trial', active: 'Active', past_due: 'Past due', expired: 'Expired', canceled: 'Canceled' }[s] ?? s;
  }

  statusVariant(s: string): 'bok' | 'bwn' | 'ber' | 'bgr' {
    return s === 'active' ? 'bok' : s === 'expired' ? 'ber' : s === 'trialing' ? 'bgr' : 'bwn';
  }

  usageRows(): { label: string; used: string; limit: string; pct: number }[] {
    const s = this.ent.subscription();
    if (!s) return [];
    const u = s.usage;
    const l = s.limits;
    const allowedSites = this.ent.siteAllowance();
    const row = (label: string, used: number, max: number | null, fmt = (n: number) => String(n)) => ({
      label,
      used: fmt(used),
      limit: max === null ? 'Unlimited' : fmt(max),
      pct: max === null ? 0 : max === 0 ? 100 : Math.min(100, Math.round((used / max) * 100)),
    });
    const hours = (n: number) => `${Math.round((n / 60) * 10) / 10}h`;
    return [
      row('Websites', u.sitesUsed, allowedSites),
      row('Tickets', u.ticketsUsed, l.tickets_monthly),
      row('Ask AI questions', u.askAiUsed, l.ask_ai_monthly),
      row('Fix time', u.fixMinutesUsed, l.fix_hours_monthly * 60, hours),
    ];
  }

  choose(pick: PlanPick): void {
    const s = this.ent.subscription();
    this.busy.set(true);
    this.busyPlanId.set(pick.plan.id);
    const current = this.plans().find((p) => p.id === s?.plan.id);
    const call =
      s && s.status === 'active'
        ? this.api.changePlan(
            pick.plan.id,
            current && pick.plan.price < current.price ? 'downgrade' : 'upgrade',
            pick.interval
          )
        : this.api.checkout(pick.plan.id, pick.interval);
    call.subscribe({
      next: (res) => {
        const url = (res.data as { url?: string } | undefined)?.url;
        if (url) {
          window.location.href = url;
          return;
        }
        this.busy.set(false);
        this.busyPlanId.set(null);
        this.showPlans.set(false);
        this.ent.refresh();
        this.toast.success(`Plan changed to ${pick.plan.name}`);
      },
      error: (err) => {
        this.busy.set(false);
        this.busyPlanId.set(null);
        this.toast.error(err?.error?.message || 'Could not start checkout');
      },
    });
  }

  openPortal(): void {
    this.busy.set(true);
    this.api.portal().subscribe({
      next: (res) => {
        const data = res.data as { url?: string; mock?: boolean } | undefined;
        if (data?.mock) {
          // Demo mode has no Stripe portal; stay on the page instead of reloading it.
          this.busy.set(false);
          this.toast.info('Demo mode: the Stripe billing portal is not available.');
          return;
        }
        if (data?.url) window.location.href = data.url;
        else this.busy.set(false);
      },
      error: (err) => {
        this.busy.set(false);
        this.toast.error(err?.error?.message || 'Could not open billing portal');
      },
    });
  }

  resume(): void {
    this.busy.set(true);
    this.api.resume().subscribe({
      next: () => {
        this.busy.set(false);
        this.ent.refresh();
        this.toast.success('Plan resumed');
      },
      error: (err) => {
        this.busy.set(false);
        this.toast.error(err?.error?.message || 'Could not resume plan');
      },
    });
  }

  cancel(): void {
    if (!confirm('Cancel your plan? You keep access until the end of the current period.')) return;
    this.busy.set(true);
    this.api.cancel().subscribe({
      next: () => {
        this.busy.set(false);
        this.ent.refresh();
        this.toast.info('Plan canceled — access continues until period end');
      },
      error: (err) => {
        this.busy.set(false);
        this.toast.error(err?.error?.message || 'Could not cancel plan');
      },
    });
  }
}
