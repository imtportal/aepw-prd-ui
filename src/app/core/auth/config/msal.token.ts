import { InjectionToken } from '@angular/core';
import { PublicClientApplication } from '@azure/msal-browser';

/**
 * Angular DI token for the fully-initialised MSAL `PublicClientApplication`.
 *
 * The instance is created and initialised in `auth.bootstrap.ts`, then
 * registered in the DI container by `provideMsal()` in `msal.providers.ts`.
 *
 * Inject this token when you need direct MSAL access.  For most use cases,
 * inject `AuthService` instead — it provides a higher-level API.
 */
export const MSAL_INSTANCE = new InjectionToken<PublicClientApplication>('MSAL_INSTANCE');
