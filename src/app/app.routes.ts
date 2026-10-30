import { Routes } from '@angular/router';
import { authGuard } from './core/auth/gaurds/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./core/layout/app-shell.component').then((m) => m.AppShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'workflow/reviewTasks',
      },
      // {
      //   path: '',
      //   pathMatch: 'full',
      //   canActivate: [authGuard],
      //   loadComponent: () =>
      //     import('./features/dashboard/containers/dashboard-page.component').then(
      //       (m) => m.DashboardPageComponent,
      //     ),
      // },
      {
        path: 'reviews',
        loadChildren: () =>
          import('./features/reviews/reviews.routes').then((m) => m.reviewsRoutes),
      },
      {
        path: 'evidence',
        canActivate: [authGuard],
        data: { pageKey: 'EVIDENCETRACKER', title: 'Evidence Tracker' },
        loadComponent: () =>
          import('./features/evidence/containers/evidence-page.component').then(
            (m) => m.EvidencePageComponent,
          ),
      },
      // {
      //   path: 'reporting',
      //   canActivate: [authGuard],
      //   data: { pageKey: 'REPORTING', title: 'Reporting Dashboard' },
      //   loadComponent: () =>
      //     import('./features/reporting/containers/reporting-page.component').then(
      //       (m) => m.ReportingPageComponent,
      //     ),
      // },
      {
        path: 'reviewer',
        canActivate: [authGuard],
        data: { pageKey: 'APPROVALQUEUE', title: 'Approval Queue' },
        loadComponent: () =>
          import('./features/reviewer/containers/reviewer-page.component').then(
            (m) => m.ReviewerPageComponent,
          ),
      },
      {
        path: 'audit',
        canActivate: [authGuard],
        data: { pageKey: 'AUDITTIMELINE', title: 'Audit Timeline' },
        loadComponent: () =>
          import('./features/audit/containers/audit-page.component').then(
            (m) => m.AuditPageComponent,
          ),
      },
      {
        path: 'ai-processing',
        canActivate: [authGuard],
        data: { pageKey: 'AIPROCESSING', title: 'AI Evidence Processing' },
        loadComponent: () =>
          import('./features/ai-processing/containers/ai-processing-page.component').then(
            (m) => m.AIProcessingPageComponent,
          ),
      },
      {
        path: 'admin',
        loadChildren: () => import('./features/admin/admin.routes').then((m) => m.adminRoutes),
      },
      {
        path: 'workflow',
        loadChildren: () =>
          import('./features/workflow/workflow.routes').then((m) => m.workFlowRoutes),
      },
      {
        path: 'reporting',
        loadChildren: () =>
          import('./features/reporting/reporting.routes').then((m) => m.reportingRoutes),
      },
    ],
  },
  { path: '**', redirectTo: 'workflow/reviewTasks' },
];
