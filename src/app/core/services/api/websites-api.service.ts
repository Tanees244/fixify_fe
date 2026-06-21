import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiEnvelope, CreateWebsiteRequest, GetWebsitesParams } from '../../models/api.models';
import { ApiBaseService } from './api-base.service';

@Injectable({ providedIn: 'root' })
export class WebsitesApiService extends ApiBaseService {
  getWebsites(
    params: GetWebsitesParams = {}
  ): Observable<
    ApiEnvelope<{ items: unknown[]; websites: unknown[]; total: number; page: number; limit: number }>
  > {
    return this.http.get<
      ApiEnvelope<{ items: unknown[]; websites: unknown[]; total: number; page: number; limit: number }>
    >(
      this.url('/websites'),
      {
        params: this.buildParams({
          page: params.page ?? 1,
          limit: params.limit ?? 100,
          status: params.status,
          clientId: params.clientId,
          search: params.search,
        }),
      }
    );
  }

  createWebsite(body: CreateWebsiteRequest): Observable<ApiEnvelope<unknown>> {
    return this.http.post<ApiEnvelope<unknown>>(this.url('/websites'), body);
  }

  activateWebsite(websiteId: string): Observable<ApiEnvelope<unknown>> {
    return this.http.patch<ApiEnvelope<unknown>>(
      this.url(`/websites/${encodeURIComponent(websiteId)}/activate`),
      {}
    );
  }

  deactivateWebsite(websiteId: string): Observable<ApiEnvelope<unknown>> {
    return this.http.patch<ApiEnvelope<unknown>>(
      this.url(`/websites/${encodeURIComponent(websiteId)}/deactivate`),
      {}
    );
  }

  deleteWebsite(websiteId: string): Observable<ApiEnvelope<unknown>> {
    return this.http.delete<ApiEnvelope<unknown>>(
      this.url(`/websites/${encodeURIComponent(websiteId)}`)
    );
  }
}
