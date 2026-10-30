import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { bootstrapMsal } from './app/core/auth/bootstrap/auth.bootstrap';
import { provideMsal } from './app/core/auth/config/msal.providers';
import { provideHttpClient } from '@angular/common/http';
import { isDevMode } from '@angular/core';
import { TranslocoHttpLoader } from './transloco-loader';
import { provideTransloco, translocoConfig } from '@jsverse/transloco';

function hideStartupLoader(): void {
  document.getElementById('startup-loader')?.remove();
}

function showStartupError(): void {
  document.getElementById('startup-loader-message')?.setAttribute('hidden', '');
  document.getElementById('startup-loader-error')?.removeAttribute('hidden');
  document.getElementById('startup-loader-refresh')?.removeAttribute('hidden');
  document.getElementById('startup-loader-refresh')?.addEventListener('click', () => {
    window.location.reload();
  });
}

// ---------------------------------------------------------------------------
// main.ts — Application entry point.
//
// This file is intentionally minimal.  Its only job is to:
//  1. Run the MSAL bootstrap sequence (initialise, handle redirect, restore
//     session, or trigger interactive login if no session exists).
//  2. If an authenticated session is available, bootstrap Angular with the
//     MSAL instance registered in the DI container.
//  3. If a login redirect was triggered (bootstrapMsal returns null), do
//     nothing — Angular will bootstrap on the next page load after the
//     user authenticates and Azure AD redirects back.
//
// All MSAL initialisation logic lives in auth.bootstrap.ts.
// All Angular provider configuration lives in app.config.ts.
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  // Run the full MSAL initialisation sequence.
  // Returns the ready PublicClientApplication, or null if a loginRedirect
  // was triggered (page is about to navigate away).
  const msalInstance = await bootstrapMsal();

  // Do not bootstrap Angular while a redirect is in progress.
  if (!msalInstance) return;

  await bootstrapApplication(AppComponent, {
    ...appConfig,
    providers: [
      ...appConfig.providers,
      // Register the fully-initialised MSAL instance in the DI container.
      // AuthService, auth interceptor, and all guards inject MSAL_INSTANCE.
      provideMsal(msalInstance),
      // provideHttpClient(),
      provideTransloco({
        config: translocoConfig({
          availableLangs: ['en'],
          defaultLang: 'en',
          reRenderOnLangChange: true,
          prodMode: !isDevMode(),
        }),
        loader: TranslocoHttpLoader,
      }),
    ],
  });
  hideStartupLoader();
}

main().catch((err: unknown) => {
  console.error('[Bootstrap] Fatal error during startup:', err);
  showStartupError();
});
