import { Injectable, inject } from '@angular/core';
import {
  AccountInfo,
  BrowserAuthErrorCodes,
  InteractionRequiredAuthError,
  PublicClientApplication,
} from '@azure/msal-browser';

import { AUTH_SCOPES } from '../config/auth.constants';
import { MSAL_INSTANCE } from '../config/msal.token';
import { isInteractionRequired } from '../utils/auth.utils';
import {
  CacheLookupPolicy,
  // existing imports
} from '@azure/msal-browser';
// ---------------------------------------------------------------------------
// auth-recovery.service.ts — Centralised access-token acquisition and interactive recovery.
//
// Depends directly on MSAL_INSTANCE only (no AuthService, AuthorizationService, HttpClient or
// Router), so interceptors and guards can use it without circular dependencies.
//
// Flow:
//  1. acquireTokenSilent() — never serialised; MSAL de-duplicates identical requests itself.
//  2. No active account            → loginRedirect().
//  3. InteractionRequiredAuthError → acquireTokenRedirect().
//  4. Transient network failure    → reported as 'unavailable'; no redirect.
//
// Only the interactive redirect is single-flight, and it is rate limited by a 60 second cooldown
// persisted in sessionStorage, so a backend that keeps rejecting fresh tokens cannot cause a loop.
// Popup authentication is intentionally not used.
// ---------------------------------------------------------------------------

export const RELOGIN_ATTEMPT_KEY = 'authGuard.reloginAttemptAt';
// Stops a redirect loop if the backend keeps returning 401 right after a fresh login.
export const RELOGIN_COOLDOWN_MS = 60_000;

/** BrowserAuthError / ClientAuthError / ServerError codes that mean the identity service was unreachable. */
const TRANSIENT_ERROR_CODES: ReadonlySet<string> = new Set([
  BrowserAuthErrorCodes.noNetworkConnectivity,
  BrowserAuthErrorCodes.postRequestFailed,
  BrowserAuthErrorCodes.getRequestFailed,
  'network_error',
  'endpoints_resolution_error',
  'temporarily_unavailable',
  'server_unavailable',
]);

/** Silent iframe renewal could not finish (blocked cookies / expired Azure session): needs interaction. */
const SILENT_RENEWAL_BLOCKED_CODES: ReadonlySet<string> = new Set([
  BrowserAuthErrorCodes.monitorWindowTimeout,
  BrowserAuthErrorCodes.iframeClosedPrematurely,
]);

export type AuthRecoveryResult =
  /** A usable access token was acquired. */
  | { status: 'success'; accessToken: string }
  /** A login/token redirect is starting or already pending; the page is about to navigate away. */
  | { status: 'redirecting' }
  /** A redirect was attempted less than RELOGIN_COOLDOWN_MS ago; suppressed to avoid a loop. */
  | { status: 'cooldown' }
  /** Transient network/service failure while talking to the identity provider. */
  | { status: 'unavailable'; error: unknown }
  /** Non-recoverable failure (unexpected MSAL error or the redirect could not be started). */
  | { status: 'failed'; error: unknown };

/** Thrown instead of sending a protected request that has no valid access token. */
export class AuthenticationRequiredError extends Error {
  constructor(readonly result: Exclude<AuthRecoveryResult, { status: 'success' }>) {
    super(`Access token unavailable (${result.status}).`);
    this.name = 'AuthenticationRequiredError';
  }
}

@Injectable({ providedIn: 'root' })
export class AuthRecoveryService {
  private readonly msal = inject<PublicClientApplication>(MSAL_INSTANCE);

  private redirectInFlight: Promise<AuthRecoveryResult> | null = null;

  /** True while an interactive redirect is starting or pending. */
  isRedirectInProgress(): boolean {
    return this.redirectInFlight !== null;
  }

  /**
   * Silently acquires an API access token, starting interactive recovery when MSAL requires it.
   *
   * @param returnUrl Where the user should land after re-authenticating; defaults to the current URL.
   */
  async acquireAccessToken(returnUrl?: string): Promise<AuthRecoveryResult> {
    return this.acquire(returnUrl, false);
  }

  /**
   * Recovery after the backend answered 401 to a request that carried a token. Forces a token
   * refresh first (the cached token may be rejected despite looking valid locally) and falls back to
   * interactive recovery. The failed request is never replayed.
   */
  async recoverFromUnauthorized(returnUrl?: string): Promise<AuthRecoveryResult> {
    return this.acquire(returnUrl, true);
  }

  /** Clears the re-login cooldown once the backend has accepted a token. */
  reset(): void {
    try {
      const hadCooldown = sessionStorage.getItem(RELOGIN_ATTEMPT_KEY) !== null;

      sessionStorage.removeItem(RELOGIN_ATTEMPT_KEY);
      console.log('[AUTH RECOVERY] Cooldown reset');
      if (hadCooldown) {
        console.log('[AUTH RECOVERY] Redirect cooldown cleared');
      }
    } catch {
      // Storage unavailable: nothing to reset.
    }
  }

