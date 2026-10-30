import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, map, Observable, of, tap } from 'rxjs';
import {
  ReviewApprovalChangesPreviewDto,
  ReviewStageApprovalChangeRequest,
  ReviewStageOption,
  // ReviewPeriodOption as ReviewStageOption,
} from '../models/review-stage-management.model';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ApiResponse } from '../../../models/project.model';
import { checkTrailingSlash } from '../../../../../shared/utils/checkTrailingSlash';
import { environment } from '../../../../../../environments/environment';
import { ReviewStage } from '../../../../reviews/models/review.model';
import { SaveReviewStageRequest } from '../../../../reviews/create/create-review.types';

@Injectable({
  providedIn: 'root',
})
export class ReviewStageManagementService {
  private http = inject(HttpClient);
  private readonly apiUrl = checkTrailingSlash(environment.apiBaseUrl) + 'Review';

  private _loadingReviewStages = signal(false);
  public readonly loadingReviewStages = this._loadingReviewStages.asReadonly();

  private _stageOptions = signal<ReviewStageOption[]>([]);
  private previousStageValuesFromDB = signal<Map<string, boolean>>(new Map());
  public readonly stageOptions = this._stageOptions.asReadonly();

  private _savingReviewStages = signal(false);
  public readonly savingReviewStages = this._savingReviewStages.asReadonly();

  private _allReviewStagesActive = computed(() =>
    this._stageOptions().every((option) => option.isActive),
  );
  public readonly allReviewStagesActive = this._allReviewStagesActive;

  toggleStageOption(reviewStageId: number, isActive: boolean): void {
    const stageOptions = this._stageOptions();

    for (const stageOption of stageOptions) {
      if (stageOption.reviewStageId === reviewStageId) {
        stageOption.isActive = isActive;
        break;
      }
    }
    this._stageOptions.set([...stageOptions]);
  }

  toggleAllStageOptions(): void {
    const currentValue = this._allReviewStagesActive();
    const stageOptions = this._stageOptions();
    for (const stageOption of stageOptions) {
      stageOption.isActive = !currentValue;
    }
    this._stageOptions.set([...stageOptions]);
  }

  resetStageStates(): void {
    const previousStageValuesFromDB: Map<string, boolean> = this.previousStageValuesFromDB
      ? this.previousStageValuesFromDB()
      : new Map();
    const stageOptions = this._stageOptions();
    for (const stageOption of stageOptions) {
      const previousValue = previousStageValuesFromDB.get(stageOption.reviewStageId.toString());
      if (previousValue !== undefined) {
        stageOption.isActive = previousValue;
      }
    }
    this._stageOptions.set([...stageOptions]);
  }

  getReviewStages(showLoader: boolean = true): Observable<ReviewStageOption[]> {
    if (showLoader) {
      this._loadingReviewStages.set(true);
      this._stageOptions.set([]);
    }
    const headers = new HttpHeaders();

    return this.http
      .get<ApiResponse<ReviewStage[]>>(this.apiUrl + '/GetReviewStages', { headers })
      .pipe(
        catchError((err) =>
          of({ data: [], message: err.message, success: false } as ApiResponse<ReviewStage[]>),
        ),
        map((res) => {
          if (showLoader) {
            this._loadingReviewStages.set(false);
          }

          const count = 20;

          return (res.data || []).map(
            (elem) =>
              <ReviewStageOption>{
                reviewStageId: Number(elem.reviewStageId || 0),
                code: Number(elem.code),
                label: elem.description || elem.name || '',
                isActive: Boolean(elem.isActive),
              },
          );
        }),
        tap((options) => {
          this._stageOptions.set(options);

          const previousStageValuesFromDB = new Map<string, boolean>();
          for (const option of options) {
            previousStageValuesFromDB.set(option.reviewStageId.toString(), option.isActive);
          }

          this.previousStageValuesFromDB.set(previousStageValuesFromDB);
        }),
      );
  }

  saveReviewStageStates(userId: number) {
    const input: SaveReviewStageRequest[] = this._stageOptions().map((stage) => ({
      ReviewStageId: stage.reviewStageId,
      IsActive: stage.isActive,
    }));

    this._savingReviewStages.set(true);

    return this.http
      .post<ApiResponse<number>>(`${this.apiUrl}/SaveReviewStages?userId=${userId}`, input)
      .pipe(
        catchError((err) => {
          console.error('Error saving review stages:', err);

          return of({
            data: 0,
            message: err.message ?? 'Failed to save review stages.',
            success: false,
          } as ApiResponse<number>);
        }),
        tap((res) => {
          if (res.success && res.data === 1) {
            const previousValues = new Map<string, boolean>();

            for (const stage of this._stageOptions()) {
              previousValues.set(stage.reviewStageId.toString(), stage.isActive);
            }

            this.previousStageValuesFromDB.set(previousValues);
          }
        }),
        finalize(() => this._savingReviewStages.set(false)),
      );
  }

  public haveStageOptionsChanged = computed(() => {
    // console.log("haveStageOptionsChanged triggered", ( new Date() ).toTimeString());

    const previousStageValuesFromDB: Map<string, boolean> = this.previousStageValuesFromDB
      ? this.previousStageValuesFromDB()
      : new Map();
    const stageOptions = this.stageOptions();
    for (const stageOption of stageOptions) {
      if (
        stageOption.isActive != previousStageValuesFromDB.get(stageOption.reviewStageId.toString())
      ) {
        return true;
      }
    }

    return false;
  });
  /////////////////////////////////////////////////////////////////////////////////////////////
  getReviewStageApprovalChanges(stageChanges: ReviewStageApprovalChangeRequest[]) {
    return this.http
      .post<
        ApiResponse<ReviewApprovalChangesPreviewDto>
      >(`${this.apiUrl}/GetApprovalChanges`, stageChanges)
      .pipe(
        catchError((err) => {
          console.error('Error fetching review stage approval changes:', err);

          return of({
            data: null,
            message:
              err?.error?.message ??
              err?.message ??
              'Failed to fetch review stage approval changes.',
            success: false,
          } satisfies ApiResponse<ReviewApprovalChangesPreviewDto | null>);
        }),
      );
  }
  getChangedStageRequests(): ReviewStageApprovalChangeRequest[] {
    const previousValues = this.previousStageValuesFromDB();

    return this._stageOptions()
      .filter((stage) => stage.isActive !== previousValues.get(stage.reviewStageId.toString()))
      .map((stage) => ({
        StageCode: stage.code,
        IsActive: stage.isActive,
      }));
  }
}
