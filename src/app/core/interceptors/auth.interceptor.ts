import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { isDirectS3Url } from '../utils/http-url.util';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Presigned S3 uploads must not get auth/JSON headers.
  if (isDirectS3Url(req.url)) {
    return next(req);
  }

  const token = inject(AuthService).getToken();
  if (!token) {
    return next(req);
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  };

  const hasBody = req.body !== null && req.body !== undefined;
  const isFormData = typeof FormData !== 'undefined' && req.body instanceof FormData;
  if (hasBody && !isFormData && !req.headers.has('Content-Type')) {
    headers['Content-Type'] = 'application/json';
  }

  return next(req.clone({ setHeaders: headers }));
};
