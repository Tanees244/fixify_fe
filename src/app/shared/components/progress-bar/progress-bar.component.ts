import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { scoreColor } from '../../../core/utils/fixify.utils';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="prog">
      <div
        class="progb"
        [style.width.%]="clampedValue"
        [style.background]="barColor"
      ></div>
    </div>
  `,
})
export class ProgressBarComponent {
  @Input() value = 0;
  @Input() color?: string;

  get clampedValue(): number {
    return Math.min(100, Math.max(0, this.value));
  }

  get barColor(): string {
    return this.color ?? scoreColor(this.value);
  }
}
