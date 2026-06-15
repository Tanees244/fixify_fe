import { Injectable } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  message: string;
  type: NotificationType;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private listeners: ((n: Notification) => void)[] = [];

  show(message: string, type: NotificationType = 'info'): void {
    this.listeners.forEach((fn) => fn({ message, type }));
  }

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'error');
  }

  warning(message: string): void {
    this.show(message, 'warning');
  }

  info(message: string): void {
    this.show(message, 'info');
  }

  subscribe(listener: (n: Notification) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }
}
