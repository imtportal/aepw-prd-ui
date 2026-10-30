export interface LoginContext {
  userDetails: UserDetails;
  pageAccess: PageAccess[];
  // actionPermissions: ActionPermission[];
}

export interface UserDetails {
  userId: number;
  displayName: string;
  email: string;
}

export interface PageAccess {
  key: string;
  value: boolean;
}

export interface ActionAccess {
  key: string;
  value: boolean;
}

export interface ActionAccessDto {
  key: string;
  value: boolean;
}

export interface PageAndActionAccessDto {
  pageAccess: PageAccess;
  actionAccess: ActionAccessDto[];
}

