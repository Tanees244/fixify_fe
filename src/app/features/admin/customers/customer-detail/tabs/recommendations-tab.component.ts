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
import { TicketPriority } from '../../../../../core/models/fixify.models';
import { priorityBadge } from '../../../../../core/utils/fixify.utils';
import { IconComponent } from '../../../../../shared/components/icon/icon.component';
import { BadgeComponent, BadgeVariant } from '../../../../../shared/components/badge/badge.component';
import { tw } from '../../../../../shared/ui/tw';

@Component({
  selector: 'app-customer-recommendations-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, IconComponent, BadgeComponent],
  templateUrl: './recommendations-tab.component.html',
})
export class CustomerRecommendationsTabComponent {
  protected readonly ui = tw;

  @Input({ required: true }) customerId!: number;

  private readonly sitesData = inject(SitesDataService);
  private readonly reportsData = inject(ReportsDataService);

  readonly priorityBadge = priorityBadge;
  readonly showForm = signal(false);

  readonly title = signal('');
  readonly body = signal('');
  readonly category = signal('Performance');
  readonly priority = signal<TicketPriority>('medium');
  readonly siteId = signal<number | ''>('');

  readonly sites = computed(() => this.sitesData.sitesForCustomer(this.customerId));

  readonly recommendations = computed(() =>
    this.reportsData.recommendationsForCustomer(this.customerId)
  );

  recBadge(status: string): BadgeVariant {
    if (status === 'applied') return 'bok';
    if (status === 'open') return 'bbl';
    return 'bgr';
  }

  toggleForm(): void {
    this.showForm.update((v) => !v);
  }

  submit(): void {
    const sid = Number(this.siteId());
    if (!sid || !this.title().trim() || !this.body().trim()) return;
    this.reportsData.addRecommendation({
      siteId: sid,
      title: this.title().trim(),
      body: this.body().trim(),
      category: this.category(),
      priority: this.priority(),
    });
    this.title.set('');
    this.body.set('');
    this.showForm.set(false);
  }

  apply(id: number): void {
    this.reportsData.applyRecommendation(id);
  }

  dismiss(id: number): void {
    this.reportsData.dismissRecommendation(id);
  }
}
