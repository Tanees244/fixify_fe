import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiEnvelope } from '../../models/api.models';
import { ActivePromotions, Promotion, PromotionInput } from '../../models/promotions.models';
import { ApiBaseService } from './api-base.service';

@Injectable({ providedIn: 'root' })
export class PromotionsApiService extends ApiBaseService {
  /** Customer + admin: what is currently live. */
  active(): Observable<ApiEnvelope<ActivePromotions>> {
    return this.http.get<ApiEnvelope<ActivePromotions>>(this.url('/api/promotions/active'));
  }

  // —— Admin ——
  list(): Observable<ApiEnvelope<{ items: Promotion[]; total: number }>> {
    return this.http.get<ApiEnvelope<{ items: Promotion[]; total: number }>>(
      this.url('/api/promotions')
    );
  }

  create(body: PromotionInput): Observable<ApiEnvelope<Promotion>> {
    return this.http.post<ApiEnvelope<Promotion>>(this.url('/api/promotions'), body);
  }

  update(id: string, body: Partial<PromotionInput>): Observable<ApiEnvelope<Promotion>> {
    return this.http.put<ApiEnvelope<Promotion>>(
      this.url(`/api/promotions/${encodeURIComponent(id)}`),
      body
    );
  }

  remove(id: string): Observable<ApiEnvelope<null>> {
    return this.http.delete<ApiEnvelope<null>>(
      this.url(`/api/promotions/${encodeURIComponent(id)}`)
    );
  }
}
