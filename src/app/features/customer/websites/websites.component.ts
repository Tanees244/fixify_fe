import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AppContextService } from '../../../core/services/app-context.service';
import { DataSessionService, SitesDataService } from '../../../core/services/data';
import { Site } from '../../../core/models/fixify.models';
import { scoreColor } from '../../../core/utils/fixify.utils';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { BadgeComponent, BadgeVariant } from '../../../shared/components/badge/badge.component';
import { SiteAvatarComponent } from '../../../shared/components/site-avatar/site-avatar.component';
import { ProgressBarComponent } from '../../../shared/components/progress-bar/progress-bar.component';
import { tw } from '../../../shared/ui/tw';

@Component({
  selector: 'app-customer-websites',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, BadgeComponent, SiteAvatarComponent, ProgressBarComponent],
  templateUrl: './websites.component.html',
})
export class WebsitesComponent {
  protected readonly ui = tw;

  private readonly session = inject(DataSessionService);
  private readonly sitesData = inject(SitesDataService);
  private readonly ctx = inject(AppContextService);
  private readonly router = inject(Router);

  readonly scoreColor = scoreColor;
  readonly loading = this.session.loading;
  readonly search = signal('');

  readonly sites = computed(() => {
    this.session.dataRevision();
    const q = this.search().trim().toLowerCase();
    const all = this.sitesData.mySites();
    return q ? all.filter((s) => s.name.toLowerCase().includes(q)) : all;
  });

  readonly skeletonCards = [1, 2, 3];

  siteStatusBadge(st: Site['st']): BadgeVariant {
    return st === 'ok' ? 'bok' : st === 'warn' ? 'bwn' : 'ber';
  }

  siteStatusLabel(st: Site['st']): string {
    return st === 'ok' ? 'Healthy' : st === 'warn' ? 'Warning' : 'Critical';
  }

  openOverview(site: Site): void {
    this.ctx.selectedSite.set(site);
    this.router.navigate(['/customer/sites', site.id, 'manage', 'overview']);
  }

  addSite(): void {
    this.router.navigate(['/customer/add-wordpress']);
  }
}
