import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import {
  Router,
  RouterOutlet,
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
} from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ModalHostComponent } from '../modal-host/modal-host.component';
import { FixifySidebarComponent } from './fixify-sidebar.component';
import { FixifyTopbarComponent } from './fixify-topbar.component';
import { DataSessionService, SitesDataService } from '../../../core/services/data';
import { AppContextService } from '../../../core/services/app-context.service';
import { AuthService } from '../../../core/services/auth.service';
import { RouteDataLoaderService } from '../../../core/services/route-data-loader.service';
import { EntitlementsService } from '../../../core/services/entitlements.service';
import { SubscriptionBannerComponent } from '../subscription-banner/subscription-banner.component';
import { PromoTickerComponent } from '../promo-ticker/promo-ticker.component';
import { PromotionsService } from '../../../core/services/promotions.service';
import { tw } from '../../ui/tw';

@Component({
  selector: 'app-fixify-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    FixifySidebarComponent,
    FixifyTopbarComponent,
    ModalHostComponent,
    SubscriptionBannerComponent,
    PromoTickerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="ui.app">
      @if (ctx.mobileNavOpen()) {
        <div
          [class]="ui.mobileNavBackdrop"
          (click)="ctx.closeMobileNav()"
          aria-hidden="true"
        ></div>
      }
      <app-fixify-sidebar />
      <div [class]="ui.mainCol" [attr.data-readonly]="ent.readOnly() ? 'true' : null">
        @if (auth.user()?.role === 'customer') {
          <app-promo-ticker />
        }
        <app-fixify-topbar />
        @if (auth.user()?.role === 'customer') {
          <app-subscription-banner />
        }
        <main [class]="ui.content">
          <router-outlet />
        </main>
      </div>
    </div>
    <app-modal-host />
  `,
})
export class FixifyLayoutComponent implements OnInit {
  protected readonly ui = tw;
  protected readonly ctx = inject(AppContextService);

  private readonly sitesData = inject(SitesDataService);
  private readonly routeLoader = inject(RouteDataLoaderService);
  protected readonly auth = inject(AuthService);
  protected readonly ent = inject(EntitlementsService);
  private readonly promotions = inject(PromotionsService);
  private readonly session = inject(DataSessionService);
  private readonly router = inject(Router);

  constructor() {
    // Raise the loading flag before the page's first frame so tables and stat cards show
    // skeletons instead of empty rows and zeros; the route loader clears it when data lands.
    if (this.auth.getToken()) this.session.beginLoad();
    this.router.events
      .pipe(takeUntilDestroyed())
      .subscribe((e) => {
        if (e instanceof NavigationStart && this.auth.getToken()) this.session.beginLoad();
        if (e instanceof NavigationCancel || e instanceof NavigationError) this.session.endLoad();
      });
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe((e) => {
        this.ctx.closeMobileNav();
        this.syncModeFromUrl();
        this.routeLoader.loadForUrl((e as NavigationEnd).urlAfterRedirects);
      });
  }

  ngOnInit(): void {
    this.auth.restoreSession().subscribe(() => {
      this.syncModeFromAuth();
      this.ent.load();
      if (this.auth.getCurrentUser()?.role === 'customer') this.promotions.load();
      this.syncModeFromUrl();
      this.routeLoader.loadForUrl(this.router.url);
    });
  }

  private syncModeFromAuth(): void {
    const user = this.auth.getCurrentUser();
    if (user?.role) {
      this.ctx.setMode(user.role);
    }
    if (user?.customerId) {
      this.ctx.currentCustomerId.set(user.customerId);
      const mySites = this.sitesData.sites.filter((s) => s.custId === user.customerId);
      if (mySites.length && !this.ctx.selectedSite()) {
        this.ctx.selectedSite.set(mySites[0]);
      }
    }
  }

  private syncModeFromUrl(): void {
    const url = this.router.url;
    if (url.startsWith('/admin')) {
      this.ctx.setMode('admin');
    } else if (url.startsWith('/customer')) {
      this.ctx.setMode('customer');
    }
  }
}
