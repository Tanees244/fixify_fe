import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { AppContextService } from '../../../core/services/app-context.service';

import { FixifyDataService } from '../../../core/services/fixify-data.service';

import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ProgressBarComponent } from '../../../shared/components/progress-bar/progress-bar.component';
import { StatCardsSkeletonComponent } from '../../../shared/components/stat-cards-skeleton/stat-cards-skeleton.component';
import { CardPanelSkeletonComponent } from '../../../shared/components/card-panel-skeleton/card-panel-skeleton.component';
import { ListItemsSkeletonComponent } from '../../../shared/components/list-items-skeleton/list-items-skeleton.component';

import { scoreColor } from '../../../core/utils/fixify.utils';

import { tw } from '../../../shared/ui/tw';



@Component({

  selector: 'app-customer-seo',

  standalone: true,

  changeDetection: ChangeDetectionStrategy.OnPush,

  imports: [
    BadgeComponent,
    ProgressBarComponent,
    StatCardsSkeletonComponent,
    CardPanelSkeletonComponent,
    ListItemsSkeletonComponent,
  ],

  templateUrl: './seo.component.html',

})

export class SeoComponent {

  protected readonly ui = tw;



  readonly ctx = inject(AppContextService);

  private readonly data = inject(FixifyDataService);



  readonly scoreColor = scoreColor;

  readonly loading = this.data.loading;

  readonly site = computed(() => {

    this.data.dataRevision();

    return this.ctx.selectedSite();

  });



  readonly screen = computed(() => {

    this.data.dataRevision();

    return this.data.seoScreen();

  });



  readonly stats = computed(() => this.screen()?.stats);



  readonly issues = computed(() => this.screen()?.issues ?? []);



  readonly signals = computed(() => this.screen()?.signals ?? []);



  readonly keywords = computed(() => {

    const raw = this.screen()?.keywords ?? [];

    return raw.map((item, index) => {

      const row = item as Record<string, unknown>;

      return {

        keyword: String(row['keyword'] ?? row['term'] ?? `Keyword ${index + 1}`),

        position: Number(row['position'] ?? 0),

        volume: String(row['volume'] ?? '—'),

        delta: String(row['delta'] ?? '0'),

      };

    });

  });



  readonly seoScore = computed(() => this.screen()?.score ?? this.site()?.seo ?? 0);



  readonly highImpactCount = computed(

    () => this.stats()?.highImpactCount ?? this.issues().filter((i) => i.impact === 'High').length

  );



  positionColor(position: number): string {

    if (!position) return 'var(--t3)';

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



  async rescan(): Promise<void> {

    const site = this.site();

    if (!site) return;

    await this.data.scanSiteSeo(site);

  }



  formatIndexed(): string {

    const s = this.stats();

    if (!s) return '—';

    if (s.pagesIndexed == null) return `${s.pagesTotal} crawled`;

    return `${s.pagesIndexed} of ${s.pagesTotal}`;

  }



  formatBacklinks(): string {

    const count = this.stats()?.backlinks;

    return count == null ? '—' : String(count);

  }

}

