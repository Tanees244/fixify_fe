import { ChangeDetectionStrategy, Component, Input, computed, inject } from '@angular/core';
import { FixifyDataService } from '../../../../../core/services/fixify-data.service';
import { IconComponent } from '../../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-customer-activity-tab',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  templateUrl: './activity-tab.component.html',
})
export class CustomerActivityTabComponent {
  @Input({ required: true }) customerId!: number;

  private readonly data = inject(FixifyDataService);

  readonly actions = computed(() => this.data.adminActionsForCustomer(this.customerId));

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
