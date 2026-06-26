import {
  ChangeDetectionStrategy,
  Component,
  Input,
  computed,
  inject,
} from '@angular/core';
import {
  CustomersDataService,
  DataSessionService,
  InsightsDataService,
  SitesDataService,
  TicketsDataService,
} from '../../../core/services/data';
import { Site } from '../../../core/models/fixify.models';
import { IconComponent } from '../icon/icon.component';
import { BadgeComponent } from '../badge/badge.component';
import { ProgressRingComponent } from '../progress-ring/progress-ring.component';
import { ProgressBarComponent } from '../progress-bar/progress-bar.component';
import { SiteAvatarComponent } from '../site-avatar/site-avatar.component';
import { TableSkeletonComponent } from '../table-skeleton/table-skeleton.component';
import { tw } from '../../ui/tw';
import {
  formatDateLong,
  priorityBadge,
  scoreColor,
  severityBadge,
  severityBg,
  severityIcon,
  ticketStatusBadge,
  ticketStatusLabel,
} from '../../../core/utils/fixify.utils';

@Component({
  selector: 'app-customer-dashboard-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IconComponent,
    BadgeComponent,
    ProgressRingComponent,
    ProgressBarComponent,
    SiteAvatarComponent,
    TableSkeletonComponent,
  ],
  templateUrl: './customer-dashboard-preview.component.html',
})
export class CustomerDashboardPreviewComponent {
  readonly ui = tw;
  @Input({ required: true }) customerId!: number;

  private readonly session = inject(DataSessionService);
  private readonly customersData = inject(CustomersDataService);
  private readonly sitesData = inject(SitesDataService);
  private readonly ticketsData = inject(TicketsDataService);
  private readonly insightsData = inject(InsightsDataService);

  readonly loading = this.session.loading;
  readonly scoreColor = scoreColor;
  readonly severityBadge = severityBadge;
  readonly severityBg = severityBg;
  readonly severityIcon = severityIcon;
  readonly priorityBadge = priorityBadge;
  readonly ticketStatusBadge = ticketStatusBadge;
  readonly ticketStatusLabel = ticketStatusLabel;
  readonly formatDateLong = formatDateLong;

  readonly customer = computed(() => this.customersData.getCustomer(this.customerId));

  readonly customerFirstName = computed(() => {
    const name = this.customer()?.name;
    return name ? name.split(' ')[0] : 'this customer';
  });

  readonly sites = computed(() => {
    this.session.dataRevision();
    return this.sitesData.sitesForCustomer(this.customerId);
  });

  readonly insights = computed(() => {
    this.session.dataRevision();
    const siteNames = new Set(this.sites().map((s) => s.name));
    return this.insightsData.getInsights().filter((i) => siteNames.has(i.site)).slice(0, 3);
  });

  readonly recentTickets = computed(() => {
    this.session.dataRevision();
    return this.ticketsData.ticketsForCustomer(this.customerId).slice(0, 3);
  });

  readonly okCount = computed(() => this.sites().filter((s) => s.st === 'ok').length);
  readonly warnCount = computed(() => this.sites().filter((s) => s.st === 'warn').length);
  readonly badCount = computed(() => this.sites().filter((s) => s.st === 'bad').length);
  readonly totalIssues = computed(() =>
    this.sites().reduce((a, s) => a + s.issues, 0)
  );

  siteStatusBadge(st: Site['st']): 'bok' | 'bwn' | 'ber' {
    return st === 'ok' ? 'bok' : st === 'warn' ? 'bwn' : 'ber';
  }

  siteStatusLabel(st: Site['st']): string {
    return st === 'ok' ? 'Healthy' : st === 'warn' ? 'Warning' : 'Critical';
  }

  ticketTypeBadge(type: string): 'bac' | 'bwn' | 'bbl' {
    if (type === 'Security') return 'bac';
    if (type === 'Performance') return 'bwn';
    return 'bbl';
  }
}
