// ////////////////////////////////////// BINDING MODELS /////////////////////////////////////////////
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errorCode?: string;
  errors?: string[];
}
// GET ImpactMaster models
export interface ImpactMasterListModel {
  impactMasterId: string;

  pin: string;
  title: string;

  programId: string;
  programName: string;
  fundingRecipientNames: string;

  recordTypeId: string;
  recordTypeName: string;

  categoryId: string | null;
  categoryCode: string | null;
  categoryName: string | null;

  phaseId: string | null;
  phaseCode: string | null;
  phaseName: string | null;

  statusId: string;
  statusCode: string;
  statusName: string;

  l1UserId: string;
  l1UserName: string;

  metricCategories: string | null;
  metricCategoryList: string[];

  createdOnUTC: string;
  updatedOnUTC: string | null;
}

export interface ImpactMasterDetailModel {
  impactMasterId: string;

  pin: string | null;
  title: string;
  description: string | null;

  programId: string | null;
  programName: string | null;
  l1UserId: string | null;
  l1UserName: string | null;

  fundingRecipients: ImpactMasterFundingRecipientModel[];

  l2ApproverUserId: string | null;
  l2ApproverUserName: string | null;

  l3ApproverUserId: string | null;
  l3ApproverUserName: string | null;

  corporateApproverUserId: string | null;
  corporateApproverUserName: string | null;

  recordTypeId: string;
  recordTypeName: string;

  phaseId: string | null;
  phaseCode: string | null;
  phaseName: string | null;

  categoryId: string | null;
  categoryCode: string | null;
  categoryName: string | null;

  startDate: string | null;
  endDate: string | null;
  actualCompletionDate: string | null;

  reportingFrequency: string;
  totalFunding: number | null;

  internalReferences: string | null;
  fieldCheckReport: string | null;
  lastFieldCheckDate: string | null;

  statusId: string;
  statusCode: string;
  statusName: string;

  createdBy: string;
  createdOnUTC: string;

  updatedBy: string | null;
  updatedOnUTC: string | null;

  cities: ImpactMasterCityRequest[];
}

export interface ImpactMasterFundingRecipientModel {
  fundingRecipientId: string;
  fundingRecipientName: string;
  fundingRecipientOrgName: string;
}
export interface ImpactMasterCityRequest {
  impactMasterCityId: string;
  countryName: string;
  cityId: string;
  cityName: string;
}
export interface ImpactMasterCityModel {
  cityId: string;
  cityName: string;
  countryName: string;
}
export interface SaveImpactMasterMetricsRequest {
  updatedBy: number;
  impactMasterId: string;
  metrics: ImpactMasterMetricItemRequest[];
}

// ImpactMaster Metric Model
export interface ImpactMasterMetricModel {
  metricId: string;
  ImpactMasterMetricId: string | null;

  categoryId: string;
  categoryCode: string;
  categoryName: string;
  categoryColor: string | null;

  metricCode: string;
  metricName: string;
  description: string | null;

  isTopLevel: boolean;

  parentMetricId: string | null;
  parentMetricName: string | null;

  metricUnitId: string | null;
  unitName: string | null;

  isActive: boolean;
  riskPct: number | null;
  baselinePct: number | null;
  // averageRiskPct: number | null;

  impactMasterMetricId: string | null;

  isRiskAdjustmentRequired: boolean;
  children: ImpactMasterMetricModel[];
}
export interface MetricCategoryModel {
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  metrics: ImpactMasterMetricModel[];
}
export interface GetImpactMastersRequest {
  pageNumber: number;
  pageSize: number;

  searchText?: string | null;

  impactMasterId?: string | null;
  programId?: string | null;
  fundingRecipientId?: string | null;

  statusId?: string | null;

  l1UserId?: string | null;

  recordTypeId?: string | null;
  phaseId?: string | null;
  categoryId?: string | null;

  metricCategories?: string | null;
}
// Save ImpactMaster request
export interface CreateImpactMasterRequest {
  pin?: string | null;
  title: string;

  programId?: string | null;
  fundingRecipientIds?: string[];

  l1UserId?: string | null;

  l2ApproverUserId?: string | null;
  l3ApproverUserId?: string | null;
  corporateApproverUserId?: string | null;

  recordTypeId: string;

  phaseId?: string | null;
  categoryId?: string | null;

  description?: string | null;

  startDate?: string | null;
  endDate?: string | null;
  actualCompletionDate?: string | null;

  reportingFrequency?: string | null;

  totalFunding?: number | null;

  internalReferences?: string | null;
  fieldCheckReport?: string | null;
  lastFieldCheckDate?: string | null;

  statusId?: string | null;

  createdBy: number;

  cityIds?: string[];
}
export interface UpdateImpactMasterRequest {
  impactMasterId: string;

  pin: string | null;

  title: string;

  description?: string | null;

  programId?: string | null;
  fundingRecipientIds: string[];

  l1UserId?: string | null;

  l2ApproverUserId?: string | null;
  l3ApproverUserId?: string | null;
  corporateApproverUserId?: string | null;

  recordTypeId: string;

  phaseId?: string | null;
  categoryId?: string | null;

  startDate?: string | null;
  endDate?: string | null;
  actualCompletionDate?: string | null;

  reportingFrequency?: string;

  totalFunding?: number | null;

  internalReferences: string | null;
  fieldCheckReport: string | null;
  lastFieldCheckDate: string | null;

  statusId: string;

  updatedBy: number;

  cityIds: string[];
}
export interface CreateImpactMasterResponse {
  impactMasterId: string;
  pin: string | null;
}
export interface ImpactMasterMetricItemRequest {
  metricId: string;
  riskPct: number | null;
  baselinePct: number | null;
  isActive: boolean;
}
export interface DeleteImpactMasterRequest {
  impactMasterId: string;
  updatedBy: string;
}

export interface DeleteImpactMasterResponse {
  impactMasterId: string;
  isDeleted: boolean;
  hasPendingReviews: boolean;
  pendingReviewIds: string | null;
}

export interface CopyImpactMasterRequest {
  impactMasterId: string;
  createdBy: string;
}

export interface CopyImpactMasterResponse {
  impactMasterId: string;
}
// FILTER MODELS
export interface ImpactMasterFilterOptionsDto {
  programOptions: ProgramOptionsDto[];
  recordTypeOptions: RecordTypeOptionsDto[];
  statusOptions: StatusOptionsDto[];
}

interface ProgramOptionsDto {
  programId: string;
  programCode: string;
  programName: string;
}

interface RecordTypeOptionsDto {
  recordTypeId: string;
  recordTypeName: string;
}

interface StatusOptionsDto {
  statusId: string;
  statusCode: string;
  statusName: string;
}