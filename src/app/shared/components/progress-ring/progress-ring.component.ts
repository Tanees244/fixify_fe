import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  inject,
} from '@angular/core';
import { scoreColor } from '../../../core/utils/fixify.utils';

@Component({
  selector: 'app-progress-ring',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      [style.width.px]="size"
      [style.height.px]="size"
      style="position: relative; display: inline-flex; align-items: center; justify-content: center"
    >
      <svg
        [attr.width]="size"
        [attr.height]="size"
        style="position: absolute; transform: rotate(-90deg)"
      >
        <circle
          [attr.cx]="size / 2"
          [attr.cy]="size / 2"
          [attr.r]="radius"
          fill="none"
          stroke="var(--bd)"
          [attr.stroke-width]="strokeWidth"
        />
        <circle
          [attr.cx]="size / 2"
          [attr.cy]="size / 2"
          [attr.r]="radius"
          fill="none"
          [attr.stroke]="ringColor"
          [attr.stroke-width]="strokeWidth"
          [attr.stroke-dasharray]="dashArray"
          stroke-linecap="round"
          style="transition: stroke-dasharray 1.1s cubic-bezier(0.4, 0, 0.2, 1)"
        />
      </svg>
      <span
        [style.font-size.px]="size * 0.21"
        style="font-weight: 700; letter-spacing: -0.5px; color: var(--t1)"
      >
        {{ score }}
      </span>
    </div>
  `,
})
export class ProgressRingComponent implements OnChanges {
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() score = 0;
  @Input() size = 80;
  @Input() strokeWidth = 7;

  animatedScore = 0;

  get radius(): number {
    return (this.size - this.strokeWidth) / 2;
  }

  get circumference(): number {
    return 2 * Math.PI * this.radius;
  }

  get ringColor(): string {
    return scoreColor(this.score);
  }

  get dashArray(): string {
    const filled = (this.animatedScore / 100) * this.circumference;
    return `${filled} ${this.circumference}`;
  }

  ngOnChanges(): void {
    this.animatedScore = 0;
    setTimeout(() => {
      this.animatedScore = this.score;
      this.cdr.markForCheck();
    }, 80);
  }
}
