import { Injectable, OnDestroy, computed, inject } from '@angular/core';
import {
  AccountInfo,
  AuthenticationResult,
  EventMessage,
  EventType,
  PublicClientApplication,
} from '@azure/msal-browser';

import { firstValueFrom, from, mergeMap, of } from 'rxjs';
import { MSAL_INSTANCE } from '../config/msal.token';
import { AUTH_SCOPES } from '../config/auth.constants';
import { isInteractionRequired, mapAccountToAuthUser } from '../utils/auth.utils';
import {
  authError,
  authState,
  authStatus,
  currentUser,
  displayName,
  email,
  initials,
  isAuthenticated,
  isInitializing,
  setAuthError,
  setAuthUser,
  setUnauthenticated,
} from '../state/msal-auth.state';
import { TokenResult } from '../models/auth.types';
import { AuthorizationService } from './authorization.service';
import { AuthStateService } from '../state/auth.state';
import { HttpClient, HttpHeaders } from '@angular/common/http';


// ---------------------------------------------------------------------------
export class MissingAzureAdObjectIdError extends Error {
  constructor() {
    super('Authenticated account is missing Azure AD Object ID.');
    this.name = 'MissingAzureAdObjectIdError';
  }
}
@Injectable({ providedIn: 'root' })
export class AuthService implements OnDestroy {
  private readonly msal = inject<PublicClientApplication>(MSAL_INSTANCE);
  private readonly authorizationService = inject(AuthorizationService);
  private readonly authStateService = inject(AuthStateService);
  private readonly http = inject(HttpClient);
  /** Full MSAL auth state snapshot. */
  readonly state = authState;
  /** Current authentication lifecycle status. */
  readonly status = authStatus;
  /** True once the user has a valid, active MSAL session. */
  readonly isAuthenticated = isAuthenticated;
  /** True while MSAL is initialising or handling a redirect response. */
  readonly isInitializing = isInitializing;
  /**
   * The authenticated user's MSAL identity.
   * Contains oid, email, displayName, initials — NO roles or permissions.
   */
  readonly currentUser = currentUser;

  /** Display name from the `name` ID token claim. */
  readonly displayName = displayName;

  /** Email / User Principal Name from the ID token. */
  readonly email = email;

  /** Two-letter initials derived from display name. */
  readonly initials = initials;

  /** Last MSAL authentication error, or null. */
  readonly error = authError;
  // adding new
  private initializationInProgress = false;
  private authorizationInitializationError: unknown = null;

  isAuthorizationInitializationInProgress(): boolean {
    return this.initializationInProgress;
  }

  getAuthorizationInitializationError(): unknown {
    return this.authorizationInitializationError;
  }

  /**
   * Stable user identity from the `oid` claim.
   * The backend uses the same `oid` to look up the database user.
   * Use this — never email/UPN — when referencing the user in API calls.
   */
  readonly oid = computed(() => this.currentUser()?.oid ?? null);

  // MSAL event callback handle — stored to allow removal on service destroy.
  private readonly msalEventCallbackId: string;

  constructor() {
    // 4. APP_INITIALIZER calls AuthService.initialize().
    // 5. initialize() synchronizes MSAL account state and loads authorization.
    this.msalEventCallbackId =
      this.msal.addEventCallback((event: EventMessage) => this.handleMsalEvent(event)) ?? '';
  }

  /**
   * Initialize authentication and authorization.
   * This MUST be called during application startup via APP_INITIALIZER.
   *
   * Synchronizes MSAL account state and loads authorization context.
   * Blocks application startup until authorization is fully loaded.
   */
  async initialize(): Promise<void> {
    this.initializationInProgress = true;

    try {
      await this.syncAccountFromMsal();
    } catch (error) {
      if (error instanceof MissingAzureAdObjectIdError) {
        throw error;
      }

      // Preserve the failure so the route guard can classify it.
      this.authorizationInitializationError = error;

      console.error('[AUTH] Authorization initialization failed:', error);
    } finally {
      this.initializationInProgress = false;
    }
  }

  ngOnDestroy(): void {
    if (this.msalEventCallbackId) {
      this.msal.removeEventCallback(this.msalEventCallbackId);
    }
  }

  // -------------------------------------------------------------------------
  // Authentication flows
  // -------------------------------------------------------------------------

  /** Initiates an interactive login redirect to the Microsoft login page. */
  async login(): Promise<void> {
    await this.msal.loginRedirect({ scopes: [...AUTH_SCOPES.LOGIN] });
  }

  /**
   * Logs the user out via a redirect to the Microsoft logout endpoint.
   * Clears both the MSAL token cache and the backend authorization state.
   */
  async logout(): Promise<void> {
    const account = this.msal.getActiveAccount();
    setUnauthenticated();
    this.authStateService.clear();

    await this.msal.logoutRedirect({
      account: account ?? undefined,
      postLogoutRedirectUri: window.location.origin,
    });
  }

  // -------------------------------------------------------------------------
  // Token acquisition
  // -------------------------------------------------------------------------

  /**
   * Acquires a Bearer access token for the backend API.
   */
  async acquireAccessToken(scopes?: readonly string[]): Promise<string | null> {
    const account = this.msal.getActiveAccount();
    if (!account) {
      // console.warn('[Auth] acquireAccessToken: no active account.');
      return null;
    }

    const requestScopes = scopes ? [...scopes] : [...AUTH_SCOPES.API];

    try {
      const result = await this.msal.acquireTokenSilent({ scopes: requestScopes, account });
      return result.accessToken;
    } catch (error) {
      if (isInteractionRequired(error)) {
        // console.warn(
        // '[Auth] Silent token acquisition failed (interaction_required). ' +
        // 'The request will proceed without a token; a 401 will trigger re-login.',
        // );
        return null;
      }
      // console.error('[Auth] Token acquisition failed:', error);
      return null;
    }
  }

