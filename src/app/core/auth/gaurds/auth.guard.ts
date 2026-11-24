import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import {
  catchError,
  defer,
  from,
  map,
  Observable,
  of,
  switchMap,
  tap,
  timeout,
  TimeoutError,
} from 'rxjs';

import {
  AuthenticationRequiredError,
  AuthRecoveryResult,
  AuthRecoveryService,
} from '../services/auth-recovery.service';
import { AuthorizationService } from '../services/authorization.service';
import { AuthStateService } from '../state/auth.state';
import { AuthService } from '../services/auth.service';

export const AUTHENTICATION_ERROR_URL = '/authentication-error';
export const UNAUTHORIZED_URL = '/unauthorized';
export const SERVER_TIMEOUT_URL = '/server-timeout';

const PAGE_ACCESS_TIMEOUT_MS = 10_000;

/**
 * Network failure, request timeout or backend server error.
 */
const isServiceUnavailable = (error: unknown): boolean =>
  error instanceof TimeoutError ||
  (error instanceof HttpErrorResponse && (error.status === 0 || error.status >= 500));

export const authGuard: CanActivateFn = (route, state): Observable<boolean | UrlTree> | UrlTree => {
  const authState = inject(AuthStateService);
  const authorizationService = inject(AuthorizationService);
  const recovery = inject(AuthRecoveryService);
  const router = inject(Router);
  const auth = inject(AuthService);
  // Preserve the originally requested page so browser refresh can retry it.
  const createErrorUrl = (path: string): UrlTree =>
    router.createUrlTree([path], {
      queryParams: {
        returnUrl: state.url,
        fromGuard: '1',
      },
    });

  const authenticationError = createErrorUrl(AUTHENTICATION_ERROR_URL);
  const denied = createErrorUrl(UNAUTHORIZED_URL);
  const serverTimeout = createErrorUrl(SERVER_TIMEOUT_URL);

  /**
   * Maps authentication recovery outcomes.
   */
  const fromRecovery = (result: AuthRecoveryResult): boolean | UrlTree => {
    switch (result.status) {
      case 'redirecting':
        // MSAL is navigating to Microsoft authentication.
        return false;

      case 'unavailable':
        // Identity provider/network is temporarily unavailable.
        return serverTimeout;

      case 'cooldown':
      case 'failed':
        // Authentication could not be recovered.
        return authenticationError;
      default:
        return authenticationError;
    }
  };
  const classifyAuthorizationFailure = (error: unknown): boolean | UrlTree => {
    if (error instanceof AuthenticationRequiredError) {
      return fromRecovery(error.result);
    }

    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) {
        return authenticationError;
      }

      if (error.status === 403 || error.status === 404) {
        return denied;
      }
    }

    if (isServiceUnavailable(error)) {
      return serverTimeout;
    }

    return serverTimeout;
  };

  const initializationError = auth.getAuthorizationInitializationError();

 if (initializationError) {
   return of(classifyAuthorizationFailure(initializationError));
 }
  const pageKey = route.data['pageKey'] as string | undefined;

  if (!pageKey) {
    return denied;
  }

  /**
   * Checks whether the authenticated user has access to the requested page.
   */
  const checkPageAccess$ = defer(() => {
    const userId = authState.getCurrentUserId();

    if (!userId) {
      return of(authenticationError);
    }

    return authorizationService.getPageAccess(pageKey, userId).pipe(
      timeout(PAGE_ACCESS_TIMEOUT_MS),

      // The backend accepted the token.
      tap(() => recovery.reset()),

      map((response) => {
        const access = response?.success === false ? null : response?.data;

        const allowed =
          access?.value === true && access.key?.toUpperCase() === pageKey.toUpperCase();

        return allowed ? true : denied;
      }),
    );
  }).pipe(
    catchError((error: unknown): Observable<boolean | UrlTree> => {
      if (error instanceof AuthenticationRequiredError) {
        return of(fromRecovery(error.result));
      }

      if (error instanceof HttpErrorResponse) {
        if (error.status === 401) {
          // The interceptor may already have started an MSAL redirect.
          return of(recovery.isRedirectInProgress() ? false : authenticationError);
        }

        if (error.status === 403) {
          recovery.reset();
          return of(denied);
        }
      }

      if (isServiceUnavailable(error)) {
        return of(serverTimeout);
      }

      // Unexpected failures must not be presented as permission denial.
      console.error(`[AuthGuard] Page access check failed for '${pageKey}':`, error);

      return of(serverTimeout);
    }),
  );

  // Acquire the token before starting the page-access request.
  // Token acquisition is deliberately outside the page-access timeout.
  return from(recovery.acquireAccessToken(state.url)).pipe(
    switchMap((result) =>
      result.status === 'success' ? checkPageAccess$ : of(fromRecovery(result)),
    ),
  );
  ////////////////////////////////////////////////////////////////////////////////////////
};
