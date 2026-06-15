import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type BadgeVariant = 'bok' | 'bwn' | 'ber' | 'bbl' | 'bac' | 'bgr';

const BADGE_STYLES: Record<BadgeVariant, { bg: string; color: string }> = {
  bok: { bg: '#f0fdf4', color: '#059669' },
  bwn: { bg: '#fffbeb', color: '#d97706' },
  ber: { bg: '#fef2f2', color: '#dc2626' },
  bbl: { bg: '#eff6ff', color: '#2563eb' },
  bac: { bg: '#dbeafe', color: '#1d6fe0' },
  bgr: { bg: '#e2efff', color: '#2e4a72' },
};

@Component({
  selector: 'app-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      [style.background]="styles.bg"
      [style.color]="styles.color"
      style="display: inline-flex; align-items: center; gap: 4px; font-weight: 600; font-size: 11px; padding: 3px 8px; border-radius: 99px; white-space: nowrap"
    >
      <ng-content />
    </span>
  `,
})
export class BadgeComponent {
  @Input() variant: BadgeVariant | string = 'bgr';

  get styles(): { bg: string; color: string } {
    return BADGE_STYLES[this.variant as BadgeVariant] ?? BADGE_STYLES.bgr;
  }
}
