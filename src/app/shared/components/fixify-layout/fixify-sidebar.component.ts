import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ADMIN_NAV, CUSTOMER_NAV } from '../../../core/constants/fixify.constants';
import { AppContextService } from '../../../core/services/app-context.service';
import { SitesDataService } from '../../../core/services/data';
import { AuthService } from '../../../core/services/auth.service';
import { RouteDataLoaderService } from '../../../core/services/route-data-loader.service';
import { IconComponent } from '../icon/icon.component';
import { tw } from '../../ui/tw';

const CUSTOMER_ROUTES: Record<string, string> = {
  dashboard: '/customer/dashboard',
  sites: '/customer/sites',
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
    <aside [class]="ui.sidebar">
      <div [class]="ui.sidebarTop">
        <div [class]="ui.logo">
          <div [class]="ui.logoIcon">
            <img src="/favicon.png" alt="Fixify" width="32" height="32" />
          </div>
          <span [class]="ui.logoText">Fix<span class="text-fixify-accent">ify</span></span>
        </div>

        @if (auth.user()?.role === 'customer') {
          <div class="px-2.5 pb-2 pt-0.5">
            <div [class]="ui.sidebarLbl">Website</div>
            <select
              [class]="ui.sidebarSelect"
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

      <div [class]="ui.sidebarNav">
        @if (auth.user()?.role === 'customer') {
          <div [class]="ui.sidebarSec">
            <div [class]="ui.sidebarLbl">Navigation</div>
            @for (item of customerNav; track item.id) {
              <a
                [routerLink]="customerRoute(item.id)"
                routerLinkActive
                #rla="routerLinkActive"
                [class]="ui.nav + (rla.isActive ? ' ' + ui.navActive : '')"
              >
                <app-icon [name]="item.icon" [size]="15" />
                <span class="min-w-0 flex-1">{{ item.label }}</span>
              </a>
            }
            <a
              routerLink="/customer/add-wordpress"
              routerLinkActive
              #wpRla="routerLinkActive"
              [class]="
                ui.nav +
                ' ' +
                ui.navWp +
                (wpRla.isActive ? ' ' + ui.navWpActive : '')
              "
            >
              <app-icon name="plus" [size]="15" />
              <span class="min-w-0 flex-1">Add WordPress</span>
            </a>
          </div>
        }

        @if (auth.user()?.role === 'admin') {
          <div [class]="ui.sidebarSec">
            <div [class]="ui.sidebarLbl">Admin Console</div>
            @for (item of adminNav; track item.id) {
              <a
                [routerLink]="adminRoute(item.id)"
                routerLinkActive
                #adminRla="routerLinkActive"
                [class]="ui.nav + (adminRla.isActive ? ' ' + ui.navActive : '')"
              >
                <app-icon [name]="item.icon" [size]="15" />
                <span>{{ item.label }}</span>
              </a>
            }
          </div>
        }
      </div>

      <div [class]="ui.sidebarFooter">
        <div [class]="ui.sidebarUser">
          <div [class]="ui.avatar">{{ auth.user()?.avatar ?? '?' }}</div>
          <div class="min-w-0 flex-1">
            <div [class]="ui.sidebarUserName">{{ auth.user()?.name ?? 'User' }}</div>
            <div [class]="ui.sidebarUserSub">{{ auth.user()?.subtitle ?? '' }}</div>
          </div>
        </div>
        <button
          type="button"
          [class]="ui.btn + ' ' + ui.btnGhost + ' ' + ui.sidebarLogout"
          (click)="logout()"
        >
          <app-icon name="lock" [size]="13" />
          Sign out
        </button>
      </div>
    </aside>
  `,
})
export class FixifySidebarComponent {
  protected readonly ui = tw;
  protected readonly ctx = inject(AppContextService);
  protected readonly sitesData = inject(SitesDataService);
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly routeLoader = inject(RouteDataLoaderService);

  readonly customerNav = CUSTOMER_NAV;
  readonly adminNav = ADMIN_NAV;

  get mySites() {
    return this.sitesData.mySites();
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
