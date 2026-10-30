import { BrowserCacheLocation, Configuration, LogLevel } from '@azure/msal-browser';
import { environment } from '../../../../environments/environment';
import { AUTHORITY_BASE } from './auth.constants';

// ---------------------------------------------------------------------------
// auth.config.ts — MSAL PublicClientApplication configuration factory.
//
// All MSAL configuration is derived from environment files and the constants
// in auth.constants.ts.  This function is called once in auth.bootstrap.ts.
// ---------------------------------------------------------------------------

export function createMsalConfig(): Configuration {
  return {
    auth: {
      /** Azure AD application (client) ID from the SPA app registration. */
      clientId: environment.azure.clientId,

      /**
       * Authority URL — identifies the Azure AD tenant.
       * Format: https://login.microsoftonline.com/{tenantId}
       * Use 'common' for multi-tenant, or 'organizations' for any work/school account.
       */
      authority: `${AUTHORITY_BASE}/${environment.azure.tenantId}`,

      /**
       * Where Azure AD should redirect after login/logout.
       * Must be registered in the Azure AD app registration under
       * "Authentication > Redirect URIs".
       */
      redirectUri: environment.azure.redirectUri,
      postLogoutRedirectUri: environment.azure.redirectUri,

      /**
       * After the login redirect completes, navigate back to the original
       * page rather than landing on the redirectUri root.
       */
      navigateToLoginRequestUrl: true,
    },

    cache: {
      /**
       * Use sessionStorage so tokens do not persist after the tab is closed.
       * This is the recommended setting for SPAs on shared devices.
       * Change to BrowserCacheLocation.LocalStorage only if persistent
       * cross-tab SSO is an explicit product requirement.
       */
      cacheLocation: BrowserCacheLocation.SessionStorage,

      /**
       * storeAuthStateInCookie: IE 11 / Safari ITP workaround.
       * Not needed for modern Chromium/Firefox browsers.
       */
      storeAuthStateInCookie: false,
    },

    system: {
      loggerOptions: {
        loggerCallback: msalLoggerCallback,
        /** Verbose logging is too noisy for production; limit to warnings. */
        logLevel: environment.production ? LogLevel.Error : LogLevel.Warning,
        /** Never log PII (tokens, emails, account IDs) in any environment. */
        piiLoggingEnabled: false,
      },

      /** Disable native authentication broker — not applicable to web SPAs. */
      allowNativeBroker: false,
    },
  };
}

// ---------------------------------------------------------------------------
// Internal log callback
// ---------------------------------------------------------------------------

/**
 * Routes MSAL log messages to the appropriate browser console method.
 *
 * This function must never log PII — the `containsPii` guard is the first
 * check and acts as a hard safety stop regardless of log level.
 */
function msalLoggerCallback(level: LogLevel, message: string, containsPii: boolean): void {
  // Hard stop — never log messages that contain personally identifiable info.
  if (containsPii) return;

  switch (level) {
    case LogLevel.Error:
      console.error('[MSAL]', message);
      break;
    case LogLevel.Warning:
      console.warn('[MSAL]', message);
      break;
    case LogLevel.Info:
      // Info is only useful during development.
      if (!environment.production) console.info('[MSAL]', message);
      break;
    case LogLevel.Verbose:
      // Verbose output is intentionally suppressed in all environments
      // to reduce console noise.
      break;
  }
}
