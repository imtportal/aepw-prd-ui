import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { AuthStateService } from '../state/auth.state';

export const authGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const authState = inject(AuthStateService);

  const router = inject(Router);


  return true

//   if (!auth.isAuthenticatedSync()) {
//     auth.login();
//     return false;
//   }

//   const pageKey = route.data['pageKey'] as string | undefined;

//   if (!pageKey) {
//     return true;
//   }

//   if (authState.hasPageAccess(pageKey)) {
//     return true;
//   }

//  alert(`[AuthGuard] Access denied for page '${pageKey}'.`);

//   return router.createUrlTree(['/']);
};
