import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SiteManageFacade } from '../site-manage.facade';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';

@Component({
  selector: 'app-site-manage-theme',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, BadgeComponent],
  templateUrl: './theme-screen.component.html',
})
export class ThemeScreenComponent {
  protected readonly facade = inject(SiteManageFacade);

  async updateTheme(): Promise<void> {
    await this.facade.runAction('update_theme');
  }
}
