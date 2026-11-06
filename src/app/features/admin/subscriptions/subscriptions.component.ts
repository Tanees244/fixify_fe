import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { BillingApiService } from '../../../core/services/api/billing-api.service';
import { AdminSubscriptionRow } from '../../../core/models/billing.models';
import { mapAdminSubscriptionsList } from '../../../core/utils/billing-mappers.util';
import {
  DataSessionService,
  CustomersDataService,
  SubscriptionsDataService,
} from '../../../core/services/data';
import { Customer, SubscriptionPlan } from '../../../core/models/fixify.models';
import { AppContextService } from '../../../core/services/app-context.service';
import { NotificationService } from '../../../core/services/notification.service';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { TableSkeletonComponent } from '../../../shared/components/table-skeleton/table-skeleton.component';
import { tw } from '../../../shared/ui/tw';

type SubTab = 'plans' | 'assignments';

@Component({
  selector: 'app-admin-subscriptions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, BadgeComponent, TableSkeletonComponent],
  templateUrl: './subscriptions.component.html',
})
export class SubscriptionsComponent {
  protected readonly ui = tw;

  private readonly session = inject(DataSessionService);
  private readonly customersData = inject(CustomersDataService);
  private readonly subscriptionsData = inject(SubscriptionsDataService);
  private readonly router = inject(Router);
  private readonly billingApi = inject(BillingApiService);
  private readonly ctx = inject(AppContextService);
  private readonly toast = inject(NotificationService);

  readonly statusFilter = signal('');
  readonly statusRows = signal<AdminSubscriptionRow[]>([]);
  readonly trialsEndingSoon = signal(0);
  readonly statuses = ['trialing', 'active', 'past_due', 'expired', 'canceled'];

  constructor() {
    this.loadStatuses();
  }

  loadStatuses(): void {
    this.billingApi.adminList(this.statusFilter() || undefined).subscribe({
      next: (res) => {
        const l = mapAdminSubscriptionsList(res.data);
        this.statusRows.set(l.items);
        // The customer list carries the profile plan, which can lag behind the real subscription.
        let changed = false;
        for (const row of l.items) {
          changed = this.customersData.setPlanByApiId(row.customerId, row.planId) || changed;
        }
        if (changed) this.session.bump();
        this.trialsEndingSoon.set(l.trialsEndingSoon);
      },
      error: () => undefined,
    });
  }

  setStatusFilter(v: string): void {
    this.statusFilter.set(v);
    this.loadStatuses();
  }

  /** Subscription row for a customer (matched by email) from the admin list, if loaded. */
  statusFor(c: Customer): AdminSubscriptionRow | undefined {
    return this.statusRows().find((r) => r.email.toLowerCase() === c.email.toLowerCase());
  }

  readonly customers = this.customersData.customers;
  readonly loading = this.session.loading;

  readonly tab = signal<SubTab>('plans');
  readonly search = signal('');

  readonly skeletonCards = [0, 1, 2];

  readonly plans = computed(() => {
    this.session.dataRevision();
    return this.subscriptionsData.subscriptionPlans;
  });

  readonly pending = computed(() => {
    this.session.dataRevision();
    return this.customersData.pendingApprovals();
  });

  readonly mrr = computed(() => {
    this.session.dataRevision();
    return this.customers
      .filter((c) => c.approvalStatus === 'approved')
      .reduce((sum, c) => sum + this.subscriptionsData.planPrice(c.plan), 0);
  });

  readonly approvedCustomers = computed(() => {
    this.session.dataRevision();
    return this.customers.filter((c) => c.approvalStatus === 'approved');
  });

  readonly filteredAssignments = computed(() => {
    this.session.dataRevision();
    const q = this.search().toLowerCase();
    const filter = this.statusFilter();
    return this.approvedCustomers().filter(
      (c) =>
        (q === '' ||
          c.name.toLowerCase().includes(q) ||
          c.company.toLowerCase().includes(q)) &&
        (!filter || this.statusFor(c)?.status === filter)
    );
  });

  planLabel(id: string): string {
    return this.subscriptionsData.planLabel(id);
  }

  planColor(id: string): string {
    return this.subscriptionsData.planColor(id);
  }

  planPrice(id: string): number {
    return this.subscriptionsData.planPrice(id);
  }

  planCount(planId: string): number {
    return this.customers.filter(
      (c) => c.plan === planId && c.approvalStatus === 'approved'
    ).length;
  }

  planRevenue(planId: string): number {
    return this.planCount(planId) * this.planPrice(planId);
  }

  setTab(tab: SubTab): void {
    this.tab.set(tab);
  }

  onSearch(value: string): void {
    this.search.set(value);
  }

  openCreatePlan(): void {
    this.ctx.openModal({ type: 'subscriptionPlan' });
  }

  openEditPlan(plan: SubscriptionPlan): void {
    this.ctx.openModal({ type: 'subscriptionPlan', data: plan });
  }

  /** Admin assignment goes through the backend (was a local-only change). Assigning = paid/active. */
  assignPlan(customer: Customer, planId: string): void {
    if (!customer.apiId) {
      this.toast.error('Customer is not linked to the backend yet');
      return;
    }
    this.billingApi.adminChangePlan(customer.apiId, { planId, markPaid: true }).subscribe({
      next: () => {
        this.customersData.assignSubscription(customer.id, planId);
        this.loadStatuses();
      },
      error: (err) => this.toast.error(err?.error?.message || 'Could not change plan'),
    });
  }

  viewCustomer(id: number): void {
    this.router.navigate(['/admin/customers', id]);
  }

  onPlanSelect(customer: Customer, event: Event): void {
    const plan = (event.target as HTMLSelectElement).value;
    this.assignPlan(customer, plan);
  }
}
