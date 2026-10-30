import { EvidenceDetailDto } from '../../evidence/models/evidence.model';

// ── Enum / union types ────────────────────────────────────────────────────────

export type ReviewStageName =
  | 'Due'
  | 'Draft'
  | 'DataCollection'
  | 'EvidenceCollection'
  | 'Validation'
  | 'Approval'
  | 'Closed';

// UI-friendly stage labels (human-readable, used by dashboard and review pages)
export type ReviewWorkflowStage =
  | 'Due'
  | 'Draft'
  | 'Data Collection'
  | 'Evidence Collection'
  | 'Validation'
  | 'Approval'
  | 'Closed'
  | 'Risk Adjustment Pending'
  | 'Risk Adjustment Reviewed'
  | 'RISKADJUSTMENT'
  | 'Risk Adjustment'
  | string;

// Approval workflow step label (used by reviewer queue tabs)
export type ApprovalStage =
  | 'PM Review'
  | 'Reviewer'
  | 'Lead Reviewer'
  | 'Final Approval'
  | 'Complete'
  | 'Admin';

export type ReviewMetricApplicability = 'Required' | 'Optional' | 'NotVisible';

export type RAStatus = 'Pending' | 'Approved' | 'Rejected';

export type ValidationStatus = 'Pending' | 'PartiallyValidated' | 'Validated';

export type ReviewApprovalStatus =
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'RequestCorrection'
  | 'Amended'
  | 'Skipped'
  | 'Recalled';

// Simplified UI approval status alias used by display components
export type ApprovalStatus = ReviewApprovalStatus;

export type ExcelUploadParseStatus = 'Queued' | 'Parsed' | 'Failed' | 'Committed';

// ── Entities ──────────────────────────────────────────────────────────────────

export interface ReviewPeriod {
  reviewPeriodId: number;
  year: number;
  quarter: number | null;
  periodCode: string;
  startUtc: string;
  endUtc: string;
  submissionDueUtc: string;
  createdBy: number;
  createdOnUtc: string;
  updatedBy: number | null;
  updatedOnUtc: string | null;
  rowVersion: string;
}

export interface ReviewStage {
  reviewStageId: number;
  code: string;
  name: string;
  description: string | null;
  defaultSequence: number;
  isActive: boolean;
  createdBy: number;
  createdOnUtc: string;
  updatedBy: number | null;
  updatedOnUtc: string | null;
  rowVersion: string;
}

export interface Review {
  reviewId: number;
  projectId: number;
  reviewPeriodId: number;
  stage: ReviewStageName;
  launchedUtc: string | null;
  submittedUtc: string | null;
  closedUtc: string | null;
  dataCompletionPct: number;
  evidenceConfirmedPct: number;
  isRestated: boolean;
  createdBy: number;
  createdOnUtc: string;
  updatedBy: number | null;
  updatedOnUtc: string | null;
  rowVersion: string;
}

export interface ReviewMetric {
  reviewMetricId: number;
  reviewId: number;
  metricId: number;
  applicability: ReviewMetricApplicability;
  riskPctProposed: number | null;
  riskPctEffective: number | null;
  raStatus: RAStatus;
  raApprovedByUserId: number | null;
  raApprovedUtc: string | null;
  raReason: string | null;
  validationStatus: ValidationStatus;
  evidenceCount: number;
  varianceAbs: number | null;
  variancePct: number | null;
  rawValue: number | null;
  adjustedValue: number | null;
  lastValueSource: string | null;
  lastValueEnteredByUserId: number | null;
  lastValueEnteredUtc: string | null;
  createdBy: number;
  createdOnUtc: string;
  updatedBy: number | null;
  updatedOnUtc: string | null;
  rowVersion: string;

  isRequired?: number;
}

export interface ReviewApproval {
  reviewApprovalId: number;
  reviewId: number;
  reviewStageCode: string;
  stepNo: number;
  attemptNo: number;
  categoryCode: string | null;
  amendedFromValue: number | null;
  amendedToValue: number | null;
  amendedReviewMetricId: number | null;
  status: ReviewApprovalStatus;
  assigneeUserId: number | null;
  assignedUtc: string | null;
  assignmentSource: string | null;
  decisionByUserId: number | null;
  decisionUtc: string | null;
  comment: string | null;
  isCurrent: boolean;
  createdBy: number;
  createdOnUtc: string;
  updatedBy: number | null;
  updatedOnUtc: string | null;
  rowVersion: string;
}

