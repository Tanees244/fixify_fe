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
