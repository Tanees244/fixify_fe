import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { tw } from '../../ui/tw';

@Component({
  selector: 'app-card-panel-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full' },
  template: `
    <div [class]="ui.card + ' ' + ui.cardPad">
      <div [class]="ui.skelCell" style="height: 14px; width: 45%; margin-bottom: 16px"></div>
      @for (i of indexes(); track i) {
        <div
          style="display: flex; align-items: center; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid var(--b2)"
        >
          <div [class]="ui.skelCell" style="height: 12px; width: 55%"></div>
          <div [class]="ui.skelCell" style="height: 12px; width: 18%"></div>
        </div>
      }
    </div>
  `,
})
export class CardPanelSkeletonComponent {
  protected readonly ui = tw;

  readonly rows = input(5);

  readonly indexes = computed(() =>
    Array.from({ length: this.rows() }, (_, i) => i)
  );
}
