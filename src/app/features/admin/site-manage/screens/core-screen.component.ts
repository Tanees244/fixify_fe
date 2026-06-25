import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SiteManageFacade } from '../site-manage.facade';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { ManageSkeletonComponent } from './manage-skeleton.component';
import { tw } from '../../../../shared/ui/tw';

@Component({
  selector: 'app-site-manage-core',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, BadgeComponent, ManageSkeletonComponent],
  templateUrl: './core-screen.component.html',
})
export class CoreScreenComponent {
  protected readonly ui = tw;
  protected readonly facade = inject(SiteManageFacade);
}
