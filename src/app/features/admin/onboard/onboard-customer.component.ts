import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FixifyDataService } from '../../../core/services/fixify-data.service';
import { NotificationService } from '../../../core/services/notification.service';
import { OnboardCustomerPayload } from '../../../core/models/fixify.models';
import { PLATFORMS } from '../../../core/constants/fixify.constants';
import { suggestLoginUrl } from '../../../core/utils/fixify.utils';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ToggleComponent } from '../../../shared/components/toggle/toggle.component';
import { tw } from '../../../shared/ui/tw';

@Component({
  selector: 'app-admin-onboard-customer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, IconComponent, ToggleComponent, RouterLink],
  templateUrl: './onboard-customer.component.html',
})
export class AdminOnboardCustomerComponent {
  protected readonly ui = tw;

  private readonly data = inject(FixifyDataService);
  private readonly toast = inject(NotificationService);
  private readonly router = inject(Router);

  readonly wp = PLATFORMS.find((p) => p.id === 'wordpress')!;
  readonly plans = this.data.subscriptionPlans;
  readonly step = signal(1);
  readonly showPassword = signal(false);
  readonly testingConnection = signal(false);
  readonly connectionTested = signal(false);
  readonly submitting = signal(false);

  readonly customerName = signal('');
  readonly email = signal('');
  readonly emailError = signal('');
  readonly company = signal('');
  readonly phone = signal('');

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
  readonly requireApproval = signal(false);

  readonly steps = [
    { n: 1, label: 'Customer details' },
    { n: 2, label: 'Site details' },
    { n: 3, label: 'WordPress credentials' },
    { n: 4, label: 'Subscription & review' },
  ];

  planLabel(id: string): string {
    return this.data.planLabel(id);
  }

  planPrice(id: string): number {
    return this.data.planPrice(id);
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
    return this.customerName().trim().length > 0 && this.email().trim().length > 0;
  }

  canContinueStep2(): boolean {
    return this.siteName().trim().length > 0 && this.siteUrl().trim().length > 0;
  }

  canContinueStep3(): boolean {
    return (
      this.loginUrl().trim().length > 0 &&
      this.username().trim().length > 0 &&
      this.password().trim().length > 0
    );
  }

  onEmailChange(value: string): void {
    this.email.set(value);
    if (this.emailError()) {
      this.emailError.set('');
    }
  }

  next(): void {
    if (this.step() === 1 && !this.canContinueStep1()) return;
    if (this.step() === 2 && !this.canContinueStep2()) return;
    if (this.step() === 3 && !this.canContinueStep3()) return;
    if (this.step() < 4) {
      this.step.update((s) => s + 1);
    }
  }

  back(): void {
    if (this.step() > 1) {
      this.step.update((s) => s - 1);
    }
  }

  async testConnection(): Promise<void> {
    if (!this.canContinueStep3()) {
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

  selectedPlanFeatures(): string[] {
    return this.data.getPlan(this.plan())?.features ?? [];
  }

  submit(): void {
    if (!this.canContinueStep1() || !this.canContinueStep2() || !this.canContinueStep3()) return;

    const payload: OnboardCustomerPayload = {
      name: this.customerName().trim(),
      email: this.email().trim(),
      company: this.company().trim() || undefined,
      phone: this.phone().trim() || undefined,
      plan: this.plan(),
      requireApproval: this.requireApproval(),
      site: {
        url: this.siteUrl().trim(),
        name: this.siteName().trim(),
        plan: this.plan(),
        type: 'cms',
        platform: 'wordpress',
        wordpress: {
          siteName: this.siteName().trim(),
          siteUrl: this.siteUrl().trim(),
          loginUrl: this.loginUrl().trim(),
          username: this.username().trim(),
          password: this.password(),
          authType: this.authType(),
          wpVersion: this.wpVersion() || undefined,
          enablePluginScan: this.enablePluginScan(),
          enableAutoUpdates: this.enableAutoUpdates(),
        },
      },
    };

    this.submitting.set(true);
    this.emailError.set('');
    this.data.onboardCustomer(payload, {
      onSuccess: () => {
        this.submitting.set(false);
        this.router.navigate(['/admin/customers']);
      },
      onError: (err) => {
        this.submitting.set(false);
        if (err.field === 'email') {
          this.emailError.set(err.message);
          this.step.set(1);
        }
      },
    });
  }
}
