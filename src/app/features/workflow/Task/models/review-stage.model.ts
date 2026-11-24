export interface ReviewStageListDto {
  reviewApprovalId: number | null;
  pin: string | null;
  impactMasterId: number | null;
  projectTitle: string | null;
  projectType: string | null;
  reportingPeriod: string | null;
  topLevelMetric: string | null;
  reviewStage: string | null;
  approverId: number | null;
  approverName: string | null;
  projectStatusCode: string | null;
  projectStatus: string | null;
  reviewStageStatusCode: string | null;
  reviewStageStatus: string | null;

  programId: number | null;
  program: string | null;
  assignedUserId: number | null;
  assignedUserName: string | null;
  updatedOn: Date | string | null;
}


export interface ReviewStageRequestFilter {
  // Search
  search?: string | null;

  // Filters
  reviewStageId?: number | null;
  reportingPeriod?: string | null;
  year?: number | null;
  quarter?: string | null;

  tlmId?: number | null;
  programId?: number | null;
  recordTypeId?: number | null;
  l1UserId?: number | null;
  assignedUserId?: number | null;

  // Current / All
  reviewScope: string;

  // Pagination
  pageNumber: number;
  pageSize: number;

  // Sorting
  sortBy?: string | null;
  sortDirection: string;
}