import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FixifyDataService } from '../../../core/services/fixify-data.service';
import { AppContextService } from '../../../core/services/app-context.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Site } from '../../../core/models/fixify.models';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../../shared/components/badge/badge.component';
import { SiteAvatarComponent } from '../../../shared/components/site-avatar/site-avatar.component';
import { ToggleComponent } from '../../../shared/components/toggle/toggle.component';
import { AccountSettingsPanelComponent } from '../../../shared/components/account-settings-panel/account-settings-panel.component';
import { tw } from '../../../shared/ui/tw';

interface NotificationPrefs {
  email: boolean;
  sms: boolean;
  weekly: boolean;
  critical: boolean;
  performance: boolean;
}

@Component({
  selector: 'app-customer-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IconComponent,
    BadgeComponent,
    SiteAvatarComponent,
    ToggleComponent,
    AccountSettingsPanelComponent,
  ],
  templateUrl: './settings.component.html',
})
export class SettingsComponent {
  protected readonly ui = tw;

  private readonly data = inject(FixifyDataService);
  private readonly ctx = inject(AppContextService);
  private readonly toast = inject(NotificationService);

  readonly notifs = signal<NotificationPrefs>({
    email: true,
    sms: false,
    weekly: true,
    critical: true,
    performance: false,
  });

  readonly notificationItems: { key: keyof NotificationPrefs; label: string; desc: string }[] = [
    { key: 'email', label: 'Email notifications', desc: 'Daily digest + critical alerts' },
    { key: 'sms', label: 'SMS alerts', desc: 'Critical issues only' },
    { key: 'critical', label: 'Critical issue alerts', desc: 'Immediate notification' },
    { key: 'performance', label: 'Performance drops', desc: 'When score drops by 10+' },
    { key: 'weekly', label: 'Weekly summary', desc: 'Every Monday morning' },
  ];

  get sites(): Site[] {
    return this.data.mySites();
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
    this.data.removeSite(id);
  }

  toggleNotif(key: keyof NotificationPrefs): void {
    this.notifs.update((n) => ({ ...n, [key]: !n[key] }));
  }

  savePreferences(): void {
    this.toast.success('Notification preferences saved');
  }
}
