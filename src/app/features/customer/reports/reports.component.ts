import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AppContextService } from '../../../core/services/app-context.service';
import { FixifyDataService } from '../../../core/services/fixify-data.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MonthlyReport } from '../../../core/models/fixify.models';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { scoreColor, priorityBadge } from '../../../core/utils/fixify.utils';

@Component({
  selector: 'app-customer-reports',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, BadgeComponent],
  templateUrl: './reports.component.html',
})
export class ReportsComponent {
  readonly ctx = inject(AppContextService);
  private readonly data = inject(FixifyDataService);
  private readonly toast = inject(NotificationService);

  readonly scoreColor = scoreColor;
  readonly priorityBadge = priorityBadge;
  readonly expandedReportId = signal<number | null>(null);

  readonly site = computed(() => this.ctx.selectedSite());

  readonly reports = computed(() => {
    const s = this.site();
    return s ? this.data.reportsForSite(s.id) : [];
  });

  readonly adminUpdates = computed(() =>
    this.data.adminActionsForCustomer(this.ctx.currentCustomerId(), true).slice(0, 5)
  );

  readonly recommendations = computed(() => {
    const s = this.site();
    if (!s) return [];
    return this.data.recommendationsForSite(s.id).filter((r) => r.status === 'open');
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
    this.toast.success(`${report.month} report downloaded`);
  }
}