  /**
   * Silent-only token acquisition — does NOT trigger a redirect on failure.
   * Use `acquireAccessToken()` when a guaranteed token is needed.
   */
  async getAccessToken(scopes?: readonly string[]): Promise<TokenResult | null> {
    const account = this.msal.getActiveAccount();
    if (!account) return null;

    try {
      const result = await this.msal.acquireTokenSilent({
        scopes: scopes ? [...scopes] : [...AUTH_SCOPES.API],
        account,
      });
      return {
        accessToken: result.accessToken,
        expiresOn: result.expiresOn,
        scopes: result.scopes,
      };
    } catch {
      return null;
    }
  }

  // -------------------------------------------------------------------------
  // Account helpers
  // -------------------------------------------------------------------------

  /** Returns the active MSAL AccountInfo, or null. */
  getActiveAccount(): AccountInfo | null {
    return this.msal.getActiveAccount();
  }

  /** Synchronous snapshot of authenticated state (for use in guards). */
  isAuthenticatedSync(): boolean {
    return this.isAuthenticated();
  }

  // -------------------------------------------------------------------------
  // Backend authorization
  // -------------------------------------------------------------------------
  /**
   * Reloads the current logged-in user's authorization context from the backend.
   * Call this only when the current user's own permissions may have changed.
   */
  public async refreshAuthorization(): Promise<void> {
    // console.log('[Auth] Refreshing authorization context');

    const response = await firstValueFrom(this.authorizationService.getLoginContext());

    if (!response.success || !response.data) {
      throw new Error(response.message ?? 'Failed to refresh authorization.');
    }

    this.authStateService.initialize(response.data);
  }

  /**
   * Loads authorization context from the backend and initializes AuthStateService.
   * First attempts to restore from sessionStorage; if not found, calls the API.
   */
  async loadAuthorization(oid: string): Promise<void> {
    this.authorizationInitializationError = null;

    const restored = this.authStateService.restore(oid);

    if (restored) {
      return;
    }

    try {
      await this.refreshAuthorization();

      this.authorizationInitializationError = null;
    } catch (error) {
      this.authorizationInitializationError = error;
      throw error;
    }
  }

  // -------------------------------------------------------------------------
  // Private: MSAL event handling and state synchronization
  // -------------------------------------------------------------------------

  /**
   * Reads the active MSAL account and updates the identity state.
   * When a valid account is found, also loads authorization context.
   */
  private async syncAccountFromMsal(): Promise<void> {
    const account = this.msal.getActiveAccount() ?? this.msal.getAllAccounts()[0] ?? null;

    if (account) {
      setAuthUser(mapAccountToAuthUser(account));
      // Load backend authorization context (first tries sessionStorage, then API).
      const oid = account.idTokenClaims?.['oid'];

      if (typeof oid !== 'string' || !oid) {
        this.authStateService.clear();
        throw new MissingAzureAdObjectIdError();
      }

      await this.loadAuthorization(oid);
    } else {
      setUnauthenticated();
      this.authStateService.clear();
    }
  }

  getProfilePhoto() {
    const account = this.msal.getActiveAccount();
    if (!account) {
      // console.warn('[Auth] getProfilePhoto: no active account.');
      return of(null);
    }
    return from(this.acquireAccessToken(['User.Read'])).pipe(
      mergeMap((accessToken) => {
        if (!accessToken) {
          // console.warn('[Auth] getProfilePhoto: no access token available.');
          return of(null);
        }

        const headers = new HttpHeaders({
          Authorization: `Bearer ${accessToken}`,
        });

        return this.http.get('https://graph.microsoft.com/v1.0/me/photo/$value', {
          headers,
          responseType: 'blob',
        });
      }),
    );
  }

  private handleMsalEvent(event: EventMessage): void {
    switch (event.eventType) {
      case EventType.LOGIN_SUCCESS:
      case EventType.SSO_SILENT_SUCCESS: {
        const payload = event.payload as AuthenticationResult | null;

        if (payload?.account) {
          this.msal.setActiveAccount(payload.account);
          setAuthUser(mapAccountToAuthUser(payload.account));

          const oid = payload.account.idTokenClaims?.['oid'];

          if (typeof oid !== 'string' || !oid) {
            this.authStateService.clear();
            setAuthError('Authenticated account is missing Azure AD Object ID.');
            return;
          }

          this.loadAuthorization(oid).catch((err) => {
            console.error('[Auth] Authorization load failed:', err);
          });
        }

        break;
      }

      case EventType.ACQUIRE_TOKEN_SUCCESS: {
        // Token was silently renewed.  Update identity state in case
        // the account object changed, but do NOT reload authorization.
        const payload = event.payload as AuthenticationResult | null;
        if (payload?.account) {
          this.msal.setActiveAccount(payload.account);
          setAuthUser(mapAccountToAuthUser(payload.account));
        }
        break;
      }

      case EventType.LOGOUT_SUCCESS:
      case EventType.ACCOUNT_REMOVED: {
        setUnauthenticated();
        this.authStateService.clear();
        break;
      }

      case EventType.LOGIN_FAILURE: {
        const message = event.error?.message ?? 'Authentication failed.';
        // console.error('[Auth] Login failure:', message);
        setAuthError(message);
        this.authStateService.clear();
        break;
      }

      default:
        break;
    }
  }
}
