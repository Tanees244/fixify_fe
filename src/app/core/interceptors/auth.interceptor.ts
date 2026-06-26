import { HttpInterceptorFn } from '@angular/common/http';

const AUTH_TOKEN_KEY = 'authToken';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Presigned S3 uploads/downloads must keep their own headers (no bearer token,
  // and the file's own Content-Type) — never touch them.
  if (/amazonaws\.com/i.test(req.url)) {
    return next(req);
  }

  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
  );
};