export interface ReviewComment {
  reviewCommentId: number;
  reviewId: number;
  authorUserId: number;
  createdUtc: string;
  body: string;
  isActive: boolean;
  createdBy: number;
  createdOnUtc: string;
  updatedBy: number | null;
  updatedOnUtc: string | null;
  rowVersion: string;
}

export interface ReviewExcelUpload {
  uploadId: number;
  reviewId: number;
  blobUri: string;
  fileName: string;
  uploadedByUserId: number;
  uploadedUtc: string;
  parseStatus: ExcelUploadParseStatus;
  parseLogJson: string | null;
  stagedValuesJson: string | null;
  createdBy: number;
  createdOnUtc: string;
  updatedBy: number | null;
  updatedOnUtc: string | null;
  rowVersion: string;
}

// ── DTOs (view models for list, queue, and detail pages) ─────────────────────

export interface ReviewListDto {
  reviewId: number;
  projectId: number;
  project: string;
  pm: string;
  recipient: string;
  stage: ReviewWorkflowStage;
  stageDisplayValue?: string;
  dataCompletionPct: number;
  dataCollectionFolderUrl?: string;
  evidenceConfirmedPct: number;
  updatedAt: string;
  quarter?: number;

  reviewPeriodCode?: string;

  comments?: ReviewCommentDto[];
  updatedOnStr?: string;
}

export interface ReviewQueueDto {
  reviewId: number;
  projectId: number;
  projectName: string;
  periodCode: string;
  currentApprovalStage: string;
  pm: string;
  reviewer: string;
  leadReviewer: string;
  finalApprover: string;
  pmStatus: ReviewApprovalStatus;
  reviewerStatus: ReviewApprovalStatus;
  leadStatus: ReviewApprovalStatus;
  finalStatus: ReviewApprovalStatus;
  totalMetrics: number;
  approvedMetrics: number;
  rejectedMetrics: number;
  recycledMetrics: number;
  materialFlags: number;
  evidenceComplete: boolean;
  lastActivity: string;
}

export interface ReviewMetricDto {
  reviewMetricId: number;
  metricId: number;
  parentMetricId?: number;
  metricCode: string;
  metricName: string;
  categoryId?: number;
  categoryCode: string;
  categoryName?: string;

  categoryColor?: string;
  rawValue?: number;
  adjustedValue?: number;

  metricDescription?: string;

  unit: string;
  frComment?: string;
  reportedValue: string;
  pmStatus: ReviewApprovalStatus;
  reviewStatus: ReviewApprovalStatus;
  leadStatus: ReviewApprovalStatus;
  finalStatus?: ReviewApprovalStatus;
  isTopLevel?: boolean;
  parentCode?: string;
  optional?: boolean;
  validationWarning?: string;
  evidenceUploadCount: number;
  // evidenceCount:   number;
  evidenceFiles: DetailEvidenceFile[];

  reviewId?: number;
  applicability?: string;
  riskOriginal?: number;
  riskPctEffective?: number;
  raStatus?: string;
  validationStatus?: string;
  evidenceCount: number;
  isRequired?: number;
  baseline?: number;
  riskPctProposed?: number;
  raReason?: string;
  raReviewComment?: string;
  evidences?: EvidenceDto[];

  valorizationType?: number;
  status?: string;
  isValorisationRequired?: boolean;
  valorisationTypeId?: number;
  isRiskAdjustmentRequired?: boolean;
  reportedLimitAcknowledgedBy?: number;
  reportedLimitMsg?: string;
  reportedLimit?: number;

  stageDescription?: string;
  currentStage?: string;
  evidenced?: number;
  evidencedPer?: number;
  
  rejectedInSubsequentStages?: number;
  allowRejection?: boolean;
  allowAction?: boolean;

  allowRecall?: boolean;
  // allowRestatement?: boolean;
}

export interface EvidenceDto {
  evidenceId: number;
  itemId: string;
  reviewMetricId: number;
  fileName: string;
  fileSizeBytes: number;
  fileUriView: string;
  fileUriDownload: string;
  uploadedByUserId: number;
  uploadedUtc: string;
  status: number;
  isLocked: boolean;
  createdBy: number;
  createdOnUTC: string;

  siteTag?: string;
  period?: string;
  language?: string;

  statusDisplayValue: string;

  evidenceTypeId: number;
  evidenceTypeCode: string;
  evidenceTypeDescription: string;

  contribution?: number;
  evidencedValue?: string;

  statusTextColor?: string;
  statusBadgeColor?: string;

}

