import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
} from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SiteManageFacade } from './site-manage.facade';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { SiteAvatarComponent } from '../../../shared/components/site-avatar/site-avatar.component';

interface ManageNavItem {
  path: string;
  label: string;
  icon: string;
  badge?: () => number | null;
}

@Component({
  selector: 'app-site-manage-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SiteManageFacade],
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    IconComponent,
    SiteAvatarComponent,
  ],
  templateUrl: './site-manage-shell.component.html',
})
export class SiteManageShellComponent implements OnInit {
  protected readonly facade = inject(SiteManageFacade);

  readonly navItems: ManageNavItem[] = [
    { path: 'overview', label: 'Overview', icon: 'dash' },
    {
      path: 'plugins',
      label: 'Plugins',
      icon: 'layers',
      badge: () => this.facade.pendingPluginCount() || null,
    },
    {
      path: 'core',
      label: 'WordPress Core',
      icon: 'refresh',
      badge: () => (this.facade.wpCoreOutdated() ? 1 : null),
    },
    {
      path: 'theme',
      label: 'Theme',
      icon: 'file',
      badge: () => (this.facade.themeOutdated() ? 1 : null),
    },
    { path: 'cache', label: 'Cache', icon: 'zap' },
    { path: 'security', label: 'Security', icon: 'shield' },
    { path: 'maintenance', label: 'Maintenance', icon: 'cog' },
  ];

  readonly basePath = computed(() => this.facade.manageBasePath());

  ngOnInit(): void {
    this.facade.ensureState();
  }
}
