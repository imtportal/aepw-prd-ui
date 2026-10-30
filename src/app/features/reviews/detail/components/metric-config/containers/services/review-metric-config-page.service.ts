import { inject, Injectable, signal } from '@angular/core';
import { ReviewDetail, ReviewDetailDto, ReviewDto } from '../../../../../models/review.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../../../../../environments/environment';
import { checkTrailingSlash } from '../../../../../../../shared/utils/checkTrailingSlash';
import { ApiResponse } from '../../../../../../../core/models/api-response.model';
import { map, tap } from 'rxjs';


export interface ImpactMasterMetricCategory {
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  categoryColor?: string;
  metrics: ImpactMasterMetric[];
}

export interface ImpactMasterMetric {
  metricId: string;
  metricCode: string;
  metricName: string;
  description?: string;

  isTopLevel: boolean;
  isActive: boolean;

  metricUnitId?: string;
  unitName?: string;

  impactMasterMetricId?: string;

  parentMetricId?: string;
  parentMetricName?: string;

  baselinePct?: number;
  riskPct?: number;
  averageRiskPct?: number;

  categoryId: number;

  isRiskAdjustmentRequired: boolean;
  isICPRequired: boolean;

  children: ImpactMasterMetric[];
  evidenceTypes: EvidenceType[];
}

export interface EvidenceType {
  // Currently empty in the payload
  [key: string]: unknown;
}

@Injectable({
  providedIn: 'root',
})
export class ReviewMetricConfigPageService {
  
  private readonly _reviewDetail = signal<ReviewDto | null>(null);
  private readonly http       = inject(HttpClient);
  private readonly apiUrl     = checkTrailingSlash(environment.apiBaseUrl, false);

  
  public metricParentCodes = signal<{ [metricCode: string]: string }>({});
  public get reviewDetail() {
    return this._reviewDetail.asReadonly();
  }

  public setReviewDetail(reviewDetail: ReviewDto | null) {
    this._reviewDetail.set(reviewDetail);
  }

  public saveMetricsConfig(reviewId: number, metrics: string[], userId: number) {
    const headers = new HttpHeaders().set('userId', userId.toString());
    return this.http.post<ReviewDetailDto>(`${this.apiUrl}/Review/SaveReviewMetricConfig/${reviewId}`, metrics, { headers });
  }

  public getImpactMasterMetrics(impactMetricId: number) {
    return this.http.get<ApiResponse<ImpactMasterMetricCategory[]>>(`${this.apiUrl}/ImpactMaster/${impactMetricId}/metrics`)
    .pipe(
      map(res => <ImpactMasterMetricCategory[]> res.data || [])
      , 
      tap(dataList => {
        for (const metric of dataList) {
          for (const topMetric of metric.metrics) {
            this.metricParentCodes.update(s => {
            
              s[topMetric.metricCode] = topMetric.metricCode;
              return s;
            });
          }
        }
      })
    );
  }

  public getAssignableMetricsForReview(reviewId: number) {
    return this.http.get<ApiResponse<ImpactMasterMetricCategory[]>>(`${this.apiUrl}/Metric/GetAssignableMetricsForReview/${reviewId}`)
    .pipe(
      map(res => <ImpactMasterMetricCategory[]> res.data || [])
      , 
      tap(dataList => {
        for (const metric of dataList) {
          for (const topMetric of metric.metrics) {
            this.metricParentCodes.update(s => {
            
              s[topMetric.metricCode] = topMetric.metricCode;
              return s;
            });
          }
        }
      })
    );
  }
}
