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
import { Customer, Site, SiteStatus } from '../../../core/models/fixify.models';
import { scoreColor } from '../../../core/utils/fixify.utils';
import { BadgeComponent, BadgeVariant } from '../../../shared/components/badge/badge.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ProgressBarComponent } from '../../../shared/components/progress-bar/progress-bar.component';
import { SiteAvatarComponent } from '../../../shared/components/site-avatar/site-avatar.component';
import { TableSkeletonComponent } from '../../../shared/components/table-skeleton/table-skeleton.component';

type StatusFilter = 'all' | SiteStatus;

@Component({
  selector: 'app-admin-sites',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, ProgressBarComponent, BadgeComponent, SiteAvatarComponent, TableSkeletonComponent],
  templateUrl: './sites.component.html',
})
export class SitesComponent {
  private readonly data = inject(FixifyDataService);
  private readonly ctx = inject(AppContextService);
  private readonly toast = inject(NotificationService);
  private readonly router = inject(Router);

  readonly sites = this.data.sites;
  readonly customers = this.data.customers;
  readonly scanning = this.ctx.scanning;
  readonly loading = this.data.loading;

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

  readonly statusChips: { id: StatusFilter; label: string }[] = [
    { id: 'all', label: 'All Sites' },
    { id: 'ok', label: 'Healthy' },
    { id: 'warn', label: 'Warning' },
    { id: 'bad', label: 'Critical' },
  ];

  customerFor(custId: number): Customer | undefined {
    return this.customers.find((c) => c.id === custId);
  }

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
}
