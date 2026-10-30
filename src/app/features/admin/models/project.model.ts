import { FundingRecipient } from './funding-recipient.model';

// ── Enum / union types ────────────────────────────────────────────────────────

export type ProjectStatus = 'Active' | 'Paused' | 'Completed';
export type ReportingFrequency = 'Quarterly' | 'Annual';
export type ProjectMetricApplicability = 'Required' | 'Optional' | 'NotVisible';

// ── Entities ──────────────────────────────────────────────────────────────────

export interface Program {
  programId: number;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdBy: number;
  createdOnUtc: string;
  updatedBy: number | null;
  updatedOnUtc: string | null;
  rowVersion: string;
}

/** Maps directly to dbo.Project columns. FK fields are numeric IDs. */
export interface Project {
  projectId: number;
  pin: string;
  title: string;
  programId: number;
  fundingRecipientId: number;
  pmUserId: number;
  status: ProjectStatus;
  startDate: string;
  endDate: string | null;
  reportingFrequency: ReportingFrequency;
  totalFunding: number | null;
  createdBy: number;
  createdOnUtc: string;
  updatedBy: number | null;
  updatedOnUtc: string | null;
  rowVersion: string;
}

export interface ProjectMetric {
  id: number;
  projectId: number;
  metricId: number;
  applicability: ProjectMetricApplicability;
  baselineRiskPct: number | null;
  isActive: boolean;
  createdBy: number;
  createdOnUtc: string;
  updatedBy: number | null;
  updatedOnUtc: string | null;
  rowVersion: string;
}

export interface ProjectReviewStage {
  projectReviewStageId: number;
  projectId: number;
  reviewStageId: number;
  sequence: number;
  isRequired: boolean;
  effectiveFromPeriodId: number | null;
  effectiveToPeriodId: number | null;
  createdBy: number;
  createdOnUtc: string;
  updatedBy: number | null;
  updatedOnUtc: string | null;
  rowVersion: string;
}

// ── View-model / DTO interfaces ───────────────────────────────────────────────

export interface MetricConfig {
  metricId: number;
  code: string;
  applicability: ProjectMetricApplicability;
  baselineRiskPct: number | null;
}

export interface BulkProject {
  reviewId?: string;
  impactMasterId: number; // Yes
  pin?: string; // Yes
  title?: string; // Yes
  programName?: string; // Not Found
  regionId?: number; // Yes
  regionName?: string; // Yes
  l1UserName?: string;
  l1UserId?: number;
  fundingRecipientId?: number;
  fundingRecipientName?: string; 
  fundingRecipientOrgName?: string;
  fundingRecipientCountryId?: number; // Yes
  fundingRecipientCountryName?: string; // Yes
  fundingRecipient?: FundingRecipient;
  metricConfig?: MetricConfig[];
  statusName?: string;
  statusCode?: string;
  lastReviewStage?: string;
  lastReviewStatus?: 'Completed' | 'In Progress' | 'Not Started' | 'Overdue';

  startDate?: string
  endDate?: string
  reportingFrequency?: string
  reviewStatus?: string;

  metrics?: MetricDto[];
  totalMetrics?: number;

  allowDeletion?: boolean;
  deletionPreventionReason?: string;

  totalRows?: number;
  skippedRows?: number;
  pageNo?: number;
  itemsPerPage?: number;
}

export interface ProjectListDto {
  projectId: number;
  pin: string;
  title: string;
  programId: number;
  programName: string;
  fundingRecipientId: number;
  fundingRecipientName: string;
  orgName: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  pmUserId: number;
  pmUserName: string;
  statusId: number;
  statusName: string;
  metricCategories: string;
  metricCategoryList: string[];
  startDate: string;
  endDate: string | null;
  reportingFrequency: string;
  totalFunding: number | null;
  createdBy: number;
  createdOnUtc: string;
  updatedBy: number | null;
  updatedOnUtc: string | null;
}

