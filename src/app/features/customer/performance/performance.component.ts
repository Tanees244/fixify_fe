import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { FixifyDataService } from '../../../core/services/fixify-data.service';

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



  private readonly data = inject(FixifyDataService);

  readonly ctx = inject(AppContextService);



  readonly scoreColor = scoreColor;

  readonly scoreBadge = scoreBadge;

  readonly loading = this.data.loading;



  readonly site = computed(() => {

    this.data.dataRevision();

    return this.ctx.selectedSite();

  });



  readonly screen = computed(() => {

    this.data.dataRevision();

    return this.data.performanceScreen();

  });



  readonly pages = computed(() => this.screen()?.pages ?? []);



  readonly history = computed(() => this.screen()?.history ?? []);



  readonly lighthouseScores = computed(() => {

    const lh = this.screen()?.lighthouse;

    if (!lh) return [];

    return [

      { label: 'Performance', value: lh.performance },

      { label: 'Accessibility', value: lh.accessibility },

      { label: 'Best Practices', value: lh.bestPractices },

      { label: 'SEO', value: lh.seo },

    ];

  });



  readonly cwv = computed(() => {

    const vitals = this.screen()?.coreWebVitals;

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

    await this.data.scanSitePerformance(site);

  }



  exportReport(): void {

    const site = this.site();

    if (!site) return;

    this.data.exportPerformancePdf(site);

  }

}

