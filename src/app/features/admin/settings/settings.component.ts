import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';
import { ToggleComponent } from '../../../shared/components/toggle/toggle.component';
import { AccountSettingsPanelComponent } from '../../../shared/components/account-settings-panel/account-settings-panel.component';
import { tw } from '../../../shared/ui/tw';

interface ScanSettings {
  interval: string;
  autoFix: boolean;
  notifications: boolean;
}

interface NotificationSettings {
  criticalAlerts: boolean;
  weeklyDigest: boolean;
  newCustomer: boolean;
  ticketEscalation: boolean;
}

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ToggleComponent, AccountSettingsPanelComponent],
  templateUrl: './settings.component.html',
})
export class SettingsComponent {
  protected readonly ui = tw;

  private readonly toast = inject(NotificationService);

  readonly scan = signal<ScanSettings>({
    interval: '5',
    autoFix: false,
    notifications: true,
  });

  readonly notifications = signal<NotificationSettings>({
    criticalAlerts: true,
    weeklyDigest: true,
    newCustomer: true,
    ticketEscalation: false,
  });

  readonly webhookUrl = signal('');

  readonly scanToggles = [
    { key: 'autoFix' as const, label: 'Auto-apply minor fixes', desc: 'Low-risk patches applied automatically' },
    { key: 'notifications' as const, label: 'Scan completion alerts', desc: 'Notify when scans complete' },
  ];

  readonly notificationToggles = [
    { key: 'criticalAlerts' as const, label: 'Critical issue alerts', desc: 'Immediate notification for critical vulnerabilities' },
    { key: 'newCustomer' as const, label: 'New customer signup', desc: 'When a new customer registers' },
    { key: 'ticketEscalation' as const, label: 'Ticket escalation', desc: 'When tickets exceed SLA time' },
    { key: 'weeklyDigest' as const, label: 'Weekly digest', desc: 'Platform summary every Monday' },
  ];

  setScanInterval(value: string): void {
    this.scan.update((s) => ({ ...s, interval: value }));
  }

  toggleScan(key: keyof Pick<ScanSettings, 'autoFix' | 'notifications'>): void {
    this.scan.update((s) => ({ ...s, [key]: !s[key] }));
  }

  toggleNotification(key: keyof NotificationSettings): void {
    this.notifications.update((n) => ({ ...n, [key]: !n[key] }));
  }

  setWebhookUrl(value: string): void {
    this.webhookUrl.set(value);
  }

  saveScanSettings(): void {
    this.toast.success('Scan settings saved');
  }

  copyApiKey(): void {
    this.toast.info('API key copied to clipboard');
  }

  saveApiSettings(): void {
    this.toast.success('API settings saved');
  }

  saveNotificationPrefs(): void {
    this.toast.success('Notification preferences saved');
  }
}
