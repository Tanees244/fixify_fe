import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  DataSessionService,
  CustomersDataService,
  SitesDataService,
  ReportsDataService,
} from '../../../core/services/data';
import { MonthlyReport } from '../../../core/models/fixify.models';
import { scoreColor } from '../../../core/utils/fixify.utils';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ToggleComponent } from '../../../shared/components/toggle/toggle.component';
import { ListItemsSkeletonComponent } from '../../../shared/components/list-items-skeleton/list-items-skeleton.component';
import { StatCardsSkeletonComponent } from '../../../shared/components/stat-cards-skeleton/stat-cards-skeleton.component';
import { tw } from '../../../shared/ui/tw';

function buildMonthOptions(count = 12): { key: string; label: string }[] {
  const options: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    options.push({ key, label });
  }
  return options;
}

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    IconComponent,
    BadgeComponent,
    ToggleComponent,
    StatCardsSkeletonComponent,
    ListItemsSkeletonComponent,
  ],
  templateUrl: './reports.component.html',
})
export class ReportsComponent {
  protected readonly ui = tw;

  private readonly session = inject(DataSessionService);
  private readonly customersData = inject(CustomersDataService);
  private readonly sitesData = inject(SitesDataService);
  private readonly reportsData = inject(ReportsDataService);

  readonly scoreColor = scoreColor;
  readonly loading = this.session.loading;
  readonly sites = this.sitesData.sites;
  readonly customers = this.customersData.customers;

  readonly generating = signal(false);
  readonly sendingId = signal<number | null>(null);
  readonly expandedReportId = signal<number | null>(null);
  readonly selectedSiteId = signal<number | ''>('');
  readonly selectedMonth = signal(buildMonthOptions()[0]?.key ?? '');
  readonly remarks = signal('');
  readonly autoSend = signal(true);
  readonly yearFilter = signal(new Date().getFullYear());
  readonly siteFilter = signal('all');
  readonly customerFilter = signal('all');

  readonly monthOptions = buildMonthOptions();
  readonly yearOptions = Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - i);

  readonly reports = computed(() => {
    this.session.dataRevision();
    return [...this.reportsData.monthlyReports].sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  });

  readonly stats = computed(() => {
    this.session.dataRevision();
    const reps = this.reports();
    const draft = reps.filter((r) => r.status === 'draft').length;
    const sites = new Set(reps.map((r) => r.siteId)).size;
    return {
      total: this.reportsData.reportsTotal() || reps.length,
      draft,
      sites,
      latest: reps[0]?.month ?? '—',
    };
  });

  generateReport(): void {
    const siteId = Number(this.selectedSiteId());
    if (!siteId || this.generating()) return;

    this.generating.set(true);
    this.reportsData.createMonthlyReport(
      siteId,
      this.selectedMonth(),
      {
        remarks: this.remarks().trim() || undefined,
        autoSendToClient: this.autoSend(),
      },
      () => this.generating.set(false)
    );
  }

  applyFilters(): void {
    const params: { year?: number; siteId?: string; custId?: string } = {
      year: this.yearFilter(),
    };
    if (this.siteFilter() !== 'all') {
      const site = this.sites.find((s) => String(s.id) === this.siteFilter());
      const apiId = site?.apiId;
      if (apiId) params.siteId = apiId;
    }
    if (this.customerFilter() !== 'all') {
      const customer = this.customers.find((c) => String(c.id) === this.customerFilter());
      const apiId = customer?.apiId;
      if (apiId) params.custId = apiId;
    }
    this.reportsData.fetchReports(params);
  }

  toggleReport(report: MonthlyReport): void {
    this.expandedReportId.set(this.expandedReportId() === report.id ? null : report.id);
  }

  sendReport(report: MonthlyReport, event?: Event): void {
    event?.stopPropagation();
    if (this.sendingId() !== null) return;
    this.sendingId.set(report.id);
    this.reportsData.sendReport(report, () => this.sendingId.set(null));
  }

  isDraft(status?: string): boolean {
    return (status ?? 'draft').toLowerCase() === 'draft';
  }

  downloadReport(report: MonthlyReport, event?: Event): void {
    event?.stopPropagation();
    this.reportsData.openReportDownload(report);
  }

  reportStatusVariant(status?: string): 'bac' | 'bok' | 'bwn' {
    if (status === 'sent') return 'bok';
    if (status === 'draft') return 'bwn';
    return 'bac';
  }

  siteLabel(siteId: number): string {
    return this.sites.find((s) => s.id === siteId)?.name ?? 'Unknown site';
  }
}
