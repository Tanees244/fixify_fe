import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PromotionsService } from '../../../core/services/promotions.service';
import { Promotion } from '../../../core/models/promotions.models';
import { safePromoUrl } from '../../../core/utils/promo-url.util';

/** Large promo banners for the customer dashboard. Content comes from the admin Promotions page. */
@Component({
  selector: 'app-promo-hero',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  host: { class: 'block' },
  template: `
    @for (p of banners(); track p.id) {
      <section class="promo-hero" [attr.data-theme]="p.theme" style="margin-bottom: 18px">
        <h2 class="promo-hero-title">{{ p.title }}</h2>
        @if (p.badge) {
          <div class="promo-hero-badge">{{ p.badge }}</div>
        }
        @if (p.subtitle) {
          <p class="promo-hero-sub">{{ p.subtitle }}</p>
        }
        @if (p.ctaLabel && link(p); as href) {
          <div>
            @if (href.external) {
              <a class="promo-hero-cta" [href]="href.url" target="_blank" rel="noopener noreferrer">{{ p.ctaLabel }}</a>
            } @else {
              <a class="promo-hero-cta" [routerLink]="href.url">{{ p.ctaLabel }}</a>
            }
          </div>
        }
      </section>
    }
  `,
})
export class PromoHeroComponent {
  private readonly promos = inject(PromotionsService);
  readonly banners = computed(() => this.promos.active().hero);

  link(p: Promotion) {
    return safePromoUrl(p.ctaUrl);
  }
}
