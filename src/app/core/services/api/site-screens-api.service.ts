import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiEnvelope } from '../../models/api.models';
import {
  ApiReportRecord,
  GenerateReportRequest,
  SitePerformanceScreen,
  SiteSecurityScreen,
  SiteSeoScreen,
} from '../../models/site-screens.models';
import { ApiBaseService } from './api-base.service';

@Injectable({ providedIn: 'root' })
export class SiteScreensApiService extends ApiBaseService {
  getPerformance(siteId: string): Observable<ApiEnvelope<SitePerformanceScreen>> {
    return this.http.get<ApiEnvelope<SitePerformanceScreen>>(
      this.url(`/api/sites/${encodeURIComponent(siteId)}/performance`)
    );
  }

  scanPerformance(siteId: string): Observable<ApiEnvelope<SitePerformanceScreen>> {
    return this.http.post<ApiEnvelope<SitePerformanceScreen>>(
      this.url(`/api/sites/${encodeURIComponent(siteId)}/performance/scan`),
      {}
    );
  }

  exportPerformancePdf(siteId: string): Observable<Blob> {
    return this.http.get(this.url(`/api/sites/${encodeURIComponent(siteId)}/performance/export`), {
      responseType: 'blob',
    });
  }

  getSecurity(siteId: string): Observable<ApiEnvelope<SiteSecurityScreen>> {
    return this.http.get<ApiEnvelope<SiteSecurityScreen>>(
      this.url(`/api/sites/${encodeURIComponent(siteId)}/security`)
    );
  }

  scanSecurity(siteId: string): Observable<ApiEnvelope<SiteSecurityScreen>> {
    return this.http.post<ApiEnvelope<SiteSecurityScreen>>(
      this.url(`/api/sites/${encodeURIComponent(siteId)}/security/scan`),
      {}
    );
  }

  getSeo(siteId: string): Observable<ApiEnvelope<SiteSeoScreen>> {
    return this.http.get<ApiEnvelope<SiteSeoScreen>>(
      this.url(`/api/sites/${encodeURIComponent(siteId)}/seo`)
    );
  }

  scanSeo(siteId: string): Observable<ApiEnvelope<SiteSeoScreen>> {
    return this.http.post<ApiEnvelope<SiteSeoScreen>>(
      this.url(`/api/sites/${encodeURIComponent(siteId)}/seo/scan`),
      {}
    );
  }

  getReports(params: {
    siteId?: string;
    custId?: string;
    year?: number;
  }): Observable<ApiEnvelope<{ items: ApiReportRecord[]; total: number }>> {
    return this.http.get<ApiEnvelope<{ items: ApiReportRecord[]; total: number }>>(
      this.url('/api/reports'),
      {
        params: this.buildParams({
          siteId: params.siteId,
          custId: params.custId,
          year: params.year,
        }),
      }
    );
  }

  generateReport(body: GenerateReportRequest): Observable<ApiEnvelope<ApiReportRecord>> {
    return this.http.post<ApiEnvelope<ApiReportRecord>>(
      this.url('/api/reports/generate'),
      body
    );
  }
}
