import { signal, computed } from '@angular/core';
import { AuthUser, AuthStateSnapshot, AuthStatus } from '../models/auth.types';

// ---------------------------------------------------------------------------
// msal-auth.state.ts — Module-level reactive store for MSAL authentication identity.
//
// This store contains ONLY MSAL-based identity information (who the user is).
// For authorization (what the user can do), see auth.state.ts (AuthStateService).
//
// Write access: AuthService only (via setter functions below).
// Read access:  Exported signals are public; AuthService re-exports them.
// ---------------------------------------------------------------------------

/**
 * Internal mutable signal — written only through the setter functions below.
 */
const _authState = signal<AuthStateSnapshot>({
  status: 'initializing',
  user: null,
  error: null,
});

// ---------------------------------------------------------------------------
// Public read-only signals
// ---------------------------------------------------------------------------

/** Full authentication state snapshot as a readonly signal. */
export const authState = _authState.asReadonly();

/** Current authentication lifecycle status. */
export const authStatus = computed<AuthStatus>(() => _authState().status);

/** True once the user has a valid, active MSAL session. */
export const isAuthenticated = computed(() => _authState().status === 'authenticated');

/** True while MSAL is initialising or handling a redirect response. */
export const isInitializing = computed(() => _authState().status === 'initializing');

/**
 * The authenticated user's MSAL identity.
 * Contains oid, email, displayName, initials — NO roles or permissions.
 */
export const currentUser = computed<AuthUser | null>(() => _authState().user);

/** Display name from the `name` ID token claim. */
export const displayName = computed(() => _authState().user?.displayName ?? '');

/** Email / User Principal Name from the ID token. */
export const email = computed(() => _authState().user?.email ?? '');

/** Two-letter initials derived from display name. */
export const initials = computed(() => _authState().user?.initials ?? '');

/** Last MSAL authentication error, or null. */
export const authError = computed<string | null>(() => _authState().error);

// ---------------------------------------------------------------------------
// State mutation setters — called ONLY from AuthService
// ---------------------------------------------------------------------------

/**
 * Sets the authenticated user after successful MSAL login.
 */
export function setAuthUser(user: AuthUser): void {
  _authState.set({
    status: 'authenticated',
    user,
    error: null,
  });
}

/**
 * Clears the authentication state (e.g., on logout or session expiry).
 */
export function setUnauthenticated(): void {
  _authState.set({
    status: 'unauthenticated',
    user: null,
    error: null,
  });
}

/**
 * Sets the authentication state into error state after a fatal auth failure.
 */
export function setAuthError(error: string): void {
  _authState.update((s) => ({
    ...s,
    status: 'error',
    error,
  }));
}
