import { HttpErrorResponse, HttpEventType, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, tap, throwError } from 'rxjs';

import { AuthenticationRequiredError, AuthRecoveryService } from '../services/auth-recovery.service';
import { isRecoverableUnauthorized } from '../utils/auth.utils';
import { isProtectedRequest } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

// Prevent concurrent API 401 responses from triggering repeated navigation.
let errorNavigationInProgress = false;

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isProtectedRequest(req.url)) {
    return next(req);
  }

  const recovery = inject(AuthRecoveryService);
  const router = inject(Router);
  const auth = inject(AuthService);
  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      // Unrecoverable 401: do not attempt token renewal.
      if (!isRecoverableUnauthorized(error)) {
        if (!auth.isAuthorizationInitializationInProgress()) {
          navigateToErrorPage(router, '/authentication-error');
        }
        return throwError(() => error);
      }

      // Recoverable 401: force silent token renewal.
      return from(recovery.recoverFromUnauthorized(resolveReturnUrl(router))).pipe(
        switchMap((result) => {
          if (result.status === 'success') {
            // Retry the original request exactly once with the new token.
            const retryRequest = req.clone({
              setHeaders: {
                Authorization: `Bearer ${result.accessToken}`,
              },
            });

            return next(retryRequest).pipe(
              tap((event) => {
                if (event.type === HttpEventType.Response) {
                  // Backend successfully responded to the renewed token.
                  recovery.reset();
                }
              }),
              catchError((retryError: unknown) => {
                if (retryError instanceof HttpErrorResponse && retryError.status === 403) {
                  // Authentication succeeded; the user simply lacks permission.
                  recovery.reset();
                }

                // Do not retry again.
                return throwError(() => retryError);
              }),
            );
          }
          if (auth.isAuthorizationInitializationInProgress()) {
            return throwError(() => new AuthenticationRequiredError(result));
          }

          // MSAL is already handling interactive authentication.
          if (result.status === 'redirecting') {
            return throwError(() => error);
          }

          if (result.status === 'unavailable') {
            if (!auth.isAuthorizationInitializationInProgress()) {
              navigateToErrorPage(router, '/server-timeout');
            }
          } else {
            if (!auth.isAuthorizationInitializationInProgress()) {
              navigateToErrorPage(router, '/authentication-error');
            }
          }

          return throwError(() => error);
        }),
      );
    }),
  );
};

/**
 * Navigate to an error page when the API request happens outside
 * an active Angular route navigation.
 *
 * During a guard navigation, the guard itself handles the error.
 */
function navigateToErrorPage(router: Router, path: string): void {
  if (router.currentNavigation()) {
    return;
  }

  if (router.url.split('?')[0] === path) {
    return;
  }

  if (errorNavigationInProgress) {
    return;
  }

  errorNavigationInProgress = true;

  const returnUrl = resolveReturnUrl(router) ?? router.url ?? '/';

  void router
    .navigate([path], {
      queryParams: {
        returnUrl,
        fromGuard: '1',
      },
      replaceUrl: true,
    })
    .finally(() => {
      errorNavigationInProgress = false;
    });
}

/**
 * The page being navigated to, otherwise the current page.
 */
function resolveReturnUrl(router: Router): string | undefined {
  const navigation = router.currentNavigation();
  const target = navigation?.finalUrl ?? navigation?.extractedUrl;

  return target ? router.serializeUrl(target) : undefined;
}
