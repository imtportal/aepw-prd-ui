import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/gaurds/auth.guard';
import { unsavedChangesGuard } from '../../core/guards/unsaved-changes.guard';

export const adminRoutes: Routes = [
  {
    path: 'projects',
    canActivate: [authGuard],
    data: { pageKey: 'PROJECTMASTER', title: 'Project Master' },
    loadComponent: () =>
      import('./projects/containers/projects-page/project-page.component').then(
        (m) => m.ProjectsPageComponent,
      ),
  },
  {
    path: 'projects-new',
    canActivate: [authGuard],
    canDeactivate: [unsavedChangesGuard],
    data: { pageKey: 'PROJECTMASTER', title: 'Project Master' },
    loadComponent: () =>
      import('./projects/containers/project-form-page/project-form-page.component').then(
        (m) => m.impactFormPage,
      ),
  },
  {
    path: 'projects-new/:impactMasterId',
    canActivate: [authGuard],
    canDeactivate: [unsavedChangesGuard],
    data: { pageKey: 'PROJECTMASTER', title: 'Project Master' },
    loadComponent: () =>
      import('./projects/containers/project-form-page/project-form-page.component').then(
        (m) => m.impactFormPage,
      ),
  },
  {
    path: 'projects-info',
    canActivate: [authGuard],
    canDeactivate: [unsavedChangesGuard],
    data: { pageKey: 'PROJECTINFO', title: 'Project Library' },
    loadComponent: () =>
      import('./projects/containers/project-information/project-information.component').then(
        (m) => m.ProjectInformationComponent,
      ),
  },
  {
    path: 'projects-info/:impactMasterId',
    canActivate: [authGuard],
    canDeactivate: [unsavedChangesGuard],
    data: { pageKey: 'PROJECTINFO', title: 'Project Library' },
    loadComponent: () =>
      import('./projects/containers/project-information/project-information.component').then(
        (m) => m.ProjectInformationComponent,
      ),
  },
  {
    path: 'metrics',
    canActivate: [authGuard],
    canDeactivate: [unsavedChangesGuard],
    data: { pageKey: 'METRICCONFIG', title: 'Metric Configuration' },
    loadComponent: () =>
      import('./metrics/containers/metrics-page2.component').then((m) => m.MetricsPageComponent),
  },
  {
    path: 'users',
    canActivate: [authGuard],

    data: { pageKey: 'USERMANAGEMENT', title: 'User Management' },
    loadComponent: () =>
      import('./users/containers/users-page.component').then((m) => m.UsersPageComponent),
  },
  // {
  //   path: 'business-roles',
  //   canActivate: [authGuard],
  //   data: { pageKey: 'BUSINESSROLEMANAGEMENT', title: 'Business Roles' },
  //   loadComponent: () =>
  //     import('./business role mapping/containers/business-role-page.component').then(
  //       (m) => m.UsersPageComponent,
  //     ),
  // },
  {
    path: 'funding-recipients',
    data: { title: 'Funding Recipient' },
    loadComponent: () =>
      import('./funding recipient/containers/funding-recipient-page/funding-recipient-page.component').then(
        (m) => m.FundingRecipientPageComponent,
      ),
  },
  {
    path: 'funding-recipients-form',
    canActivate: [authGuard],
    canDeactivate: [unsavedChangesGuard],
    data: { pageKey: 'FUNDINGRECIPIENTMANAGEMENT', title: 'Funding Recipient' },
    loadComponent: () =>
      import('./funding recipient/containers/funding-recipient-form-page/funding-recipient-form-page.component').then(
        (m) => m.FundingRecipientFormPage,
      ),
  },
  {
    path: 'funding-recipients/:fundingRecipientId',
    canActivate: [authGuard],
    canDeactivate: [unsavedChangesGuard],
    data: { pageKey: 'FUNDINGRECIPIENTMANAGEMENT', title: 'Funding Recipient' },
    loadComponent: () =>
      import('./funding recipient/containers/funding-recipient-form-page/funding-recipient-form-page.component').then(
        (m) => m.FundingRecipientFormPage,
      ),
  },
  {
    path: 'programs',
    data: { title: 'Program' },

    loadComponent: () =>
      import('./program/containers/program-page/program-page.component').then(
        (m) => m.ProgramPageComponent,
      ),
  },
  {
    path: 'program-form',
    canActivate: [authGuard],
    canDeactivate: [unsavedChangesGuard],
    data: { pageKey: 'PROGRAMMANAGEMENT', title: 'Program' },
    loadComponent: () =>
      import('./program/containers/program-form-page/program-form-page.component').then(
        (m) => m.ProgramFormPage,
      ),
  },
  {
    path: 'programs/:programId',
    canActivate: [authGuard],
    canDeactivate: [unsavedChangesGuard],
    data: { pageKey: 'PROGRAMMANAGEMENT', title: 'Program' },
    loadComponent: () =>
      import('./program/containers/program-form-page/program-form-page.component').then(
        (m) => m.ProgramFormPage,
      ),
  },
  {
    path: 'user-control-access',
    canActivate: [authGuard],
    data: { pageKey: 'USERCONTROLACCESS', title: 'Security' },
    loadComponent: () =>
      import('./user control access/containers/role-page-access-page/role-page-access-page.component').then(
        (m) => m.RolePageAccessPageComponent,
      ),
  },
  {
    path: 'user-control-access/page-actions/:pageStructureId',
    canActivate: [authGuard],
    data: { pageKey: 'USERCONTROLACCESS', title: 'Security' },
    loadComponent: () =>
      import('./user control access/containers/role-page-action-access-page/role-page-action-access-page.component').then(
        (m) => m.RolePageActionAccessPageComponent,
      ),
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    data: { pageKey: 'SYSTEMSETTINGS', title: 'System Settings' },
    loadComponent: () =>
      import('./settings/containers/settings-page.component').then((m) => m.SettingsPageComponent),
  },
  {
    path: 'audit',
    canActivate: [authGuard],
    data: { pageKey: 'AUDITTIMELINE', title: 'Audit Timeline' },
    loadComponent: () =>
      import('../audit/containers/audit-page.component').then((m) => m.AuditPageComponent),
  },
];
