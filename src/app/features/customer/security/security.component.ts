import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { DataSessionService, SitesDataService } from '../../../core/services/data';

import { AppContextService } from '../../../core/services/app-context.service';

import { IconComponent } from '../../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { StatCardsSkeletonComponent } from '../../../shared/components/stat-cards-skeleton/stat-cards-skeleton.component';
import { CardPanelSkeletonComponent } from '../../../shared/components/card-panel-skeleton/card-panel-skeleton.component';
import { ListItemsSkeletonComponent } from '../../../shared/components/list-items-skeleton/list-items-skeleton.component';

import { scoreColor, severityBadge, severityBg, severityIcon } from '../../../core/utils/fixify.utils';

import { tw } from '../../../shared/ui/tw';



@Component({

  selector: 'app-customer-security',

  standalone: true,

  changeDetection: ChangeDetectionStrategy.OnPush,

  imports: [
    IconComponent,
    BadgeComponent,
    StatCardsSkeletonComponent,
    CardPanelSkeletonComponent,
    ListItemsSkeletonComponent,
  ],

  templateUrl: './security.component.html',

})

export class SecurityComponent {

  protected readonly ui = tw;



  private readonly session = inject(DataSessionService);

  private readonly sitesData = inject(SitesDataService);

  readonly ctx = inject(AppContextService);



  readonly scoreColor = scoreColor;

  readonly severityBadge = severityBadge;

  readonly severityBg = severityBg;

  readonly severityIcon = severityIcon;

  readonly loading = this.session.loading;

  readonly site = computed(() => {

    this.session.dataRevision();

    return this.ctx.selectedSite();

  });



  readonly screen = computed(() => {

    this.session.dataRevision();

    return this.sitesData.securityScreen();

  });



  readonly activeVulns = computed(() => {

    const vulns = this.screen()?.vulnerabilities ?? [];

    return vulns.map((v) => ({

      key: v.key,

      title: v.title,

      sev: this.normalizeSeverity(v.severity),

      type: v.type,

      fix: v.fix,

    }));

  });



  readonly criticalCount = computed(

    () => this.screen()?.criticalCount ?? this.activeVulns().filter((v) => v.sev === 'critical').length

  );



  readonly checklist = computed(() => this.screen()?.checklist ?? []);



  readonly ssl = computed(() => this.screen()?.ssl);



  readonly sslExpiryLabel = computed(() => {

    const days = this.ssl()?.daysRemaining;

    if (days == null) return '—';

    return `${days} days`;

  });



  normalizeSeverity(severity: string): 'critical' | 'high' | 'medium' {

    const s = severity.toLowerCase();

    if (s === 'critical') return 'critical';

    if (s === 'high') return 'high';

    return 'medium';

  }



  async rescan(): Promise<void> {

    const site = this.site();

    if (!site) return;

    await this.sitesData.scanSiteSecurity(site);

  }

}

