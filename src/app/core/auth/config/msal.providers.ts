import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { PublicClientApplication } from '@azure/msal-browser';
import { MSAL_INSTANCE } from './msal.token';

// ---------------------------------------------------------------------------
// msal.providers.ts — Angular DI provider factory for the MSAL instance.
//
// Separating provider registration from bootstrap logic keeps main.ts thin
// and makes it easy to swap the MSAL instance in tests.
// ---------------------------------------------------------------------------

/**
 * Creates Angular DI `EnvironmentProviders` that register a fully-initialised
 * `PublicClientApplication` under the `MSAL_INSTANCE` injection token.
 *
 * Prerequisites:
 *  - The PCA must have been created and `initialize()` called before
 *    passing it here.  This is handled by `bootstrapMsal()` in auth.bootstrap.ts.
 *  - `handleRedirectPromise()` must have been awaited before calling this,
 *    so the MSAL internal state is consistent when Angular first reads it.
 *
 * Usage (main.ts):
 * ```ts
 * const msalInstance = await bootstrapMsal();
 * if (!msalInstance) return; // loginRedirect in progress
 *
 * bootstrapApplication(AppComponent, {
 *   ...appConfig,
 *   providers: [...appConfig.providers, provideMsal(msalInstance)],
 * });
 * ```
 */
export function provideMsal(msalInstance: PublicClientApplication): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: MSAL_INSTANCE,
      useValue: msalInstance,
    },
  ]);
}
