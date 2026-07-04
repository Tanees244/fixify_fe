import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DataSessionService, AdminDashboardDataService } from '../../../core/services/data';
import {
  formatDateLong,
  priorityBadge,
  ticketStatusBadge,
  ticketStatusLabel,
} from '../../../core/utils/fixify.utils';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ProgressBarComponent } from '../../../shared/components/progress-bar/progress-bar.component';
import { TableSkeletonComponent } from '../../../shared/components/table-skeleton/table-skeleton.component';
import { tw } from '../../../shared/ui/tw';

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, ProgressBarComponent, BadgeComponent, TableSkeletonComponent],
  templateUrl: './overview.component.html',
})
export class OverviewComponent {
  protected readonly ui = tw;

  private readonly session = inject(DataSessionService);
  private readonly dashboardData = inject(AdminDashboardDataService);
  private readonly router = inject(Router);

  readonly loading = this.session.loading;
  readonly statCards = this.dashboardData.statCards;
  readonly healthDistribution = this.dashboardData.healthDistribution;
  readonly platformSnapshot = this.dashboardData.platformSnapshot;
  readonly recentActivity = this.dashboardData.recentActivity;
  readonly totalSiteCount = this.dashboardData.totalSiteCount;

  readonly dateLabel = formatDateLong();
  readonly priorityBadge = priorityBadge;
  readonly ticketStatusBadge = ticketStatusBadge;
  readonly ticketStatusLabel = ticketStatusLabel;

  healthPct(count: number): number {
    const total = this.totalSiteCount();
    return total ? (count / total) * 100 : 0;
  }

  snapshotCardClass(tone: 'default' | 'warn' | 'alert' | 'ok'): string {
    const base = this.ui.snapshotCard;
    if (tone === 'warn') return `${base} ${this.ui.snapshotCardWarn}`;
    if (tone === 'alert') return `${base} ${this.ui.snapshotCardAlert}`;
    if (tone === 'ok') return `${base} ${this.ui.snapshotCardOk}`;
    return base;
  }

  viewAllTickets(): void {
    this.router.navigate(['/admin/tickets']);
  }

  openTicket(id: string): void {
    if (id) this.router.navigate(['/admin/tickets', id]);
  }
}
