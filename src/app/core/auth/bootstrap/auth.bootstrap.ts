import { AuthenticationResult, PublicClientApplication } from '@azure/msal-browser';
import { createMsalConfig } from '../config/auth.config';
import { AUTH_SCOPES } from '../config/auth.constants';
import { isTenantMismatch } from '../utils/auth.utils';

// ---------------------------------------------------------------------------
// auth.bootstrap.ts — MSAL initialisation and session bootstrap logic.
//
// This module is responsible for the full authentication setup sequence
// that must complete BEFORE Angular is bootstrapped.  It is imported only
// by main.ts and must have zero Angular dependencies.
//
// Bootstrap sequence:
//  1.  Create PublicClientApplication with the app's MSAL config.
//  2.  Initialize internal MSAL modules (crypto, storage).
//  3.  Call handleRedirectPromise() — REQUIRED on every page load.
//      MSAL inspects the current URL for an auth code response.
//  4.  Determine active account:
//       a. Redirect result      → use the freshly authenticated account.
//       b. Cached session       → restore from sessionStorage (page refresh).
//       c. Silent SSO (iframe)  → re-authenticate without a visible redirect
//                                 (e.g. new tab, expired sessionStorage).
//  5.  If still unauthenticated → trigger loginRedirect() and return null.
//      Angular bootstrap is deferred; the user will be redirected back after
//      authenticating and this entire sequence runs again.
// ---------------------------------------------------------------------------

/**
 * Runs the full MSAL bootstrap sequence.
 *
 * @returns A fully-initialised `PublicClientApplication` with an active
 *          account set, or `null` if a login redirect was triggered and
 *          Angular bootstrap should NOT proceed yet.
 */
export async function bootstrapMsal(): Promise<PublicClientApplication | null> {
  // -------------------------------------------------------------------------
  // Step 1 — Create the PublicClientApplication.
  // -------------------------------------------------------------------------
  const msalInstance = new PublicClientApplication(createMsalConfig());

  // -------------------------------------------------------------------------
  // Step 2 — Initialise internal MSAL modules (crypto, storage adapters).
  // Must complete before any other MSAL method is called.
  // -------------------------------------------------------------------------
  await msalInstance.initialize();

  // -------------------------------------------------------------------------
  // Step 3 — Process any pending redirect response.
  //
  // handleRedirectPromise() MUST be called on every page load.
  // It inspects the URL for an `#code=` or `?error=` fragment that Azure AD
  // appended after the login/logout redirect, exchanges the auth code for
  // tokens, and clears the URL fragment.
  //
  // Returns:
  //  - AuthenticationResult  → a redirect response was just processed.
  //  - null                  → normal page load or browser refresh.
  // -------------------------------------------------------------------------
  let redirectResult: AuthenticationResult | null = null;

  try {
    redirectResult = await msalInstance.handleRedirectPromise();
  } catch (error) {
    // handleRedirectPromise can fail when:
    //  - The URL contains a stale `state` parameter (e.g. user pressed Back
    //    after a partial login).
    //  - The user clicked "Cancel" on the Microsoft login page.
    //  - A genuine network or configuration error occurred.
    //
    // IMPORTANT: Do NOT clear the entire token cache on every error here.
    // Clearing would log out the user on transient failures (e.g. network
    // blip during the redirect), degrading the user experience.
    // Instead, log the failure and attempt to restore a cached session.
    const message = error instanceof Error ? error.message : String(error);
    console.warn('[Auth] handleRedirectPromise failed:', message);

    if (isTenantMismatch(error)) {
      // Tenant mismatch is a hard failure — the user is in the wrong
      // organisation.  Log the error clearly and fall through to login.
      console.error(
        '[Auth] Tenant mismatch detected.  Ensure the user belongs to the configured tenant.',
      );
    }
    // Fall through — attempt to use any existing cached session below.
  }

  // -------------------------------------------------------------------------
  // Step 4a — Use the account from the redirect response if available.
  // -------------------------------------------------------------------------
  if (redirectResult?.account) {
    msalInstance.setActiveAccount(redirectResult.account);
    return msalInstance;
  }

  // -------------------------------------------------------------------------
  // Step 4b — Attempt to restore a cached session from sessionStorage.
  //
  // This handles the browser refresh scenario: the user was authenticated,
  // refreshed the page, and the token cache is still in sessionStorage.
  // -------------------------------------------------------------------------
  const activeAccount =
    msalInstance.getActiveAccount() ?? // Previously set active account
    msalInstance.getAllAccounts()[0] ?? // First cached account (fallback)
    null;

  if (activeAccount) {
    msalInstance.setActiveAccount(activeAccount);
    console.log(activeAccount);
    return msalInstance;
  }

  // -------------------------------------------------------------------------
  // Step 4c — Attempt silent SSO via a hidden iframe.
  //
  // ssoSilent() checks whether the user has an active Azure AD session in
  // the browser (even across tabs/windows when using sessionStorage cache).
  // This is the preferred path for opening a new tab — avoids a visible
  // login redirect if the user is already signed in to Azure AD.
  //
  // This is a best-effort enhancement; if it fails for any reason we fall
  // through to interactive login redirect.
  // -------------------------------------------------------------------------
  try {
    const silentResult = await msalInstance.ssoSilent({
      scopes: [...AUTH_SCOPES.LOGIN],
    });
    console.log('silent result:', silentResult);
    if (silentResult.account) {
      msalInstance.setActiveAccount(silentResult.account);
      return msalInstance;
    }
  } catch {
    // Silent SSO failure is expected when:
    //  - No Azure AD session exists in the browser.
    //  - Third-party cookie blocking prevents the hidden iframe.
    //  - ITP (Intelligent Tracking Prevention) in Safari.
    // All of these are normal conditions — fall through to interactive login.
  }

  // -------------------------------------------------------------------------
  // Step 5 — No session recoverable. Initiate interactive login redirect.
  //
  // loginRedirect() navigates the browser away from this page to the
  // Microsoft login page.  After the user authenticates, Azure AD redirects
  // back to redirectUri and this entire bootstrap sequence runs again —
  // this time with a redirect result in Step 4a.
  //
  // We return null to signal to main.ts that Angular should NOT be
  // bootstrapped yet (the page is about to navigate away).
  // -------------------------------------------------------------------------
  try {
    await msalInstance.loginRedirect({
      scopes: [...AUTH_SCOPES.LOGIN],
      // Do not pass `prompt: 'login'` — this forces a login screen even when
      // the user has an active session.  Omitting prompt lets Azure AD decide
      // whether a login UI is needed.
    });
  } catch (error) {
    // loginRedirect itself can fail if called during an existing interaction
    // or if the configuration is invalid. Propagate the failure so main.ts
    // can report the startup error instead of leaving the loader indefinitely.
    console.error('[Auth] loginRedirect failed:', error instanceof Error ? error.message : error);
    throw error;
  }

  // The browser is navigating away.  This return is never reached in practice
  // but satisfies the TypeScript return type.
  return null;
}
