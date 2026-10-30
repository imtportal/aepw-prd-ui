export interface AzureAdUserLookupModel {
  id: string; // azure object id
  displayName?: string;
  givenName?: string; // firstname
  surname?: string; // lastname
  userPrincipalName?: string; // upn in table
  mail?: string; //email
  jobTitle?: string; // job title
  mobilePhone?: string; //phone
  city?: string; // from city can get timezone?
}
// Save model
export interface AppUserSaveModel {
  azureAdObjectId: string;
  firstName?: string;
  lastName?: string;
  displayName: string;
  upn: string;
  email?: string;
  jobTitle?: string;
  phone?: string;
  systemRoleId: string;
  timeZoneId: number;
  createdBy: string;
}

export interface AppUserListModel {
  userId: string;
  displayName: string;
  upn: string;
  email: string;
  azureAdObjectId: string;
  systemRoleId: string;
  roleName: string;
  isActive: boolean;
  lastLoginUtc?: string;
}
export interface AppUserDetailModel {
  userId: string;
  azureAdObjectId: string;
  upn: string;
  displayName: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  jobTitle: string;
  timeZoneId: number;
  // timeZoneName: string;
  systemRoleId: string;
  roleName: string;
  isActive: boolean;
  lastLoginUtc?: string;
}
export interface DeleteUserModel {
  userId: string;
  updatedBy: string;
}
export interface DeleteUserResponseModel {
  userId: number;
  isDeleted: boolean;
  hasPendingReviews: boolean;
  pendingReviewIds: string | null;
}
export interface UpdateUserRequest {
  userId: string;
  systemRoleId: string;
  timeZoneId: number;
  isActive: boolean;
  lastLoginUtc?: string;
  updatedBy: string;
}

export interface UpdateUserResponse {
  userId: number;
}

export interface UserRoleSummaryModel {
  roleId: string;
  code: string;
  roleName: string;
  description: string;
  userCount: number;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
