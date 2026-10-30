export interface MetricCategoryLookup {
  categoryId: string;
  code: string;
  name: string;
  color?: string;
}

export interface MetricUnitLookup {
  metricUnitId: string;
  unitCode: string;
  unitName: string;
}

export interface StatusLookup {
  statusId: string;
  statusCode: string;
  statusName: string;
  displayOrder: number;
  isDefault: boolean;
}

export interface ProgramLookup {
  programId: string;
  code: string;
  name: string;
}
export interface ImpactMasterLookup {
  impactMasterId: string;
  pin: string;
  title: string;
  fundingRecipientName: string;
}
export interface CategoryLookup {
  categoryId: string;
  categoryName: string;
}
export interface PhaseLookup {
  phaseId: string;
  phaseName: string;
}
// Country & City
export interface CountryLookup {
  countryName: string;
  cities: CityLookup[];
}

export interface CityLookup {
  cityId: string;
  countryName: string;
  cityName: string;
}
export interface RecordTypeLookup {
  recordTypeId: string;
  name: string;
}
export interface FundingRecipientLookup {
  fundingRecipientId: string;
  name: string;
  orgName: string;
  countryId: string;
  countryCode: string;
  countryName: string;
}

export interface AppUserLookup {
  userId: string;
  displayName: string;
  email?: string;
}
export interface BusinessRoleUserLookup {
  userId: string;
  displayName: string;
}
export interface SystemRoleLookup {
  roleId: string;
  code: string;
  roleName: string;
}
export interface BusinessRoleLookup {
  businessRoleId: string;
  roleCode: string;
  businessRoleName: string;
}
export interface ReviewStageLookup {
  reviewStageId: string;
  code: string;
  name: string;

  stageName?: string;
}
export interface ParentMetricLookup {
  metricId: string;
  code: string;
  name: string;
  description?: string;
  categoryId: string;
}
export interface ProjectManagerLookup {
  pmUserId: string;
  displayName: string;
  userId?: string;
}
export interface TimeZoneLookupModel {
  timeZoneId: number;
  timeZoneCode: string;
  timeZoneName: string;
}
export interface MetricSourceLookup {
  metricSourceId: number;
  code: string;
  name: string;
}
