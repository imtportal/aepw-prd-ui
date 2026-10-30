export interface ReviewStageApprovalChangeRequest {
  StageCode: number;
  IsActive: boolean;
}

export interface ReviewApprovalChangeRecord {
  reviewApprovalId: number | null;
  reviewId: number;
  reviewTitle: string;
  metricId: number;
  metricCode: string;
  metricName: string;
  statusId: number | null;
  currentStatusId: number | null;
  statusCode: string | null;
  currentStatus: string | null;
  assigneeUserId: number | null;
  stepNo: number | null;
  attemptNo: number | null;
  isCurrent: boolean | null;
  action: string;
}

export interface ReviewStageApprovalChanges {
  stageCode: number;
  stageName: string;
  changes: ReviewApprovalChangeRecord[];
}

export interface ReviewApprovalChangesPreviewDto {
  disablePreview: ReviewStageApprovalChanges[];
  enablePreview: ReviewStageApprovalChanges[];
}
export interface ReviewStageOption {
  label: string;
  reviewStageId: number;
  code: number;
  isActive: boolean;
}

export interface ReviewStageApprovalChangeRequest {
  StageCode: number;
  IsActive: boolean;
}