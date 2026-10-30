import { HttpInterceptorFn } from '@angular/common/http';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  // Keep the global screen loader tied only to route navigation.
  // Request-level loading is intentionally not used here so filters/refreshes do not trigger the full-screen overlay.
  return next(req);
};