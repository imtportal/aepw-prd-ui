export type UserRole   = 'Admin' | 'Project Manager' | 'Reviewer' | 'Lead Reviewer' | 'Funding Recipient';
export type UserStatus = 'Active' | 'Inactive' | 'Pending';
export type UserSystemRoleSource = 'Manual' | 'EntraGroup';

export interface UserListDto {
  userId:       number;
  displayName:  string;
  email:        string | null;
  role:         UserRole;
  status:       UserStatus;
  lastLoginUtc: string | null;
}

export interface AppUser {
  userId:          number;
  azureAdObjectId: string | null;
  upn:             string;
  email:           string | null;
  displayName:     string;
  firstName:       string | null;
  lastName:        string | null;
  phone:           string | null;
  jobTitle:        string | null;
  timeZoneIana:    string;
  isActive:        boolean;
  lastLoginUtc:    string | null;
  createdBy:       number | null;
  createdOnUtc:    string;
  updatedBy:       number | null;
  updatedOnUtc:    string | null;
  rowVersion:      string;

  createdOnUTC?: string;
    
}

export interface SystemRole {
  systemRoleId: number;
  code:         string;
  name:         string;
  description:  string | null;
  isActive:     boolean;
  createdBy:    number;
  createdOnUtc: string;
  updatedBy:    number | null;
  updatedOnUtc: string | null;
  rowVersion:   string;
}

export interface UserSystemRole {
  userSystemRoleId: number;
  userId:           number;
  systemRoleId:     number;
  grantedByUserId:  number | null;
  grantedUtc:       string;
  source:           UserSystemRoleSource;
  isActive:         boolean;
  createdBy:        number;
  createdOnUtc:     string;
  updatedBy:        number | null;
  updatedOnUtc:     string | null;
  rowVersion:       string;
}

export interface BusinessRoleMapping {
  businessRoleMappingId: number;
  roleCode:              string;
  userId:                number;
  regionId:              number | null;
  reviewStageId:         number | null;
  categoryCode:          string | null;
  isPrimary:             boolean;
  effectiveFromUtc:      string | null;
  effectiveToUtc:        string | null;
  isActive:              boolean;
  createdBy:             number;
  createdOnUtc:          string;
  updatedBy:             number | null;
  updatedOnUtc:          string | null;
  rowVersion:            string;
}
