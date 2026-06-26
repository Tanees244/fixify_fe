import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminMonthlyReportItem, AdminWebsiteDashboardData, ApiEnvelope, CustomerDashboardData } from '../../models/api.models';
import { ApiBaseService } from './api-base.service';

@Injectable({ providedIn: 'root' })
export class DashboardApiService extends ApiBaseService {
  getCustomerDashboard(siteId?: string): Observable<ApiEnvelope<CustomerDashboardData>> {
    return this.http.get<ApiEnvelope<CustomerDashboardData>>(
      this.url('/api/customer/dashboard'),
      { params: this.buildParams({ siteId }) }
    );
  }

  getAdminWebsiteDashboard(websiteId: string): Observable<ApiEnvelope<AdminWebsiteDashboardData>> {
    return this.http.get<ApiEnvelope<AdminWebsiteDashboardData>>(
      this.url(`/api/admin/dashboard/websites/${encodeURIComponent(websiteId)}`)
    );
  }

  getAdminWebsiteReports(
    websiteId: string,
    params: { year?: number; page?: number; limit?: number } = {}
  ): Observable<
    ApiEnvelope<{
      websiteId: string;
      year: string | number;
      reports: AdminMonthlyReportItem[];
      pagination: unknown;
    }>
  > {
    return this.http.get<
      ApiEnvelope<{
        websiteId: string;
        year: string | number;
        reports: AdminMonthlyReportItem[];
        pagination: unknown;
      }>
    >(this.url(`/api/admin/dashboard/websites/${encodeURIComponent(websiteId)}/reports`), {
      params: this.buildParams({ page: params.page ?? 1, limit: params.limit ?? 12, year: params.year }),
    });
  }
}
