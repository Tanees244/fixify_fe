import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AppContextService } from '../../../core/services/app-context.service';
import { NotificationService } from '../../../core/services/notification.service';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ProgressBarComponent } from '../../../shared/components/progress-bar/progress-bar.component';
import { scoreColor } from '../../../core/utils/fixify.utils';

interface SeoIssue {
  key: string;
  title: string;
  impact: 'High' | 'Medium';
  category: string;
}

interface Keyword {
  keyword: string;
  position: number;
  volume: string;
  delta: string;
}

@Component({
  selector: 'app-customer-seo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BadgeComponent, ProgressBarComponent],
  templateUrl: './seo.component.html',
})
export class SeoComponent {
  readonly ctx = inject(AppContextService);
  private readonly toast = inject(NotificationService);

  readonly scoreColor = scoreColor;
  readonly fixed = signal<Record<string, boolean>>({});

  readonly issues: SeoIssue[] = [
    { key: 's1', title: '3 pages missing meta description', impact: 'High', category: 'Meta Tags' },
    { key: 's2', title: '27 images missing alt attributes', impact: 'High', category: 'Accessibility' },
    { key: 's3', title: 'No XML sitemap detected', impact: 'High', category: 'Crawlability' },
    { key: 's4', title: 'Missing H1 tag on /about', impact: 'Medium', category: 'Structure' },
    { key: 's5', title: 'Slow page speed impacting crawl', impact: 'High', category: 'Performance' },
  ];

  readonly keywords: Keyword[] = [
    { keyword: 'website monitoring', position: 4, volume: '2.4K', delta: '+2' },
    { keyword: 'site health checker', position: 7, volume: '1.1K', delta: '+1' },
    { keyword: 'uptime monitoring tool', position: 12, volume: '890', delta: '-3' },
    { keyword: 'wordpress security scan', position: 9, volume: '3.2K', delta: '+4' },
    { keyword: 'web performance audit', position: 15, volume: '760', delta: '0' },
  ];

  readonly site = computed(() => this.ctx.selectedSite());

  readonly activeIssues = computed(() =>
    this.issues.filter((i) => !this.fixed()[i.key])
  );

  readonly highImpactCount = computed(
    () => this.activeIssues().filter((i) => i.impact === 'High').length
  );

  readonly signals = computed(() => {
    const site = this.site();
    const fixed = this.fixed();
    if (!site) return [];
    return [
      { label: 'Title Tags', score: 90 },
      { label: 'Meta Descriptions', score: fixed['s1'] ? 85 : 55 },
      { label: 'Header Structure', score: fixed['s4'] ? 90 : 80 },
      { label: 'Image Alt Text', score: fixed['s2'] ? 90 : 42 },
      { label: 'Internal Linking', score: 78 },
      { label: 'Page Speed', score: site.perf },
    ];
  });

  positionColor(position: number): string {
    return position <= 5 ? 'var(--ok)' : position <= 10 ? 'var(--wn)' : 'var(--er)';
  }

  deltaColor(delta: string): string {
    if (delta.startsWith('+')) return 'var(--ok)';
    if (delta.startsWith('-')) return 'var(--er)';
    return 'var(--t3)';
  }

  impactBadge(impact: string): 'bwn' | 'bbl' {
    return impact === 'High' ? 'bwn' : 'bbl';
  }

  fixIssue(issue: SeoIssue): void {
    this.fixed.update((f) => ({ ...f, [issue.key]: true }));
    this.toast.success(`Fixed: ${issue.title.slice(0, 30)}…`);
  }
}