  private async acquire(
    returnUrl: string | undefined,
    forceRefresh: boolean,
  ): Promise<AuthRecoveryResult> {
    console.log('[AUTH RECOVERY] Started');
    console.log('[AUTH RECOVERY] Force refresh:', forceRefresh);
    if (this.redirectInFlight) {
      console.log('[AUTH RECOVERY] Redirect already in progress');
      return { status: 'redirecting' };
    }

    const account = this.msal.getActiveAccount();
    console.log('[AUTH RECOVERY] Active account exists:', !!account);
    if (!account) {
      console.log('[AUTH RECOVERY] No account. Starting login redirect');
      return this.startRedirect(null, returnUrl);
    }

    try {
      // console.log('[AUTH RECOVERY] Attempting acquireTokenSilent');

      const result = await this.msal.acquireTokenSilent({
        scopes: [...AUTH_SCOPES.API],
        account,
        // changing policy to test silent token refresh
        // cacheLookupPolicy: CacheLookupPolicy.RefreshTokenAndNetwork,
        // cacheLookupPolicy: CacheLookupPolicy.Skip,
        forceRefresh,
      });
      console.log('[AUTH RECOVERY] Silent token acquisition succeeded:', {
        hasAccessToken: !!result.accessToken,
        expiresOn: result.expiresOn,
      });

      return result.accessToken
        ? { status: 'success', accessToken: result.accessToken }
        : { status: 'failed', error: new Error('MSAL returned an empty access token.') };
    } catch (error) {
      console.error('[AUTH RECOVERY] Silent token acquisition failed:', error);
      return this.handleSilentFailure(error, account, returnUrl);
    }
  }

  private handleSilentFailure(
    error: unknown,
    account: AccountInfo,
    returnUrl: string | undefined,
  ): Promise<AuthRecoveryResult> | AuthRecoveryResult {
    const code = (error as { errorCode?: string } | null)?.errorCode ?? '';

    console.log('[AUTH RECOVERY] Handling silent failure:', {
      errorCode: code,
      errorName: error instanceof Error ? error.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : String(error),
      isInteractionRequired: error instanceof InteractionRequiredAuthError,
      isSilentRenewalBlocked: SILENT_RENEWAL_BLOCKED_CODES.has(code),
      isTransient: TRANSIENT_ERROR_CODES.has(code),
    });

    if (code === BrowserAuthErrorCodes.interactionInProgress) {
      console.log('[AUTH RECOVERY] Interaction already in progress');

      return { status: 'redirecting' };
    }

    if (
      error instanceof InteractionRequiredAuthError ||
      isInteractionRequired(error) ||
      SILENT_RENEWAL_BLOCKED_CODES.has(code)
    ) {
      console.log('[AUTH RECOVERY] Interaction required. Starting redirect');

      return this.startRedirect(account, returnUrl);
    }

    if (TRANSIENT_ERROR_CODES.has(code)) {
      console.warn('[AUTH RECOVERY] Transient error. Not redirecting');

      return { status: 'unavailable', error };
    }

    console.error('[AUTH RECOVERY] Unhandled silent authentication failure');

    return { status: 'failed', error };
  }

  /** Single-flight: concurrent callers share one redirect; the cooldown limits repeated attempts. */
  private startRedirect(
    account: AccountInfo | null,
    returnUrl: string | undefined,
  ): Promise<AuthRecoveryResult> {
    if (this.redirectInFlight) {
      return this.redirectInFlight;
    }

    if (this.isCooldownActive()) {
      console.warn('[AUTH RECOVERY] Redirect suppressed by cooldown');
      return Promise.resolve({ status: 'cooldown' });
    }

    this.markRedirectAttempt();
    console.log('[AUTH RECOVERY] Redirect cooldown started');
    const redirect = this.runRedirect(account, this.resolveReturnUrl(returnUrl)).finally(() => {
      // Only reached if the browser did not navigate away (failure or MSAL navigation timeout).
      if (this.redirectInFlight === redirect) {
        this.redirectInFlight = null;
      }
    });

    this.redirectInFlight = redirect;
    return redirect;
  }

  private async runRedirect(
    account: AccountInfo | null,
    redirectStartPage: string,
  ): Promise<AuthRecoveryResult> {
    try {
      if (account) {
        await this.msal.acquireTokenRedirect({
          scopes: [...AUTH_SCOPES.API],
          account,
          redirectStartPage,
        });
      } else {
        await this.msal.loginRedirect({
          scopes: [...AUTH_SCOPES.LOGIN],
          redirectStartPage,
        });
      }

      return { status: 'redirecting' };
    } catch (error) {
      // Another interaction owns the redirect; it must not consume the cooldown.
      const interactionInProgress =
        (error as { errorCode?: string } | null)?.errorCode ===
        BrowserAuthErrorCodes.interactionInProgress;

      this.reset();
      return interactionInProgress ? { status: 'redirecting' } : { status: 'failed', error };
    }
  }

  private isCooldownActive(): boolean {
    try {
      const lastAttempt = Number(sessionStorage.getItem(RELOGIN_ATTEMPT_KEY) ?? 0);

      const active = Date.now() - lastAttempt < RELOGIN_COOLDOWN_MS;

      console.log('[AUTH RECOVERY] Cooldown active:', active);

      return active;
    } catch {
      return false;
    }
  }

  private markRedirectAttempt(): void {
    try {
      sessionStorage.setItem(RELOGIN_ATTEMPT_KEY, String(Date.now()));
    } catch {
      // Storage unavailable: the in-memory single-flight still applies.
    }
  }

  /** Same-origin absolute URL for redirectStartPage; anything else falls back to the current page. */
  private resolveReturnUrl(url: string | undefined): string {
    try {
      const resolved = new URL(url ?? window.location.href, window.location.origin);
      return resolved.origin === window.location.origin ? resolved.href : window.location.href;
    } catch {
      return window.location.href;
    }
  }
}
