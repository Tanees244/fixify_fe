import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ModalHostComponent } from '../modal-host/modal-host.component';
import { FixifySidebarComponent } from './fixify-sidebar.component';
import { FixifyTopbarComponent } from './fixify-topbar.component';
import { SitesDataService } from '../../../core/services/data';
import { AppContextService } from '../../../core/services/app-context.service';
import { AuthService } from '../../../core/services/auth.service';
import { RouteDataLoaderService } from '../../../core/services/route-data-loader.service';
import { tw } from '../../ui/tw';

@Component({
  selector: 'app-fixify-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    FixifySidebarComponent,
    FixifyTopbarComponent,
    ModalHostComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="ui.app">
      <app-fixify-sidebar />
      <div [class]="ui.mainCol">
        <app-fixify-topbar />
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

  private readonly sitesData = inject(SitesDataService);
  private readonly routeLoader = inject(RouteDataLoaderService);
  private readonly ctx = inject(AppContextService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  constructor() {
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe((e) => {
        this.syncModeFromUrl();
        this.routeLoader.loadForUrl((e as NavigationEnd).urlAfterRedirects);
      });
  }

  ngOnInit(): void {
    this.auth.restoreSession().subscribe(() => {
      this.syncModeFromAuth();
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
