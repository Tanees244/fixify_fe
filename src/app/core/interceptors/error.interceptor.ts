import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../services/auth.service';
import { EntitlementsService } from '../services/entitlements.service';
import { isDirectS3Url } from '../utils/http-url.util';

const SUBSCRIPTION_CODES = new Set([
  'SITE_LIMIT_REACHED',
  'FEATURE_LOCKED',
  'ASK_AI_LIMIT_REACHED',
  'TICKET_LIMIT_REACHED',
  'TRIAL_ALREADY_USED',
  'SUBSCRIPTION_EXPIRED',
]);

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  if (isDirectS3Url(req.url)) {
    return next(req);
  }

  const router = inject(Router);
  const notification = inject(NotificationService);
  const authService = inject(AuthService);
  const entitlements = inject(EntitlementsService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        authService.logout();
        router.navigate(['/auth']);
        notification.error('Session expired. Please log in again.');
      } else if (SUBSCRIPTION_CODES.has(err.error?.code) || err.status === 402) {
        // Plan limit / read-only enforced by the backend — resync UI state.
        notification.warning(err.error?.message || 'This action is not available on your plan');
        entitlements.refresh();
      } else if (err.status >= 500) {
        notification.error('Server error. Please try again later.');
      } else if (err.error?.message) {
        notification.error(err.error.message);
      }
      return throwError(() => err);
    })
  );
};
