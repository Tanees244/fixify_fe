import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { SiteManageFacade } from '../site-manage.facade';
import { FixifyDataService } from '../../../../core/services/fixify-data.service';
import { WordPressPlugin } from '../../../../core/models/fixify.models';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { BadgeComponent } from '../../../../shared/components/badge/badge.component';
import { TableSkeletonComponent } from '../../../../shared/components/table-skeleton/table-skeleton.component';

type PluginFilter = 'all' | 'updates' | 'vulnerable' | 'active';

@Component({
  selector: 'app-site-manage-plugins',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, BadgeComponent, TableSkeletonComponent],
  templateUrl: './plugins-screen.component.html',
})
export class PluginsScreenComponent {
  protected readonly facade = inject(SiteManageFacade);
  private readonly data = inject(FixifyDataService);

  readonly loading = this.data.loading;

  readonly filter = signal<PluginFilter>('all');
  readonly selected = signal<Set<string>>(new Set());

  readonly plugins = computed(() => {
    this.data.dataRevision();
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

  readonly updatableIds = computed(() =>
    this.plugins().filter((p) => p.status !== 'ok').map((p) => p.id)
  );

  readonly selectedUpdatableCount = computed(() => {
    const sel = this.selected();
    return this.plugins().filter((p) => sel.has(p.id) && p.status !== 'ok').length;
  });

  readonly allFilteredSelected = computed(() => {
    const list = this.filteredPlugins();
    return list.length > 0 && list.every((p) => this.selected().has(p.id));
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

  isSelected(id: string): boolean {
    return this.selected().has(id);
  }

  togglePlugin(id: string): void {
    const next = new Set(this.selected());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.selected.set(next);
  }

  toggleSelectAllFiltered(): void {
    const list = this.filteredPlugins();
    const next = new Set(this.selected());
    const allOn = list.every((p) => next.has(p.id));
    for (const p of list) {
      if (allOn) {
        next.delete(p.id);
      } else {
        next.add(p.id);
      }
    }
    this.selected.set(next);
  }

  selectAllUpdatable(): void {
    this.selected.set(new Set(this.updatableIds()));
  }

  clearSelection(): void {
    this.selected.set(new Set());
  }

  pluginBadge(status: string): 'bok' | 'bwn' | 'ber' {
    if (status === 'ok') return 'bok';
    if (status === 'update') return 'bwn';
    return 'ber';
  }

  pluginStatusLabel(status: string): string {
    return status === 'ok' ? 'Up to date' : status === 'update' ? 'Update available' : 'Vulnerable';
  }

  canUpdate(plugin: WordPressPlugin): boolean {
    return plugin.status !== 'ok';
  }

  async updateOne(plugin: WordPressPlugin): Promise<void> {
    await this.facade.runAction('update_plugin', plugin.id);
    const next = new Set(this.selected());
    next.delete(plugin.id);
    this.selected.set(next);
  }

  async updateSelected(): Promise<void> {
    const ids = [...this.selected()].filter((id) => {
      const p = this.plugins().find((pl) => pl.id === id);
      return p && p.status !== 'ok';
    });
    if (!ids.length) return;
    await this.facade.runAction('update_selected_plugins', ids.join(','));
    this.clearSelection();
  }

  async updateAll(): Promise<void> {
    await this.facade.runAction('update_all_plugins');
    this.clearSelection();
  }
}
