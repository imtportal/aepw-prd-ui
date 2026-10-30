import { inject, Injectable, signal } from '@angular/core';
import { ApprovalCycleRecord, PendingRiskAdjustmentReview, RiskOverride } from '../create-review.types';
import { map, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { ApiResponse } from '../../../admin/models/project.model';
import { ReviewDto, ReviewMetricDto, ReviewWorkflowStage } from '../../models/review.model';
import { mapStageToFormattedKeys } from '../../../dashboard/containers/dashboard-page.model';
import { checkTrailingSlash } from '../../../../shared/utils/checkTrailingSlash';

const STORAGE_KEY = 'aepw-pending-reviews';

@Injectable({ providedIn: 'root' })
export class PendingRiskAdjustmentReviewService {
  private readonly _reviews = signal<PendingRiskAdjustmentReview[]>(this.load());

  readonly reviews = this._reviews.asReadonly();

  private http: HttpClient = inject(HttpClient);
  private readonly apiUrl = checkTrailingSlash(environment.apiBaseUrl, false) + "/Review";

  add(draft: Omit<PendingRiskAdjustmentReview, 'id' | 'createdAt'>): PendingRiskAdjustmentReview {
    // If an active (non-draft) entry already exists for this project+period,
    // archive its current cycle into history and update it in place.
    const existing = this._reviews().find(
      r => r.projectId === draft.projectId && r.period === draft.period && r.status !== 'draft',
    );

    if (existing) {
      const archivedCycle: ApprovalCycleRecord = {
        riskOverrides:    existing.riskOverrides,
        newOverrideCodes: existing.newOverrideCodes ?? Object.keys(existing.riskOverrides),
        status:           existing.status === 'approved' ? 'approved' : 'rejected',
        rejectionInfo:    existing.rejectionInfo,
        createdAt:        existing.createdAt,
      };
      const updated: PendingRiskAdjustmentReview = {
        ...existing,
        ...draft,
        id:              existing.id,
        createdAt:       new Date().toISOString(),
        approvalHistory: [...(existing.approvalHistory ?? []), archivedCycle],
      };
      this._reviews.update(arr => arr.map(r => r.id === existing.id ? updated : r));
      this.persist();
      return updated;
    }

    const saved: PendingRiskAdjustmentReview = {
      ...draft,
      id:        crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this._reviews.update(arr => [...arr, saved]);
    this.persist();
    return saved;
  }

  approve(id: string): void {
    this._reviews.update(arr =>
      arr.map(r => r.id === id ? { ...r, status: 'approved' as const, rejectionInfo: undefined } : r)
    );
    this.persist();
  }

  reject(id: string, rejectionInfo: Record<string, string>): void {
    this._reviews.update(arr =>
      arr.map(r => r.id === id ? { ...r, status: 'rejected' as const, rejectionInfo } : r)
    );
    this.persist();
  }

  update(id: string, changes: Partial<Omit<PendingRiskAdjustmentReview, 'id' | 'createdAt'>>): void {
    this._reviews.update(arr =>
      arr.map(r => r.id === id ? { ...r, ...changes } : r)
    );
    this.persist();
  }

  getById(id: string): Observable<PendingRiskAdjustmentReview | undefined> {
    const existingCachedReview = this._reviews().find(r => r.id === id);

    if (!existingCachedReview) {
      return this.http.get<ApiResponse<ReviewDto[]>>(this.apiUrl + "/GetReviewById/" + id)
      .pipe(
        map(res => {
          const [ review ]: ReviewDto[] = res.data;

          const metricCodes: string[] = [];
          const mandatoryCodes: string[] = [];
          const riskOverrides: Record<string, RiskOverride> = {};
          const rejectionInfo: Record<string, string> = {};

          for (const m of review.reviewMetrics) {
            metricCodes.push(m.metricCode);
            
            if (m.isRequired) {
              mandatoryCodes.push(m.metricCode);
            }

            // if (m.riskPctProposed && !isNaN(+m.riskPctProposed)) {
            //   const pendingReviewStatusValues = mapStageToFormattedKeys({ "Pending Risk Adjust": "true" });
            //   if (review.stageDisplayValue && pendingReviewStatusValues[review.stageDisplayValue]) {
            //     riskOverrides[m.metricCode] = { risk: +m.riskPctProposed, reason: m.raReason || "" }
            //   }
            //   else {
            //     riskOverrides[m.metricCode] = { risk: +(m.riskPctEffective || m.riskOriginal || 0), reason: m.raReason || "" }
            //   }

            // }
            if (m.riskPctEffective && !isNaN(+m.riskPctEffective)) {
              riskOverrides[m.metricCode] = { risk: +m.riskPctEffective, reason: m.raReason || "" }
            }


            if (m.raStatus?.toLowerCase() == "rejected") {
              rejectionInfo[m.metricCode] = m.raReviewComment || "";
            }

          } 
          

          const result: PendingRiskAdjustmentReview = {
            id: String(review.reviewId),
            projectId: String(review.impactMasterId),
            projectName: String(review.projectName),
            period: String(review.reviewPeriodId),
            metricCodes,
            mandatoryCodes,
            riskOverrides,
            rejectionInfo,
            newOverrideCodes: [],
            approvalHistory: [],
            status: review.stageName as ReviewWorkflowStage,
            statusDisplayValue: review.stageDisplayValue,
            // savedAtStep: null,
            createdAt: "",
            reviewMetrics: review.reviewMetrics,
            // rejectionInfo: null,
          } as PendingRiskAdjustmentReview; 

          return result;
        })
      );
    }

    return of (existingCachedReview);
  }

  private load(): PendingRiskAdjustmentReview[] {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as PendingRiskAdjustmentReview[]) : [];
    } catch {
      return [];
    }
  }

  private persist(): void {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this._reviews()));
  }
}
