import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SiteManageFacade } from '../site-manage.facade';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-site-manage-maintenance',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  templateUrl: './maintenance-screen.component.html',
})
export class MaintenanceScreenComponent {
  protected readonly facade = inject(SiteManageFacade);

  async optimizeDb(): Promise<void> {
    await this.facade.runAction('optimize_database');
  }

  async flushPermalinks(): Promise<void> {
    await this.facade.runAction('flush_rewrite_rules');
  }

  async regenThumbnails(): Promise<void> {
    await this.facade.runAction('regenerate_thumbnails');
  }
}
