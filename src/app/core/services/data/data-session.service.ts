import { Injectable, computed, inject, signal } from '@angular/core';
import { AuthService } from '../auth.service';

@Injectable({ providedIn: 'root' })
export class DataSessionService {
  private readonly auth = inject(AuthService);

  /** A data request is running (begin/endLoad). */
  private readonly fetching = signal(false);
  /**
   * A page change is in progress and its data has not been requested/finished yet.
   * Kept apart from `fetching` so the route loader can clear it without cutting off a
   * request that is already in flight.
   */
  readonly navigating = signal(false);

  /** What pages read to decide between skeletons and content. */
  readonly loading = computed(() => this.fetching() || this.navigating());

  readonly useApi = signal(false);
  /** Bumped after data arrays mutate so OnPush computeds re-evaluate. */
  readonly dataRevision = signal(0);

  init(): void {
    this.useApi.set(!!this.auth.getToken());
  }

  beginLoad(): void {
    this.fetching.set(true);
  }

  endLoad(): void {
    this.fetching.set(false);
    this.bump();
  }

  beginNav(): void {
    this.navigating.set(true);
  }

  endNav(): void {
    this.navigating.set(false);
    this.bump();
  }

  bump(): void {
    this.dataRevision.update((n) => n + 1);
  }
}
