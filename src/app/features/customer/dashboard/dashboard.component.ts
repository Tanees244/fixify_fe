import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FixifyDataService } from '../../../core/services/fixify-data.service';
import { AppContextService } from '../../../core/services/app-context.service';
import { Site, Ticket } from '../../../core/models/fixify.models';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { ProgressRingComponent } from '../../../shared/components/progress-ring/progress-ring.component';
import { ProgressBarComponent } from '../../../shared/components/progress-bar/progress-bar.component';
import { SiteAvatarComponent } from '../../../shared/components/site-avatar/site-avatar.component';
import { TableSkeletonComponent } from '../../../shared/components/table-skeleton/table-skeleton.component';
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
  ],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  private readonly data = inject(FixifyDataService);
  private readonly ctx = inject(AppContextService);
  private readonly router = inject(Router);

  readonly insights = signal(this.data.getInsights().slice(0, 3));
  readonly loading = this.data.loading;
  readonly scoreColor = scoreColor;
  readonly severityBadge = severityBadge;
  readonly severityBg = severityBg;
  readonly severityIcon = severityIcon;
  readonly priorityBadge = priorityBadge;
  readonly ticketStatusBadge = ticketStatusBadge;
  readonly ticketStatusLabel = ticketStatusLabel;
  readonly formatDateLong = formatDateLong;

  get sites(): Site[] {
    return this.data.mySites();
  }

  get customerName(): string {
    const customer = this.data.customers.find(
      (c) => c.id === this.ctx.currentCustomerId()
    );
    return customer?.name.split(' ')[0] ?? 'there';
  }

  get okCount(): number {
    return this.sites.filter((s) => s.st === 'ok').length;
  }

  get warnCount(): number {
    return this.sites.filter((s) => s.st === 'warn').length;
  }

  get badCount(): number {
    return this.sites.filter((s) => s.st === 'bad').length;
  }

  get totalIssues(): number {
    return this.sites.reduce((a, s) => a + s.issues, 0);
  }

  readonly recentTickets = computed(() => {
    this.data.dataRevision();
    return this.data.tickets
      .filter((t) => t.custId === this.ctx.currentCustomerId())
      .slice(0, 3);
  });

  get adminUpdates() {
    return this.data
      .adminActionsForCustomer(this.ctx.currentCustomerId(), true)
      .slice(0, 4);
  }

  get openRecommendations() {
    return this.data
      .recommendationsForCustomer(this.ctx.currentCustomerId())
      .filter((r) => r.status === 'open')
      .slice(0, 3);
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
    this.ctx.openModal({ type: 'viewTicket', data: ticket });
  }
}
