import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { scoreColor } from '../../../core/utils/fixify.utils';
import { tw } from '../../ui/tw';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="ui.prog">
      <div
        [class]="ui.progb"
        [style.width.%]="clampedValue"
        [style.background]="barColor"
      ></div>
    </div>
  `,
})
export class ProgressBarComponent {
  protected readonly ui = tw;

  @Input() value = 0;
  @Input() color?: string;

  get clampedValue(): number {
    return Math.min(100, Math.max(0, this.value));
  }

  get barColor(): string {
    return this.color ?? scoreColor(this.value);
  }
}
