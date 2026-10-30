export type {
  ReviewDto,
  ReviewMetricDto,
  ReviewCommentDto,
  ReviewDetailDto,
  MetricRow,
} from '../../../models/review.model';

export type {
  EvidenceDetailDto,
} from '../../../../evidence/models/evidence.model';


export interface ReviewMetricsByIdAction {
  actionName: ReviewMetricsByIdActionNames;
  metricCode?: string;
  reviewId?: number;
}

export enum ReviewMetricsByIdActionNames {
  Recall = 'recall',
  GoBack = 'goback',
}

export enum ReviewMetricsByIdSourceNames {
  ReviewDetail = 'ReviewDetail',
  ProjectLibrary = 'ProjectLibrary',
}