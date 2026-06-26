import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AppContextService } from '../../../core/services/app-context.service';
import { DataSessionService, SitesDataService } from '../../../core/services/data';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { SparkLineComponent } from '../../../shared/components/spark-line/spark-line.component';
import { UptimeHistoryDay } from '../../../core/models/site-screens.models';
import { tw } from '../../../shared/ui/tw';

@Component({
  selector: 'app-customer-uptime',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BadgeComponent, SparkLineComponent],
  templateUrl: './uptime.component.html',
})
export class UptimeComponent {
  protected readonly ui = tw;

  readonly ctx = inject(AppContextService);
  private readonly session = inject(DataSessionService);
  private readonly sitesData = inject(SitesDataService);

  readonly loading = this.session.loading;
  readonly site = computed(() => this.ctx.selectedSite());

  readonly dashboard = computed(() => {
    this.session.dataRevision();
    return this.sitesData.uptimeDashboard();
  });

  readonly isOnline = computed(() => this.dashboard()?.status?.toLowerCase() === 'online');

  readonly responseData = computed(() => this.dashboard()?.responseTrend?.points ?? []);

  readonly endpoints = computed(() => this.dashboard()?.endpoints ?? []);

  readonly history = computed(() => this.dashboard()?.history90d ?? []);

  segmentHeight(day: UptimeHistoryDay): number {
    return day.status === 'up' ? 26 : day.status === 'degraded' ? 16 : 9;
  }

  segmentColor(day: UptimeHistoryDay): string {
    return day.status === 'up' ? '#10b981' : day.status === 'degraded' ? '#f59e0b' : '#ef4444';
  }

  endpointOnline(status: string): boolean {
    return status.toLowerCase() === 'online';
  }
}
