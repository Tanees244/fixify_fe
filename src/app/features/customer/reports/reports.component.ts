import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AppContextService } from '../../../core/services/app-context.service';
import { DataSessionService, ReportsDataService } from '../../../core/services/data';
import { MonthlyReport } from '../../../core/models/fixify.models';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { StatCardsSkeletonComponent } from '../../../shared/components/stat-cards-skeleton/stat-cards-skeleton.component';
import { ListItemsSkeletonComponent } from '../../../shared/components/list-items-skeleton/list-items-skeleton.component';
import { scoreColor, priorityBadge } from '../../../core/utils/fixify.utils';
import { tw } from '../../../shared/ui/tw';

@Component({
  selector: 'app-customer-reports',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, BadgeComponent, StatCardsSkeletonComponent, ListItemsSkeletonComponent],
  templateUrl: './reports.component.html',
})
export class ReportsComponent {
  protected readonly ui = tw;

  readonly ctx = inject(AppContextService);
  private readonly session = inject(DataSessionService);
  private readonly reportsData = inject(ReportsDataService);

  readonly scoreColor = scoreColor;
  readonly priorityBadge = priorityBadge;
  readonly expandedReportId = signal<number | null>(null);
  readonly loading = this.session.loading;

  readonly site = computed(() => this.ctx.selectedSite());

  readonly reports = computed(() => {
    this.session.dataRevision();
    const s = this.site();
    return s ? this.reportsData.reportsForSite(s.id) : [];
  });

  readonly adminUpdates = computed(() =>
    this.reportsData.adminActionsForCustomer(this.ctx.currentCustomerId(), true).slice(0, 5)
  );

  readonly recommendations = computed(() => {
    const s = this.site();
    if (!s) return [];
    return this.reportsData.recommendationsForSite(s.id).filter((r) => r.status === 'open');
  });

  readonly stats = computed(() => {
    const reps = this.reports();
    const resolved = reps.reduce((a, r) => a + r.issuesResolved, 0);
    const s = this.site();
    return {
      count: reps.length,
      health: s?.health ?? 0,
      resolved,
    };
  });

  toggleReport(report: MonthlyReport): void {
    this.expandedReportId.set(this.expandedReportId() === report.id ? null : report.id);
  }

  downloadReport(report: MonthlyReport): void {
    this.reportsData.openReportDownload(report);
  }
}
