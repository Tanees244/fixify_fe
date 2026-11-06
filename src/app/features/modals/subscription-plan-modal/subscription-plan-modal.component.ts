import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  SubscriptionPlan,
  SubscriptionPlanPayload,
} from '../../../core/models/fixify.models';
import {
  DEFAULT_PLAN_LIMITS,
  LIMIT_FIELDS,
  LimitField,
  PlanLimitKey,
  PlanLimits,
} from '../../../core/models/billing.models';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ModalHeaderComponent } from '../../../shared/components/modal-header/modal-header.component';
import { tw } from '../../../shared/ui/tw';

const PLAN_COLORS = ['#6b88ad', '#1d6fe0', '#059669', '#7c3aed', '#d97706', '#dc2626'];

@Component({
  selector: 'app-subscription-plan-modal',
  standalone: true,
  imports: [FormsModule, IconComponent, ModalHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal-header
      [title]="plan ? 'Edit Subscription Plan' : 'Create Subscription Plan'"
      icon="layers"
      (closed)="closed.emit()"
    />
    <div [class]="ui.modalBody">
      <div [class]="ui.grid2">
        <div [class]="ui.field">
          <label [class]="ui.label">Plan name *</label>
          <input
            [class]="ui.input"
            placeholder="e.g. Business"
            [ngModel]="name()"
            (ngModelChange)="name.set($event)"
          />
        </div>
        <div [class]="ui.field">
          <label [class]="ui.label">Price (USD/month) *</label>
          <input
            [class]="ui.input"
            type="number"
            min="0"
            step="1"
            placeholder="0"
            [ngModel]="price()"
            (ngModelChange)="price.set(+$event || 0)"
          />
        </div>
      </div>
      <div [class]="ui.grid2">
        <div [class]="ui.field">
          <label [class]="ui.label">Price (USD/year)</label>
          <input [class]="ui.input" type="number" min="0" step="1" [ngModel]="priceYearly()" (ngModelChange)="priceYearly.set(+$event || 0)" />
        </div>
        <div [class]="ui.field">
          <label [class]="ui.label">Slug</label>
          <input [class]="ui.input" placeholder="starter | pro | business" [ngModel]="slug()" (ngModelChange)="slug.set($event)" />
        </div>
      </div>
      <div [class]="ui.grid2">
        <div [class]="ui.field">
          <label [class]="ui.label">Stripe monthly price ID</label>
          <input [class]="ui.input" placeholder="price_…" [ngModel]="stripeMonthly()" (ngModelChange)="stripeMonthly.set($event)" />
        </div>
        <div [class]="ui.field">
          <label [class]="ui.label">Stripe yearly price ID</label>
          <input [class]="ui.input" placeholder="price_…" [ngModel]="stripeYearly()" (ngModelChange)="stripeYearly.set($event)" />
        </div>
      </div>
      <div [class]="ui.grid2">
        <div [class]="ui.field">
          <label [class]="ui.label">Sort order</label>
          <input [class]="ui.input" type="number" step="1" [ngModel]="sortOrder()" (ngModelChange)="sortOrder.set(+$event || 0)" />
        </div>
        <div [class]="ui.field" style="justify-content: flex-end; gap: 8px">
          <label style="display: flex; align-items: center; gap: 8px; font-size: 13px">
            <input type="checkbox" [ngModel]="isDefault()" (ngModelChange)="isDefault.set($event)" /> Default plan
          </label>
          <label style="display: flex; align-items: center; gap: 8px; font-size: 13px">
            <input type="checkbox" [ngModel]="isPublic()" (ngModelChange)="isPublic.set($event)" /> Public (pricing page)
          </label>
        </div>
      </div>
      <div [class]="ui.field">
        <label [class]="ui.label">Color</label>
        <div class="flex flex-wrap gap-2">
          @for (c of colors; track c) {
            <button
              type="button"
              (click)="color.set(c)"
              [style.background]="c"
              [style.outline]="color() === c ? '2px solid #0d1e3d' : '2px solid transparent'"
              class="h-7 w-7 cursor-pointer rounded-lg"
            ></button>
          }
        </div>
      </div>
      <div [class]="ui.field">
        <label [class]="ui.label">
          Features <span class="font-normal text-fixify-text-3">(one per line)</span>
        </label>
        <textarea
          [class]="ui.input + ' resize-y'"
          rows="5"
          placeholder="1 website&#10;Weekly health scan&#10;Email alerts"
          [ngModel]="featuresText()"
          (ngModelChange)="featuresText.set($event)"
        ></textarea>
      </div>
      <div [class]="ui.field">
        <label [class]="ui.label">Limits</label>
        <div style="display: grid; gap: 10px; border: 1px solid var(--bd); border-radius: 10px; padding: 12px">
          @for (f of limitFields; track f.key) {
            <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 10px; align-items: center">
              <span style="font-size: 12.5px; color: var(--t2)">{{ f.label }}</span>
              @switch (f.kind) {
                @case ('bool') {
                  <input type="checkbox" [ngModel]="limits()[f.key]" (ngModelChange)="setLimit(f.key, $event)" />
                }
                @case ('select') {
                  <select [class]="ui.input" [ngModel]="limits()[f.key]" (ngModelChange)="setLimit(f.key, $event)">
                    @for (o of f.options; track o.value) {
                      <option [value]="o.value">{{ o.label }}</option>
                    }
                  </select>
                }
                @default {
                  <div style="display: flex; gap: 8px; align-items: center">
                    <input
                      [class]="ui.input"
                      type="number"
                      min="0"
                      [disabled]="limits()[f.key] === null"
                      [ngModel]="limits()[f.key]"
                      (ngModelChange)="setLimit(f.key, +$event || 0)"
                    />
                    @if (f.unlimited) {
                      <label style="display: flex; align-items: center; gap: 4px; font-size: 12px; white-space: nowrap">
                        <input type="checkbox" [ngModel]="limits()[f.key] === null" (ngModelChange)="toggleNull(f, $event)" />
                        {{ f.nullMeansNotAllowed ? 'Not allowed' : 'Unlimited' }}
                      </label>
                    }
                  </div>
                }
              }
            </div>
          }
        </div>
      </div>
    </div>
    <div [class]="ui.modalFooter">
      <button type="button" [class]="ui.btn + ' ' + ui.btnGhost" (click)="closed.emit()" [disabled]="submitting">
        Cancel
      </button>
      <button
        type="button"
        [class]="ui.btn + ' ' + ui.btnPrimary"
        [disabled]="!name().trim() || submitting"
        (click)="submit()"
      >
        @if (submitting) {
          <app-icon name="loader" [size]="13" color="#fff" />
          {{ plan ? 'Saving…' : 'Creating…' }}
        } @else {
          <app-icon name="check" [size]="13" color="#fff" />
          {{ plan ? 'Save Plan' : 'Create Plan' }}
        }
      </button>
    </div>
  `,
})
export class SubscriptionPlanModalComponent implements OnChanges {
  @Input() plan: SubscriptionPlan | null = null;
  @Input() submitting = false;
  @Output() closed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<SubscriptionPlanPayload>();

  readonly ui = tw;
  readonly colors = PLAN_COLORS;
  readonly name = signal('');
  readonly price = signal(0);
  readonly color = signal('#1d6fe0');
  readonly featuresText = signal('');
  readonly priceYearly = signal(0);
  readonly slug = signal('');
  readonly stripeMonthly = signal('');
  readonly stripeYearly = signal('');
  readonly sortOrder = signal(0);
  readonly isDefault = signal(false);
  readonly isPublic = signal(true);
  readonly limits = signal<PlanLimits>({ ...DEFAULT_PLAN_LIMITS });
  readonly limitFields = LIMIT_FIELDS;

  setLimit(key: PlanLimitKey, value: unknown): void {
    this.limits.update((l) => ({ ...l, [key]: value }));
  }

  toggleNull(f: LimitField, isNull: boolean): void {
    this.setLimit(f.key, isNull ? null : 0);
  }

  ngOnChanges(): void {
    if (this.plan) {
      this.name.set(this.plan.name);
      this.price.set(this.plan.price);
      this.color.set(this.plan.color);
      this.featuresText.set(this.plan.features.join('\n'));
      this.priceYearly.set(this.plan.priceYearly);
      this.slug.set(this.plan.slug || this.plan.id);
      this.stripeMonthly.set(this.plan.stripePriceMonthlyId);
      this.stripeYearly.set(this.plan.stripePriceYearlyId);
      this.sortOrder.set(this.plan.sortOrder);
      this.isDefault.set(this.plan.isDefault);
      this.isPublic.set(this.plan.isPublic);
      this.limits.set({ ...this.plan.limits });
    } else {
      this.name.set('');
      this.price.set(0);
      this.color.set('#1d6fe0');
      this.featuresText.set('');
      this.priceYearly.set(0);
      this.slug.set('');
      this.stripeMonthly.set('');
      this.stripeYearly.set('');
      this.sortOrder.set(0);
      this.isDefault.set(false);
      this.isPublic.set(true);
      this.limits.set({ ...DEFAULT_PLAN_LIMITS });
    }
  }

  submit(): void {
    if (!this.name().trim()) return;
    this.submitted.emit({
      name: this.name().trim(),
      price: this.price(),
      color: this.color(),
      slug: this.slug().trim(),
      priceYearly: this.priceYearly(),
      stripePriceMonthlyId: this.stripeMonthly().trim(),
      stripePriceYearlyId: this.stripeYearly().trim(),
      sortOrder: this.sortOrder(),
      isDefault: this.isDefault(),
      isPublic: this.isPublic(),
      limits: this.limits(),
      features: this.featuresText()
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean),
    });
  }
}
