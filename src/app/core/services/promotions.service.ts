import { Injectable, inject, signal } from '@angular/core';
import { ActivePromotions } from '../models/promotions.models';
import { PromotionsApiService } from './api/promotions-api.service';

/** Live promotions shown to customers (top ticker + dashboard hero banners). */
@Injectable({ providedIn: 'root' })
export class PromotionsService {
  private readonly api = inject(PromotionsApiService);

  readonly active = signal<ActivePromotions>({ ticker: [], hero: [] });
  readonly loaded = signal(false);
  private inflight = false;

  /** Loads once per session; pass force to re-read after an admin edit. */
  load(force = false): void {
    if (this.inflight || (this.loaded() && !force)) return;
    this.inflight = true;
    this.api.active().subscribe({
      next: (res) => {
        this.active.set({
          ticker: res.data?.ticker ?? [],
          hero: res.data?.hero ?? [],
        });
        this.loaded.set(true);
        this.inflight = false;
      },
      // Promotions are decorative: fail quiet and show nothing.
      error: () => {
        this.loaded.set(true);
        this.inflight = false;
      },
    });
  }
}
