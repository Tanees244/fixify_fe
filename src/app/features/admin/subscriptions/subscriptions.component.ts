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
  SubscriptionsDataService,
} from '../../../core/services/data';
import { AppContextService } from '../../../core/services/app-context.service';
import { Customer, SubscriptionPlan } from '../../../core/models/fixify.models';
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
  private readonly ctx = inject(AppContextService);
  private readonly router = inject(Router);

  readonly customers = this.customersData.customers;
  readonly loading = this.session.loading;
  readonly planSaving = this.subscriptionsData.planSaving;

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
    return this.approvedCustomers().filter(
      (c) =>
        q === '' ||
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q)
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

  createPlan(): void {
    this.ctx.openModal({ type: 'subscriptionPlan' });
  }

  editPlan(plan: SubscriptionPlan): void {
    this.ctx.openModal({ type: 'subscriptionPlan', data: plan });
  }

  deletePlan(plan: SubscriptionPlan): void {
    const count = this.subscriptionsData.customersOnPlan(plan.id);
    this.ctx.openModal({
      type: 'confirm',
      title: 'Delete subscription plan?',
      body: count
        ? `Cannot delete "${plan.name}" — ${count} customer(s) are on this plan. Reassign them first.`
        : `Permanently delete the "${plan.name}" plan (${plan.priceLabel})?`,
      danger: count === 0,
      onConfirm: count === 0 ? () => this.subscriptionsData.deleteSubscriptionPlan(plan.id) : undefined,
    });
  }

  assignPlan(customer: Customer, planId: string): void {
    this.customersData.assignSubscription(customer.id, planId);
  }

  viewCustomer(id: number): void {
    this.router.navigate(['/admin/customers', id]);
  }

  onPlanSelect(customer: Customer, event: Event): void {
    const plan = (event.target as HTMLSelectElement).value;
    this.assignPlan(customer, plan);
  }
}
