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
import { Customer, SubscriptionPlan } from '../../../core/models/fixify.models';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { TableSkeletonComponent } from '../../../shared/components/table-skeleton/table-skeleton.component';

type SubTab = 'plans' | 'assignments';

@Component({
  selector: 'app-admin-subscriptions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, BadgeComponent, TableSkeletonComponent],
  templateUrl: './subscriptions.component.html',
})
export class SubscriptionsComponent {
  private readonly data = inject(FixifyDataService);
  private readonly ctx = inject(AppContextService);
  private readonly router = inject(Router);

  readonly customers = this.data.customers;
  readonly loading = this.data.loading;
  readonly planSaving = this.data.planSaving;

  readonly tab = signal<SubTab>('plans');
  readonly search = signal('');

  readonly skeletonCards = [0, 1, 2];

  readonly plans = computed(() => {
    this.data.dataRevision();
    return this.data.subscriptionPlans;
  });

  readonly pending = computed(() => {
    this.data.dataRevision();
    return this.data.pendingApprovals();
  });

  readonly mrr = computed(() => {
    this.data.dataRevision();
    return this.customers
      .filter((c) => c.approvalStatus === 'approved')
      .reduce((sum, c) => sum + this.data.planPrice(c.plan), 0);
  });

  readonly approvedCustomers = computed(() => {
    this.data.dataRevision();
    return this.customers.filter((c) => c.approvalStatus === 'approved');
  });

  readonly filteredAssignments = computed(() => {
    this.data.dataRevision();
    const q = this.search().toLowerCase();
    return this.approvedCustomers().filter(
      (c) =>
        q === '' ||
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q)
    );
  });

  planLabel(id: string): string {
    return this.data.planLabel(id);
  }

  planColor(id: string): string {
    return this.data.planColor(id);
  }

  planPrice(id: string): number {
    return this.data.planPrice(id);
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
    const count = this.data.customersOnPlan(plan.id);
    this.ctx.openModal({
      type: 'confirm',
      title: 'Delete subscription plan?',
      body: count
        ? `Cannot delete "${plan.name}" — ${count} customer(s) are on this plan. Reassign them first.`
        : `Permanently delete the "${plan.name}" plan (${plan.priceLabel})?`,
      danger: count === 0,
      onConfirm: count === 0 ? () => this.data.deleteSubscriptionPlan(plan.id) : undefined,
    });
  }

  assignPlan(customer: Customer, planId: string): void {
    this.data.assignSubscription(customer.id, planId);
  }

  viewCustomer(id: number): void {
    this.router.navigate(['/admin/customers', id]);
  }

  onPlanSelect(customer: Customer, event: Event): void {
    const plan = (event.target as HTMLSelectElement).value;
    this.assignPlan(customer, plan);
  }
}
