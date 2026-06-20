import { Injectable, Injector, inject } from '@angular/core';
import { SubscriptionPlan, SubscriptionPlanPayload } from '../../models/fixify.models';
import { cloneMockData, MOCK_SUBSCRIPTION_PLANS } from '../../data/mock-data';
import { formatPriceLabel } from '../../constants/subscription.constants';
import { NotificationService } from '../notification.service';
import { AppContextService } from '../app-context.service';
import { CustomersDataService } from './customers-data.service';

@Injectable({ providedIn: 'root' })
export class SubscriptionsDataService {
  private readonly toast = inject(NotificationService);
  private readonly ctx = inject(AppContextService);
  private readonly injector = inject(Injector);
  readonly subscriptionPlans: SubscriptionPlan[] = [];

  private nextPlanId = 100;

  initSession(): void {
    this.subscriptionPlans.splice(
      0,
      this.subscriptionPlans.length,
      ...cloneMockData(MOCK_SUBSCRIPTION_PLANS)
    );
  }

  getPlan(id: string): SubscriptionPlan | undefined {
    return this.subscriptionPlans.find((p) => p.id === id);
  }

  planLabel(id: string): string {
    return this.getPlan(id)?.name ?? id;
  }

  planPrice(id: string): number {
    return this.getPlan(id)?.price ?? 0;
  }

  planColor(id: string): string {
    return this.getPlan(id)?.color ?? '#6b88ad';
  }

  customersOnPlan(planId: string): number {
    return this.injector.get(CustomersDataService).customersOnPlan(planId);
  }
  createSubscriptionPlan(data: SubscriptionPlanPayload): void {
    const baseId =
      data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || `plan-${this.nextPlanId}`;
    let id = baseId;
    while (this.subscriptionPlans.some((p) => p.id === id)) {
      id = `${baseId}-${this.nextPlanId++}`;
    }
    const plan: SubscriptionPlan = {
      id,
      name: data.name.trim(),
      price: data.price,
      priceLabel: formatPriceLabel(data.price),
      color: data.color,
      features: data.features.filter((f) => f.trim()),
    };
    this.subscriptionPlans.push(plan);
    this.toast.success(`Plan "${plan.name}" created`);
    this.ctx.closeModal();
  }

  updateSubscriptionPlan(id: string, data: SubscriptionPlanPayload): void {
    const idx = this.subscriptionPlans.findIndex((p) => p.id === id);
    if (idx < 0) return;
    this.subscriptionPlans[idx] = {
      ...this.subscriptionPlans[idx],
      name: data.name.trim(),
      price: data.price,
      priceLabel: formatPriceLabel(data.price),
      color: data.color,
      features: data.features.filter((f) => f.trim()),
    };
    this.toast.success(`Plan "${data.name}" updated`);
    this.ctx.closeModal();
  }

  deleteSubscriptionPlan(id: string): boolean {
    const count = this.customersOnPlan(id);
    if (count > 0) {
      this.toast.show(
        `Cannot delete — ${count} customer${count === 1 ? '' : 's'} on this plan`,
        'warning'
      );
      return false;
    }
    const idx = this.subscriptionPlans.findIndex((p) => p.id === id);
    if (idx < 0) return false;
    const name = this.subscriptionPlans[idx].name;
    this.subscriptionPlans.splice(idx, 1);
    this.toast.info(`Plan "${name}" deleted`);
    return true;
  }
}
