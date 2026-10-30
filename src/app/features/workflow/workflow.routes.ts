import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/gaurds/auth.guard';

export const workFlowRoutes: Routes = [
  {
    path: 'reviewTasks',
    canActivate: [authGuard],
    data: { pageKey: 'REVIEWTASK', title: 'Review Tasks' },
    loadComponent: () =>
      import('./Task/containers/task-page/review-task.component').then(
        (m) => m.ReviewTasksComponent,
      ),
  },

  {
    path: 'dashboard',
    canActivate: [authGuard],
    data: { pageKey: 'DASHBOARD', title: 'Dashboard' },
    loadComponent: () =>
      import('./dashboard/container/dashboard-page/dashboard-page.component').then(
        (m) => m.DashboardPageComponent,
      ),
  },
  {
    path: 'projectLibrary',
    canActivate: [authGuard],
    data: { pageKey: 'PROJECTLIBRARY', title: 'Project Library' },
    loadComponent: () =>
      import('./project library/containers/project-library-page/project-library-page.component').then(
        (m) => m.ProjectLibraryPageComponent,
      ),
  }
];
