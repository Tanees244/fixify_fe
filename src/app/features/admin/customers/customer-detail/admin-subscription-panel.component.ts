import { ChangeDetectionStrategy, Component, Input, OnChanges, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillingApiService } from '../../../../core/services/api/billing-api.service';
import { SubscriptionsDataService } from '../../../../core/services/data';
import { NotificationService } from '../../../../core/services/notification.service';
import { CustomerSubscription } from '../../../../core/models/billing.models';
import { mapCustomerSubscription } from '../../../../core/utils/billing-mappers.util';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { tw } from '../../../../shared/ui/tw';

/** Admin view of one customer's subscription: status, plan, trial/period dates, usage + actions. */
@Component({
  selector: 'app-admin-subscription-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, FormsModule, BadgeComponent],
  template: `
    <div [class]="ui.card + ' ' + ui.cardPad" style="padding: 20px; margin-bottom: 22px">
      <div style="font-weight: 700; font-size: 14px; margin-bottom: 14px">Subscription & Billing</div>
      @if (sub(); as s) {
        <div [class]="ui.adminInfoGrid">
          <div><span [class]="ui.adminInfoLabel">Status</span><app-badge [variant]="variant(s.status)">{{ s.status }}</app-badge></div>
          <div><span [class]="ui.adminInfoLabel">Plan</span><span>{{ s.plan.name }} · {{ s.billingInterval === 'year' ? 'yearly' : 'monthly' }}</span></div>
          <div><span [class]="ui.adminInfoLabel">Trial ends</span><span>{{ s.trialEndsAt ? (s.trialEndsAt | date: 'mediumDate') : '—' }}</span></div>
          <div><span [class]="ui.adminInfoLabel">Period end</span><span>{{ s.currentPeriodEnd ? (s.currentPeriodEnd | date: 'mediumDate') : '—' }}</span></div>
          <div><span [class]="ui.adminInfoLabel">Tickets</span><span>{{ s.usage.ticketsUsed }} / {{ s.limits.tickets_monthly ?? '∞' }}</span></div>
          <div><span [class]="ui.adminInfoLabel">Ask AI</span><span>{{ s.usage.askAiUsed }} / {{ s.limits.ask_ai_monthly ?? '∞' }}</span></div>
          <div><span [class]="ui.adminInfoLabel">Fix hours</span><span>{{ hours(s.usage.fixMinutesUsed) }}h / {{ s.limits.fix_hours_monthly }}h</span></div>
          <div><span [class]="ui.adminInfoLabel">Sites</span><span>{{ s.usage.sitesUsed }} / {{ s.limits.max_sites ?? '∞' }} (+{{ s.extraSites }})</span></div>
        </div>

        <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 16px; align-items: center">
          <select [class]="ui.input" style="width: auto" [ngModel]="planId()" (ngModelChange)="planId.set($event)">
            @for (p of plans; track p.id) {
              <option [value]="p.id">{{ p.name }}</option>
            }
          </select>
          <label style="font-size: 12.5px; display: flex; gap: 6px; align-items: center">
            <input type="checkbox" [ngModel]="markPaid()" (ngModelChange)="markPaid.set($event)" /> Mark paid
          </label>
          <button type="button" [class]="ui.btn + ' ' + ui.btnPrimary + ' ' + ui.btnSm" [disabled]="busy() || !planId()" (click)="changePlan()">Change plan</button>
        </div>
        <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px; align-items: center">
          <input type="date" [class]="ui.input" style="width: auto" [ngModel]="trialDate()" (ngModelChange)="trialDate.set($event)" />
          <button type="button" [class]="ui.btn + ' ' + ui.btnGhost + ' ' + ui.btnSm" [disabled]="busy() || !trialDate()" (click)="extendTrial()">Extend trial</button>
          <button type="button" [class]="ui.btn + ' ' + ui.btnGhost + ' ' + ui.btnSm" [disabled]="busy() || s.status === 'canceled' || s.status === 'expired'" (click)="cancel()">Cancel subscription</button>
        </div>
      } @else {
        <div style="font-size: 13px; color: var(--t3)">{{ loading() ? 'Loading…' : 'No subscription data available.' }}</div>
      }
    </div>
  `,
})
export class AdminSubscriptionPanelComponent implements OnChanges {
  protected readonly ui = tw;
  private readonly api = inject(BillingApiService);
  private readonly toast = inject(NotificationService);
  readonly plans = inject(SubscriptionsDataService).subscriptionPlans;

  @Input() customerApiId: string | undefined;

  readonly sub = signal<CustomerSubscription | null>(null);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly planId = signal('');
  readonly markPaid = signal(false);
  readonly trialDate = signal('');

  ngOnChanges(): void {
    this.load();
  }

  hours(min: number): number {
    return Math.round((min / 60) * 10) / 10;
  }

  variant(s: string): string {
    return s === 'active' ? 'bok' : s === 'expired' ? 'ber' : s === 'trialing' ? 'bgr' : 'bwn';
  }

  private load(): void {
    if (!this.customerApiId) return;
    this.loading.set(true);
    this.api.adminGetCustomer(this.customerApiId).subscribe({
      next: (res) => {
        const s = res.data ? mapCustomerSubscription(res.data) : null;
        this.sub.set(s);
        if (s) this.planId.set(s.plan.id);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private run(call: ReturnType<BillingApiService['adminCancel']>, ok: string): void {
    this.busy.set(true);
    call.subscribe({
      next: () => {
        this.busy.set(false);
        this.toast.success(ok);
        this.load();
      },
      error: (err) => {
        this.busy.set(false);
        this.toast.error(err?.error?.message || 'Action failed');
      },
    });
  }

  changePlan(): void {
    if (!this.customerApiId) return;
    this.run(
      this.api.adminChangePlan(this.customerApiId, { planId: this.planId(), markPaid: this.markPaid() }),
      'Plan updated'
    );
  }

  extendTrial(): void {
    if (!this.customerApiId) return;
    this.run(
      this.api.adminExtendTrial(this.customerApiId, new Date(this.trialDate() + 'T23:59:59').toISOString()),
      'Trial extended'
    );
  }

  cancel(): void {
    if (!this.customerApiId || !confirm("Cancel this customer's subscription?")) return;
    this.run(this.api.adminCancel(this.customerApiId), 'Subscription canceled');
  }
}
