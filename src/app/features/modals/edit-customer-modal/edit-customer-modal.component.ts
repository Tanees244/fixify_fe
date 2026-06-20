import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Customer } from '../../../core/models/fixify.models';
import { FixifyDataService } from '../../../core/services/fixify-data.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ModalHeaderComponent } from '../../../shared/components/modal-header/modal-header.component';

@Component({
  selector: 'app-edit-customer-modal',
  standalone: true,
  imports: [FormsModule, IconComponent, ModalHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal-header title="Edit Customer" icon="edit" (closed)="closed.emit()" />
    <div class="mdl-b">
      <div class="g2">
        <div class="fld">
          <label>Full Name</label>
          <input class="inp" [ngModel]="name()" (ngModelChange)="name.set($event)" />
        </div>
        <div class="fld">
          <label>Email</label>
          <input class="inp" [ngModel]="email()" (ngModelChange)="email.set($event)" />
        </div>
      </div>
      <div class="g2">
        <div class="fld">
          <label>Company</label>
          <input class="inp" [ngModel]="company()" (ngModelChange)="company.set($event)" />
        </div>
        <div class="fld">
          <label>Phone</label>
          <input class="inp" [ngModel]="phone()" (ngModelChange)="phone.set($event)" />
        </div>
      </div>
      <div class="g2">
        <div class="fld">
          <label>Subscription Plan</label>
          <select class="inp" [ngModel]="plan()" (ngModelChange)="plan.set($event)">
            @for (p of data.subscriptionPlans; track p.id) {
              <option [value]="p.id">{{ p.name }} — {{ p.priceLabel }}</option>
            }
          </select>
        </div>
        <div class="fld">
          <label>Status</label>
          <select class="inp" [ngModel]="status()" (ngModelChange)="status.set($event)">
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="warning">Warning</option>
            <option value="suspended">Suspended</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>
      
    </div>
    <div class="mdl-f">
      <button type="button" class="btn bg" (click)="closed.emit()">Cancel</button>
      <button type="button" class="btn bp" (click)="submit()">
        <app-icon name="check" [size]="13" color="#fff" /> Save Changes
      </button>
    </div>
  `,
})
export class EditCustomerModalComponent implements OnChanges {
  @Input({ required: true }) customer!: Customer;
  @Output() closed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<Customer>();

  protected readonly data = inject(FixifyDataService);

  readonly name = signal('');
  readonly email = signal('');
  readonly company = signal('');
  readonly phone = signal('');
  readonly plan = signal('free');
  readonly status = signal('active');
  readonly approvalStatus = signal<'pending' | 'approved' | 'rejected'>('approved');

  ngOnChanges(): void {
    if (this.customer) {
      this.name.set(this.customer.name);
      this.email.set(this.customer.email);
      this.company.set(this.customer.company);
      this.phone.set(this.customer.phone ?? '');
      this.plan.set(this.customer.plan);
      this.status.set(this.customer.status);
      this.approvalStatus.set(this.customer.approvalStatus);
    }
  }

  submit(): void {
    this.submitted.emit({
      ...this.customer,
      name: this.name(),
      email: this.email(),
      company: this.company(),
      phone: this.phone(),
      plan: this.plan(),
      status: this.status(),
      approvalStatus: this.approvalStatus(),
    });
  }
}
