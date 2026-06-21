import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { tw } from '../../ui/tw';

@Component({
  selector: 'app-table-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tbody>
      @for (row of rowIndexes(); track row) {
        <tr>
          @for (col of colIndexes(); track col) {
            <td>
              <div [class]="ui.skelCell" [style.width.%]="cellWidth(col)"></div>
            </td>
          }
        </tr>
      }
    </tbody>
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
