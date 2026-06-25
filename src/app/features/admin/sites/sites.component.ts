import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { FixifyDataService } from '../../../core/services/fixify-data.service';
import { AppContextService } from '../../../core/services/app-context.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Site, SiteStatus } from '../../../core/models/fixify.models';
import { scoreColor } from '../../../core/utils/fixify.utils';
import { BadgeComponent, BadgeVariant } from '../../../shared/components/badge/badge.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ProgressBarComponent } from '../../../shared/components/progress-bar/progress-bar.component';
import { SiteAvatarComponent } from '../../../shared/components/site-avatar/site-avatar.component';
import { TableSkeletonComponent } from '../../../shared/components/table-skeleton/table-skeleton.component';
import { tw } from '../../../shared/ui/tw';

type StatusFilter = 'all' | SiteStatus;

@Component({
  selector: 'app-admin-sites',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, ProgressBarComponent, BadgeComponent, SiteAvatarComponent, TableSkeletonComponent],
  templateUrl: './sites.component.html',
})
export class SitesComponent {
  protected readonly ui = tw;

  private readonly data = inject(FixifyDataService);
  private readonly ctx = inject(AppContextService);
  private readonly toast = inject(NotificationService);
  private readonly router = inject(Router);

  readonly Math = Math;
  readonly sites = this.data.sites;
  readonly scanning = this.ctx.scanning;
  readonly loading = this.data.loading;
  readonly sitesPage = this.data.sitesPage;
  readonly sitesLimit = this.data.sitesLimit;
  readonly sitesTotal = this.data.sitesTotal;

  readonly search = signal('');
  readonly statusFilter = signal<StatusFilter>('all');

  readonly scoreColor = scoreColor;

  readonly filteredSites = computed(() => {
    this.data.dataRevision();
    const q = this.search().toLowerCase();
    const st = this.statusFilter();
    return this.sites.filter(
      (s) =>
        (st === 'all' || s.st === st) &&
        (q === '' || s.name.toLowerCase().includes(q))
    );
  });

  readonly totalPages = computed(() => {
    this.sitesTotal();
    this.data.dataRevision();
    const total = this.sitesTotal() || this.sites.length;
    return Math.max(1, Math.ceil(total / this.sitesLimit()));
  });

  readonly showPagination = computed(() => {
    this.sitesTotal();
    this.data.dataRevision();
    if (this.loading()) return false;
    return this.sitesTotal() > 0 || this.sites.length > 0;
  });

  readonly statusChips: { id: StatusFilter; label: string }[] = [
    { id: 'all', label: 'All Sites' },
    { id: 'ok', label: 'Healthy' },
    { id: 'warn', label: 'Warning' },
    { id: 'bad', label: 'Critical' },
  ];

  issuesBadge(issues: number): BadgeVariant {
    return issues > 5 ? 'ber' : issues > 0 ? 'bwn' : 'bok';
  }

  onSearch(value: string): void {
    this.search.set(value);
  }

  setStatusFilter(filter: StatusFilter): void {
    this.statusFilter.set(filter);
  }

  scanAll(): void {
    this.toast.info('Bulk scan initiated for all sites');
  }

  addSite(): void {
    this.ctx.openModal({ type: 'addSite' });
  }

  scanSite(site: Site): void {
    this.data.scanSite(site);
  }

  manageSite(site: Site): void {
    if (site.platform === 'wordpress') {
      this.data.initWordPressState(site.id);
      this.router.navigate(['/admin/sites', site.id, 'manage']);
      return;
    }
    this.router.navigate(['/admin/customers', site.custId]);
  }

  goToPage(page: number): void {
    const next = Math.min(Math.max(1, page), this.totalPages());
    if (next === this.sitesPage()) return;
    this.data.fetchWebsites({ page: next, limit: this.sitesLimit() });
  }
}
