import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-spark-line',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.width]="width"
      [attr.height]="height"
      style="overflow: visible; display: block"
    >
      <defs>
        <linearGradient [attr.id]="gradientId" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" [attr.stop-color]="color" stop-opacity="0.18" />
          <stop offset="100%" [attr.stop-color]="color" stop-opacity="0" />
        </linearGradient>
      </defs>
      <path [attr.d]="areaPath" [attr.fill]="'url(#' + gradientId + ')'" />
      <polyline
        [attr.points]="linePoints"
        fill="none"
        [attr.stroke]="color"
        stroke-width="2"
        stroke-linejoin="round"
        stroke-linecap="round"
      />
    </svg>
  `,
})
export class SparkLineComponent {
  @Input() data: number[] = [];
  @Input() color = 'var(--acc)';
  @Input() width = 100;
  @Input() height = 40;
  @Input() chartId = 'sp';

  get gradientId(): string {
    return `sg-${this.chartId}`;
  }

  get linePoints(): string {
    if (!this.data.length) return '';

    const min = Math.min(...this.data);
    const max = Math.max(...this.data);
    const range = max - min || 1;

    return this.data
      .map((v, i) => {
        const x = +(i / (this.data.length - 1 || 1) * this.width).toFixed(1);
        const y = +(this.height - 4 - ((v - min) / range) * (this.height - 10)).toFixed(1);
        return `${x},${y}`;
      })
      .join(' ');
  }

  get areaPath(): string {
    if (!this.data.length) return '';

    const pts = this.linePoints.split(' ').map((p) => {
      const [x, y] = p.split(',');
      return { x: +x, y: +y };
    });

    const segments = pts.map((p) => `L${p.x},${p.y}`).join(' ');
    return `M0,${this.height} ${segments} L${this.width},${this.height} Z`;
  }
}
