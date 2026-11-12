import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { catchError, defer, map, Observable, of, timeout } from 'rxjs';

import { AuthorizationService } from '../services/authorization.service';
import { AuthService } from '../services/auth.service';
import { AuthStateService } from '../state/auth.state';

export const UNAUTHORIZED_URL = '/unauthorized';
const PAGE_ACCESS_TIMEOUT_MS = 10_000;

/**
 * Page-level authorization. Verifies the route's `data.pageKey` against the backend on every
 * navigation (direct URL, refresh and shared links included). Fails closed: anything other than an
 * explicit `value === true` for the requested page redirects to the Unauthorized page.
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
      return of(denied);
    }),
  );
};
