// ---------------------------------------------------------------------------
// index.ts — Public barrel export for the auth module.
//
// External code (components, features, interceptors) should import from
// this barrel rather than from individual files within core/auth/.
// This keeps internal file structure an implementation detail.
//
// IDENTITY vs AUTHORIZATION:
//   AuthService / authState signals = WHO the user is (MSAL / Azure AD)
//   AuthStateService = WHAT the user can do (backend authorization)
// ---------------------------------------------------------------------------

// Types and interfaces
export type { AuthUser, AuthStateSnapshot, AuthStatus, TokenResult } from './models/auth.types';

// Constants
export {
  AUTH_SCOPES,
  INTERACTION_REQUIRED_CODES,
  PUBLIC_ENDPOINTS,
  AUTHORITY_BASE,
} from './config/auth.constants';

// Reactive identity state signals (read via AuthService where possible)
export {
  authState,
  authStatus,
  isAuthenticated,
  isInitializing,
  currentUser,
  displayName,
  email,
  initials,
  authError,
} from './state/msal-auth.state';

// Authorization models
export type {
  LoginContext,
  UserDetails,
  PageAccess,
  // ActionPermission,
} from './models/authorization.model';

// Authorization services
export { AuthorizationService } from './services/authorization.service';
export { AuthStateService } from './state/auth.state';

// Core identity service
export { AuthService } from './services/auth.service';

// Angular DI
export { MSAL_INSTANCE } from './config/msal.token';
export { provideMsal } from './config/msal.providers';
export { provideAuthInitializer } from './config/auth.initializer';

// HTTP interceptor
export { authInterceptor } from './interceptors/auth.interceptor';

// Route guards
// export { authGuard, authGuardChild, roleGuard } from './gaurds/auth.guard';

// Bootstrap (imported only by main.ts)
export { bootstrapMsal } from './bootstrap/auth.bootstrap';
