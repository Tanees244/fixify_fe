import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  PageSpeedRequest,
  PageSpeedResponse,
  PHPVersionResponse,
  SSLResponse,
  UptimeResponse,
  WordPressHealthResponse,
  WordPressPluginsResponse,
  WordPressUpdatesResponse,
} from '../../models/api.models';
import { ApiBaseService } from './api-base.service';

@Injectable({ providedIn: 'root' })
export class AnalyticsApiService extends ApiBaseService {
  checkPageSpeed(body: PageSpeedRequest): Observable<PageSpeedResponse> {
    return this.http.post<PageSpeedResponse>(this.url('/analytics/pagespeed'), body);
  }

  checkUptime(url: string): Observable<UptimeResponse> {
    return this.http.post<UptimeResponse>(this.url('/analytics/uptime'), { url });
  }

  checkSsl(url: string): Observable<SSLResponse> {
    return this.http.post<SSLResponse>(this.url('/analytics/ssl'), { url });
  }

  checkPhpVersion(url: string): Observable<PHPVersionResponse> {
    return this.http.post<PHPVersionResponse>(this.url('/analytics/php-version'), { url });
  }

  getWordPressPlugins(
    url: string,
    username: string,
    password: string
  ): Observable<WordPressPluginsResponse> {
    return this.http.post<WordPressPluginsResponse>(this.url('/analytics/wordpress/plugins'), {
      url,
      username,
      password,
    });
  }

  getWordPressUpdates(
    url: string,
    username: string,
    password: string
  ): Observable<WordPressUpdatesResponse> {
    return this.http.post<WordPressUpdatesResponse>(this.url('/analytics/wordpress/updates'), {
      url,
      username,
      password,
    });
  }

  getWordPressSiteHealth(
    url: string,
    username: string,
    password: string
  ): Observable<WordPressHealthResponse> {
    return this.http.post<WordPressHealthResponse>(this.url('/analytics/wordpress/health'), {
      url,
      username,
      password,
    });
  }

  checkBlacklist(url: string): Observable<unknown> {
    return this.http.post(this.url('/analytics/blacklist'), { url });
  }

  checkGtMetrix(body: { url: string; action: string; testId?: string }): Observable<unknown> {
    return this.http.post(this.url('/analytics/gtmetrix'), body);
  }
}
