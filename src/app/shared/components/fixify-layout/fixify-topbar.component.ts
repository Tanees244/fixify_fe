import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { PAGE_TITLES } from '../../../core/constants/fixify.constants';
import { AppContextService } from '../../../core/services/app-context.service';
import { AuthService } from '../../../core/services/auth.service';
import { siteStatusColor } from '../../../core/utils/fixify.utils';
import { IconComponent } from '../icon/icon.component';

function resolvePageKey(url: string): string {
  if (url.includes('/admin/overview')) return 'admin-dash';
  if (url.includes('/admin/sites')) return 'admin-sites';
  if (url.includes('/admin/customers')) return 'admin-users';
  if (url.includes('/admin/subscriptions')) return 'admin-subs';
  if (url.includes('/admin/onboard')) return 'admin-onboard';
  if (url.includes('/admin/tickets')) return 'admin-tickets';
  if (url.includes('/admin/reports')) return 'admin-reports';
  if (url.includes('/admin/settings')) return 'admin-settings';
  if (url.includes('/add-wordpress')) return 'add-wordpress';

  const match = url.match(/\/customer\/([^/?]+)/);
  return match?.[1] ?? 'dashboard';
}

@Component({
  selector: 'app-fixify-topbar',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="tb">
      <div style="display: flex; align-items: center; gap: 12px">
        <div style="font-weight: 700; font-size: 15px; color: var(--t1)">
          {{ pageTitle() }}
        </div>
        @if (ctx.selectedSite() && auth.user()?.role === 'customer' && pageKey() !== 'add-wordpress') {
          <span class="tb-site-badge">
            <span
              class="tb-site-dot"
              [style.background]="siteDotColor()"
            ></span>
            {{ ctx.selectedSite()!.name }}
          </span>
        }
        @if (ctx.scanning()) {
          <span class="tb-scanning">
            <app-icon name="loader" [size]="13" color="var(--acc)" />
            Scanning…
          </span>
        }
      </div>
      <div style="display: flex; align-items: center; gap: 10px">
        <div class="srch">
          <app-icon name="search" [size]="14" color="var(--t3)" />
          <input placeholder="Search anything…" />
        </div>
        <div class="tb-bell">
          <app-icon name="bell" [size]="17" color="var(--t2)" />
          <span class="tb-bell-dot"></span>
        </div>
        <div class="av" style="cursor: pointer">
          {{ auth.user()?.avatar ?? '?' }}
        </div>
      </div>
    </header>
  `,
})
export class FixifyTopbarComponent {
  protected readonly ctx = inject(AppContextService);
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly pageKey = signal('dashboard');

  constructor() {
    this.pageKey.set(resolvePageKey(this.router.url));
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((e) => this.pageKey.set(resolvePageKey(e.urlAfterRedirects)));
  }

  pageTitle(): string {
    const key = this.pageKey();
    if (key === 'add-wordpress') return 'Add WordPress Site';
    if (key === 'admin-onboard') return 'Onboard Customer';
    return PAGE_TITLES[key] ?? 'Dashboard';
  }

  siteDotColor(): string {
    const site = this.ctx.selectedSite();
    return site ? siteStatusColor(site.st) : '#9590b8';
  }
}
