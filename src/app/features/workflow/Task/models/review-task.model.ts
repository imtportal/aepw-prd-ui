export interface ReviewTaskModel {
  reviewId: number;
  publicId: string;
  impactMasterId: number;
  pin: string;
  title: string;
  recordTypeId: number;
  recordTypeName: string;
  statusId: number;
  statusName: string;
  periodCode: string | null;
  stage: number;
  stageName: string;
  metricCategories: string | null;
  createdOnUTC: string;
  updatedOnUTC: string | null;
}

export interface GetReviewTasksRequest {
  pageNumber: number;
  pageSize: number;
  stageCode?: number | null;
  periodCode: string | null;
  userId: number;
}
export interface SeniorLeadershipReviewTask {
  quarter: string;
  categoryCode: string;
  categoryName: string;
}