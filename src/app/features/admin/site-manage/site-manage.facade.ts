import { Injectable, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import {
  CustomersDataService,
  DataSessionService,
  SitesDataService,
} from '../../../core/services/data';
import { scoreColor } from '../../../core/utils/fixify.utils';

@Injectable()
export class SiteManageFacade {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly session = inject(DataSessionService);
  private readonly sitesData = inject(SitesDataService);
  private readonly customersData = inject(CustomersDataService);

  readonly loading = this.session.loading;
  readonly scoreColor = scoreColor;

  readonly siteId = toSignal(
    this.route.paramMap.pipe(map((p) => Number(p.get('siteId')))),
    { initialValue: Number(this.route.snapshot.paramMap.get('siteId')) }
  );

  readonly site = computed(() => {
    const id = this.siteId();
    return this.sitesData.sites.find((s) => s.id === id);
  });

  readonly customer = computed(() => {
    const s = this.site();
    return s ? this.customersData.getCustomer(s.custId) : undefined;
  });

  readonly wpState = computed(() => {
    this.session.dataRevision();
    const id = this.siteId();
    return id ? this.sitesData.getWordPressState(id) : undefined;
  });

  readonly pendingPluginCount = computed(() => {
    const state = this.wpState();
    return state ? state.plugins.filter((p) => p.status !== 'ok').length : 0;
  });

  readonly wpCoreOutdated = computed(() => {
    const s = this.wpState();
    return !!s && s.wpVersion !== s.latestWpVersion;
  });

  readonly themeOutdated = computed(() => {
    const s = this.wpState();
    return !!s && s.themeVersion !== s.latestThemeVersion;
  });

  ensureState(): void {
    const id = this.siteId();
    if (id) {
      this.sitesData.initWordPressState(id);
    }
  }

  /** True when this manage view is rendered inside the customer portal. */
  isCustomer(): boolean {
    return this.router.url.startsWith('/customer');
  }

  private sitesRoot(): string {
    return this.isCustomer() ? '/customer/sites' : '/admin/sites';
  }

  backLabel(): string {
    return this.isCustomer() ? 'My Websites' : 'All Websites';
  }

  manageBasePath(): string {
    return `${this.sitesRoot()}/${this.siteId()}/manage`;
  }

  goBack(): void {
    this.router.navigate([this.sitesRoot()]);
  }

  goToCustomer(): void {
    const s = this.site();
    if (s) {
      this.router.navigate(['/admin/customers', s.custId], {
        queryParams: { tab: 'wordpress', site: s.id },
      });
    }
  }
}
