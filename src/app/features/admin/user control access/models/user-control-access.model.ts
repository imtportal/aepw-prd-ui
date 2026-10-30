export interface RolePageAccessModel {
  systemRoleId: number;
  systemRoleName: string;
  pageStructureId: number;
  pageName: string;
  description: string;
  hasAccess: boolean;
}
export interface RolePageActionAccessModel {
  systemRoleId: number;
  systemRoleName: string;
  pageStructureId: number;
  pageActionStructureId: number;
  actionName: string;
  actionDescription: string;
  actionKey: string;
  hasAccess: boolean;
}
export interface SaveRolePageAccessRequest {
  rolePageAccess: RolePageAccessItem[];
  updatedBy: number;
}

export interface RolePageAccessItem {
  systemRoleId: number;
  pageStructureId: number;
  hasAccess: boolean;
}

export interface SaveRolePageActionAccessRequest {
  rolePageActionAccess: RolePageActionAccessItem[];
  updatedBy: number;
}

export interface RolePageActionAccessItem {
  systemRoleId: number;
  pageActionStructureId: number;
  canPerformAction: boolean;
}