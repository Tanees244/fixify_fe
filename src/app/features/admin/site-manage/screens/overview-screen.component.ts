import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteManageFacade } from '../site-manage.facade';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-site-manage-overview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconComponent],
  templateUrl: './overview-screen.component.html',
})
export class OverviewScreenComponent {
  protected readonly facade = inject(SiteManageFacade);

  readonly sections = [
    {
      path: 'plugins',
      title: 'Plugins',
      desc: 'View installed plugins, update individually or in bulk',
      icon: 'layers',
      badge: () => this.facade.pendingPluginCount(),
    },
    {
      path: 'core',
      title: 'WordPress Core',
      desc: 'Check version, review changelog, and update WordPress',
      icon: 'refresh',
      badge: () => (this.facade.wpCoreOutdated() ? 1 : 0),
    },
    {
      path: 'theme',
      title: 'Theme',
      desc: 'Update active theme to the latest version',
      icon: 'file',
      badge: () => (this.facade.themeOutdated() ? 1 : 0),
    },
    {
      path: 'cache',
      title: 'Cache',
      desc: 'Clear page cache and object cache',
      icon: 'zap',
    },
    {
      path: 'security',
      title: 'Security',
      desc: 'Run malware and vulnerability scans',
      icon: 'shield',
    },
    {
      path: 'maintenance',
      title: 'Maintenance',
      desc: 'Database optimization, permalinks, and thumbnails',
      icon: 'cog',
    },
  ];
}
