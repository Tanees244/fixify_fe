import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SiteManageFacade } from '../site-manage.facade';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { ManageSkeletonComponent } from './manage-skeleton.component';
import { tw } from '../../../../shared/ui/tw';

@Component({
  selector: 'app-site-manage-cache',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, ManageSkeletonComponent],
  templateUrl: './cache-screen.component.html',
})
export class CacheScreenComponent {
  protected readonly ui = tw;
  protected readonly facade = inject(SiteManageFacade);
}
