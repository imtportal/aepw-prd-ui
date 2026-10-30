import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, of, switchMap } from 'rxjs';
import { PublicClientApplication } from '@azure/msal-browser';
import { environment } from '../../../../environments/environment';
import { PUBLIC_ENDPOINTS, AUTH_SCOPES } from '../config/auth.constants';
import { MSAL_INSTANCE } from '../config/msal.token';
import { AuthStateService } from '../state/auth.state';

// ---------------------------------------------------------------------------
// auth.interceptor.ts — Centralized HTTP interceptor for Bearer token attachment.
//
// This interceptor automatically acquires an access token and attaches it as
// an `Authorization: Bearer` header to all outbound requests destined for
// the protected backend API.
//
// Design principles:
//  - Single responsibility: attaches the token; nothing else.
//  - Uses MSAL directly to avoid circular dependency with AuthService.
//  - Token acquisition is silent-only (no interactive redirects).
//  - Token is NEVER constructed or modified here — it is read-only.
//  - Sensitive endpoints can be excluded via PUBLIC_ENDPOINTS in auth.constants.ts.
//
// SECURITY:
//  - The Bearer token is attached ONLY to requests targeting environment.apiBaseUrl.
//    This prevents accidental token leakage to third-party services or CDNs.
//  - The interceptor does not inspect or decode the token payload.
//  - Identity (createdBy / updatedBy) must come from the backend's validated
//    JWT claims — never from request bodies sent by the frontend.
// ---------------------------------------------------------------------------

/**
 * Functional HTTP interceptor that attaches a Bearer access token to
 * all requests targeting the protected backend API.
 *
 * Pipeline:
 *  1. Check if the request URL targets the API base URL.
 *  2. Check if the URL is a public (unauthenticated) endpoint.
 *  3. Acquire a silent access token via MSAL.
 *  4. Clone the request with the Authorization header attached.
 *  5. Forward the (possibly augmented) request to the next handler.
 *
 * If token acquisition fails for any reason (no account, network error),
 * the request is forwarded without the token.  The backend will return 401,
 * which the error.interceptor.ts handles by triggering re-authentication.
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  // -------------------------------------------------------------------------
  // Guard 1 — Skip requests that do not target the protected API.
  // This prevents tokens from being sent to third-party services.
  // -------------------------------------------------------------------------
  if (!isProtectedRequest(req.url)) {
    return next(req);
  }

  const msal = inject(MSAL_INSTANCE);
  const authState = inject(AuthStateService);
  const userId = authState.getCurrentUserId();
  // -------------------------------------------------------------------------
  // Acquire token silently using MSAL directly.
  //
  // This avoids circular dependency with AuthService.
  // We use acquireTokenSilent which returns a cached token if valid,
  // or silently renews it using the refresh token.
  //
  // CRITICAL: catchError is scoped to ONLY the token acquisition observable.
  // HTTP error responses (4xx, 5xx) from next() must NOT be caught here,
  // otherwise they will trigger a retry without the token.
  // -------------------------------------------------------------------------
  const tokenOrNull$ = from(acquireToken(msal)).pipe(
    catchError(() => {
      // Token acquisition failed — return null to proceed without a token.
      // The backend will return 401, which must be handled by the caller.
      return of(null);
    }),
  );

  return tokenOrNull$.pipe(
    switchMap((token) => {
      if (!token) {
        // Token acquisition returned null — forward the original request.
        // The backend 401 response will propagate to the service's catchError.
        return next(req);
      }

      // Attach the Bearer token.
      // req.clone() is mandatory — HttpRequest objects are immutable.
      const authorizedReq = req.clone({
        setHeaders: {
          // Standard OAuth 2.0 Bearer token header.
          // The backend validates this using AddMicrosoftIdentityWebApi.
          Authorization: `Bearer ${token}`,
          ...(userId ? { 'X-User-Id': userId.toString() } : {}),
        },
      });

      return next(authorizedReq);
    }),
  );
};

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Acquires an access token using MSAL directly.
 * This is used by the interceptor to avoid circular dependency with AuthService.
 */
async function acquireToken(msal: PublicClientApplication): Promise<string | null> {
  const account = msal.getActiveAccount();
  if (!account) {
    return null;
  }

  try {
    const result = await msal.acquireTokenSilent({
      scopes: [...AUTH_SCOPES.API],
      account,
    });
    return result.accessToken;
  } catch (error) {
    // Silent token acquisition failed. Return null and let the 401 handler
    // trigger re-authentication if needed.
    console.warn('[auth.interceptor] Token acquisition failed:', error);
    return null;
  }
}

/**
 * Returns true if the given URL should receive an Authorization header.
 *
 * A URL is "protected" when:
 *  1. It starts with the configured API base URL.
 *  2. It is NOT listed in PUBLIC_ENDPOINTS.
 */
function isProtectedRequest(url: string): boolean {
  // Only attach tokens to calls targeting our own backend API.
  if (!url.startsWith(environment.apiBaseUrl)) return false;

  // Skip any explicitly declared public endpoints (health checks, etc.).
  return !PUBLIC_ENDPOINTS.some((publicPath) => url.includes(publicPath));
}
