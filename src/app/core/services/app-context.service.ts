import { Injectable, signal } from '@angular/core';
import { AppMode, ModalState, Site } from '../models/fixify.models';

@Injectable({ providedIn: 'root' })
export class AppContextService {
  readonly mode = signal<AppMode>('customer');
  readonly selectedSite = signal<Site | null>(null);
  readonly scanning = signal(false);
  readonly modal = signal<ModalState | null>(null);
  readonly currentCustomerId = signal(1);

  setMode(mode: AppMode): void {
    this.mode.set(mode);
  }

  openModal(state: ModalState): void {
    this.modal.set(state);
  }

  closeModal(): void {
    this.modal.set(null);
  }
}
