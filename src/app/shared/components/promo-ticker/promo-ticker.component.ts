import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PromotionsService } from '../../../core/services/promotions.service';
import { Promotion } from '../../../core/models/promotions.models';
import { safePromoUrl } from '../../../core/utils/promo-url.util';

const SEPARATORS = ['%', '✦'];
const MIN_ITEMS_PER_HALF = 8;

/** Scrolling announcement bar. Items come from the admin Promotions page. */
@Component({
  selector: 'app-promo-ticker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    @if (items().length) {
      <div class="promo-ticker" [attr.data-theme]="theme()" role="region" aria-label="Announcements">
        <div class="promo-track" [style.animation-duration.s]="duration()">
          @for (half of [0, 1]; track half) {
            @for (it of loop(); track $index) {
              @if (link(it); as href) {
                @if (href.external) {
                  <a class="promo-item" [href]="href.url" target="_blank" rel="noopener noreferrer" [attr.aria-hidden]="half ? 'true' : null" [attr.tabindex]="half ? -1 : null">
                    <span>{{ it.title }}</span><span class="promo-sep">{{ sep($index) }}</span>
                  </a>
                } @else {
                  <a class="promo-item" [routerLink]="href.url" [attr.aria-hidden]="half ? 'true' : null" [attr.tabindex]="half ? -1 : null">
                    <span>{{ it.title }}</span><span class="promo-sep">{{ sep($index) }}</span>
                  </a>
                }
              } @else {
                <span class="promo-item" [attr.aria-hidden]="half ? 'true' : null">
                  <span>{{ it.title }}</span><span class="promo-sep">{{ sep($index) }}</span>
                </span>
              }
            }
          }
        </div>
      </div>
    }
  `,
})
export class PromoTickerComponent {
  private readonly promos = inject(PromotionsService);

  readonly items = computed(() => this.promos.active().ticker);
  readonly theme = computed(() => this.items()[0]?.theme ?? 'coral');

  /** Repeat short lists so one half always overflows the viewport (seamless loop). */
  readonly loop = computed<Promotion[]>(() => {
    const base = this.items();
    if (!base.length) return [];
    const out: Promotion[] = [];
    while (out.length < MIN_ITEMS_PER_HALF || out.length % base.length !== 0) {
      out.push(base[out.length % base.length]);
    }
    return out;
  });

  /** Constant reading speed regardless of how many items there are. */
  readonly duration = computed(() => Math.max(20, this.loop().length * 5));

  link(p: Promotion) {
    return safePromoUrl(p.ctaUrl);
  }

  sep(i: number): string {
    return SEPARATORS[i % SEPARATORS.length];
  }
}
