import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

const AVATAR_GRADIENTS: [string, string][] = [
  ['#1d6fe0', '#38bdf8'],
  ['#059669', '#34d399'],
  ['#d97706', '#fbbf24'],
  ['#dc2626', '#f87171'],
  ['#7c3aed', '#a78bfa'],
];

@Component({
  selector: 'app-site-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      [style.width.px]="size"
      [style.height.px]="size"
      [style.border-radius.px]="size * 0.27"
      [style.background]="gradient"
      style="display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; flex-shrink: 0"
      [style.font-size.px]="size * 0.38"
    >
      {{ initials }}
    </div>
  `,
})
export class SiteAvatarComponent {
  @Input({ required: true }) fa!: string;
  @Input() size = 40;

  get initials(): string {
    return (this.fa ?? '').slice(0, 2);
  }

  get gradient(): string {
    const idx = (this.fa?.charCodeAt(0) ?? 0) % AVATAR_GRADIENTS.length;
    const [a, b] = AVATAR_GRADIENTS[idx];
    return `linear-gradient(135deg, ${a}, ${b})`;
  }
}
