import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  CustomerDashboardDataService,
  DataSessionService,
  SitesDataService,
} from '../../../core/services/data';
import { AppContextService } from '../../../core/services/app-context.service';
import { Site, Ticket } from '../../../core/models/fixify.models';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ProgressRingComponent } from '../../../shared/components/progress-ring/progress-ring.component';
import { ProgressBarComponent } from '../../../shared/components/progress-bar/progress-bar.component';
import { SiteAvatarComponent } from '../../../shared/components/site-avatar/site-avatar.component';
import { TableSkeletonComponent } from '../../../shared/components/table-skeleton/table-skeleton.component';
import { StatCardsSkeletonComponent } from '../../../shared/components/stat-cards-skeleton/stat-cards-skeleton.component';
import { ListItemsSkeletonComponent } from '../../../shared/components/list-items-skeleton/list-items-skeleton.component';
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
import { tw } from '../../../shared/ui/tw';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IconComponent,
    BadgeComponent,
    ProgressRingComponent,
    ProgressBarComponent,
    SiteAvatarComponent,
    RouterLink,
    TableSkeletonComponent,
    StatCardsSkeletonComponent,
    ListItemsSkeletonComponent,
  ],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  protected readonly ui = tw;

  private readonly session = inject(DataSessionService);
  private readonly dashboardData = inject(CustomerDashboardDataService);
  private readonly sitesData = inject(SitesDataService);
  private readonly ctx = inject(AppContextService);
  private readonly router = inject(Router);

  readonly loading = this.session.loading;
  readonly summary = this.dashboardData.summary;
  readonly teamUpdates = this.dashboardData.teamUpdates;
  readonly recommendations = this.dashboardData.recommendations;
  readonly insights = this.dashboardData.latestInsights;
  readonly recentTickets = this.dashboardData.recentTickets;
  readonly scoreColor = scoreColor;
  readonly severityBadge = severityBadge;
  readonly severityBg = severityBg;
  readonly severityIcon = severityIcon;
  readonly priorityBadge = priorityBadge;
  readonly ticketStatusBadge = ticketStatusBadge;
  readonly ticketStatusLabel = ticketStatusLabel;
  readonly formatDateLong = formatDateLong;

  get sites(): Site[] {
    this.session.dataRevision();
    return this.sitesData.mySites();
  }

  get customerName(): string {
    return this.dashboardData.greetingName() || 'there';
  }

  ticketTypeBadge(type: string): 'bac' | 'bwn' | 'bbl' {
    if (type === 'Security') return 'bac';
    if (type === 'Performance') return 'bwn';
    return 'bbl';
  }

  siteStatusBadge(st: Site['st']): 'bok' | 'bwn' | 'ber' {
    return st === 'ok' ? 'bok' : st === 'warn' ? 'bwn' : 'ber';
  }

  siteStatusLabel(st: Site['st']): string {
    return st === 'ok' ? 'Healthy' : st === 'warn' ? 'Warning' : 'Critical';
  }

  addSite(): void {
    this.ctx.openModal({ type: 'addSite' });
  }

  openSite(site: Site): void {
    this.ctx.selectedSite.set(site);
    this.router.navigate(['/customer/performance']);
  }

  navTo(path: string): void {
    this.router.navigate(['/customer', path]);
  }

  viewTicket(ticket: Ticket): void {
    this.router.navigate(['/customer/tickets', ticket.id]);
  }
}
