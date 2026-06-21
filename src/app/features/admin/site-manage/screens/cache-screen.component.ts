import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SiteManageFacade } from '../site-manage.facade';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { tw } from '../../../../shared/ui/tw';

@Component({
  selector: 'app-site-manage-cache',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  templateUrl: './cache-screen.component.html',
})
export class CacheScreenComponent {
  protected readonly ui = tw;
  protected readonly facade = inject(SiteManageFacade);

  async clearPageCache(): Promise<void> {
    await this.facade.runAction('clear_cache');
  }

  async clearObjectCache(): Promise<void> {
    await this.facade.runAction('clear_object_cache');
  }
}
