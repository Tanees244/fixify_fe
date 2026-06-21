import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import {
  Notification,
  NotificationService,
  NotificationType,
} from '../../../core/services/notification.service';
import { IconComponent } from '../icon/icon.component';
import { tw } from '../../ui/tw';

interface ToastItem extends Notification {
  id: number;
}

const TOAST_ICONS: Record<NotificationType, string> = {
  success: 'check',
  error: 'alert',
  info: 'info',
  warning: 'alert',
};

const TOAST_ICON_COLORS: Record<NotificationType, string> = {
  success: '#6ee7b7',
  error: '#fca5a5',
  info: '#93c5fd',
  warning: '#fde68a',
};

const MAX_TOASTS = 3;

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (toasts.length) {
      <div [class]="ui.toastWrap">
        @for (toast of toasts; track toast.id) {
          <div [class]="ui.toast + ' ' + toastClass(toast.type)">
            <app-icon
              [name]="toastIcon(toast.type)"
              [size]="15"
              [color]="toastIconColor(toast.type)"
            />
            {{ toast.message }}
          </div>
        }
      </div>
    }
  `,
})
export class ToastContainerComponent implements OnInit, OnDestroy {
  protected readonly ui = tw;

  private readonly notificationService = inject(NotificationService);
  private readonly cdr = inject(ChangeDetectorRef);

  toasts: ToastItem[] = [];
  private nextId = 1;
  private unsubscribe?: () => void;
  private timers = new Map<number, ReturnType<typeof setTimeout>>();

  ngOnInit(): void {
    this.unsubscribe = this.notificationService.subscribe((n) =>
      this.addToast(n),
    );
  }

  ngOnDestroy(): void {
    this.unsubscribe?.();
    this.timers.forEach((t) => clearTimeout(t));
    this.timers.clear();
  }

  toastClass(type: NotificationType): string {
    if (type === 'success') return this.ui.toastSuccess;
    if (type === 'error') return this.ui.toastError;
    if (type === 'info') return this.ui.toastInfo;
    return this.ui.toastWarn;
  }

  toastIcon(type: NotificationType): string {
    return TOAST_ICONS[type];
  }

  toastIconColor(type: NotificationType): string {
    return TOAST_ICON_COLORS[type];
  }

  private addToast(notification: Notification): void {
    const id = this.nextId++;
    const toast: ToastItem = { ...notification, id };

    this.toasts = [...this.toasts, toast].slice(-MAX_TOASTS);
    this.cdr.markForCheck();

    const duration =
      notification.type === 'error' || notification.type === 'warning'
        ? 6000
        : 4000;

    const timer = setTimeout(() => this.removeToast(id), duration);
    this.timers.set(id, timer);
  }

  private removeToast(id: number): void {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this.cdr.markForCheck();
  }
}
