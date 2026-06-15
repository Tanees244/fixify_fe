import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastContainerComponent } from '../toast-container/toast-container.component';
import { ModalHostComponent } from '../modal-host/modal-host.component';
import { FixifySidebarComponent } from './fixify-sidebar.component';
import { FixifyTopbarComponent } from './fixify-topbar.component';
import { FixifyDataService } from '../../../core/services/fixify-data.service';
import { AppContextService } from '../../../core/services/app-context.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-fixify-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    FixifySidebarComponent,
    FixifyTopbarComponent,
    ToastContainerComponent,
    ModalHostComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app">
      <app-fixify-sidebar />
      <div class="mn">
        <app-fixify-topbar />
        <main class="ct">
          <router-outlet />
        </main>
      </div>
    </div>
    <app-toast-container />
    <app-modal-host />
  `,
})
export class FixifyLayoutComponent implements OnInit {
  private readonly data = inject(FixifyDataService);
  private readonly ctx = inject(AppContextService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  constructor() {
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => this.syncModeFromUrl());
  }

  ngOnInit(): void {
    this.data.loadAll();
    this.syncModeFromAuth();
    this.syncModeFromUrl();
  }

  private syncModeFromAuth(): void {
    const user = this.auth.getCurrentUser();
    if (user?.role) {
      this.ctx.setMode(user.role);
    }
    if (user?.customerId) {
      this.ctx.currentCustomerId.set(user.customerId);
      const mySites = this.data.sites.filter((s) => s.custId === user.customerId);
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
