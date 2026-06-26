import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiEnvelope, SubscriptionPlanRequest } from '../../models/api.models';
import { ApiBaseService } from './api-base.service';

@Injectable({ providedIn: 'root' })
export class SubscriptionsApiService extends ApiBaseService {
  getPlans(): Observable<ApiEnvelope<{ items: unknown[]; total: number }>> {
    return this.http.get<ApiEnvelope<{ items: unknown[]; total: number }>>(
      this.url('/api/subscriptions')
    );
  }

  createPlan(body: SubscriptionPlanRequest): Observable<ApiEnvelope<unknown>> {
    return this.http.post<ApiEnvelope<unknown>>(this.url('/api/subscriptions'), body);
  }

  updatePlan(id: string, body: SubscriptionPlanRequest): Observable<ApiEnvelope<unknown>> {
    return this.http.put<ApiEnvelope<unknown>>(
      this.url(`/api/subscriptions/${encodeURIComponent(id)}`),
      body
    );
  }

  deletePlan(id: string): Observable<ApiEnvelope<unknown>> {
    return this.http.delete<ApiEnvelope<unknown>>(
      this.url(`/api/subscriptions/${encodeURIComponent(id)}`)
    );
  }

  getCustomersCount(id: string): Observable<ApiEnvelope<{ count: number }>> {
    return this.http.get<ApiEnvelope<{ count: number }>>(
      this.url(`/api/subscriptions/${encodeURIComponent(id)}/customers/count`)
    );
  }
}
