import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DataSessionService, SitesDataService, SubscriptionsDataService } from '../../../core/services/data';
import { WordPressSiteDetails } from '../../../core/models/fixify.models';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ToggleComponent } from '../../../shared/components/toggle/toggle.component';
import { PLATFORMS } from '../../../core/constants/fixify.constants';
import { tw } from '../../../shared/ui/tw';

@Component({
  selector: 'app-add-wordpress',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, IconComponent, ToggleComponent, RouterLink],
  templateUrl: './add-wordpress.component.html',
})
export class AddWordpressComponent {
  protected readonly ui = tw;

  private readonly session = inject(DataSessionService);
  private readonly sitesData = inject(SitesDataService);
  private readonly subscriptionsData = inject(SubscriptionsDataService);
  private readonly router = inject(Router);

  readonly wp = PLATFORMS.find((p) => p.id === 'wordpress')!;
  readonly step = signal(1);
  readonly submitting = signal(false);

  readonly siteName = signal('');
  readonly siteUrl = signal('');
  readonly siteDescription = signal('');
  readonly plan = signal('free');
  readonly enablePluginScan = signal(true);
  readonly enableAutoUpdates = signal(false);

  readonly steps = [
    { n: 1, label: 'Site details' },
    { n: 2, label: 'Monitoring plan' },
  ];

  readonly plans = computed(() => {
    this.session.dataRevision();
    return this.subscriptionsData.subscriptionPlans;
  });

  planLabel(id: string): string {
    return this.subscriptionsData.planLabel(id);
  }

  canContinueStep1(): boolean {
    return this.siteName().trim().length > 0 && this.siteUrl().trim().length > 0;
  }

  next(): void {
    if (this.step() === 1 && !this.canContinueStep1()) return;
    if (this.step() < 2) {
      this.step.update((s) => s + 1);
    }
  }

  back(): void {
    if (this.step() > 1) {
      this.step.update((s) => s - 1);
    }
  }

  buildWordPressDetails(): WordPressSiteDetails {
    return {
      siteName: this.siteName().trim(),
      siteUrl: this.siteUrl().trim(),
      enablePluginScan: this.enablePluginScan(),
      enableAutoUpdates: this.enableAutoUpdates(),
    };
  }

  async submit(): Promise<void> {
    const url = this.siteUrl().trim();
    if (!url || !this.canContinueStep1() || this.submitting()) return;

    this.submitting.set(true);
    const site = await this.sitesData.addSite({
      url,
      name: this.siteName().trim(),
      plan: this.plan(),
      type: 'cms',
      platform: 'wordpress',
      wordpress: this.buildWordPressDetails(),
    });
    this.submitting.set(false);

    if (site) {
      this.router.navigate(['/customer/dashboard']);
    }
  }
}
