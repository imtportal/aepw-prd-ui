import { Injectable, inject, signal } from '@angular/core';
import { catchError, finalize, map, Observable, of, Subject, take, tap } from 'rxjs';

import { ReviewService } from '../../../services/review.service';
import { EvidenceDetailDto, ReviewMetricsByIdSourceNames } from './review-metrics-by-id.types'; 
import { ReviewDto, ReviewMetricDto } from '../../../models/review.model';

export interface ReviewMetricsEvidenceRow {
  evidenceId: number;
  fileName: string;
  evidenceCategory: string;
  site: string;
  date: string;
  aiConfidencePct: number;
  capturedValue: number;
  contributionPct: number;
}

export interface ReviewMetricsSubMetric {
  code: string;
  name: string;
  reported: number;
  captured: number;
  riskPct: number;
  riskAdjustmentTonnes: number;
  additionalDetails: string;
  evidenceRows: ReviewMetricsEvidenceRow[];
}

export interface ReviewMetricsTopMetric extends ReviewMetricDto {
  // code: string;
  // name: string;
  // metricDescription?: string;
  // categoryCode: string;
  // reported: number;
  // captured: number;
  // riskPct: number;
  // riskAdjustmentTonnes: number;

   
  l1Metrics: ReviewMetricDto[]  ;
}

export interface ReviewMetricsCategorySummary {
  code: string;
  name: string;
  color: string;
  uploadedEvidence: number;
  categoryId?: number;
  requiredEvidence: number;
}

export interface ReviewMetricsPageData {
  reviewId: string;
  periodLabel: string;
  phaseLabel: string;
  roleLabel: string;
  categories: ReviewMetricsCategorySummary[];
  topMetrics: ReviewMetricsTopMetric[];
  stage: string;
  allowRestatement?: boolean;
  atLeastOneMetricAssigned?: boolean;
  stageDisplayValue: string;
}

// const CATEGORY_META: Record<string, { name: string; color: string }> = {
//   MW: { name: 'Reduce Unmanaged Waste', color: '#006699' },
//   CV: { name: 'Capture Value from Waste', color: '#086D37' },
//   EE: { name: 'Enable the Ecosystem', color: '#99CC66' },
//   MC: { name: 'Mobilise Capital', color: '#DE785E' },
//   SB: { name: 'Create Social Benefit', color: '#95CAD5' },
// };

@Injectable({ providedIn: 'root' })
export class ReviewMetricsByIdService {
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private readonly reviewService = inject(ReviewService);

  public readonly refreshReviewMetricsData: Subject<void> = new Subject<void>();
  public readonly baselineCalculation = signal<{ [reviewId: number]: { [metricCode: string]: string } }>({});

  load(input: {reviewId: string, userId: number, stageId: number | null, sourcePage?: ReviewMetricsByIdSourceNames}, skipLoader = false): Observable<ReviewMetricsPageData | null> {
    if (!skipLoader) {
      this.loading.set(true);
      this.error.set(null);
    }

    return this.reviewService.getReviewByReviewId(input).pipe(
      map(review => review ? this.mapReview(review) : null),
      tap(() => {
        this.error.set(null)
        this.updateBaselineCalculation(+(input.reviewId));
      }),
      catchError(() => {
        this.error.set('Unable to load review metrics.');
        return of(null);
      }),
      finalize(() => {
        if (!skipLoader) {
          this.loading.set(false);
        }
      }),
    );
  }

  updateBaselineCalculation(reviewId: number) {
    this.reviewService.getBaselineRemainder(String(reviewId)).pipe(take(1))
    .subscribe(remainders => {
      const baselineCalculation = this.baselineCalculation();

      const existingMetrics = baselineCalculation[reviewId] || {};

      for (const remainder of remainders) {
        existingMetrics[remainder.metricCode] = remainder.baseline;
      }

      baselineCalculation[reviewId] = existingMetrics;

      this.baselineCalculation.set(baselineCalculation);
    })
  }

  private mapReview(review: ReviewDto): ReviewMetricsPageData {
    const metrics = review.reviewMetrics ?? [];
    const categories = this.buildCategories(metrics);
    const topMetrics = this.buildTopMetrics(metrics);

    return {
      ...review,
      reviewId: String(review.reviewId),
      periodLabel: review.reviewPeriodCode ?? `Review ${review.reviewId}`,
      phaseLabel: review.stageDisplayValue ?? review.stageName ?? review.stage,
      roleLabel: review.assigneeName || '—',
      categories,
      topMetrics,
      stage: review.stage,
      stageDisplayValue: review.stageDisplayValue || "",
    };
  }

  private buildCategories(metrics: ReviewMetricDto[]): ReviewMetricsCategorySummary[] {
    const defaultCategoryColor: string = "#64748b";

    const result: Map<string, ReviewMetricsCategorySummary> = new Map();

    for (const metric of metrics) {
      if (result.has(metric.categoryCode)) {
        continue;
      }

      const categoryData = { categoryId: metric.categoryId, code: metric.categoryCode, name: metric.categoryName || "", color: metric.categoryColor || defaultCategoryColor, uploadedEvidence: 0, requiredEvidence: 0 };

      result.set(metric.categoryCode, categoryData);
    }

    return (Array.from(result.values()) || []).sort((m1, m2) => ((m1.categoryId || 0) - (m2.categoryId || 0))); 
  }