export interface ReviewCommentDto {
  reviewCommentId: number;
  reviewId: number;
  authorUserId: number;
  authorName: string;
  role?: string;
  body: string;
  createdUtc: string;
  createdOnUtc: string;
  createdBy?: number;
  isActive: number;
  shortenedBody?: string;

  updatedBy?: number;
  updatedOnUtc?: string;
}

export interface ReviewDetailDto {
  reviewId: number;
  projectId: number;
  projectName: string;
  periodCode: string;
  stage: ReviewWorkflowStage;
  metrics: ReviewMetricDto[];
  comments: ReviewCommentDto[];
}

export interface ReviewDto {
  reviewId: number;
  impactMasterId: number;
  projectName: string;
  fundingRecipientName: string;
  pmUserId: number;
  pmName: string;
  assigneeName?: string;
  reviewPeriodId: number;
  reviewPeriodCode?: string;
  stage: string;
  stageName?: string;
  stageDisplayValue?: string;
  launchedUtc: string;
  dataCompletionPct: number;
  dataCollectionFolderUrl?: string;
  evidenceConfirmedPct: number;
  createdBy: number;
  createdByName: string;
  createdOnUTC: string;
  updatedByName: string;
  updatedOnUTC: string;

  recordTypeName?: string;

  quarter?: number;

  updatedOnStr?: string;
  comments?: ReviewCommentDto[];
  
  allowRestatement?: boolean;
  reviewMetrics: ReviewMetricDto[];

  atLeastOneMetricAssigned?: boolean;
}

export interface ReviewDto {
  submittedUtc: string;
  closedUtc: string;

  // "reviewMetrics": [
  //     {
  //         "reviewMetricId": 1,
  //         "reviewId": 1,
  //         "metricId": 2,
  //         "applicability": "Required",
  //         "riskPctEffective": 0,
  //         "raStatus": "Pending",
  //         "validationStatus": "Pending",
  //         "evidenceCount": 0
  //     },
  //     {
  //         "reviewMetricId": 2,
  //         "reviewId": 1,
  //         "metricId": 16,
  //         "applicability": "Required",
  //         "riskPctEffective": 0,
  //         "raStatus": "Pending",
  //         "validationStatus": "Pending",
  //         "evidenceCount": 0
  //     },
  //     {
  //         "reviewMetricId": 3,
  //         "reviewId": 1,
  //         "metricId": 17,
  //         "applicability": "Required",
  //         "riskPctEffective": 0,
  //         "raStatus": "Pending",
  //         "validationStatus": "Pending",
  //         "evidenceCount": 0
  //     }
  // ]
}

export interface ReviewStageLookupDto {
  reviewStageId: number;
  code: string;
  name: string;
  description: string;
  defaultSequence: number;
  isActive: number;
  createdBy: number;
  createdOnUTC: string;
  isApprovalRequired: number;
}

export class GetReviewFilters {
  Project: string = '';
  PM: string = '';
  Stage: string = '';
  ReviewPeriodId: string = '';

  SortBy: string = 'ReviewId';
  SortDesc: number = 0;
}

export interface MetricRiskResponseJSON {
  MetricId: number;
  RiskPctProposed: number;
  RiskPctEffective: number;
  RAReason: string;
  Approved: number;
}

export interface ReviewExcelUploadDto {
  documentId: number;
  reviewId: number;
  blobUri: string;
  fileName: string;
  uploadedByUserId: number;
  uploadedUtc: string;
  parseStatus: number;
  parseLogJson: string;
  stagedValuesJson: string;
  createdBy: number;
  createdOnUTC: string;
}

export type FileProcessingStatus =
  | 'pending'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'validated'
  | 'needs-review'
  | 'rejected'
  | 'error';

export interface DetailEvidenceFile {
  id: string;
  fileName: string;
  evidenceType: string;
  siteTag?: string;
  uploadedBy: string;
  uploadedDate: string;
  status: 'pending' | 'complete';
  confidence?: number;
  aiStatus?: FileProcessingStatus | 'approved';
  reviewComment?: string;
}

export interface UpdateReviewMetricsValuesDto {
  MetricId: number;
  Baseline: number | null;
  RawValue: number | null;
  RiskPercentage: number | null;
  RestatementComment: string | null;

  UpdatingRiskPercentage?: boolean;
}

export interface BaselineRemainderDto {
  baseline: string;
  reviewId: number;
  metricId: number;
  metricCode: string;
  impactMasterId: number;
  quarter: number;
  reviewIdMetricIdQuarter: string;
  baselineSum: number;
  immBaseline: number;
}

