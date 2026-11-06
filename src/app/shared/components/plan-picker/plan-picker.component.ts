import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  signal,
} from '@angular/core';
import { BillingInterval } from '../../../core/models/billing.models';
import { SubscriptionPlan } from '../../../core/models/fixify.models';
import { IconComponent } from '../icon/icon.component';
import { tw } from '../../ui/tw';

export interface PlanPick {
  plan: SubscriptionPlan;
  interval: BillingInterval;
}

/** 3 plan cards, Pro highlighted "Most popular", monthly/yearly toggle. Reused on /pricing, Billing and Add WordPress. */
@Component({
  selector: 'app-plan-picker',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="display: flex; justify-content: center; margin-bottom: 18px">
      <div
        style="display: inline-flex; gap: 4px; padding: 4px; border: 1px solid var(--bd); border-radius: 99px; background: var(--sr)"
      >
        <button
          type="button"
          [class]="ui.btn + ' ' + ui.btnSm + ' ' + (interval() === 'month' ? ui.btnPrimary : ui.btnGhost)"
          (click)="interval.set('month')"
        >
          Monthly
        </button>
        <button
          type="button"
          [class]="ui.btn + ' ' + ui.btnSm + ' ' + (interval() === 'year' ? ui.btnPrimary : ui.btnGhost)"
          (click)="interval.set('year')"
        >
          Yearly <span style="font-weight: 700; margin-left: 4px">2 months free</span>
        </button>
      </div>
    </div>

    <div [class]="ui.grid3">
      @for (p of visiblePlans(); track p.id) {
        <div
          [class]="ui.card + ' ' + ui.cardPad"
          [style.border]="isPopular(p) ? '2px solid ' + p.color : '1px solid var(--bd)'"
          style="position: relative; display: flex; flex-direction: column"
        >
          @if (isPopular(p)) {
            <span
              style="position: absolute; top: -11px; left: 50%; transform: translateX(-50%); font-size: 10.5px; font-weight: 700; padding: 3px 12px; border-radius: 99px; color: #fff; white-space: nowrap"
              [style.background]="p.color"
              >Most popular</span
            >
          }
          <div style="font-weight: 800; font-size: 18px; color: var(--t1)">{{ p.name }}</div>
          <div style="margin: 6px 0 14px">
            <span style="font-size: 30px; font-weight: 800" [style.color]="p.color"
              >\${{ interval() === 'year' ? p.priceYearly : p.price }}</span
            >
            <span style="font-size: 13px; color: var(--t3)"
              >/{{ interval() === 'year' ? 'year' : 'month' }}</span
            >
          </div>
          <div style="display: flex; flex-direction: column; gap: 7px; flex: 1; margin-bottom: 16px">
            @for (feat of p.features; track feat) {
              <div style="font-size: 12.5px; color: var(--t2)">✓ {{ feat }}</div>
            }
          </div>
          @if (isCurrent(p)) {
            <button type="button" [class]="ui.btn + ' ' + ui.btnGhost" disabled>Current plan</button>
          } @else {
            <button
              type="button"
              data-allow
              [class]="ui.btn + ' ' + (isPopular(p) ? ui.btnPrimary : ui.btnGhost)"
              [disabled]="busy"
              (click)="picked.emit({ plan: p, interval: interval() })"
            >
              @if (busy && busyPlanId === p.id) {
                <app-icon name="loader" [size]="13" />
              }
              {{ ctaLabel }}
            </button>
          }
        </div>
      } @empty {
        <div [class]="ui.card + ' ' + ui.cardPad" style="grid-column: 1 / -1; text-align: center; color: var(--t3)">
          No plans available yet
        </div>
      }
    </div>
  `,
})
export class PlanPickerComponent {
  protected readonly ui = tw;

  private readonly _plans = signal<SubscriptionPlan[]>([]);
  readonly interval = signal<BillingInterval>('month');

  @Input() set plans(v: SubscriptionPlan[]) {
    this._plans.set(v ?? []);
  }
  @Input() currentPlanId: string | null = null;
  @Input() ctaLabel = 'Choose plan';
  @Input() busy = false;
  @Input() busyPlanId: string | null = null;
  @Input() set initialInterval(v: BillingInterval) {
    this.interval.set(v);
  }
  @Output() picked = new EventEmitter<PlanPick>();

  readonly visiblePlans = computed(() =>
    [...this._plans()]
      .filter((p) => p.isPublic)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.price - b.price)
  );

  isPopular(p: SubscriptionPlan): boolean {
    return p.isDefault;
  }

  isCurrent(p: SubscriptionPlan): boolean {
    return !!this.currentPlanId && p.id === this.currentPlanId;
  }
}