export interface ProjectDetailDto {
  projectId: number;
  pin: string;
  title: string;
  programId: number;
  programName: string;
  fundingRecipientId: number;
  fundingRecipientName: string;
  fundingRecipientOrgName: string;
  fundingRecipientContactName: string;
  fundingRecipientContactEmail: string;
  fundingRecipientContactPhone: string;
  pmUserId: number;
  pmUserName: string;
  countryId: number;
  countryCode: string;
  countryName: string;
  regionId: number;
  regionName: string;
  startDate: string;
  endDate: string | null;
  reportingFrequency: string;
  totalFunding: number | null;
  statusId: number;
  statusName: string;
  createdBy: number;
  createdOnUtc: string;
  updatedBy: number | null;
  updatedOnUtc: string | null;
}

export interface MetricDto {
  metricId: string;
  metricCode: string;
  metricName: string;
  categoryId: string | null;
  categoryCode?: string | null;
  description: string | null;

  isTopLevel: boolean;

  parentMetricId: string | null;
  parentMetricName: string | null;

  isCorporate: boolean;
  riskOriginal?: number;

  defaultRiskPct: number | null;
  riskPctEffective: number | null;
  evidenceRequiredMin: number;

  isActive: boolean;
  effectiveFromUtc: string;

  metricUnitId: string | null;
  unitName: string | null;

  // project-specific fields
  projectMetricId: string | null;
  baselineRiskPct: number | null;
  isRequired: boolean;

  children: MetricDto[];

  categoryColor?: string;
}

export interface MetricCategoryDto {
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  categoryColor: string | null;
  metrics: MetricDto[];
  pin: string;
}
// ////////////////////////////////////// BINDING MODELS /////////////////////////////////////////////
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errorCode?: string;
  errors?: string[];
}

export interface CreateProjectRequest {
  title: string;
  programId: string;
  fundingRecipientId: string;
  pmUserId: string;
  countryId: string;
  startDate: string; // ISO date string
  endDate?: string | null;
  reportingFrequency: string;
  totalFunding?: number | null;
  statusId: string;
  createdBy: string;
}

export interface CreateProjectResponse {
  projectId: number;
  pin: string;
}
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errorCode?: string;
  errors?: string[];
}

export interface ProjectListModel {
  projectId: number;
  pin: string;
  title: string;

  programId: number;
  programName: string;

  fundingRecipientId: number;
  fundingRecipientName: string;

  orgName: string;

  pmUserId: number;
  pmUserName: string;

  statusId: number;
  statusName: string;

  metricCategories: string;
  metricCategoryList: string[];

  startDate: string;
  endDate: string | null;

  createdBy: number;
  createdOnUTC: string;

  updatedBy: number | null;
  updatedOnUTC: string | null;
}

// --------------------------- FILTER MODEL ------------------------------------
export interface GetProjectsRequest {
  pageNumber: number;
  pageSize: number;
  searchText?: string | null;
  pmUserId?: string | null;
  projectId?: string | null;
  programId?: string | null;
  statusId?: string | null;
  fundingRecipientId?: string | null;
  metricCategories?: string | null;
}
// --------------------------- SAVE MODELS--------------------------------------
export interface ProjectDetailModel {
  projectId: string;
  pin: string;
  title: string;

  programId: string;
  programName: string;

  fundingRecipientId: string;
  fundingRecipientName: string;
  fundingRecipientOrgName: string;
  fundingRecipientContactName: string;
  fundingRecipientContactEmail: string;
  fundingRecipientContactPhone: string;

  pmUserId: string;
  pmUserName: string;

  countryId: string;
  countryCode: string;
  countryName: string;

  regionId: string;
  regionName: string;

  startDate: string;
  endDate: string | null;

  reportingFrequency: string;
  totalFunding: number | null;

  statusId: string;
  statusName: string;

  createdBy: string;
  createdOnUTC: string;

  updatedBy: string | null;
  updatedOnUTC: string | null;
}
export interface ProjectMetricItemRequest {
  metricId: string;
  baselineRiskPct: number | null;
  EvidenceRequiredMin: number | null;
  isRequired: boolean;
  isActive: boolean;
}

export interface SaveProjectMetricsRequest {
  projectId: string;
  metrics: ProjectMetricItemRequest[];
}

export interface UpdateProjectRequest {
  projectId: string;
  programId: string;
  pmUserId: string;
  countryId: string;
  startDate: string;
  endDate?: string | null;
  totalFunding?: number | null;
  fundingRecipientId: string;
  reportingFrequency: string;
  updatedBy: string;
}
