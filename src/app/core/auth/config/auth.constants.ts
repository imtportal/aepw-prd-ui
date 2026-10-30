import { environment } from '../../../../environments/environment';

// ---------------------------------------------------------------------------
// auth.constants.ts — Centralised OAuth 2.0 / OIDC constants.
//
// All scope strings, authority URLs, error codes, and protected endpoint
// configuration live here.  Nothing auth-related is hard-coded elsewhere.
// ---------------------------------------------------------------------------

/**
 * All OAuth 2.0 / OpenID Connect scopes used by this application.
 *
 * Scope strategy:
 *  - OIDC scopes go into every loginRedirect request.
 *  - GRAPH scopes are used for Microsoft Graph calls (e.g. reading profile).
 *  - API scopes are acquired separately, just before calling the backend.
 *    Requesting API scopes during login can cause consent dialogs on first use.
 *
 * Keep these aligned with the "Expose an API" and "API Permissions"
 * configuration in the Azure AD app registration.
 */
export const AUTH_SCOPES = {
  /** OpenID Connect core scopes — always requested at login. */
  OIDC: ['openid', 'profile', 'email'] as const,

  /** Microsoft Graph scope — reads the signed-in user's basic profile. */
  GRAPH: ['User.Read'] as const,

  /**
   * Backend API access scope.
   * Maps to the scope defined under "Expose an API" in the Azure AD
   * app registration for the backend (not this SPA's registration).
   *
   * Token acquired with this scope is sent as Bearer token to ASP.NET Core.
   * The backend validates it via AddMicrosoftIdentityWebApi.
   */
  API: [`api://${environment.azure.clientId}/access_as_user`] as const,

  /**
   * Combined scopes for the initial loginRedirect request.
   * Intentionally excludes API scopes — those are acquired on demand
   * to avoid unnecessary consent dialogs during first login.
   */
  LOGIN: ['openid', 'profile', 'email', 'User.Read'] as const,
} as const;

/** Base URL of the Microsoft identity platform authority. */
export const AUTHORITY_BASE = 'https://login.microsoftonline.com' as const;

/**
 * MSAL error codes that indicate interactive user action is required
 * before a token can be acquired silently.
 *
 * When acquireTokenSilent throws one of these codes, the correct response
 * is to call acquireTokenRedirect (or acquireTokenPopup) to re-authenticate.
 *
 * See: https://learn.microsoft.com/en-us/azure/active-directory/develop/msal-error-handling-js
 */
export const INTERACTION_REQUIRED_CODES = new Set([
  'interaction_required', // Generic — user must interact
  'login_required', // Session expired or user not signed in
  'consent_required', // New permission requires user consent
  'bad_token', // Cached token is corrupt or unreadable
  'token_expired', // Token has passed its expiry time
  'no_account_in_silent_request', // No matching account in the cache
]) as ReadonlySet<string>;

/**
 * URL path segments for endpoints that are publicly accessible and must
 * NOT receive an Authorization header from the auth interceptor.
 *
 * Add health-check endpoints, public asset URLs, or unauthenticated API
 * endpoints here.
 *
 * @example
 *   '/api/public/health'
 *   '/api/status'
 */
export const PUBLIC_ENDPOINTS: readonly string[] = [
  // No public endpoints configured by default.
  // Add paths here as strings, e.g.: '/api/public/ping'
];
