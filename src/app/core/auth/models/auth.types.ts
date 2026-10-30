import { AccountInfo } from '@azure/msal-browser';

// ---------------------------------------------------------------------------
// auth.types.ts — Shared TypeScript types for the authentication domain.
//

export interface AuthUser {
  /** Raw MSAL account descriptor — contains the full ID token claims. */
  readonly account: AccountInfo;

  /** Human-readable display name, sourced from the `name` ID token claim. */
  readonly displayName: string;

  /** Email address / User Principal Name, sourced from `preferred_username`. */
  readonly email: string;

  /** Two-letter initials derived from display name (e.g. "John Doe" → "JD"). */
  readonly initials: string;

  /**
   * Object ID — the stable, immutable unique identity claim (`oid`) from Azure AD.
   *
   * The backend extracts this same `oid` from the validated JWT Bearer token
   * to look up the application user in the database.
   *
   * Always use `oid` when referencing the user on the backend — NOT email/UPN,
   * which can change when a user is renamed or migrated.
   */
  readonly oid: string;

  // NOTE: Application roles and permissions are intentionally NOT here.
  // They come from the backend via GET /api/authorization/me and are stored in
  // AuthStateService (auth.state.ts).  See authorization.model.ts and
  // authorization.service.ts for the authorization layer.
}

/**
 * Lifecycle phases of the authentication flow.
 *
 * - `initializing`    : MSAL is starting up / processing a redirect response.
 * - `authenticated`   : A valid session exists with a known active account.
 * - `unauthenticated` : No session — user must log in.
 * - `error`           : A fatal auth failure occurred (see authError signal).
 */
export type AuthStatus = 'initializing' | 'authenticated' | 'unauthenticated' | 'error';

/**
 * Immutable snapshot of the complete authentication state.
 * Stored inside the core auth signal in auth.state.ts.
 */
export interface AuthStateSnapshot {
  readonly status: AuthStatus;
  readonly user: AuthUser | null;
  /** Most recent authentication error message, or null if none. */
  readonly error: string | null;
}

/**
 * Result of a successful token acquisition call.
 * Returned by AuthService.getAccessToken().
 */
export interface TokenResult {
  /** Raw Bearer token string — send as `Authorization: Bearer <token>`. */
  readonly accessToken: string;
  /** Token expiry time, or null if MSAL could not determine it. */
  readonly expiresOn: Date | null;
  /** Scopes that were granted for this token. */
  readonly scopes: readonly string[];
}
