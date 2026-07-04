import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { AppContextService } from '../../core/services/app-context.service';
import { DataSessionService, SitesDataService } from '../../core/services/data';
import { NotificationService } from '../../core/services/notification.service';
import { WpConnectionStatus } from '../../core/models/site-screens.models';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { SiteAvatarComponent } from '../../shared/components/site-avatar/site-avatar.component';
import { tw } from '../../shared/ui/tw';

const POLL_MS = 3000;

@Component({
  selector: 'app-wordpress-connect-step',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconComponent, SiteAvatarComponent],
  templateUrl: './wordpress-connect-step.component.html',
})
export class WordpressConnectStepComponent implements OnInit, OnDestroy {
  protected readonly ui = tw;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly sitesData = inject(SitesDataService);
  private readonly session = inject(DataSessionService);
  private readonly ctx = inject(AppContextService);
  private readonly toast = inject(NotificationService);

  private pollTimer?: ReturnType<typeof setInterval>;
  private redirectTimer?: ReturnType<typeof setTimeout>;

  readonly siteId = toSignal(
    this.route.paramMap.pipe(map((p) => Number(p.get('siteId')))),
    { initialValue: Number(this.route.snapshot.paramMap.get('siteId')) }
  );

  readonly status = signal<WpConnectionStatus | null>(null);
  readonly polling = signal(true);
  readonly checking = signal(false);

  readonly isCustomer = computed(() => this.router.url.startsWith('/customer'));

  readonly site = computed(() => {
    this.session.dataRevision();
    const id = this.siteId();
    return id ? this.sitesData.sites.find((s) => s.id === id) : undefined;
  });

  readonly sitesRoot = computed(() => (this.isCustomer() ? '/customer/sites' : '/admin/sites'));

  readonly managePath = computed(() => {
    const id = this.siteId();
    return id ? `${this.sitesRoot()}/${id}/manage/overview` : this.sitesRoot();
  });

  ngOnInit(): void {
    const id = this.siteId();
    const cached = id ? this.sitesData.getWordPressConnection(id) : undefined;
    if (cached) {
      this.status.set(cached);
      if (cached.connected) {
        this.onConnected();
        return;
      }
    }

    void this.pollOnce();
    this.pollTimer = setInterval(() => void this.pollOnce(), POLL_MS);
  }

  ngOnDestroy(): void {
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.redirectTimer) clearTimeout(this.redirectTimer);
  }

  openConnectWizard(): void {
    const url = this.status()?.connectPageUrl;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }

  downloadPlugin(): void {
    const url = this.status()?.pluginDownloadUrl;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }

  goToManage(): void {
    const site = this.site();
    if (site) this.ctx.selectedSite.set(site);
    this.router.navigate([this.managePath()]);
  }

  private async pollOnce(): Promise<void> {
    const id = this.siteId();
    if (!id || !this.polling() || this.checking()) return;

    this.checking.set(true);
    const next = await this.sitesData.fetchWordPressConnectionStatus(id);
    this.checking.set(false);

    if (!next) return;

    this.status.set(next);
    if (next.connected) {
      this.onConnected();
    }
  }

  private onConnected(): void {
    this.polling.set(false);
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = undefined;
    }
    this.toast.success('WordPress plugin connected');
    this.redirectTimer = setTimeout(() => this.goToManage(), 1500);
  }
}
