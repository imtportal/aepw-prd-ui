import { ReviewMetricDto, ReviewWorkflowStage } from "../models/review.model";

export interface RiskOverride {
  risk:   number;
  reason: string;
}

export interface ApprovalCycleRecord {
  riskOverrides:    Record<string, RiskOverride>;
  newOverrideCodes: string[];          // which codes were new in that cycle
  status:           'approved' | 'rejected';
  rejectionInfo?:   Record<string, string>;
  createdAt:        string;
}

export interface PendingRiskAdjustmentReview {
  id:               string;
  projectId:        string;
  projectName:      string;
  period:           string;
  metricCodes:      string[];
  mandatoryCodes:   string[];
  riskOverrides:    Record<string, RiskOverride>;
  newOverrideCodes?: string[];          // codes new in the CURRENT cycle (excludes previously approved)
  approvalHistory?: ApprovalCycleRecord[]; // finalized prior cycles, oldest first
  status:           ReviewWorkflowStage
  statusDisplayValue?: string;
  savedAtStep?:     number;
  createdAt:        string;
  rejectionInfo?:   Record<string, string>; // metric code → approver's rejection reason

  reviewMetrics?: ReviewMetricDto[];
}

export interface CreateReviewPayload {
  projectId:     string;
  projectName:   string;
  period:        string;
  metricCodes:   string[];
  riskOverrides: Record<string, RiskOverride>;
  status:        ReviewWorkflowStage;
}

export const REVIEW_PERIODS = [
  'Q1 2026', 'Annual 2025', 'Q3 2025', 'Q2 2025', 'Q1 2025',
  'Annual 2024', 'Q4 2024', 'Q3 2024',
];

export const WIZARD_STEPS: { label: string, key?: string }[] = [
  { label: '', key: 'PROJECT' },
  { label: '', key: 'METRICS' },
  { label: '', key: 'RISK_ADJUSTMENT' },
  { label: '', key: 'LAUNCH' },
];

export class CreateReviewRequestDto {
  ReviewId: number | null = null;
  ProjectId: number | null = null;
  ReviewPeriodId: number | null = null;
  Stage: string = "";
  LaunchedUtc?: Date;
  SubmittedUtc?: Date;
  ClosedUtc?: Date;
  DataCompletionPct?: number;
  EvidenceConfirmedPct?: number;
  IsRestated?: boolean;
  UserId: number = 0;
  "ReviewMetrics": CreateReviewMetricJsonDto[] = []
}

export class CreateReviewMetricJsonDto {
  ReviewMetricId?: number;
  ReviewId?: number;
  MetricId?: number;
  Applicability?: string;
  RiskPctProposed?: number | null = 0;
  RiskPctEffective?: number = 0;
  RaStatus?: string = "Pending";
  RaApprovedByUserId?: number = 0;
  RaApprovedUtc?: Date;
  RaReason?: string | null = "";
  ValidationStatus?: string = "";
  EvidenceCount?: number;
  VarianceAbs?: number;
  VariancePct?: number;
  RawValue?: number;
  AdjustedValue?: number;
  LastValueSource?: string;
  LastValueEnteredByUserId?: number;
  LastValueEnteredUtc?: string

  IsRequired: number = 0;
}

export interface SaveReviewStageRequest {
  ReviewStageId: number;
  IsActive: boolean;
}


export interface ReviewPeriodDto {
    reviewPeriodId: number;
    year: number;
    periodCode: string;
    startUtc: string;
    endUtc: string;
    submissionDueUtc: string;
    createdBy: number;
    createdOnUTC: string;

    isCurrent?: boolean;
}