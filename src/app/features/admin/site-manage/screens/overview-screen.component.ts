import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteManageFacade } from '../site-manage.facade';
import { scoreColor } from '../../../../core/utils/fixify.utils';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { ManageSkeletonComponent } from './manage-skeleton.component';
import { tw } from '../../../../shared/ui/tw';

@Component({
  selector: 'app-site-manage-overview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconComponent, BadgeComponent, ManageSkeletonComponent],
  templateUrl: './overview-screen.component.html',
})
export class OverviewScreenComponent {
  protected readonly ui = tw;
  protected readonly facade = inject(SiteManageFacade);
  protected readonly scoreColor = scoreColor;

  readonly sections = [
    {
      path: 'plugins',
      title: 'Plugins',
      desc: 'View installed plugins and their update status',
      icon: 'layers',
      badge: () => this.facade.pendingPluginCount(),
    },
    {
      path: 'core',
      title: 'WordPress Core',
      desc: 'View the installed WordPress version and status',
      icon: 'refresh',
      badge: () => (this.facade.wpCoreOutdated() ? 1 : 0),
    },
    {
      path: 'theme',
      title: 'Theme',
      desc: 'View the active theme and its version',
      icon: 'file',
      badge: () => (this.facade.themeOutdated() ? 1 : 0),
    },
    {
      path: 'cache',
      title: 'Cache',
      desc: 'View caching configuration',
      icon: 'zap',
    },
    {
      path: 'security',
      title: 'Security',
      desc: 'View security posture and scan coverage',
      icon: 'shield',
    },
    {
      path: 'maintenance',
      title: 'Maintenance',
      desc: 'View maintenance task history',
      icon: 'cog',
    },
  ];

  formatRefreshed(iso?: string): string {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  }

  openAdminUrl(url?: string): void {
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }

  healthBadgeVariant(score?: number): 'bok' | 'bwn' | 'ber' | 'bgr' {
    if (score === undefined) return 'bgr';
    if (score >= 80) return 'bok';
    if (score >= 60) return 'bwn';
    return 'ber';
  }
}
