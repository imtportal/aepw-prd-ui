import { APP_INITIALIZER, Provider } from '@angular/core';
import { AuthService } from '../services/auth.service';

// ---------------------------------------------------------------------------
// auth.initializer.ts — Angular APP_INITIALIZER for authentication/authorization.
//
// This provider ensures that authentication and authorization are fully
// initialized BEFORE the Angular router starts navigation.
//
// Without this initializer, there is a race condition where:
//  1. Angular bootstraps and AuthService is constructed
//  2. Router starts initial navigation
//  3. Guards execute before authorization data is loaded
//  4. Navigation is denied even though the user has access
//
// By using APP_INITIALIZER:
//  1. Angular bootstraps and AuthService is constructed
//  2. APP_INITIALIZER awaits AuthService.initialize()
//  3. Authorization data is fully loaded
//  4. Router starts navigation
//  5. Guards can synchronously check authorization
//
// IMPORTANT:
//  - This function blocks application startup until complete.
//  - It only runs ONCE during application initialization.
//  - The function must return a Promise.
//  - Router navigation will not begin until the Promise resolves.
// ---------------------------------------------------------------------------

/**
 * Factory function for APP_INITIALIZER.
 *
 * Angular will:
 *  1. Instantiate AuthService (via dependency injection)
 *  2. Call this factory function, which returns a function
 *  3. Execute the returned function
 *  4. Wait for the returned Promise to resolve
 *  5. Then proceed with application startup and routing
 */
function initializeAuth(authService: AuthService): () => Promise<void> {
  return () => authService.initialize();
}

/**
 * Provides the authentication/authorization initializer.
 *
 * Usage in app.config.ts:
 *
 * ```typescript
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideAuthInitializer(),
 *     // ... other providers
 *   ],
 * };
 * ```
 */
export function provideAuthInitializer(): Provider {
  return {
    provide: APP_INITIALIZER,
    useFactory: initializeAuth,
    deps: [AuthService],
    multi: true,
  };
}
