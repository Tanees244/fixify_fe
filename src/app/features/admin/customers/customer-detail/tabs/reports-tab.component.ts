import {
  ChangeDetectionStrategy,
  Component,
  Input,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FixifyDataService } from '../../../../../core/services/fixify-data.service';
import { AppContextService } from '../../../../../core/services/app-context.service';
import { MonthlyReport } from '../../../../../core/models/fixify.models';
import { scoreColor } from '../../../../../core/utils/fixify.utils';
import { IconComponent } from '../../../../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../../../../shared/components/badge/badge.component';
import { tw } from '../../../../../shared/ui/tw';

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

  private readonly data = inject(FixifyDataService);
  private readonly ctx = inject(AppContextService);

  readonly scoreColor = scoreColor;
  readonly generating = signal(false);
  readonly selectedSiteId = signal<number | ''>('');
  readonly selectedMonth = signal('2025-06');
  readonly expandedReportId = signal<number | null>(null);

  readonly sites = computed(() => this.data.sitesForCustomer(this.customerId));

  readonly reports = computed(() => this.data.reportsForCustomer(this.customerId));

  readonly monthOptions = [
    { key: '2025-06', label: 'June 2025' },
    { key: '2025-05', label: 'May 2025' },
    { key: '2025-04', label: 'April 2025' },
    { key: '2025-03', label: 'March 2025' },
    { key: '2025-02', label: 'February 2025' },
    { key: '2025-01', label: 'January 2025' },
  ];

  async generate(): Promise<void> {
    const siteId = Number(this.selectedSiteId());
    if (!siteId) return;
    this.generating.set(true);
    await new Promise((r) => setTimeout(r, 800));
    this.data.createMonthlyReport(siteId, this.selectedMonth());
    this.generating.set(false);
  }

  toggleReport(report: MonthlyReport): void {
    this.expandedReportId.set(this.expandedReportId() === report.id ? null : report.id);
  }
}
