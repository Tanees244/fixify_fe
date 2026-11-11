import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BillingApiService } from '../../../core/services/api/billing-api.service';
import { EntitlementsService } from '../../../core/services/entitlements.service';
import { NotificationService } from '../../../core/services/notification.service';
import { BillingInterval } from '../../../core/models/billing.models';
import { SubscriptionPlan } from '../../../core/models/fixify.models';
import { mapApiSubscriptionPlan } from '../../../core/utils/api-mappers.util';
import { tw } from '../../../shared/ui/tw';

/** Demo-only checkout (backend BILLING_MOCK=true). No real card is charged or stored. */
@Component({
  selector: 'app-mock-checkout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div data-allow style="max-width: 460px; margin: 24px auto">
      <div [class]="ui.card + ' ' + ui.cardPad">
        <div
          style="display: inline-block; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 99px; background: #fff7ed; color: #c2410c; margin-bottom: 12px"
        >
          DEMO MODE — no real payment
        </div>
        @if (plan(); as p) {
          <div style="font-weight: 800; font-size: 20px">{{ p.name }} plan</div>
          <div style="font-size: 28px; font-weight: 800; margin: 6px 0 16px" [style.color]="p.color">
            \${{ interval() === 'year' ? p.priceYearly : p.price }}
            <span style="font-size: 13px; color: var(--t3); font-weight: 500">/{{ interval() }}</span>
          </div>
        } @else {
          <div style="margin-bottom: 16px" aria-busy="true" aria-label="Loading plan">
            <div [class]="ui.skelCell" style="height: 20px; width: 45%; margin-bottom: 12px"></div>
            <div [class]="ui.skelCell" style="height: 28px; width: 30%"></div>
          </div>
        }

        <div [class]="ui.fld">
          <label [class]="ui.label">Card number</label>
          <input [class]="ui.input" [ngModel]="card()" (ngModelChange)="card.set($event)" />
        </div>
        <div [class]="ui.grid2">
          <div [class]="ui.fld">
            <label [class]="ui.label">Expiry</label>
            <input [class]="ui.input" [ngModel]="expiry()" (ngModelChange)="expiry.set($event)" />
          </div>
          <div [class]="ui.fld">
            <label [class]="ui.label">CVC</label>
            <input [class]="ui.input" [ngModel]="cvc()" (ngModelChange)="cvc.set($event)" />
          </div>
        </div>

        <div style="display: flex; gap: 10px; margin-top: 8px">
          <button type="button" [class]="ui.btn + ' ' + ui.btnGhost" [disabled]="busy()" (click)="cancel()">Cancel</button>
          <button type="button" [class]="ui.btn + ' ' + ui.btnPrimary" style="flex: 1" [disabled]="busy() || !plan()" (click)="pay()">
            {{ busy() ? 'Processing…' : 'Pay now' }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class MockCheckoutComponent implements OnInit {
  protected readonly ui = tw;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(BillingApiService);
  private readonly ent = inject(EntitlementsService);
  private readonly toast = inject(NotificationService);

  readonly plan = signal<SubscriptionPlan | null>(null);
  readonly interval = signal<BillingInterval>('month');
  readonly busy = signal(false);
  readonly card = signal('4242 4242 4242 4242');
  readonly expiry = signal('12 / 34');
  readonly cvc = signal('123');

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap;
    this.interval.set(q.get('interval') === 'year' ? 'year' : 'month');
    const slug = q.get('plan');
    this.api.getPublicPlans().subscribe({
      next: (res) => {
        this.plan.set((res.data?.items ?? []).map(mapApiSubscriptionPlan).find((p) => p.id === slug) ?? null);
      },
    });
  }

  pay(): void {
    const p = this.plan();
    if (!p) return;
    this.busy.set(true);
    this.api.mockConfirm(p.id, this.interval()).subscribe({
      next: () => {
        this.ent.reset();
        this.ent.load(true);
        this.router.navigate(['/customer/billing'], { queryParams: { checkout: 'success' } });
      },
      error: (err) => {
        this.busy.set(false);
        this.toast.error(err?.error?.message || 'Mock payment failed');
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/customer/billing'], { queryParams: { checkout: 'cancel' } });
  }
}
