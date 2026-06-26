import {
  ChangeDetectionStrategy,
  Component,
  Input,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReportsDataService, SitesDataService } from '../../../../../core/services/data';
import { MonthlyReport } from '../../../../../core/models/fixify.models';
import { scoreColor } from '../../../../../core/utils/fixify.utils';
import { IconComponent } from '../../../../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../../../../shared/components/badge/badge.component';
import { tw } from '../../../../../shared/ui/tw';

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
  selector: 'app-customer-reports-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, IconComponent, BadgeComponent],
  templateUrl: './reports-tab.component.html',
})
export class CustomerReportsTabComponent {
  protected readonly ui = tw;

  @Input({ required: true }) customerId!: number;

  private readonly sitesData = inject(SitesDataService);
  private readonly reportsData = inject(ReportsDataService);

  readonly scoreColor = scoreColor;
  readonly generating = signal(false);
  readonly selectedSiteId = signal<number | ''>('');
  readonly selectedMonth = signal(buildMonthOptions()[0]?.key ?? '');
  readonly expandedReportId = signal<number | null>(null);

  readonly sites = computed(() => this.sitesData.sitesForCustomer(this.customerId));

  readonly reports = computed(() => this.reportsData.reportsForCustomer(this.customerId));

  readonly monthOptions = buildMonthOptions();

  generate(): void {
    const siteId = Number(this.selectedSiteId());
    if (!siteId || this.generating()) return;
    this.generating.set(true);
    this.reportsData.createMonthlyReport(siteId, this.selectedMonth(), undefined, () =>
      this.generating.set(false)
    );
  }

  toggleReport(report: MonthlyReport): void {
    this.expandedReportId.set(this.expandedReportId() === report.id ? null : report.id);
  }
}
