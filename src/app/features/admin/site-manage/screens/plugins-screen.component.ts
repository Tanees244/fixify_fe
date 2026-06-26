import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { SiteManageFacade } from '../site-manage.facade';
import { DataSessionService } from '../../../../core/services/data';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { TableSkeletonComponent } from '../../../../shared/components/table-skeleton/table-skeleton.component';
import { tw } from '../../../../shared/ui/tw';

type PluginFilter = 'all' | 'updates' | 'vulnerable' | 'active';

@Component({
  selector: 'app-site-manage-plugins',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BadgeComponent, TableSkeletonComponent],
  templateUrl: './plugins-screen.component.html',
})
export class PluginsScreenComponent {
  protected readonly ui = tw;
  protected readonly facade = inject(SiteManageFacade);
  private readonly session = inject(DataSessionService);

  readonly loading = this.session.loading;

  readonly filter = signal<PluginFilter>('all');

  readonly plugins = computed(() => {
    this.session.dataRevision();
    return this.facade.wpState()?.plugins ?? [];
  });

  readonly filteredPlugins = computed(() => {
    const f = this.filter();
    return this.plugins().filter((p) => {
      if (f === 'updates') return p.status === 'update';
      if (f === 'vulnerable') return p.status === 'vulnerable';
      if (f === 'active') return p.active;
      return true;
    });
  });

  readonly filterChips: { id: PluginFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'updates', label: 'Updates' },
    { id: 'vulnerable', label: 'Vulnerable' },
    { id: 'active', label: 'Active only' },
  ];

  setFilter(filter: PluginFilter): void {
    this.filter.set(filter);
  }

  pluginBadge(status: string): 'bok' | 'bwn' | 'ber' {
    if (status === 'ok') return 'bok';
    if (status === 'update') return 'bwn';
    return 'ber';
  }

  pluginStatusLabel(status: string): string {
    return status === 'ok' ? 'Up to date' : status === 'update' ? 'Update available' : 'Vulnerable';
  }
}
