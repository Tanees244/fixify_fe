import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SiteManageFacade } from '../site-manage.facade';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';

@Component({
  selector: 'app-site-manage-core',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, BadgeComponent],
  templateUrl: './core-screen.component.html',
})
export class CoreScreenComponent {
  protected readonly facade = inject(SiteManageFacade);

  readonly changelog = [
    'Security patch for authenticated XSS in REST API',
    'Fix for privilege escalation in user roles',
    'Block editor performance improvements',
    'PHP 8.2 compatibility updates',
  ];

  async updateCore(): Promise<void> {
    await this.facade.runAction('update_wordpress_core');
  }
}
