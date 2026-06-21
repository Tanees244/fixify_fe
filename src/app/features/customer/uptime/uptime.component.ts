import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { AppContextService } from '../../../core/services/app-context.service';
import { NotificationService } from '../../../core/services/notification.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { SparkLineComponent } from '../../../shared/components/spark-line/spark-line.component';
import { tw } from '../../../shared/ui/tw';

interface Endpoint {
  url: string;
  status: 'Online' | 'Slow';
  ms: string;
}

type UptimeSegment = 'ok' | 'warn' | 'bad';

@Component({
  selector: 'app-customer-uptime',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, BadgeComponent, SparkLineComponent],
  templateUrl: './uptime.component.html',
})
export class UptimeComponent implements OnInit {
  protected readonly ui = tw;

  readonly ctx = inject(AppContextService);
  private readonly toast = inject(NotificationService);

  readonly endpoints = signal<Endpoint[]>([]);
  readonly segments = signal<UptimeSegment[]>([]);

  readonly responseData = [182, 195, 171, 188, 203, 165, 178, 185, 182];

  readonly site = computed(() => this.ctx.selectedSite());

  ngOnInit(): void {
    this.resetEndpoints();
    this.segments.set(this.generateSegments());
  }

  private resetEndpoints(): void {
    const site = this.site();
    if (!site) return;
    this.endpoints.set([
      { url: `https://${site.name}`, status: 'Online', ms: '182ms' },
      { url: `https://${site.name}/api/health`, status: 'Online', ms: '94ms' },
      { url: `https://${site.name}/checkout`, status: 'Slow', ms: '418ms' },
    ]);
  }

  private generateSegments(): UptimeSegment[] {
    return Array.from({ length: 90 }, () => {
      const r = Math.random();
      return r > 0.06 ? 'ok' : r > 0.02 ? 'warn' : 'bad';
    });
  }

  segmentHeight(st: UptimeSegment): number {
    return st === 'ok' ? 26 : st === 'warn' ? 16 : 9;
  }

  segmentColor(st: UptimeSegment): string {
    return st === 'ok' ? '#10b981' : st === 'warn' ? '#f59e0b' : '#ef4444';
  }

  addEndpoint(): void {
    const site = this.site();
    if (!site) return;
    this.endpoints.update((eps) => [
      ...eps,
      { url: `https://${site.name}/new-endpoint`, status: 'Online', ms: '200ms' },
    ]);
    this.toast.success('Endpoint added');
  }
}
