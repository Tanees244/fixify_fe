import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { BillingApiService } from '../../core/services/api/billing-api.service';
import { SubscriptionPlan } from '../../core/models/fixify.models';
import { mapApiSubscriptionPlan } from '../../core/utils/api-mappers.util';
import { PlanPickerComponent } from '../../shared/components/plan-picker/plan-picker.component';

/** Public pricing page (/pricing). */
@Component({
  selector: 'app-pricing',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PlanPickerComponent, RouterLink],
  template: `
    <div style="min-height: 100vh; background: var(--bg, #f5f8fc); padding: 48px 16px">
      <div style="max-width: 1040px; margin: 0 auto">
        <div style="text-align: center; margin-bottom: 28px">
          <h1 style="font-size: 30px; font-weight: 800; color: var(--t1)">Simple pricing for every site</h1>
          <p style="color: var(--t2); margin-top: 8px">
            Start 14-day free trial — no card required.
          </p>
        </div>
        <app-plan-picker [plans]="plans()" ctaLabel="Start 14-day free trial" (picked)="start()" />
        <p style="text-align: center; margin-top: 24px; font-size: 13px; color: var(--t3)">
          Already have an account? <a routerLink="/auth" style="color: var(--acc); font-weight: 600">Sign in</a>
        </p>
      </div>
    </div>
  `,
})
export class PricingComponent implements OnInit {
  private readonly api = inject(BillingApiService);
  private readonly router = inject(Router);
  readonly plans = signal<SubscriptionPlan[]>([]);

  ngOnInit(): void {
    this.api.getPublicPlans().subscribe({
      next: (res) => this.plans.set((res.data?.items ?? []).map(mapApiSubscriptionPlan)),
    });
  }

  start(): void {
    this.router.navigate(['/auth']);
  }
}
