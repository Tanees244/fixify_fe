import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiEnvelope } from '../../models/api.models';
import {
  WpCacheScreen,
  WpConnectionStatus,
  WpCoreScreen,
  WpMaintenanceScreen,
  WpOverviewScreen,
  WpPluginsScreen,
  WpSecurityScreen,
  WpThemeScreen,
} from '../../models/site-screens.models';
import { ApiBaseService } from './api-base.service';

/** WordPress site management — /api/sites/{id}/wordpress/* (id = website apiId). */
@Injectable({ providedIn: 'root' })
export class WordpressApiService extends ApiBaseService {
  private base(siteId: string): string {
    return `/api/sites/${encodeURIComponent(siteId)}/wordpress`;
  }

  getStatus(siteId: string): Observable<ApiEnvelope<WpConnectionStatus>> {
    return this.http.get<ApiEnvelope<WpConnectionStatus>>(this.url(`${this.base(siteId)}/status`));
  }

  refresh(siteId: string): Observable<ApiEnvelope<unknown>> {
    return this.http.post<ApiEnvelope<unknown>>(this.url(`${this.base(siteId)}/refresh`), {});
  }

  getOverview(siteId: string): Observable<ApiEnvelope<WpOverviewScreen>> {
    return this.http.get<ApiEnvelope<WpOverviewScreen>>(this.url(`${this.base(siteId)}/overview`));
  }

  getPlugins(siteId: string, filter?: string): Observable<ApiEnvelope<WpPluginsScreen>> {
    return this.http.get<ApiEnvelope<WpPluginsScreen>>(this.url(`${this.base(siteId)}/plugins`), {
      params: this.buildParams({ filter }),
    });
  }

  getCore(siteId: string): Observable<ApiEnvelope<WpCoreScreen>> {
    return this.http.get<ApiEnvelope<WpCoreScreen>>(this.url(`${this.base(siteId)}/core`));
  }

  getTheme(siteId: string): Observable<ApiEnvelope<WpThemeScreen>> {
    return this.http.get<ApiEnvelope<WpThemeScreen>>(this.url(`${this.base(siteId)}/theme`));
  }

  getCache(siteId: string): Observable<ApiEnvelope<WpCacheScreen>> {
    return this.http.get<ApiEnvelope<WpCacheScreen>>(this.url(`${this.base(siteId)}/cache`));
  }

  getSecurity(siteId: string): Observable<ApiEnvelope<WpSecurityScreen>> {
    return this.http.get<ApiEnvelope<WpSecurityScreen>>(this.url(`${this.base(siteId)}/security`));
  }

  getMaintenance(siteId: string): Observable<ApiEnvelope<WpMaintenanceScreen>> {
    return this.http.get<ApiEnvelope<WpMaintenanceScreen>>(
      this.url(`${this.base(siteId)}/maintenance`)
    );
  }
}
