import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { catchError, defer, map, Observable, of, timeout, TimeoutError } from 'rxjs';

import { AuthorizationService } from '../services/authorization.service';
import { AuthService } from '../services/auth.service';
import { AuthStateService } from '../state/auth.state';

export const UNAUTHORIZED_URL = '/unauthorized';
export const SERVER_TIMEOUT_URL = '/server-timeout';
const PAGE_ACCESS_TIMEOUT_MS = 10_000;
const RELOGIN_ATTEMPT_KEY = 'authGuard.reloginAttemptAt';
// Stops a redirect loop if the backend keeps returning 401 right after a fresh login.
const RELOGIN_COOLDOWN_MS = 60_000;

/** Network failure (status 0) or backend 5xx: the access check could not be completed. */
const isServiceUnavailable = (error: unknown): boolean =>
  error instanceof TimeoutError ||
  (error instanceof HttpErrorResponse && (error.status === 0 || error.status >= 500));

/**
 * Page-level authorization. Verifies the route's `data.pageKey` against the backend on every
 * navigation (direct URL, refresh and shared links included). Fails closed: anything other than an
 * explicit `value === true` for the requested page redirects to the Unauthorized page.
 *
 * Failures that are not a real permission decision are reported separately:
 *  - 401 (expired or missing token) starts a re-login instead of showing "Access denied".
 *  - Timeouts, network failures and 5xx redirect to the Server Timeout page so users can retry.
 */
export const authGuard: CanActivateFn = (route): Observable<boolean | UrlTree> | UrlTree => {
  const auth = inject(AuthService);
  const authState = inject(AuthStateService);
  const authorizationService = inject(AuthorizationService);
  const router = inject(Router);

  const denied = router.createUrlTree([UNAUTHORIZED_URL]);

  if (!auth.isAuthenticatedSync()) {
    void auth.login();
    return denied;
  }

  const pageKey = route.data['pageKey'] as string | undefined;

  if (!pageKey) {
    console.error('[AuthGuard] Route has no pageKey; denying navigation.');
    return denied;
  }

  return defer(() => {
    const userId = authState.getCurrentUserId();

    if (!userId) {
      console.error('[AuthGuard] Current user ID not available; denying navigation.');
      return of(denied);
    }

    return authorizationService.getPageAccess(pageKey, userId).pipe(
      timeout(PAGE_ACCESS_TIMEOUT_MS),
      map((response) => {
        const access = response?.success === false ? null : response?.data;
        const allowed =
          access?.value === true && access.key?.toUpperCase() === pageKey.toUpperCase();

        if (!allowed) {
          console.warn(`[AuthGuard] Access denied for page '${pageKey}'.`);
        }

        return allowed ? true : denied;
      }),
    );
  }).pipe(
    catchError((error) => {
      console.error(`[AuthGuard] Page access check failed for '${pageKey}':`, error);

      const serverTimeout = router.createUrlTree([SERVER_TIMEOUT_URL]);

      if (error instanceof HttpErrorResponse && error.status === 401) {
        const lastAttempt = Number(sessionStorage.getItem(RELOGIN_ATTEMPT_KEY) ?? 0);

        if (Date.now() - lastAttempt < RELOGIN_COOLDOWN_MS) {
          return of(serverTimeout);
        }

        sessionStorage.setItem(RELOGIN_ATTEMPT_KEY, String(Date.now()));
        void auth.login();
        // Cancel navigation; the browser is redirected to the Microsoft login page.
        return of(false);
      }

      if (isServiceUnavailable(error)) {
        return of(serverTimeout);
      }

      return of(denied);
    }),
  );
};
