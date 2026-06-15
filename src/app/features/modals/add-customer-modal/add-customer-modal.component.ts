import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AddCustomerPayload, SubscriptionPlanId } from '../../../core/models/fixify.models';
import { SUBSCRIPTION_PLANS } from '../../../core/constants/subscription.constants';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ModalHeaderComponent } from '../../../shared/components/modal-header/modal-header.component';

@Component({
  selector: 'app-add-customer-modal',
  standalone: true,
  imports: [FormsModule, IconComponent, ModalHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal-header
      title="Onboard Customer"
      icon="users"
      (closed)="closed.emit()"
    />
    <div class="mdl-b">
      <div class="g2">
        <div class="fld">
          <label>Full Name *</label>
          <input
            class="inp"
            placeholder="Jane Smith"
            [ngModel]="name()"
            (ngModelChange)="name.set($event)"
          />
        </div>
        <div class="fld">
          <label>Email *</label>
          <input
            class="inp"
            placeholder="jane@company.com"
            [ngModel]="email()"
            (ngModelChange)="email.set($event)"
          />
        </div>
      </div>
      <div class="g2">
        <div class="fld">
          <label>Company</label>
          <input
            class="inp"
            placeholder="Acme Corp"
            [ngModel]="company()"
            (ngModelChange)="company.set($event)"
          />
        </div>
        <div class="fld">
          <label>Phone</label>
          <input
            class="inp"
            placeholder="+1 555-0100"
            [ngModel]="phone()"
            (ngModelChange)="phone.set($event)"
          />
        </div>
      </div>
      <div class="fld">
        <label>Subscription Plan *</label>
        <select class="inp" [ngModel]="plan()" (ngModelChange)="plan.set($event)">
          @for (p of plans; track p.id) {
            <option [value]="p.id">{{ p.name }} — {{ p.priceLabel }}</option>
          }
        </select>
        <span style="font-size: 11.5px; color: var(--t3); margin-top: 4px">
          @for (feat of selectedPlanFeatures(); track feat; let last = $last) {
            {{ feat }}@if (!last) { · }
          }
        </span>
      </div>
      <label class="admin-check-row">
        <input type="checkbox" [ngModel]="requireApproval()" (ngModelChange)="requireApproval.set($event)" />
        <span>
          <strong>Require admin approval</strong>
          <span style="display: block; font-size: 12px; color: var(--t3); font-weight: 400; margin-top: 2px">
            Customer will be pending until you approve them in Subscriptions → Approvals
          </span>
        </span>
      </label>
    </div>
    <div class="mdl-f">
      <button type="button" class="btn bg" (click)="closed.emit()">Cancel</button>
      <button
        type="button"
        class="btn bp"
        [disabled]="!name() || !email()"
        (click)="submit()"
      >
        <app-icon name="users" [size]="13" color="#fff" />
        {{ requireApproval() ? 'Submit for Approval' : 'Onboard Customer' }}
      </button>
    </div>
  `,
})
export class AddCustomerModalComponent {
  @Output() closed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<AddCustomerPayload>();

  readonly plans = SUBSCRIPTION_PLANS;
  readonly name = signal('');
  readonly email = signal('');
  readonly company = signal('');
  readonly plan = signal<SubscriptionPlanId>('free');
  readonly phone = signal('');
  readonly requireApproval = signal(false);

  selectedPlanFeatures(): string[] {
    return this.plans.find((p) => p.id === this.plan())?.features.slice(0, 3) ?? [];
  }

  submit(): void {
    if (!this.name() || !this.email()) return;
    this.submitted.emit({
      name: this.name(),
      email: this.email(),
      company: this.company() || undefined,
      plan: this.plan(),
      phone: this.phone() || undefined,
      requireApproval: this.requireApproval(),
    });
  }
}
