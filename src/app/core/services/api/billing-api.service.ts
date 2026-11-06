import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiEnvelope } from '../../models/api.models';
import { BillingInterval } from '../../models/billing.models';
import { ApiBaseService } from './api-base.service';

/** Contract documented in docs/BACKEND_SUBSCRIPTIONS.md */
@Injectable({ providedIn: 'root' })
export class BillingApiService extends ApiBaseService {
  // —— Customer ——
  getSubscription(): Observable<ApiEnvelope<unknown>> {
    return this.http.get<ApiEnvelope<unknown>>(this.url('/api/billing/entitlements'));
  }

  getPublicPlans(): Observable<ApiEnvelope<{ items: unknown[] }>> {
    return this.http.get<ApiEnvelope<{ items: unknown[] }>>(this.url('/api/plans/public'));
  }

  checkout(planId: string, interval: BillingInterval): Observable<ApiEnvelope<{ url: string }>> {
    return this.http.post<ApiEnvelope<{ url: string }>>(this.url('/api/billing/checkout'), {
      planSlug: planId,
      interval,
    });
  }

  /** Upgrades prorate immediately; downgrades are scheduled for period end (backend decides). */
  changePlan(planId: string, direction: 'upgrade' | 'downgrade'): Observable<ApiEnvelope<unknown>> {
    return this.http.put<ApiEnvelope<unknown>>(
      this.url(`/api/billing/subscription/${direction}`),
      { planSlug: planId }
    );
  }

  setExtraSites(quantity: number): Observable<ApiEnvelope<unknown>> {
    return this.http.post<ApiEnvelope<unknown>>(this.url('/api/billing/extra-sites'), {
      quantity,
    });
  }

  portal(): Observable<ApiEnvelope<{ url: string }>> {
    return this.http.post<ApiEnvelope<{ url: string }>>(this.url('/api/billing/portal'), {});
  }

  cancel(): Observable<ApiEnvelope<unknown>> {
    return this.http.post<ApiEnvelope<unknown>>(this.url('/api/billing/subscription/cancel'), {});
  }

  // —— Admin ——
  adminList(status?: string): Observable<ApiEnvelope<unknown>> {
    return this.http.get<ApiEnvelope<unknown>>(this.url('/api/admin/billing/entitlements'), {
      params: this.buildParams({ status, limit: 200 }),
    });
  }

  adminGetCustomer(customerId: string): Observable<ApiEnvelope<unknown>> {
    return this.http.get<ApiEnvelope<unknown>>(
      this.url(`/api/admin/billing/customers/${encodeURIComponent(customerId)}/entitlements`)
    );
  }

  adminChangePlan(
    customerId: string,
    body: { planId: string; markPaid?: boolean }
  ): Observable<ApiEnvelope<unknown>> {
    return this.http.post<ApiEnvelope<unknown>>(
      this.url(`/api/admin/billing/customers/${encodeURIComponent(customerId)}/change-plan`),
      body
    );
  }

  adminExtendTrial(customerId: string, trialEndsAt: string): Observable<ApiEnvelope<unknown>> {
    return this.http.post<ApiEnvelope<unknown>>(
      this.url(`/api/admin/billing/customers/${encodeURIComponent(customerId)}/extend-trial`),
      { trialEndsAt }
    );
  }

  adminCancel(customerId: string): Observable<ApiEnvelope<unknown>> {
    return this.http.post<ApiEnvelope<unknown>>(
      this.url(`/api/admin/billing/customers/${encodeURIComponent(customerId)}/cancel`),
      {}
    );
  }
}
