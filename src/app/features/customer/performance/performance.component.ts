import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FixifyDataService } from '../../../core/services/fixify-data.service';
import { AppContextService } from '../../../core/services/app-context.service';
import { NotificationService } from '../../../core/services/notification.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ProgressRingComponent } from '../../../shared/components/progress-ring/progress-ring.component';
import { ProgressBarComponent } from '../../../shared/components/progress-bar/progress-bar.component';
import { scoreBadge, scoreColor } from '../../../core/utils/fixify.utils';

interface PageRow {
  url: string;
  score: number;
  lcp: string;
  fid: string;
  cls: string;
}

@Component({
  selector: 'app-customer-performance',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, BadgeComponent, ProgressRingComponent, ProgressBarComponent],
  templateUrl: './performance.component.html',
})
export class PerformanceComponent {
  private readonly data = inject(FixifyDataService);
  readonly ctx = inject(AppContextService);
  private readonly toast = inject(NotificationService);

  readonly scoreColor = scoreColor;
  readonly scoreBadge = scoreBadge;

  readonly site = computed(() => this.ctx.selectedSite());

  readonly pages = computed((): PageRow[] => {
    const site = this.site();
    if (!site) return [];
    return [
      { url: '/', score: site.perf, lcp: site.lcp, fid: site.fid, cls: site.cls },
      { url: '/about', score: Math.max(50, site.perf - 6), lcp: '2.1s', fid: '18ms', cls: '0.08' },
      { url: '/products', score: Math.max(30, site.perf - 27), lcp: '3.4s', fid: '95ms', cls: '0.22' },
      { url: '/checkout', score: Math.max(20, site.perf - 50), lcp: '5.2s', fid: '210ms', cls: '0.38' },
    ];
  });

  readonly history = computed((): number[] => {
    const site = this.site();
    if (!site) return [];
    const perf = site.perf;
    return [
      Math.max(50, perf - 18),
      Math.max(50, perf - 15),
      Math.max(50, perf - 17),
      Math.max(50, perf - 10),
      Math.max(50, perf - 8),
      Math.max(50, perf - 10),
      Math.max(50, perf - 3),
      perf - 1,
      perf,
    ];
  });

  readonly lighthouseScores = computed(() => {
    const site = this.site();
    if (!site) return [];
    return [
      { label: 'Performance', value: site.perf },
      { label: 'Accessibility', value: Math.min(99, site.perf + 7) },
      { label: 'Best Practices', value: Math.min(99, site.perf + 5) },
      { label: 'SEO', value: site.seo },
    ];
  });

  readonly cwv = computed(() => {
    const site = this.site();
    if (!site) return [];
    return [
      {
        label: 'LCP',
        value: site.lcp,
        desc: 'Largest Contentful Paint',
        status: parseFloat(site.lcp) < 2.5 ? 'ok' : parseFloat(site.lcp) < 4 ? 'warn' : 'bad',
      },
      {
        label: 'FID',
        value: site.fid,
        desc: 'First Input Delay',
        status: parseInt(site.fid, 10) < 100 ? 'ok' : parseInt(site.fid, 10) < 300 ? 'warn' : 'bad',
      },
      {
        label: 'CLS',
        value: site.cls,
        desc: 'Layout Shift',
        status: parseFloat(site.cls) < 0.1 ? 'ok' : parseFloat(site.cls) < 0.25 ? 'warn' : 'bad',
      },
    ];
  });

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
    return scoreColor(90);
  }

  async rescan(): Promise<void> {
    const site = this.site();
    if (!site) return;
    await this.data.scanSite(site);
  }

  exportReport(): void {
    this.toast.show('Report exported as PDF', 'info');
  }
}
