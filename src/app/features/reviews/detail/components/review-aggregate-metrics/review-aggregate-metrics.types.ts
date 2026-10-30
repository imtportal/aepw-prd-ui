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


export interface ReviewAggregateMetricsAction {
  actionName: ReviewAggregateMetricsActionNames;
  metricCode?: string;
  reviewId?: number;
}

export enum ReviewAggregateMetricsActionNames {
  Recall = 'recall',
  GoBack = 'goback',
}