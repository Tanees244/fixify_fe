import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FixifyDataService } from '../../../core/services/fixify-data.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Customer } from '../../../core/models/fixify.models';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';

const MRR_STATS = [
  { label: 'Total MRR', value: '$743', sub: '↑ 12% this month', color: 'var(--ok)' },
  { label: 'Tickets Resolved', value: 34, sub: 'Last 30 days', color: 'var(--ok)' },
  { label: 'Avg Response Time', value: '4.2h', sub: 'Under SLA target', color: 'var(--t1)' },
];

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, BadgeComponent],
  templateUrl: './reports.component.html',
})
export class ReportsComponent {
  private readonly data = inject(FixifyDataService);
  private readonly toast = inject(NotificationService);

  readonly customers = this.data.customers;
  readonly generating = signal(false);

  readonly activeCount = computed(() =>
    this.customers.filter((c) => c.status === 'active').length
  );

  readonly mrrStats = computed(() => [
    MRR_STATS[0],
    {
      label: 'Active Customers',
      value: this.activeCount(),
      sub: '1 new this week',
      color: 'var(--acc)',
    },
    MRR_STATS[1],
    MRR_STATS[2],
  ]);

  generateReport(): void {
    if (this.generating()) return;
    this.generating.set(true);
    setTimeout(() => {
      this.generating.set(false);
      this.toast.success('Platform report generated');
    }, 2000);
  }

  viewReport(customer: Customer): void {
    this.toast.info(`Viewing ${customer.name}'s report`);
  }

  downloadReport(customer: Customer): void {
    this.toast.success(`${customer.name}'s report downloaded`);
  }

  sendReport(customer: Customer): void {
    this.toast.success(`Report emailed to ${customer.email}`);
  }
}
