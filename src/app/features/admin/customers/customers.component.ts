import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  DataSessionService,
  CustomersDataService,
  SitesDataService,
  SubscriptionsDataService,
} from '../../../core/services/data';
import { AppContextService } from '../../../core/services/app-context.service';
import { Customer } from '../../../core/models/fixify.models';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { TableSkeletonComponent } from '../../../shared/components/table-skeleton/table-skeleton.component';
import { tw } from '../../../shared/ui/tw';

type CustomerTab = 'all' | 'pending' | 'active';

@Component({
  selector: 'app-admin-customers',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, TableSkeletonComponent],
  templateUrl: './customers.component.html',
})
export class CustomersComponent {
  protected readonly ui = tw;

  private readonly session = inject(DataSessionService);
  private readonly customersData = inject(CustomersDataService);
  private readonly sitesData = inject(SitesDataService);
  private readonly subscriptionsData = inject(SubscriptionsDataService);
  private readonly ctx = inject(AppContextService);
  private readonly router = inject(Router);

  readonly customers = this.customersData.customers;
  readonly sites = this.sitesData.sites;
  readonly loading = this.session.loading;

  readonly search = signal('');
  readonly tab = signal<CustomerTab>('all');

  plans() {
    return this.subscriptionsData.subscriptionPlans;
  }

  planLabel(id: string) {
    return this.subscriptionsData.planLabel(id);
  }

  planColor(id: string) {
    return this.subscriptionsData.planColor(id);
  }

  planPrice(id: string) {
    return this.subscriptionsData.planPrice(id);
  }

  readonly pendingCount = computed(() => {
    this.session.dataRevision();
    return this.customers.filter((c) => c.approvalStatus === 'pending').length;
  });

  readonly activeCount = computed(() => {
    this.session.dataRevision();
    return this.customers.filter((c) => c.status === 'active' && c.approvalStatus === 'approved').length;
  });

  readonly filteredCustomers = computed(() => {
    this.session.dataRevision();
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
    this.customersData.approveCustomer(customer.id);
  }

  reject(customer: Customer): void {
    this.customersData.rejectCustomer(customer.id);
  }
}
