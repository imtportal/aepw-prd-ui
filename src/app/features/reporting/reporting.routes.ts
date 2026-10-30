import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/gaurds/auth.guard';

export const reportingRoutes: Routes = [
  {
    path: 'reports',
    canActivate: [authGuard],
    data: { pageKey: 'REPORTING', title: 'Reports' },
    loadComponent: () =>
      import('./containers/reporting-page.component').then(
        (m) => m.ReportingPageComponent,
      ),
  },
];
