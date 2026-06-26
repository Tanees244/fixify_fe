import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SitesDataService } from '../../../core/services/data';
import { AppContextService } from '../../../core/services/app-context.service';
import { Site } from '../../../core/models/fixify.models';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { SiteAvatarComponent } from '../../../shared/components/site-avatar/site-avatar.component';
import { AccountSettingsPanelComponent } from '../../../shared/components/account-settings-panel/account-settings-panel.component';
import { tw } from '../../../shared/ui/tw';

@Component({
  selector: 'app-customer-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, BadgeComponent, SiteAvatarComponent, AccountSettingsPanelComponent],
  templateUrl: './settings.component.html',
})
export class SettingsComponent {
  protected readonly ui = tw;

  private readonly sitesData = inject(SitesDataService);
  private readonly ctx = inject(AppContextService);

  get sites(): Site[] {
    return this.sitesData.mySites();
  }

  siteStatusBadge(st: Site['st']): 'bok' | 'bwn' | 'ber' {
    return st === 'ok' ? 'bok' : st === 'warn' ? 'bwn' : 'ber';
  }

  siteStatusLabel(st: Site['st']): string {
    return st === 'ok' ? 'Healthy' : st === 'warn' ? 'Warning' : 'Critical';
  }

  addSite(): void {
    this.ctx.openModal({ type: 'addSite' });
  }

  removeSite(id: number): void {
    this.sitesData.removeSite(id);
  }
}
