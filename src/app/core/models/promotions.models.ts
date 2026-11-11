export type PromotionKind = 'ticker' | 'hero';
export type PromotionTheme = 'coral' | 'purple' | 'blue' | 'green' | 'dark';

export const PROMOTION_THEMES: PromotionTheme[] = ['coral', 'purple', 'blue', 'green', 'dark'];

export interface Promotion {
  id: string;
  kind: PromotionKind;
  /** Ticker: scrolling text. Hero: headline. */
  title: string;
  subtitle: string;
  /** Hero only: highlighted tag such as "85% OFF". */
  badge: string;
  ctaLabel: string;
  ctaUrl: string;
  theme: PromotionTheme;
  isActive: boolean;
  sortOrder: number;
  startsAt: string | null;
  endsAt: string | null;
}

export type PromotionInput = Partial<Omit<Promotion, 'id'>> & Pick<Promotion, 'kind' | 'title'>;

export interface ActivePromotions {
  ticker: Promotion[];
  hero: Promotion[];
}
