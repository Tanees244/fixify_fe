import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { tw } from '../../ui/tw';

/**
 * Skeleton rows for a table. Use it AS the table body:
 *   <tbody app-table-skeleton [rows]="6" [cols]="7"></tbody>
 * An element wrapper between <table> and <tbody> makes the browser wrap the rows in an
 * anonymous cell, which collapses every column to zero width.
 */
@Component({
  selector: 'tbody[app-table-skeleton]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-busy': 'true', 'aria-label': 'Loading' },
  template: `
    @for (row of rowIndexes(); track row) {
      <tr>
        @for (col of colIndexes(); track col) {
          <td [class]="ui.td">
            <div [class]="ui.skelCell" style="height: 14px" [style.width.%]="cellWidth(col)"></div>
          </td>
        }
      </tr>
    }
  `,
})
export class TableSkeletonComponent {
  protected readonly ui = tw;

  readonly rows = input(5);
  readonly cols = input(6);

  readonly rowIndexes = computed(() =>
    Array.from({ length: this.rows() }, (_, i) => i)
  );

  readonly colIndexes = computed(() =>
    Array.from({ length: this.cols() }, (_, i) => i)
  );

  cellWidth(col: number): number {
    const pattern = [92, 78, 65, 88, 72, 55, 80, 60, 70];
    return pattern[col % pattern.length];
  }
}
