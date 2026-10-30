import { AccountInfo } from '@azure/msal-browser';
import { AuthUser } from '../models/auth.types';
import { INTERACTION_REQUIRED_CODES } from '../config/auth.constants';

// ---------------------------------------------------------------------------
// auth.utils.ts — Pure utility functions for the authentication domain.
//
// All functions here are stateless and side-effect-free, making them easy
// to unit test in isolation.  They must never inject Angular services or
// access MSAL directly.
// ---------------------------------------------------------------------------

/**
 * Maps a raw MSAL `AccountInfo` object into a typed, application-level
 * `AuthUser` identity object.
 *
 * IMPORTANT — What this function extracts:
 *   ✓ oid           — Stable identity; used by backend to look up the user.
 *   ✓ email         — Display / contact info only.
 *   ✓ displayName   — UI display only.
 *   ✓ initials      — UI display only.
 *   ✗ roles         — NOT extracted.  Roles/permissions come from the backend via
 *                     GET /api/authorization/me and live in AuthStateService.
 *
 * SECURITY:
 *   This function NEVER constructs or modifies claim values; it only reads
 *   from the MSAL-validated AccountInfo.  Azure is trusted as the identity
 *   provider for these fields only.  Authorization (roles/permissions) is
 *   entirely the backend's responsibility.
 */
export function mapAccountToAuthUser(account: AccountInfo): AuthUser {
  // Cast the claim bag to a typed record for safe property access.
  // All claims are injected by Azure AD and validated by MSAL.
  const claims = account.idTokenClaims as Record<string, unknown> | undefined;

  // `oid` (Object ID) — the only stable, immutable identity value in Azure AD.
  // The backend uses the same `oid` from the validated Bearer token to look up
  // the application user.  Fall back to homeAccountId only as a last resort.
  const oid = (claims?.['oid'] as string | undefined) ?? account.homeAccountId;

  return {
    account,
    displayName: account.name ?? account.username,
    email: account.username,
    initials: buildInitials(account.name ?? account.username),
    oid,
    // NOTE: No `roles` field.  Application authorization is loaded from the
    // backend (GET /api/authorization/me) and stored in AuthStateService.
  };
}

/**
 * Derives two-letter initials from a display name or email address.
 *
 * Rules:
 *  - "John Doe"       → "JD"  (first letter of first and last word)
 *  - "Alice"          → "AL"  (first two letters of a single name)
 *  - "alice@corp.com" → "AL"  (treated as a single-word name)
 *  - ""               → "?"   (unknown / empty name)
 */
export function buildInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Returns true if the given MSAL error code indicates that the silent
 * token acquisition path cannot succeed and interactive login is required.
 *
 * Used in AuthService.acquireAccessToken() to decide whether to fall
 * back to acquireTokenRedirect.
 *
 * @param error — Any caught value (may not be a proper Error instance).
 */
export function isInteractionRequired(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = (error as { errorCode?: string }).errorCode ?? '';
  return INTERACTION_REQUIRED_CODES.has(code);
}

/**
 * Returns true if the error indicates a tenant mismatch — the user is
 * signed in to a different Azure AD tenant than the one configured in
 * the app registration.
 *
 * This typically means the user used a personal Microsoft account against
 * a single-tenant app, or belongs to the wrong organisation.
 */
export function isTenantMismatch(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = (error as { errorCode?: string }).errorCode ?? '';
  return code === 'tenant_mismatch';
}
