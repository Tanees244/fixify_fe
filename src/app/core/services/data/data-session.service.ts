import { Injectable, inject, signal } from '@angular/core';
import { AuthService } from '../auth.service';

@Injectable({ providedIn: 'root' })
export class DataSessionService {
  private readonly auth = inject(AuthService);

  readonly loading = signal(false);
  readonly useApi = signal(false);
  /** Bumped after data arrays mutate so OnPush computeds re-evaluate. */
  readonly dataRevision = signal(0);

  init(): void {
    this.useApi.set(!!this.auth.getToken());
  }

  beginLoad(): void {
    this.loading.set(true);
  }

  endLoad(): void {
    this.loading.set(false);
    this.bump();
  }

  bump(): void {
    this.dataRevision.update((n) => n + 1);
  }
}
