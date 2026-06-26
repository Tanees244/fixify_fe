import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { tw } from '../../ui/tw';

@Component({
  selector: 'app-stat-cards-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full' },
  template: `
    <div [class]="gridClass()">
      @for (i of indexes(); track i) {
        <div [class]="ui.statCard">
          <div [class]="ui.skelCell" style="height: 12px; width: 55%; margin-bottom: 14px"></div>
          <div [class]="ui.skelCell" style="height: 28px; width: 40%; margin-bottom: 8px"></div>
          <div [class]="ui.skelCell" style="height: 12px; width: 70%"></div>
        </div>
      }
    </div>
  `,
})
export class StatCardsSkeletonComponent {
  protected readonly ui = tw;

  readonly count = input(4);
  readonly gridClass = input<string>(tw.grid4);

  readonly indexes = computed(() =>
    Array.from({ length: this.count() }, (_, i) => i)
  );
}
