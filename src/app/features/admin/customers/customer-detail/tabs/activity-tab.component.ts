import { ChangeDetectionStrategy, Component, Input, computed, inject } from '@angular/core';
import { ReportsDataService } from '../../../../../core/services/data';
import { IconComponent } from '../../../../../shared/components/icon/icon.component';
import { tw } from '../../../../../shared/ui/tw';

@Component({
  selector: 'app-customer-activity-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  templateUrl: './activity-tab.component.html',
})
export class CustomerActivityTabComponent {
  protected readonly ui = tw;

  @Input({ required: true }) customerId!: number;

  private readonly reportsData = inject(ReportsDataService);

  readonly actions = computed(() => this.reportsData.adminActionsForCustomer(this.customerId));

  actionIcon(type: string): string {
    const map: Record<string, string> = {
      update_plugin: 'layers',
      update_all_plugins: 'layers',
      update_wordpress_core: 'refresh',
      update_theme: 'file',
      clear_cache: 'zap',
      clear_object_cache: 'activity',
      run_security_scan: 'shield',
      optimize_database: 'cog',
      flush_rewrite_rules: 'globe',
      regenerate_thumbnails: 'file',
      generate_report: 'file',
      apply_recommendation: 'check',
    };
    return map[type] ?? 'activity';
  }
}
