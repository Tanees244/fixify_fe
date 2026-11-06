import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EntitlementsService } from '../../../core/services/entitlements.service';
import { BillingApiService } from '../../../core/services/api/billing-api.service';
import { NotificationService } from '../../../core/services/notification.service';

interface BannerView {
  text: string;
  cta: string;
  action?: 'resume';
  bg: string;
  fg: string;
  border: string;
}

/** Top-of-page subscription banner for customers: trial, past due, canceled, expired. */
@Component({
  selector: 'app-subscription-banner',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (view(); as v) {
      <div
        data-allow
        role="status"
        style="display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 10px 16px; font-size: 13px; font-weight: 600; border-bottom: 1px solid"
        [style.background]="v.bg"
        [style.color]="v.fg"
        [style.border-color]="v.border"
      >
        <span>{{ v.text }}</span>
        @if (v.action === 'resume') {
          <button
            type="button"
            style="font-weight: 700; text-decoration: underline; color: inherit; white-space: nowrap; background: none; border: 0; cursor: pointer"
            (click)="resume()"
          >
            {{ v.cta }}
          </button>
        } @else {
          <a
            routerLink="/customer/billing"
            style="font-weight: 700; text-decoration: underline; color: inherit; white-space: nowrap"
            >{{ v.cta }}</a
          >
        }
      </div>
    }
  `,
})
export class SubscriptionBannerComponent {
  private readonly ent = inject(EntitlementsService);
  private readonly api = inject(BillingApiService);
  private readonly toast = inject(NotificationService);

  resume(): void {
    this.api.resume().subscribe({
      next: () => {
        this.toast.success('Plan resumed');
        this.ent.refresh();
      },
      error: (err) => this.toast.error(err?.error?.message || 'Could not resume plan'),
    });
  }
  private readonly datePipe = new DatePipe('en-US');

  readonly view = computed<BannerView | null>(() => {
    const s = this.ent.subscription();
    if (!s) return null;
    switch (s.status) {
      case 'trialing': {
        const d = this.ent.trialDaysLeft() ?? 0;
        const urgent = d <= 3;
        return {
          text: `${s.plan.name} trial — ${d} day${d === 1 ? '' : 's'} left`,
          cta: 'Choose a plan',
          bg: urgent ? '#fff7ed' : '#eff6ff',
          fg: urgent ? '#c2410c' : '#1d4ed8',
          border: urgent ? '#fed7aa' : '#bfdbfe',
        };
      }
      case 'expired':
        return {
          text: 'Your trial has ended — choose a plan. Your account is read-only.',
          cta: 'Choose a plan',
          bg: '#fef2f2',
          fg: '#b91c1c',
          border: '#fecaca',
        };
      case 'past_due': {
        const d = this.ent.graceDaysLeft();
        return {
          text: `Payment failed — update your card${d !== null ? ` within ${d} day${d === 1 ? '' : 's'}` : ''} to keep your plan.`,
          cta: 'Manage billing',
          bg: '#fff7ed',
          fg: '#c2410c',
          border: '#fed7aa',
        };
      }
      case 'canceled':
        return {
          text: `Your plan is canceled. Access ends ${this.datePipe.transform(s.currentPeriodEnd, 'mediumDate') ?? 'at period end'}.`,
          cta: 'Resume plan',
          action: 'resume',
          bg: '#fffbeb',
          fg: '#92400e',
          border: '#fde68a',
        };
      default:
        return null;
    }
  });
}
