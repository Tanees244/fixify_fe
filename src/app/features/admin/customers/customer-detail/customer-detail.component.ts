import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { FixifyDataService } from '../../../../core/services/fixify-data.service';
import { AppContextService } from '../../../../core/services/app-context.service';
import { scoreColor } from '../../../../core/utils/fixify.utils';
import { BadgeComponent, BadgeVariant } from '../../../../shared/components/badge/badge.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { CustomerDashboardPreviewComponent } from '../../../../shared/components/customer-dashboard-preview/customer-dashboard-preview.component';
import { WordpressManagementComponent } from '../../../../shared/components/wordpress-management/wordpress-management.component';
import { CustomerReportsTabComponent } from './tabs/reports-tab.component';
import { CustomerRecommendationsTabComponent } from './tabs/recommendations-tab.component';
import { CustomerActivityTabComponent } from './tabs/activity-tab.component';
import { TableSkeletonComponent } from '../../../../shared/components/table-skeleton/table-skeleton.component';
import { tw } from '../../../../shared/ui/tw';

type DetailTab = 'overview' | 'wordpress' | 'reports' | 'recommendations' | 'activity' | 'dashboard';

const VALID_TABS: DetailTab[] = ['overview', 'wordpress', 'reports', 'recommendations', 'activity', 'dashboard'];

function tabFromQuery(param: string | null): DetailTab {
  if (param && VALID_TABS.includes(param as DetailTab)) {
    return param as DetailTab;
  }
  return 'overview';
}

@Component({
  selector: 'app-admin-customer-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    IconComponent,
    BadgeComponent,
    CustomerDashboardPreviewComponent,
    WordpressManagementComponent,
    CustomerReportsTabComponent,
    CustomerRecommendationsTabComponent,
    CustomerActivityTabComponent,
    TableSkeletonComponent,
  ],
  templateUrl: './customer-detail.component.html',
})
export class CustomerDetailComponent {
  protected readonly ui = tw;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly data = inject(FixifyDataService);
  private readonly ctx = inject(AppContextService);

  readonly plans = this.data.subscriptionPlans;

  planLabel(id: string): string {
    return this.data.planLabel(id);
  }

  planPrice(id: string): number {
    return this.data.planPrice(id);
  }

  planColor(id: string): string {
    return this.data.planColor(id);
  }

  readonly tabQuery = toSignal(
    this.route.queryParamMap.pipe(
      map((p) => tabFromQuery(p.get('tab')))
    ),
    { initialValue: tabFromQuery(this.route.snapshot.queryParamMap.get('tab')) }
  );

  readonly siteQueryId = toSignal(
    this.route.queryParamMap.pipe(
      map((p) => {
        const site = p.get('site');
        return site ? Number(site) : null;
      })
    ),
    {
      initialValue: this.route.snapshot.queryParamMap.get('site')
        ? Number(this.route.snapshot.queryParamMap.get('site'))
        : null,
    }
  );

  private readonly tabOverride = signal<DetailTab | null>(null);

  readonly tab = computed(() => this.tabOverride() ?? this.tabQuery() ?? 'overview');

  readonly customerId = computed(() => Number(this.route.snapshot.paramMap.get('id')));

  readonly customer = computed(() => this.data.getCustomer(this.customerId()));

  readonly loading = this.data.loading;
  readonly scoreColor = scoreColor;

  readonly sites = computed(() => {
    this.data.dataRevision();
    return this.data.sitesForCustomer(this.customerId());
  });

  readonly tickets = computed(() => {
    this.data.dataRevision();
    return this.data.ticketsForCustomer(this.customerId());
  });

  readonly avgHealth = computed(() => {
    const custSites = this.sites();
    return custSites.length
      ? Math.round(custSites.reduce((a, s) => a + s.health, 0) / custSites.length)
      : null;
  });

  readonly currentPlanFeatures = computed(() => {
    const c = this.customer();
    if (!c) return [];
    return this.plans.find((p) => p.id === c.plan)?.features ?? [];
  });

  setTab(tab: DetailTab): void {
    this.tabOverride.set(tab);
    this.router.navigate([], {
      queryParams: { tab },
      queryParamsHandling: 'merge',
    });
  }

  openSiteManagement(siteId: number): void {
    const site = this.data.sites.find((s) => s.id === siteId);
    if (site?.platform === 'wordpress') {
      this.data.initWordPressState(siteId);
      this.router.navigate(['/admin/sites', siteId, 'manage']);
      return;
    }
    this.tabOverride.set('overview');
    this.router.navigate([], {
      queryParams: { tab: 'overview', site: siteId },
      queryParamsHandling: 'merge',
    });
  }

  statusBadge(status: string): BadgeVariant {
    if (status === 'active') return 'bok';
    if (status === 'pending') return 'bwn';
    if (status === 'warning') return 'bwn';
    return 'ber';
  }

  approvalBadge(status: string): BadgeVariant {
    if (status === 'approved') return 'bok';
    if (status === 'pending') return 'bwn';
    return 'ber';
  }

  approve(): void {
    this.data.approveCustomer(this.customerId());
  }

  reject(): void {
    this.data.rejectCustomer(this.customerId());
  }

  onPlanChange(event: Event): void {
    const plan = (event.target as HTMLSelectElement).value;
    this.data.assignSubscription(this.customerId(), plan);
  }

  manageCustomer(): void {
    const c = this.customer();
    if (c) {
      this.ctx.openModal({ type: 'editCustomer', data: c });
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/customers']);
  }
}
