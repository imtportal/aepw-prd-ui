import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, tap, throwError } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { ApiResponse } from '../../../admin/projects/models/project-new.model';
import { PagedResponse } from '../../../../shared/models/paged-response';

import { GetReviewTasksRequest, ReviewTaskModel } from "../models/review-task.model"
import { ReviewStageListDto, ReviewStageRequestFilter } from '../models/review-stage.model';

@Injectable({
  providedIn: 'root',
})
export class ReviewTaskService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiBaseUrl}/Task`;

  getReviewApprovalTasks(
    request: GetReviewTasksRequest,
  ): Observable<ApiResponse<PagedResponse<ReviewTaskModel>>> {
    const params =<GetReviewTasksRequest> {
      pageNumber: request.pageNumber,
      pageSize: request.pageSize,
      stageCode: <number | null> request.stageCode,
      periodCode: request.periodCode || '',
      userId: request.userId,
    };

    if (
      !request.stageCode
    ) {
      delete params.stageCode;
    }

    return this.http
      .get<ApiResponse<PagedResponse<ReviewTaskModel>>>(this.apiUrl, {
        params: params as any,
      })
      .pipe(
        tap((response) => {
          // console.log('[ReviewTaskService] Get Review Approval Tasks Success:', response);
        }),
        catchError((error) => {
          // console.error('[ReviewTaskService] Get Review Approval Tasks Error:', error);
          return throwError(() => error);
        }),
      );
  }

  getReviewStageList(
    request: ReviewStageRequestFilter,
  ): Observable<ApiResponse<PagedResponse<ReviewStageListDto>>> {
    let params = new HttpParams();

    for (const [key, value] of Object.entries(request)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }

    return this.http.get<ApiResponse<PagedResponse<ReviewStageListDto>>>(
      `${this.apiUrl}/review-stage-list`,
      { params },
    );
  }
}
