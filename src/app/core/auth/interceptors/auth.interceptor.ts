import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PUBLIC_ENDPOINTS } from '../config/auth.constants';
import {
  AuthenticationRequiredError,
  AuthRecoveryService,
} from '../services/auth-recovery.service';
import { AuthStateService } from '../state/auth.state';

// ---------------------------------------------------------------------------
// auth.interceptor.ts — Centralized HTTP interceptor for Bearer token attachment.
//
// This interceptor acquires an access token through AuthRecoveryService and attaches it as
// an `Authorization: Bearer` header to all outbound requests destined for
// the protected backend API.
//
// Design principles:
//  - Single responsibility: attaches the token; nothing else.
//  - A protected request is NEVER sent without a valid access token. If no token can be
//    acquired, the request fails with AuthenticationRequiredError (and, when MSAL requires it,
//    AuthRecoveryService has started the login/token redirect).
//  - Requests are not replayed after a redirect.
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
 *  3. Acquire an access token via AuthRecoveryService (silent first, interactive recovery if required).
 *  4. Clone the request with the Authorization header attached.
 *  5. Forward the augmented request to the next handler.
 *
 * Backend 401 responses are handled by error.interceptor.ts.
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

  const recovery = inject(AuthRecoveryService);
  const authState = inject(AuthStateService);
  const userId = authState.getCurrentUserId();

  // No catchError here: a failed token acquisition must stop the request, not let it
  // reach the backend without a token.
  return from(recovery.acquireAccessToken()).pipe(
    switchMap((result) => {
      if (result.status !== 'success') {
        return throwError(() => new AuthenticationRequiredError(result));
      }

      // Attach the Bearer token.
      // req.clone() is mandatory — HttpRequest objects are immutable.
      const authorizedReq = req.clone({
        setHeaders: {
          // Standard OAuth 2.0 Bearer token header.
          // The backend validates this using AddMicrosoftIdentityWebApi.
          // for test shows:
          // Authorization: `Bearer invalid-test-token`,
          Authorization: `Bearer ${result.accessToken}`,
          ...(userId ? { 'X-User-Id': userId.toString() } : {}),
        },
      });

      return next(authorizedReq);
    }),
  );
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns true if the given URL should receive an Authorization header.
 *
 * A URL is "protected" when:
 *  1. It starts with the configured API base URL.
 *  2. It is NOT listed in PUBLIC_ENDPOINTS.
 */
export function isProtectedRequest(url: string): boolean {
  // Only attach tokens to calls targeting our own backend API.
  if (!url.startsWith(environment.apiBaseUrl)) return false;

  // Skip any explicitly declared public endpoints (health checks, etc.).
  return !PUBLIC_ENDPOINTS.some((publicPath) => url.includes(publicPath));
}
