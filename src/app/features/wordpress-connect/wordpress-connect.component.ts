import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { FixifyDataService } from '../../core/services/fixify-data.service';
import { AppContextService } from '../../core/services/app-context.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { tw } from '../../shared/ui/tw';

type ConnectPhase = 'connecting' | 'success' | 'failed';

/**
 * Landing page for the WordPress connect callback:
 * FRONTEND_URL/sites/:id/wordpress/connect?success=1
 * Shows a success screen, resolves the website, then redirects to its
 * management overview (admin or customer portal depending on the user).
 */
@Component({
  selector: 'app-wordpress-connect',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; background: var(--bg, #f5f7fb)">
      <div [class]="ui.card + ' ' + ui.cardPad" style="max-width: 460px; width: 100%; text-align: center">
        @if (phase() === 'failed') {
          <div [style]="iconWrap" style="background: var(--er-bg, rgba(220,53,69,.12))">
            <app-icon name="alert" [size]="30" color="var(--er)" />
          </div>
          <div style="font-size: 20px; font-weight: 700; color: var(--t1); margin: 18px 0 8px">
            Connection not completed
          </div>
          <p style="font-size: 13.5px; color: var(--t2); line-height: 1.6; margin: 0 0 22px">
            We couldn't confirm the WordPress connection. You can retry from the website's
            management screen or reinstall the WebCare Connector plugin.
          </p>
          <button type="button" [class]="ui.btn + ' ' + ui.btnPrimary" (click)="goToWebsites()">
            Go to My Websites
          </button>
        } @else {
          <div [style]="iconWrap" style="background: rgba(34,197,94,.12)">
            @if (phase() === 'success') {
              <app-icon name="check" [size]="30" color="var(--ok)" />
            } @else {
              <app-icon name="loader" [size]="30" color="var(--acc)" />
            }
          </div>
          <div style="font-size: 20px; font-weight: 700; color: var(--t1); margin: 18px 0 8px">
            WordPress connected
          </div>
          <p style="font-size: 13.5px; color: var(--t2); line-height: 1.6; margin: 0 0 6px">
            {{ siteName() ? siteName() + ' is now connected.' : 'Your website is now connected.' }}
          </p>
          <p style="font-size: 12.5px; color: var(--t3); margin: 0 0 22px">
            Redirecting you to the website…
          </p>
          <button type="button" [class]="ui.btn + ' ' + ui.btnPrimary" (click)="redirectNow()">
            Open website now
          </button>
        }
      </div>
    </div>
  `,
})
export class WordpressConnectComponent implements OnInit {
  protected readonly ui = tw;
  protected readonly iconWrap =
    'width:64px;height:64px;border-radius:18px;display:flex;align-items:center;justify-content:center;margin:0 auto';

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly data = inject(FixifyDataService);
  private readonly ctx = inject(AppContextService);

  readonly phase = signal<ConnectPhase>('connecting');
  readonly siteName = signal('');

  private apiId = '';

  ngOnInit(): void {
    if (!this.auth.getToken() || !this.auth.getCurrentUser()) {
      this.router.navigate(['/auth']);
      return;
    }

    this.apiId = this.route.snapshot.paramMap.get('id') ?? '';
    const success = this.route.snapshot.queryParamMap.get('success');

    if (success && success !== '1') {
      this.phase.set('failed');
      return;
    }

    this.phase.set('success');
    this.data.initSession();
    this.loadAndRedirect();
  }

  private loadAndRedirect(): void {
    const isAdmin = this.auth.getCurrentUser()?.role === 'admin';
    const onLoaded = () => {
      const site = this.data.sites.find((s) => s.apiId === this.apiId);
      if (site) this.siteName.set(site.name);
      setTimeout(() => this.redirectNow(), 1800);
    };

    if (isAdmin) {
      this.data.fetchWebsites({ page: 1, limit: 100 }, onLoaded);
    } else {
      this.data.fetchCustomerWebsites(onLoaded);
    }
  }

  redirectNow(): void {
    const role = this.auth.getCurrentUser()?.role === 'admin' ? 'admin' : 'customer';
    const site = this.data.sites.find((s) => s.apiId === this.apiId);
    if (site) {
      this.ctx.selectedSite.set(site);
      this.router.navigate([`/${role}/sites`, site.id, 'manage', 'overview']);
    } else {
      this.router.navigate([`/${role}/sites`]);
    }
  }

  goToWebsites(): void {
    const role = this.auth.getCurrentUser()?.role === 'admin' ? 'admin' : 'customer';
    this.router.navigate([`/${role}/sites`]);
  }
}
