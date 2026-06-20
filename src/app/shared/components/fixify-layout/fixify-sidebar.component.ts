import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ADMIN_NAV, CUSTOMER_NAV } from '../../../core/constants/fixify.constants';
import { AppContextService } from '../../../core/services/app-context.service';
import { FixifyDataService } from '../../../core/services/fixify-data.service';
import { AuthService } from '../../../core/services/auth.service';
import { RouteDataLoaderService } from '../../../core/services/route-data-loader.service';
import { IconComponent } from '../icon/icon.component';

const CUSTOMER_ROUTES: Record<string, string> = {
  dashboard: '/customer/dashboard',
  performance: '/customer/performance',
  security: '/customer/security',
  seo: '/customer/seo',
  uptime: '/customer/uptime',
  ai: '/customer/ai',
  tickets: '/customer/tickets',
  reports: '/customer/reports',
  settings: '/customer/settings',
  'add-wordpress': '/customer/add-wordpress',
};

const ADMIN_ROUTES: Record<string, string> = {
  'admin-dash': '/admin/overview',
  'admin-sites': '/admin/sites',
  'admin-users': '/admin/customers',
  'admin-subs': '/admin/subscriptions',
  'admin-tickets': '/admin/tickets',
  'admin-reports': '/admin/reports',
  'admin-settings': '/admin/settings',
};

@Component({
  selector: 'app-fixify-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="sb">
      <div class="sb-top">
        <div class="logo">
          <div class="logo-ic">
            <img src="/favicon.png" alt="Fixify" width="32" height="32" />
          </div>
          <span class="logo-t">Fix<span>ify</span></span>
        </div>

        @if (auth.user()?.role === 'customer') {
          <div style="padding: 2px 10px 8px">
            <div class="sb-lbl">Website</div>
            <select
              class="sb-select"
              [value]="ctx.selectedSite()?.id ?? ''"
              (change)="onSiteChange($event)"
            >
              @for (site of mySites; track site.id) {
                <option [value]="site.id">{{ site.name }}</option>
              }
            </select>
          </div>
        }
      </div>

      <div class="sb-nav">
        @if (auth.user()?.role === 'customer') {
          <div class="sb-sec">
            <div class="sb-lbl">Navigation</div>
            @for (item of customerNav; track item.id) {
              <a
                [routerLink]="customerRoute(item.id)"
                routerLinkActive="on"
                class="nav"
              >
                <app-icon [name]="item.icon" [size]="15" />
                <span style="flex: 1">{{ item.label }}</span>
                @if (item.count) {
                  <span class="nct" [class]="item.countClass || ''">{{
                    item.count
                  }}</span>
                }
              </a>
            }
            <a
              routerLink="/customer/add-wordpress"
              routerLinkActive="on"
              class="nav nav-wp"
            >
              <app-icon name="plus" [size]="15" />
              <span style="flex: 1">Add WordPress</span>
            </a>
          </div>
        }

        @if (auth.user()?.role === 'admin') {
          <div class="sb-sec">
            <div class="sb-lbl">Admin Console</div>
            @for (item of adminNav; track item.id) {
              <a
                [routerLink]="adminRoute(item.id)"
                routerLinkActive="on"
                class="nav"
              >
                <app-icon [name]="item.icon" [size]="15" />
                <span>{{ item.label }}</span>
              </a>
            }
          </div>
        }
      </div>

      <div class="sf">
        <div class="su">
          <div class="av">{{ auth.user()?.avatar ?? '?' }}</div>
          <div style="flex: 1; min-width: 0">
            <div class="sb-user-name">{{ auth.user()?.name ?? 'User' }}</div>
            <div class="sb-user-sub">{{ auth.user()?.subtitle ?? '' }}</div>
          </div>
        </div>
        <button type="button" class="btn bg sb-logout" (click)="logout()">
          <app-icon name="lock" [size]="13" />
          Sign out
        </button>
      </div>
    </aside>
  `,
})
export class FixifySidebarComponent {
  protected readonly ctx = inject(AppContextService);
  protected readonly data = inject(FixifyDataService);
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly routeLoader = inject(RouteDataLoaderService);

  readonly customerNav = CUSTOMER_NAV;
  readonly adminNav = ADMIN_NAV;

  get mySites() {
    return this.data.mySites();
  }

  customerRoute(id: string): string {
    return CUSTOMER_ROUTES[id] ?? '/customer/dashboard';
  }

  adminRoute(id: string): string {
    return ADMIN_ROUTES[id] ?? '/admin/overview';
  }

  onSiteChange(event: Event): void {
    const id = Number((event.target as HTMLSelectElement).value);
    const site = this.mySites.find((s) => s.id === id);
    if (site) {
      this.ctx.selectedSite.set(site);
      this.routeLoader.reloadCurrentRoute();
    }
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/auth']);
  }
}
