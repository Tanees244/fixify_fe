import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { DataSessionService, SitesDataService } from '../../../core/services/data';

import { DeviceType } from '../../../core/models/site-screens.models';

import { AppContextService } from '../../../core/services/app-context.service';

import { IconComponent } from '../../../shared/components/icon/icon.component';

import { BadgeComponent } from '../../../shared/components/badge/badge.component';

import { ProgressRingComponent } from '../../../shared/components/progress-ring/progress-ring.component';

import { ProgressBarComponent } from '../../../shared/components/progress-bar/progress-bar.component';

import { TableSkeletonComponent } from '../../../shared/components/table-skeleton/table-skeleton.component';
import { CardPanelSkeletonComponent } from '../../../shared/components/card-panel-skeleton/card-panel-skeleton.component';

import { scoreBadge, scoreColor } from '../../../core/utils/fixify.utils';

import { tw } from '../../../shared/ui/tw';



@Component({

  selector: 'app-customer-performance',

  standalone: true,

  changeDetection: ChangeDetectionStrategy.OnPush,

  imports: [
    IconComponent,
    BadgeComponent,
    ProgressRingComponent,
    ProgressBarComponent,
    TableSkeletonComponent,
    CardPanelSkeletonComponent,
  ],

  templateUrl: './performance.component.html',

})

export class PerformanceComponent {

  protected readonly ui = tw;



  private readonly session = inject(DataSessionService);

  private readonly sitesData = inject(SitesDataService);

  readonly ctx = inject(AppContextService);



  readonly scoreColor = scoreColor;

  readonly scoreBadge = scoreBadge;

  readonly loading = this.session.loading;

  /** Lighthouse runs against desktop & mobile; user toggles which profile to view. */
  readonly device = signal<DeviceType>('desktop');

  readonly devices: { id: DeviceType; label: string }[] = [
    { id: 'desktop', label: 'Desktop' },
    { id: 'mobile', label: 'Mobile' },
  ];

  setDevice(device: DeviceType): void {
    this.device.set(device);
  }



  readonly site = computed(() => {

    this.session.dataRevision();

    return this.ctx.selectedSite();

  });



  readonly screen = computed(() => {

    this.session.dataRevision();

    return this.sitesData.performanceScreen();

  });



  readonly pages = computed(() => {
    const d = this.device();
    return (this.screen()?.pages ?? []).map((p) => ({ url: p.url, ...p[d] }));
  });



  readonly history = computed(() => this.screen()?.history ?? []);



  readonly lighthouseScores = computed(() => {

    const lh = this.screen()?.lighthouse?.[this.device()];

    if (!lh) return [];

    return [

      { label: 'Performance', value: lh.performance },

      { label: 'Accessibility', value: lh.accessibility },

      { label: 'Best Practices', value: lh.bestPractices },

      { label: 'SEO', value: lh.seo },

    ];

  });



  readonly cwv = computed(() => {

    const vitals = this.screen()?.coreWebVitals?.[this.device()];

    if (!vitals) return [];

    return [

      {

        label: 'LCP',

        value: vitals.lcp.value,

        desc: 'Largest Contentful Paint',

        status: vitals.lcp.status,

      },

      {

        label: 'FID',

        value: vitals.fid.value,

        desc: 'First Input Delay',

        status: vitals.fid.status,

      },

      {

        label: 'CLS',

        value: vitals.cls.value,

        desc: 'Layout Shift',

        status: vitals.cls.status,

      },

    ];

  });



  readonly lastScan = computed(() => this.screen()?.lastScan ?? this.site()?.scan ?? '—');



  scoreLabel(score: number): string {

    return score >= 80 ? 'Good' : score >= 60 ? 'Needs Work' : 'Poor';

  }



  pageStatus(score: number): string {

    return score >= 80 ? 'Pass' : score >= 60 ? 'Warn' : 'Fail';

  }



  cwvBadge(status: string): 'bok' | 'bwn' | 'ber' {

    return status === 'ok' ? 'bok' : status === 'warn' ? 'bwn' : 'ber';

  }



  cwvLabel(status: string): string {

    return status === 'ok' ? 'Good' : status === 'warn' ? 'Improve' : 'Poor';

  }



  cwvColor(status: string): string {

    return scoreColor(status === 'ok' ? 90 : status === 'warn' ? 65 : 30);

  }



  metricColor(value: string, type: 'lcp' | 'fid' | 'cls'): string {

    if (type === 'lcp') {

      const v = parseFloat(value);

      return scoreColor(v < 2.5 ? 90 : v < 4 ? 65 : 30);

    }

    if (type === 'fid') {

      const v = parseInt(value, 10);

      return scoreColor(v < 100 ? 90 : v < 300 ? 65 : 30);

    }

    const v = parseFloat(value);

    return scoreColor(v < 0.1 ? 90 : v < 0.25 ? 65 : 30);

  }



  async rescan(): Promise<void> {

    const site = this.site();

    if (!site) return;

    await this.sitesData.scanSitePerformance(site);

  }



  exportReport(): void {

    const site = this.site();

    if (!site) return;

    this.sitesData.exportPerformancePdf(site);

  }

}

