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
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ModalHeaderComponent } from '../../../shared/components/modal-header/modal-header.component';

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
    <div class="mdl-b">
      <div class="g2">
        <div class="fld">
          <label>Plan name *</label>
          <input
            class="inp"
            placeholder="e.g. Business"
            [ngModel]="name()"
            (ngModelChange)="name.set($event)"
          />
        </div>
        <div class="fld">
          <label>Price (USD/month) *</label>
          <input
            class="inp"
            type="number"
            min="0"
            step="1"
            placeholder="0"
            [ngModel]="price()"
            (ngModelChange)="price.set(+$event || 0)"
          />
        </div>
      </div>
      <div class="fld">
        <label>Color</label>
        <div style="display: flex; gap: 8px; flex-wrap: wrap">
          @for (c of colors; track c) {
            <button
              type="button"
              (click)="color.set(c)"
              [style.background]="c"
              [style.outline]="color() === c ? '2px solid var(--t1)' : '2px solid transparent'"
              style="width: 28px; height: 28px; border-radius: 8px; cursor: pointer"
            ></button>
          }
        </div>
      </div>
      <div class="fld">
        <label>Features <span style="font-weight: 400; color: var(--t3)">(one per line)</span></label>
        <textarea
          class="inp"
          rows="5"
          placeholder="1 website&#10;Weekly health scan&#10;Email alerts"
          style="resize: vertical"
          [ngModel]="featuresText()"
          (ngModelChange)="featuresText.set($event)"
        ></textarea>
      </div>
    </div>
    <div class="mdl-f">
      <button type="button" class="btn bg" (click)="closed.emit()">Cancel</button>
      <button type="button" class="btn bp" [disabled]="!name().trim()" (click)="submit()">
        <app-icon name="check" [size]="13" color="#fff" />
        {{ plan ? 'Save Plan' : 'Create Plan' }}
      </button>
    </div>
  `,
})
export class SubscriptionPlanModalComponent implements OnChanges {
  @Input() plan: SubscriptionPlan | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<SubscriptionPlanPayload>();

  readonly colors = PLAN_COLORS;
  readonly name = signal('');
  readonly price = signal(0);
  readonly color = signal('#1d6fe0');
  readonly featuresText = signal('');

  ngOnChanges(): void {
    if (this.plan) {
      this.name.set(this.plan.name);
      this.price.set(this.plan.price);
      this.color.set(this.plan.color);
      this.featuresText.set(this.plan.features.join('\n'));
    } else {
      this.name.set('');
      this.price.set(0);
      this.color.set('#1d6fe0');
      this.featuresText.set('');
    }
  }

  submit(): void {
    if (!this.name().trim()) return;
    this.submitted.emit({
      name: this.name().trim(),
      price: this.price(),
      color: this.color(),
      features: this.featuresText()
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean),
    });
  }
}
