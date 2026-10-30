import { Routes } from '@angular/router';

import { authGuard } from '../../core/auth/gaurds/auth.guard';
import { unsavedChangesGuard } from '../../core/guards/unsaved-changes.guard';

export const reviewsRoutes: Routes = [
  {
    path: 'create',
    canActivate: [authGuard],
    canDeactivate: [unsavedChangesGuard],
    data: { pageKey: 'CREATEREVIEW', title: 'Create Review' },
    loadComponent: () =>
      import('./create/containers/create-review-page.component').then(
        (m) => m.CreateReviewPageComponent,
      ),
  },
  // {
  //   path: 'review-stage-management',
  //   // canActivate: [authGuard],
  //   data: { pageKey: 'REVIEWPERIODMANAGEMENT' },
  //   loadComponent: () =>
  //     import('./review-stage-management/review-stage-management.component').then(
  //       (m) => m.ReviewStageManagement,
  //     ),
  // },
  {
    path: 'bulk-launch',
    canActivate: [authGuard],
    canDeactivate: [unsavedChangesGuard],
    data: { pageKey: 'BULKLAUNCH', title: 'Bulk Launch Reviews' },
    loadComponent: () =>
      import('./bulk-launch/containers/bulk-launch-page.component').then(
        (m) => m.BulkLaunchPageComponent,
      ),
  },
  {
    path: 'metric-config/:id',
    canActivate: [authGuard],
    canDeactivate: [unsavedChangesGuard],
    loadComponent: () =>
      import('./detail/components/metric-config/containers/review-metric-config-page.component').then(
        (m) => m.ReviewMetricConfigPageComponent,
      ),
  },
  {
    path: 'evidence-review',
    canActivate: [authGuard],
    canDeactivate: [unsavedChangesGuard],
    data: { pageKey: 'CREATEREVIEW', title: 'Review Details' },
    loadComponent: () =>
      import('./evidence-review/containers/evidence-review-page.component').then(
        (m) => m.EvidenceReviewComponent,
      ),
  },
  {
    path: ':id/:stageId',
    canActivate: [authGuard],
    data: { pageKey: 'CREATEREVIEW', title: 'Review Details' },
    loadComponent: () =>
      import('./detail/containers/review-detail-page.component').then(
        (m) => m.ReviewDetailPageComponent,
      ),
  },
];
