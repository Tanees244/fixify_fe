import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  CustomersDataService,
  SubscriptionsDataService,
} from '../../../core/services/data';
import { OnboardCustomerPayload } from '../../../core/models/fixify.models';
import { PLATFORMS } from '../../../core/constants/fixify.constants';
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

  private readonly customersData = inject(CustomersDataService);
  private readonly subscriptionsData = inject(SubscriptionsDataService);
  private readonly router = inject(Router);

  readonly wp = PLATFORMS.find((p) => p.id === 'wordpress')!;
  readonly plans = this.subscriptionsData.subscriptionPlans;
  readonly step = signal(1);
  readonly submitting = signal(false);

  readonly customerName = signal('');
  readonly email = signal('');
  readonly emailError = signal('');
  readonly company = signal('');
  readonly phone = signal('');

  readonly siteName = signal('');
  readonly siteUrl = signal('');
  readonly siteDescription = signal('');
  readonly plan = signal('free');
  readonly enablePluginScan = signal(true);
  readonly enableAutoUpdates = signal(false);
  readonly requireApproval = signal(false);

  readonly steps = [
    { n: 1, label: 'Customer details' },
    { n: 2, label: 'Site details' },
    { n: 3, label: 'Subscription & review' },
  ];

  planLabel(id: string): string {
    return this.subscriptionsData.planLabel(id);
  }

  planPrice(id: string): number {
    return this.subscriptionsData.planPrice(id);
  }

  canContinueStep1(): boolean {
    return this.customerName().trim().length > 0 && this.email().trim().length > 0;
  }

  canContinueStep2(): boolean {
    return this.siteName().trim().length > 0 && this.siteUrl().trim().length > 0;
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
    if (this.step() < 3) {
      this.step.update((s) => s + 1);
    }
  }

  back(): void {
    if (this.step() > 1) {
      this.step.update((s) => s - 1);
    }
  }

  selectedPlanFeatures(): string[] {
    return this.subscriptionsData.getPlan(this.plan())?.features ?? [];
  }

  submit(): void {
    if (!this.canContinueStep1() || !this.canContinueStep2()) return;

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
          enablePluginScan: this.enablePluginScan(),
          enableAutoUpdates: this.enableAutoUpdates(),
        },
      },
    };

    this.submitting.set(true);
    this.emailError.set('');
    this.customersData.onboardCustomer(payload, {
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