export interface ReviewMetricApproveRejectDto {
  ReviewId: number;
  MetricCode: string;
  MetricId?: number;
  Decision: string;
  Comment?: string;

  StatusId?: number;
  Action?: string;

  StageCode?: string;

  Role?: string;
}

export interface ReviewApprovalProgressDto {
  reviewId: number;
  metricCode: string;
  stage: string;
  status?: string;
  stageDisplayName?: string;
  approvedById?: number;
  assigneeUserId: number;
  assigneeUserName?: string;
  ///////////////////////////////
  approvedBy?: string;
  approvedOnUTC?: string;
  approvalComment?: string;

  rejectedBy?: string;
  rejectedOnUTC?: string;
  rejectionComment?: string;

  taskReassignedBy?: number;
  taskReassignedByName?: string;
  taskReassignedOn?: string;

  recallDoneById?: number;
  recallDoneByName?: string;
  recallComment?: string;
  recallOnUtc?: string;

  updatedOnUtc?: string;
  comment?: string;
}
export interface UpdateReviewApprovalAssigneeRequest {
  reviewId: number;
  reviewStageCode: number;
  metricCode: string;
  currentAssigneeUserId: number;
  newAssigneeUserId: number;
  updatedBy: number;
}

export class TopLevelMetricAggregationDto {
  parentCode?: string;
  parentName?: string; // not existing currently
  rawValue?: number;
  adjustedValue?: number;
  evidenced?: number;

  unit?: string; // not existing currently

  selected?: boolean;
  projects?: ProjectLevelAggregationDto[] = [];
}

export interface ProjectLevelAggregationDto {
  title?: string;
  recordTypeId?: number;
  impactMasterId?: number;
  pin?: string;
  parentCode?: string;
  rawValue?: number;
  adjustedValue?: number;
  evidenced?: number;
  breakdown?: string;
  reviewId?: number;
  total: number;

  selected?: boolean;
}

export interface NewReviewsDto {
  reviewId: number;
  projectTitle: string;
  projectPin: string;
  quarter: string;
  recordType: string;
}

export interface ReviewMetricCodeForAdminL4ApprovalRejectionDto {
  reviewId: number;
  metricCode: string;
  parentCode: string;
  total: number;
}
export enum ReviewPageRole {
  Admin = 'admin',
  SeniorLeadership = 'seniorleadership',
}

export interface RecallTopLevelMetricInput {
  TopLevelMetricCode: string;
  ReviewId: number;
  Recallcomment: string;
  UserId: number;
}

export interface RecallTopLevelMetricResultDto {
  previousStageCode?: number | null;
  newStageCode?: number | null;
  message?: string;
}
export enum ReviewDetailPageActionKey {
  VIEWPROGRESS = 'VIEWPROGRESS',
  APPROVEMETRIC = 'APPROVEMETRIC',
  REJECTMETRIC = 'REJECTMETRIC',
  ISSUERESTATEMENT = 'ISSUERESTATEMENT',
  ISSUERECALL = 'ISSUERECALL',
  UPLOADDATACOLLECTIONEXCEL = 'UPLOADDATACOLLECTIONEXCEL',
  ADDCOMMENT = 'ADDCOMMENT',
  EDITMETRICS = 'EDITMETRICS',
  EDITREPORTEDVALUE = 'EDITREPORTEDVALUE',
  EDITRISKPERCENT = 'EDITRISKPERCENT',
  EDITBASELINE = 'EDITBASELINE',
  ADDEVIDENCE = 'ADDEVIDENCE',
  TAGUSERINCOMMENT = 'TAGUSERINCOMMENT',
  VIEWEVIDENCEEXTRACTION = 'VIEWEVIDENCEEXTRACTION',
  DELETEEVIDENCE = 'DELETEEVIDENCE',
}
export interface StartEndRestatementDto {
  ReviewId: number;
  UserId: number;
  Comment: string;
  Metrics: StartEndRestatementMetricDto[];
  Start: boolean;
}

export interface StartEndRestatementMetricDto {
  MetricId: number;
  MetricCode?: string;
}

export interface UpdateReviewMetricFRCommentDto {
  ReviewId: number;
  MetricId?: number;
  MetricCode?: string;
  Comment: string;
  UserId: number;
}

// ── Backward-compat aliases for renamed DTOs ──────────────────────────────────
export type ReviewItem = ReviewQueueDto;
export type ReviewDetail = ReviewDetailDto;
export type MetricRow = ReviewMetricDto;
