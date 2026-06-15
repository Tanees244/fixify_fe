import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FixifyDataService } from '../../../core/services/fixify-data.service';
import { scoreColor } from '../../../core/utils/fixify.utils';
import { IconComponent } from '../icon/icon.component';
import { SiteAvatarComponent } from '../site-avatar/site-avatar.component';

@Component({
  selector: 'app-wordpress-management',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconComponent, SiteAvatarComponent],
  templateUrl: './wordpress-management.component.html',
})
export class WordpressManagementComponent implements OnInit, OnChanges {
  @Input({ required: true }) customerId!: number;
  @Input() initialSiteId: number | null = null;

  private readonly data = inject(FixifyDataService);
  private readonly router = inject(Router);

  readonly selectedSiteId = signal<number | null>(null);
  readonly scoreColor = scoreColor;

  readonly wpSites = computed(() => this.data.wordPressSitesForCustomer(this.customerId));

  readonly selectedSite = computed(() => {
    const id = this.selectedSiteId();
    return id ? this.data.sites.find((s) => s.id === id) : undefined;
  });

  readonly wpState = computed(() => {
    const id = this.selectedSiteId();
    return id ? this.data.getWordPressState(id) : undefined;
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

  readonly hasPendingWork = computed(
    () => this.pendingPluginCount() > 0 || this.wpCoreOutdated() || this.themeOutdated()
  );

  readonly manageSections = computed(() => {
    const siteId = this.selectedSiteId();
    if (!siteId) return [];
    const base = `/admin/sites/${siteId}/manage`;
    return [
      { path: `${base}/plugins`, title: 'Plugins', desc: 'Update individually or in bulk', icon: 'layers', badge: this.pendingPluginCount() || null },
      { path: `${base}/core`, title: 'WordPress Core', desc: 'Version check & core update', icon: 'refresh', badge: this.wpCoreOutdated() ? 1 : null },
      { path: `${base}/theme`, title: 'Theme', desc: 'Update active theme', icon: 'file', badge: this.themeOutdated() ? 1 : null },
      { path: `${base}/cache`, title: 'Cache', desc: 'Clear page & object cache', icon: 'zap' },
      { path: `${base}/security`, title: 'Security', desc: 'Run vulnerability scan', icon: 'shield' },
      { path: `${base}/maintenance`, title: 'Maintenance', desc: 'DB, permalinks, thumbnails', icon: 'cog' },
    ];
  });

  ngOnInit(): void {
    this.selectInitialSite();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialSiteId'] || changes['customerId']) {
      this.selectInitialSite();
    }
  }

  private selectInitialSite(): void {
    const sites = this.wpSites();
    if (!sites.length) {
      this.selectedSiteId.set(null);
      return;
    }
    const preferred = this.initialSiteId;
    const id =
      preferred && sites.some((s) => s.id === preferred) ? preferred : sites[0].id;
    this.selectedSiteId.set(id);
    this.data.initWordPressState(id);
  }

  onSiteChange(event: Event): void {
    const id = Number((event.target as HTMLSelectElement).value);
    this.selectedSiteId.set(id);
    this.data.initWordPressState(id);
  }

  openFullManage(): void {
    const id = this.selectedSiteId();
    if (id) {
      this.router.navigate(['/admin/sites', id, 'manage']);
    }
  }
}
