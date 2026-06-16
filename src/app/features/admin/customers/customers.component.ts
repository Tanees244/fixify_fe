import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { FixifyDataService } from '../../../core/services/fixify-data.service';
import { AppContextService } from '../../../core/services/app-context.service';
import { Customer } from '../../../core/models/fixify.models';
import { scoreColor } from '../../../core/utils/fixify.utils';
import { BadgeComponent, BadgeVariant } from '../../../shared/components/badge/badge.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { TableSkeletonComponent } from '../../../shared/components/table-skeleton/table-skeleton.component';

type CustomerTab = 'all' | 'pending' | 'active';

@Component({
  selector: 'app-admin-customers',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, BadgeComponent, TableSkeletonComponent],
  templateUrl: './customers.component.html',
})
export class CustomersComponent {
  private readonly data = inject(FixifyDataService);
  private readonly ctx = inject(AppContextService);
  private readonly router = inject(Router);

  readonly customers = this.data.customers;
  readonly sites = this.data.sites;
  readonly loading = this.data.loading;

  readonly search = signal('');
  readonly tab = signal<CustomerTab>('all');
  readonly scoreColor = scoreColor;

  plans() {
    return this.data.subscriptionPlans;
  }

  planLabel(id: string) {
    return this.data.planLabel(id);
  }

  planColor(id: string) {
    return this.data.planColor(id);
  }

  planPrice(id: string) {
    return this.data.planPrice(id);
  }

  readonly pendingCount = computed(() => {
    this.data.dataRevision();
    return this.customers.filter((c) => c.approvalStatus === 'pending').length;
  });

  readonly activeCount = computed(() => {
    this.data.dataRevision();
    return this.customers.filter((c) => c.status === 'active' && c.approvalStatus === 'approved').length;
  });

  readonly filteredCustomers = computed(() => {
    this.data.dataRevision();
    const q = this.search().toLowerCase();
    const tab = this.tab();
    return this.customers.filter((c) => {
      const matchesSearch =
        q === '' ||
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q);
      if (!matchesSearch) return false;
      if (tab === 'pending') return c.approvalStatus === 'pending';
      if (tab === 'active') return c.approvalStatus === 'approved' && c.status === 'active';
      return true;
    });
  });

  planCount(planId: string): number {
    return this.customers.filter(
      (c) => c.plan === planId && c.approvalStatus === 'approved'
    ).length;
  }

  customerSites(custId: number) {
    return this.sites.filter((s) => s.custId === custId);
  }

  avgHealth(custId: number): number | null {
    const custSites = this.customerSites(custId);
    return custSites.length
      ? Math.round(custSites.reduce((a, s) => a + s.health, 0) / custSites.length)
      : null;
  }

  statusBadge(status: string): BadgeVariant {
    if (status === 'active') return 'bok';
    if (status === 'pending') return 'bwn';
    if (status === 'warning') return 'bwn';
    return 'ber';
  }

  approvalBadge(status: string): BadgeVariant {
    if (status === 'approved') return 'bok';
    if (status === 'pending') return 'bwn';
    return 'ber';
  }

  setTab(tab: CustomerTab): void {
    this.tab.set(tab);
  }

  onSearch(value: string): void {
    this.search.set(value);
  }

  onboardCustomer(): void {
    this.router.navigate(['/admin/onboard']);
  }

  viewCustomer(customer: Customer): void {
    this.router.navigate(['/admin/customers', customer.id]);
  }

  viewDashboard(customer: Customer): void {
    this.router.navigate(['/admin/customers', customer.id], {
      queryParams: { tab: 'dashboard' },
    });
  }

  manageCustomer(customer: Customer): void {
    this.ctx.openModal({ type: 'editCustomer', data: customer });
  }

  approve(customer: Customer): void {
    this.data.approveCustomer(customer.id);
  }

  reject(customer: Customer): void {
    this.data.rejectCustomer(customer.id);
  }
}