  private buildTopMetrics(metrics: ReviewMetricDto[]): ReviewMetricsTopMetric[] {
    const topLevelMetricsMap = new Map<number, { topLevelMetric?: ReviewMetricDto; l1Metrics?: ReviewMetricDto[] }>();

    for (const metric of metrics) {
        if (metric.isTopLevel) {
            if (!topLevelMetricsMap.has(metric.metricId)) {
                topLevelMetricsMap.set(metric.metricId, { topLevelMetric: metric, l1Metrics: [] });
            }
            else {
                const existing = topLevelMetricsMap.get(metric.metricId);
                if (existing) {
                    existing.topLevelMetric = metric;
                    topLevelMetricsMap.set(metric.metricId, existing);
                }
            }
            continue;
        }

        if (metric.parentMetricId == undefined) {
            continue;
        }

        const parentMetric = topLevelMetricsMap.get(metric.parentMetricId);
        if (parentMetric) {
            parentMetric.l1Metrics?.push(metric);
        }

        else {
            topLevelMetricsMap.set(metric.parentMetricId, { topLevelMetric: undefined, l1Metrics: [metric] });
        }
    }

    return Array.from(topLevelMetricsMap.values()).filter(m => m.topLevelMetric).map(({ topLevelMetric, l1Metrics }) => {
        
        if (!topLevelMetric) {
            topLevelMetric = {} as ReviewMetricDto;
        }

        const reviewMetricsTopMetric: ReviewMetricsTopMetric = {
            // code: topLevelMetric.metricCode,
            // name: topLevelMetric.metricName,
            // categoryCode: topLevelMetric.categoryCode,
            // reported: 0,
            // captured: 0,
            // riskPct: topLevelMetric.riskOriginal ?? 0,
            // riskAdjustmentTonnes: 0,
            ...topLevelMetric,
            l1Metrics: l1Metrics || [],
        };
    
        return reviewMetricsTopMetric;
        // return {...topLevelMetric!, l1Metrics: l1Metrics || []};
    });
    

    // const result = metrics
    //   .filter(metric => this.isTopLevelMetric(metric))
    //   .sort((a, b) => a.metricCode.localeCompare(b.metricCode))
    //   .map(metric => ({
    //     code: metric.metricCode,
    //     name: metric.metricName,
    //     categoryCode: metric.categoryCode ?? 'UNASSIGNED',
    //     reported: this.toNumber(metric.reportedValue),
    //     captured: metric.evidenceUploadCount ?? 0,
    //     riskPct: this.riskPct(metric),
    //     riskAdjustmentTonnes: metric.evidenceCount ?? 0,
    //     subMetrics: this.buildL1Metrics(metrics, metric.parentMetricId),
    //   }));


    // return result;
  }

//   private buildL1Metrics(metrics: ReviewMetricDto[], parentCode: number): ReviewMetricsSubMetric[] {
//     const result = metrics
//     .filter(metric => metric.parentMetricId === parentCode)
//     .sort((a, b) => a.metricCode.localeCompare(b.metricCode))
//     .map(metric => ({
//         code: metric.metricCode,
//         name: metric.metricName,
//         reported: this.toNumber(metric.reportedValue),
//         captured: metric.evidenceUploadCount ?? 0,
//         riskPct: this.riskPct(metric),
//         riskAdjustmentTonnes: metric.evidenceCount ?? 0,
//         additionalDetails: this.additionalDetails(metric),
//         evidenceRows: this.buildEvidenceRows(metric.evidenceFiles ?? []),
//     }));

//     return result; 
//   }

  private buildEvidenceRows(evidenceFiles: EvidenceDetailDto[]): ReviewMetricsEvidenceRow[] {
    return evidenceFiles.map(file => ({
      evidenceId: file.evidenceId ?? 0,
      fileName: file.fileName ?? '',
      evidenceCategory: file.evidenceType ?? '',
      site: file.siteTag ?? '—',
      date: file.uploadedDate ?? '',
      aiConfidencePct: 0,
      capturedValue: 0,
      contributionPct: 0,
    }));
  }

  private riskPct(metric: ReviewMetricDto): number {
    return metric.riskPctEffective ?? metric.riskPctProposed ?? metric.riskOriginal ?? 0;
  }

  private additionalDetails(metric: ReviewMetricDto): string {
    return metric.validationWarning || metric.raReason || metric.raReviewComment || '';
  }

  private isTopLevelMetric(metric: ReviewMetricDto): boolean {
    return metric.isTopLevel ? true : false;
  }

  private toNumber(value: string | number | null | undefined): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }

    if (typeof value === 'number') {
      return value;
    }

    const parsed = Number(value.replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
}