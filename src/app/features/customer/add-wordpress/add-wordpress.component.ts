import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FixifyDataService } from '../../../core/services/fixify-data.service';
import { NotificationService } from '../../../core/services/notification.service';
import { WordPressSiteDetails } from '../../../core/models/fixify.models';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ToggleComponent } from '../../../shared/components/toggle/toggle.component';
import { PLATFORMS } from '../../../core/constants/fixify.constants';
import { suggestLoginUrl } from '../../../core/utils/fixify.utils';

@Component({
  selector: 'app-add-wordpress',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, IconComponent, ToggleComponent],
  templateUrl: './add-wordpress.component.html',
})
export class AddWordpressComponent {
  private readonly data = inject(FixifyDataService);
  private readonly toast = inject(NotificationService);
  private readonly router = inject(Router);

  readonly wp = PLATFORMS.find((p) => p.id === 'wordpress')!;
  readonly step = signal(1);
  readonly showPassword = signal(false);
  readonly testingConnection = signal(false);
  readonly connectionTested = signal(false);

  readonly siteName = signal('');
  readonly siteUrl = signal('');
  readonly siteDescription = signal('');
  readonly loginUrl = signal('');
  readonly username = signal('');
  readonly password = signal('');
  readonly authType = signal<'password' | 'application-password'>('application-password');
  readonly wpVersion = signal('');
  readonly plan = signal('free');
  readonly enablePluginScan = signal(true);
  readonly enableAutoUpdates = signal(false);

  readonly steps = [
    { n: 1, label: 'Site details' },
    { n: 2, label: 'WordPress credentials' },
    { n: 3, label: 'Monitoring plan' },
  ];

  get plans() {
    return this.data.subscriptionPlans;
  }

  planLabel(id: string): string {
    return this.data.planLabel(id);
  }

  onSiteUrlChange(value: string): void {
    const prevSuggest = suggestLoginUrl(this.siteUrl());
    const wasAuto = !this.loginUrl() || this.loginUrl() === prevSuggest;
    this.siteUrl.set(value);
    if (wasAuto) {
      this.loginUrl.set(suggestLoginUrl(value));
    }
    this.connectionTested.set(false);
  }

  canContinueStep1(): boolean {
    return this.siteName().trim().length > 0 && this.siteUrl().trim().length > 0;
  }

  canContinueStep2(): boolean {
    return (
      this.loginUrl().trim().length > 0 &&
      this.username().trim().length > 0 &&
      this.password().trim().length > 0
    );
  }

  next(): void {
    if (this.step() === 1 && !this.canContinueStep1()) return;
    if (this.step() === 2 && !this.canContinueStep2()) return;
    if (this.step() < 3) {
      this.step.update((s) => s + 1);
    }
  }

  back(): void {
    if (this.step() > 1) {
      this.step.update((s) => s - 1);
    }
  }

  async testConnection(): Promise<void> {
    if (!this.canContinueStep2()) {
      this.toast.show('Fill in login URL, username, and password first.', 'warning');
      return;
    }
    this.testingConnection.set(true);
    this.connectionTested.set(false);
    await new Promise((r) => setTimeout(r, 1500));
    this.wpVersion.set('6.5.4');
    this.connectionTested.set(true);
    this.testingConnection.set(false);
    this.toast.success('Connection successful — WordPress 6.5.4 detected');
  }

  authTypeLabel(): string {
    return this.authType() === 'application-password'
      ? 'Application Password'
      : 'Account Password';
  }

  maskedPassword(): string {
    const p = this.password();
    return p ? '•'.repeat(Math.min(p.length, 12)) : '—';
  }

  buildWordPressDetails(): WordPressSiteDetails {
    return {
      siteName: this.siteName().trim(),
      siteUrl: this.siteUrl().trim(),
      loginUrl: this.loginUrl().trim(),
      username: this.username().trim(),
      password: this.password(),
      authType: this.authType(),
      wpVersion: this.wpVersion() || undefined,
      enablePluginScan: this.enablePluginScan(),
      enableAutoUpdates: this.enableAutoUpdates(),
    };
  }

  submit(): void {
    const url = this.siteUrl().trim();
    if (!url || !this.canContinueStep2()) return;

    this.data.addSite({
      url,
      name: this.siteName().trim(),
      plan: this.plan(),
      type: 'cms',
      platform: 'wordpress',
      wordpress: this.buildWordPressDetails(),
    });

    this.router.navigate(['/customer/dashboard']);
  }
}
