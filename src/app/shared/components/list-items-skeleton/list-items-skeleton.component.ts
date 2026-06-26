import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { tw } from '../../ui/tw';

@Component({
  selector: 'app-list-items-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full' },
  template: `
    <div style="display: flex; flex-direction: column; gap: 10px">
      @for (i of indexes(); track i) {
        <div
          style="background: var(--sr); border: 1px solid var(--bd); border-radius: 12px; padding: 14px 18px; display: flex; align-items: center; gap: 12px"
        >
          <div [class]="ui.skelCell" style="width: 34px; height: 34px; border-radius: 8px; flex-shrink: 0"></div>
          <div style="flex: 1; min-width: 0">
            <div [class]="ui.skelCell" style="height: 13px; width: 65%; margin-bottom: 8px"></div>
            <div [class]="ui.skelCell" style="height: 11px; width: 30%"></div>
          </div>
          <div [class]="ui.skelCell" style="height: 11px; width: 52px"></div>
        </div>
      }
    </div>
  `,
})
export class ListItemsSkeletonComponent {
  protected readonly ui = tw;

  readonly rows = input(3);

  readonly indexes = computed(() =>
    Array.from({ length: this.rows() }, (_, i) => i)
  );
}
