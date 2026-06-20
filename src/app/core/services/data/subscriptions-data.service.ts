import { Injectable, Injector, inject, signal } from '@angular/core';
import { SubscriptionPlan, SubscriptionPlanPayload } from '../../models/fixify.models';
import { mapApiSubscriptionPlan } from '../../utils/api-mappers.util';
import { NotificationService } from '../notification.service';
import { AppContextService } from '../app-context.service';
import { SubscriptionsApiService } from '../api/subscriptions-api.service';
import { DataSessionService } from './data-session.service';
import { CustomersDataService } from './customers-data.service';

@Injectable({ providedIn: 'root' })
export class SubscriptionsDataService {
  private readonly toast = inject(NotificationService);
  private readonly ctx = inject(AppContextService);
  private readonly session = inject(DataSessionService);
  private readonly subscriptionsApi = inject(SubscriptionsApiService);
  private readonly injector = inject(Injector);
  readonly subscriptionPlans: SubscriptionPlan[] = [];
  readonly planSaving = signal(false);

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

  fetchSubscriptions(done?: () => void): void {
    if (!this.session.useApi()) {
      this.subscriptionPlans.splice(0, this.subscriptionPlans.length);
      done?.();
      return;
    }
    this.session.beginLoad();
    this.syncPlansFromApi(() => {
      this.session.endLoad();
      done?.();
    }, () => {
      this.session.endLoad();
      this.toast.error('Failed to load subscription plans');
      done?.();
    });
  }

  private syncPlansFromApi(done?: () => void, onError?: () => void): void {
    this.subscriptionsApi.getPlans().subscribe({
      next: (res) => {
        this.subscriptionPlans.splice(
          0,
          this.subscriptionPlans.length,
          ...(res.data?.items ?? []).map((p) => mapApiSubscriptionPlan(p))
        );
        this.session.bump();
        done?.();
      },
      error: () => onError?.(),
    });
  }

  createSubscriptionPlan(data: SubscriptionPlanPayload): void {
    if (!this.session.useApi()) {
      this.toast.error('Sign in to create subscription plans');
      return;
    }
    this.planSaving.set(true);
    this.subscriptionsApi
      .createPlan({
        name: data.name.trim(),
        price: data.price,
        color: data.color,
        features: data.features.filter((f) => f.trim()),
      })
      .subscribe({
        next: () => {
          this.syncPlansFromApi(() => {
            this.planSaving.set(false);
            this.toast.success(`Plan "${data.name}" created`);
            this.ctx.closeModal();
          });
        },
        error: (err) => {
          this.planSaving.set(false);
          this.toast.error(err?.error?.message || 'Failed to create subscription plan');
        },
      });
  }

  updateSubscriptionPlan(id: string, data: SubscriptionPlanPayload): void {
    if (!this.session.useApi()) {
      this.toast.error('Sign in to update subscription plans');
      return;
    }
    this.planSaving.set(true);
    this.subscriptionsApi
      .updatePlan(id, {
        name: data.name.trim(),
        price: data.price,
        color: data.color,
        features: data.features.filter((f) => f.trim()),
      })
      .subscribe({
        next: () => {
          this.syncPlansFromApi(() => {
            this.planSaving.set(false);
            this.toast.success(`Plan "${data.name}" updated`);
            this.ctx.closeModal();
          });
        },
        error: (err) => {
          this.planSaving.set(false);
          this.toast.error(err?.error?.message || 'Failed to update subscription plan');
        },
      });
  }

  deleteSubscriptionPlan(id: string): boolean {
    if (!this.session.useApi()) {
      this.toast.error('Sign in to delete subscription plans');
      return false;
    }
    this.subscriptionsApi.getCustomersCount(id).subscribe({
      next: (res) => {
        const count = res.data?.count ?? 0;
        if (count > 0) {
          this.toast.show(
            `Cannot delete — ${count} customer${count === 1 ? '' : 's'} on this plan`,
            'warning'
          );
          return;
        }
        this.subscriptionsApi.deletePlan(id).subscribe({
          next: () => {
            this.syncPlansFromApi(() => this.toast.info(`Plan deleted`));
          },
          error: (err) =>
            this.toast.error(err?.error?.message || 'Failed to delete subscription plan'),
        });
      },
      error: () => this.toast.error('Failed to check plan usage'),
    });
    return false;
  }
}
