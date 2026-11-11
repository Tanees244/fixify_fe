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

interface FeatureRow {
  text: string;
  on: boolean;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const count = (v: number | null, one: string, many: string) =>
  v === null ? `Unlimited ${many}` : `${v} ${v === 1 ? one : many}`;

/** Plan cards with a monthly/yearly toggle. Reused on /pricing, Billing and Add WordPress. */
@Component({
  selector: 'app-plan-picker',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (yearlyAvailable()) {
      <div style="display: flex; justify-content: center; margin-bottom: 26px">
        <div
          role="group"
          aria-label="Billing period"
          style="display: inline-flex; padding: 4px; border: 1px solid var(--bd); border-radius: 99px; background: var(--sr); box-shadow: var(--s1)"
        >
          <button
            type="button"
            [attr.aria-pressed]="effectiveInterval() === 'month'"
            [style.background]="effectiveInterval() === 'month' ? 'var(--acc)' : 'transparent'"
            [style.color]="effectiveInterval() === 'month' ? '#fff' : 'var(--t2)'"
            style="border: 0; border-radius: 99px; padding: 8px 20px; font-size: 13px; font-weight: 600; cursor: pointer"
            (click)="interval.set('month')"
          >
            Monthly
          </button>
          <button
            type="button"
            [attr.aria-pressed]="effectiveInterval() === 'year'"
            [style.background]="effectiveInterval() === 'year' ? 'var(--acc)' : 'transparent'"
            [style.color]="effectiveInterval() === 'year' ? '#fff' : 'var(--t2)'"
            style="border: 0; border-radius: 99px; padding: 8px 20px; font-size: 13px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 8px"
            (click)="interval.set('year')"
          >
            Yearly
            <span
              style="font-size: 10.5px; font-weight: 700; padding: 2px 8px; border-radius: 99px"
              [style.background]="effectiveInterval() === 'year' ? 'rgba(255,255,255,0.22)' : 'var(--okb)'"
              [style.color]="effectiveInterval() === 'year' ? '#fff' : 'var(--ok)'"
              >2 months free</span
            >
          </button>
        </div>
      </div>
    }

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; align-items: stretch">
      @for (p of visiblePlans(); track p.id) {
        <div
          style="position: relative; display: flex; flex-direction: column; background: var(--sr); border-radius: 16px; padding: 26px 24px 24px; min-width: 0"
          [style.border]="isCurrent(p) ? '2px solid var(--ok)' : isPopular(p) ? '2px solid ' + p.color : '1px solid var(--bd)'"
          [style.box-shadow]="isPopular(p) ? '0 10px 30px rgba(13,30,61,0.12)' : 'var(--s1)'"
        >
          @if (isCurrent(p)) {
            <span style="position: absolute; top: -12px; left: 24px; font-size: 11px; font-weight: 700; padding: 3px 12px; border-radius: 99px; color: #fff; background: var(--ok); white-space: nowrap">Current plan</span>
          } @else if (isPopular(p)) {
            <span style="position: absolute; top: -12px; left: 24px; font-size: 11px; font-weight: 700; padding: 3px 12px; border-radius: 99px; color: #fff; white-space: nowrap" [style.background]="p.color">Most popular</span>
          }

          <div style="font-size: 13px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase" [style.color]="p.color">{{ p.name }}</div>

          <div style="display: flex; align-items: baseline; gap: 6px; margin: 10px 0 4px">
            <span style="font-size: 38px; font-weight: 800; letter-spacing: -0.02em; color: var(--t1); font-variant-numeric: tabular-nums">\${{ priceFor(p) }}</span>
            <span style="font-size: 14px; color: var(--t3)">/{{ unitFor(p) }}</span>
          </div>
          <div style="font-size: 12.5px; color: var(--t3); min-height: 18px">
            @if (unitFor(p) === 'year') {
              That is \${{ monthlyEquivalent(p) }}/month, billed once a year
            } @else {
              Billed monthly, cancel any time
            }
          </div>

          <div style="height: 1px; background: var(--b2); margin: 18px 0"></div>

          <ul style="list-style: none; margin: 0 0 22px; padding: 0; display: flex; flex-direction: column; gap: 11px; flex: 1">
            @for (r of rows(p); track r.text) {
              <li style="display: flex; align-items: flex-start; gap: 10px; font-size: 13.5px; line-height: 1.35" [style.color]="r.on ? 'var(--t1)' : 'var(--t3)'">
                <span
                  aria-hidden="true"
                  style="flex-shrink: 0; width: 18px; height: 18px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-top: 1px"
                  [style.background]="r.on ? 'var(--okb)' : 'var(--s2)'"
                >
                  @if (r.on) {
                    <app-icon name="check" [size]="11" color="var(--ok)" />
                  } @else {
                    <span style="width: 8px; height: 2px; background: var(--t3); border-radius: 2px"></span>
                  }
                </span>
                <span [attr.aria-label]="r.on ? null : r.text + ' (not included)'">{{ r.text }}</span>
              </li>
            }
          </ul>

          @if (isCurrent(p)) {
            <button type="button" [class]="ui.btn + ' ' + ui.btnGhost" style="width: 100%; justify-content: center" disabled>Current plan</button>
          } @else {
            <button
              type="button"
              data-allow
              [class]="ui.btn + ' ' + (isPopular(p) ? ui.btnPrimary : ui.btnGhost)"
              style="width: 100%; justify-content: center; padding-top: 11px; padding-bottom: 11px"
              [disabled]="busy"
              (click)="pick(p)"
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

  /** Yearly is only offered when at least one plan actually has a yearly price. */
  readonly yearlyAvailable = computed(() => this.visiblePlans().some((p) => p.priceYearly > 0));
  readonly effectiveInterval = computed<BillingInterval>(() =>
    this.interval() === 'year' && this.yearlyAvailable() ? 'year' : 'month'
  );

  isPopular(p: SubscriptionPlan): boolean {
    return p.isDefault;
  }

  isCurrent(p: SubscriptionPlan): boolean {
    return !!this.currentPlanId && p.id === this.currentPlanId;
  }

  private yearlyFor(p: SubscriptionPlan): boolean {
    return this.effectiveInterval() === 'year' && p.priceYearly > 0;
  }

  priceFor(p: SubscriptionPlan): number {
    return this.yearlyFor(p) ? p.priceYearly : p.price;
  }

  unitFor(p: SubscriptionPlan): 'year' | 'month' {
    return this.yearlyFor(p) ? 'year' : 'month';
  }

  monthlyEquivalent(p: SubscriptionPlan): string {
    return (p.priceYearly / 12).toFixed(2).replace(/\.00$/, '');
  }

  pick(p: SubscriptionPlan): void {
    this.picked.emit({ plan: p, interval: this.yearlyFor(p) ? 'year' : 'month' });
  }

  /**
   * Feature lines come from the plan's real limits, so what is promised always matches what
   * is enforced. Plans without limits fall back to their hand-written feature text.
   */
  rows(p: SubscriptionPlan): FeatureRow[] {
    const l = p.limits;
    if (!l) return (p.features ?? []).map((text) => ({ text, on: true }));
    const rows: FeatureRow[] = [
      { text: count(l.max_sites, 'website', 'websites'), on: true },
      { text: `${cap(l.scan_frequency)} health scans${l.manual_rescan ? ' + manual re-scan' : ''}`, on: true },
      { text: `${cap(l.seo_frequency)} SEO checks`, on: true },
      {
        text: `Uptime checks every ${l.uptime_interval_min} min` +
          (l.uptime_endpoints === null ? '' : ` · ${count(l.uptime_endpoints, 'endpoint', 'endpoints')}`),
        on: true,
      },
      {
        text: l.ask_ai_monthly === null ? 'Unlimited Ask AI' : l.ask_ai_monthly > 0 ? `${l.ask_ai_monthly} Ask AI questions / month` : 'Ask AI',
        on: l.ask_ai_monthly !== 0,
      },
      {
        text: l.tickets_monthly === null
          ? `Unlimited tickets · ${l.ticket_sla_hours}h response`
          : `${l.tickets_monthly} ticket${l.tickets_monthly === 1 ? '' : 's'} / month · ${l.ticket_sla_hours}h response`,
        on: l.tickets_monthly !== 0,
      },
      {
        text: l.fix_hours_monthly > 0 ? `${l.fix_hours_monthly} fix hour${l.fix_hours_monthly === 1 ? '' : 's'} / month` : 'Fix hours',
        on: l.fix_hours_monthly > 0,
      },
      { text: 'Monthly reports', on: l.reports },
      { text: 'Report & audit export', on: l.export },
    ];
    if (l.extra_site_price !== null && l.extra_site_price !== undefined) {
      rows.push({ text: `Extra websites at $${l.extra_site_price} each`, on: true });
    }
    return rows;
  }
}
