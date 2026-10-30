import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, delay, map, Observable, of, tap, throwError, timer } from 'rxjs';
import {
  ReviewListDto,
  ReviewQueueDto,
  ReviewDetailDto,
  ReviewApprovalStatus,
  ReviewCommentDto,
  ReviewWorkflowStage,
  ReviewDto,
  GetReviewFilters,
  ReviewStageLookupDto,
  MetricRiskResponseJSON,
  ReviewExcelUploadDto,
  UpdateReviewMetricsValuesDto,
  BaselineRemainderDto,
  ReviewMetricApproveRejectDto,
  ReviewApprovalProgressDto,
  ProjectLevelAggregationDto,
  TopLevelMetricAggregationDto,
  ReviewMetricCodeForAdminL4ApprovalRejectionDto,
  NewReviewsDto,
  RecallTopLevelMetricInput,
  RecallTopLevelMetricResultDto,
  StartEndRestatementDto,
  UpdateReviewMetricFRCommentDto,
  UpdateReviewApprovalAssigneeRequest,
} from '../models/review.model';
import {
  ApiResponse,
  PaginatedResponse,
  PagedRequest,
} from '../../../core/models/api-response.model';
import {
  CreateReviewRequestDto,
  PendingRiskAdjustmentReview,
  RiskOverride,
} from '../create/create-review.types';
import { environment } from '../../../../environments/environment';
import { checkTrailingSlash } from '../../../shared/utils/checkTrailingSlash';
import { BulkProject } from '../../admin/models/project.model';
import { ReviewMetricsByIdSourceNames } from '../detail/components/review-metrics-by-id/review-metrics-by-id.types';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly http = inject(HttpClient);
  private readonly useMocks = false; // flip to false when endpoint is ready
  private readonly apiUrl = checkTrailingSlash(environment.apiBaseUrl) + 'Review';
  private readonly mockApiUrl = checkTrailingSlash(environment.apiBaseUrl2, false) + '/reviews';

  private get url(): string {
    return this.useMocks ? this.mockApiUrl : this.apiUrl;
  }

  private readonly _reviews = signal<ReviewListDto[]>([]);
  private readonly _reviewerQueue = signal<ReviewQueueDto[]>([]);

  readonly reviews = this._reviews.asReadonly();
  readonly reviewerQueue = this._reviewerQueue.asReadonly();
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private readonly _savingAsDraft = signal<boolean>(false);
  readonly savingAsDraft = this._savingAsDraft.asReadonly();

  updateReviewApprovalAssignee(
    request: UpdateReviewApprovalAssigneeRequest,
  ): Observable<ApiResponse<boolean>> {
    return this.http
      .put<ApiResponse<boolean>>(`${this.apiUrl}/UpdateReviewApprovalAssignee`, request)
      .pipe(
        tap((res) => {
          console.log('[ReviewService] Update Review Approval Assignee Success:', res);
        }),
        catchError((err) => {
          console.error('[ReviewService] Update Review Approval Assignee Error:', err);
          return throwError(() => err);
        }),
      );
  }

  getReviews(filters: GetReviewFilters): Observable<PaginatedResponse<ReviewListDto>> {
    const params = new HttpParams()
      .set('project', filters.Project)
      .set('pm', filters.PM)
      .set('stage', filters.Stage)
      .set('sortBy', filters.SortBy)
      .set('sortDesc', filters.SortDesc.toString())
      .set('ReviewPeriodId', filters.ReviewPeriodId);
    return this.http.get<ApiResponse<ReviewDto[]>>(this.apiUrl, { params }).pipe(
      map((res) => {
        const data: ReviewListDto[] = [];

        for (const review of res.data) {
          const reviewListElem: ReviewListDto = {
            reviewId: review.reviewId,
            projectId: review.impactMasterId,
            project: review.projectName,
            pm: review.pmName,
            recipient: review.fundingRecipientName,
            stage: review.stage as ReviewWorkflowStage,
            stageDisplayValue: review.stageDisplayValue,
            dataCollectionFolderUrl: review.dataCollectionFolderUrl,
            dataCompletionPct: review.dataCompletionPct,
            evidenceConfirmedPct: review.evidenceConfirmedPct,
            updatedAt: 'review.updatedAt',
            quarter: review.quarter,

            updatedOnStr: review.updatedOnStr,
          };

          data.push(reviewListElem);
        }

        return {
          data,
          total: res.data.length,
        } as PaginatedResponse<ReviewListDto>;
      }),
      tap((reviews) => {
        this._reviews.set(reviews.data);
      }),
    );
  }

  loadPagedReviews(params: PagedRequest): Observable<PaginatedResponse<ReviewListDto>> {
    let p = new HttpParams().set('page', params.page).set('pageSize', params.pageSize);
    if (params.filters) {
      Object.entries(params.filters).forEach(([k, v]) => {
        if (v) p = p.set(k, v);
      });
    }
    return this.http.get<PaginatedResponse<ReviewListDto>>(this.url, { params: p }).pipe(
      tap((res) => {
        this._reviews.set(res.data);
        console.log('[ReviewService] Load Paged Reviews Success:', res);
      }),
      catchError((err) => {
        console.error('[ReviewService] Load Paged Reviews Error:', err);
        return throwError(() => err);
      }),
    );
  }

  loadPagedQueue(params: PagedRequest): Observable<PaginatedResponse<ReviewQueueDto>> {
    let p = new HttpParams().set('page', params.page).set('pageSize', params.pageSize);
    if (params.filters) {
      Object.entries(params.filters).forEach(([k, v]) => {
        if (v) p = p.set(k, v);
      });
    }
    return this.http
      .get<PaginatedResponse<ReviewQueueDto>>(`${this.url}/queue`, { params: p })
      .pipe(
        tap((res) => {
          this._reviewerQueue.set(res.data);
          console.log('[ReviewService] Load Paged Queue Success:', res);
        }),
        catchError((err) => {
          console.error('[ReviewService] Load Paged Queue Error:', err);
          return throwError(() => err);
        }),
      );
  }

  getReviewByPublicId(publicId: string): Observable<ReviewDto> {
    const headers = new HttpHeaders().set('PublicId', publicId);
    return this.http
      .get<ApiResponse<ReviewDto[]>>(this.apiUrl + '/GetReviewByPublicId', { headers })
      .pipe(
        map((res) => {
          const [review]: ReviewDto[] = res.data;

          return review;
        }),
      );
  }

  getReviewByReviewId(input: {
    reviewId: string;
    userId: number;
    stageId: number | null;
    sourcePage?: ReviewMetricsByIdSourceNames;
  }): Observable<ReviewDto> {
    if (!input.sourcePage) {
      input.sourcePage = ReviewMetricsByIdSourceNames.ReviewDetail;
    }

    const headers = new HttpHeaders()
      .set('UserId', String(input.userId))
      .set('stage', String(input.stageId))
      .set('sourcePage', String(input.sourcePage));
    return this.http
      .get<ApiResponse<ReviewDto[]>>(this.apiUrl + '/GetReviewById/' + input.reviewId, { headers })
      .pipe(
        map((res) => {
          const [review]: ReviewDto[] = res.data;

          // temporarily disabling check

          for (const review of res.data) {
            // Uncomment when local
            // review.reviewMetrics.forEach(metric => {
            //   metric.allowAction = true
            // });

            // shortening comments
            for (const comment of review.comments || []) {
              if (comment.body.length > 100) {
                comment.shortenedBody = comment.body.substring(0, 100);
              }
            }

            // .forEach(comment => {
          }

          return review;
        }),
      );
  }

  getReviewDetail(projectId: number): Observable<ApiResponse<ReviewDto>> {
    return this.http.get<ApiResponse<ReviewDto>>(`${this.url}/${projectId}`).pipe(
      tap((res) => {
        console.log('[ReviewService] Get Review Detail Success:', res);
      }),
      catchError((err) => {
        console.error('[ReviewService] Get Review Detail Error:', err);
        return throwError(() => err);
      }),
    );
  }

  // getImpactsWithActiveReviews(pageNo: number, skippedRows: number, itemsPerPage: number) {
  //   const headers = new HttpHeaders()
  //     .set('pageNo', String(pageNo))
  //     .set('skippedRows', String(skippedRows))
  //     .set('itemsPerPage', String(itemsPerPage));
  //   return this.http.get<ApiResponse<BulkProject[]>>(`${this.url}/GetImpactsWithActiveReviews`, {headers}).pipe(
  //     map(x => x)
  //   )
  // }

  updateMetricStatus(
    projectId: number,
    metricCode: string,
    field: 'pmStatus' | 'reviewStatus' | 'leadStatus',
    value: ReviewApprovalStatus,
  ): Observable<ApiResponse<boolean>> {
    return this.http
      .patch<
        ApiResponse<boolean>
      >(`${this.url}/${projectId}/metrics/${metricCode}/status`, { field, value })
      .pipe(
        tap((res) => {
          console.log('[ReviewService] Update Metric Status Success:', res);
        }),
        catchError((err) => {
          console.error('[ReviewService] Update Metric Status Error:', err);
          return throwError(() => err);
        }),
      );
  }

  updateApprovalStep(
    projectId: number,
    stepId: 'pmStatus' | 'reviewerStatus' | 'leadStatus' | 'finalStatus',
    action: 'approved' | 'rejected' | 'recycled',
  ): Observable<ApiResponse<boolean>> {
    return this.http
      .patch<ApiResponse<boolean>>(`${this.url}/${projectId}/approval`, { stepId, action })
      .pipe(
        tap((res) => {
          console.log('[ReviewService] Update Approval Step Success:', res);
        }),
        catchError((err) => {
          console.error('[ReviewService] Update Approval Step Error:', err);
          return throwError(() => err);
        }),
      );
  }

  addComment(
    reviewId: number,
    body: string,
    mentionedUsers: number[],
    stage: number | string,
    userId: number,
  ): Observable<ApiResponse<ReviewCommentDto | null>> {
    return this.http
      .post<
        ApiResponse<ReviewCommentDto>
      >(`${this.apiUrl}/AddComment`, [{ ReviewId: reviewId, Body: body, UserId: userId, MentionedUsers: mentionedUsers, Stage: stage }])
      .pipe(
        catchError((err) => {
          console.error('[ReviewService] Add Comment Error:', err);
          return of({ data: null, status: -1 } as ApiResponse<ReviewCommentDto | null>);
        }),
        tap((res) => {
          console.log('[ReviewService] Add Comment Success:', res);
        }),
      );
  }

  bulkLaunch(projectIds: number[], userId: number, quarter?: string): Observable<ApiResponse<NewReviewsDto[]>> {
    let headers: HttpHeaders = new HttpHeaders().set('userId', String(userId));

    if (quarter?.trim()) {
      headers = headers.set('quarter', quarter);
    }
    return this.http
      .post<
        ApiResponse<NewReviewsDto[]>
      >(`${this.apiUrl}/BulkLaunchReviews`, projectIds, { headers })
      .pipe(
        catchError(() =>
          of({ data: [], success: false, status: -1, message: 'some error occured' } as ApiResponse<
            NewReviewsDto[]
          >),
        ),
        tap((res) => {
          this._reviews.update((reviews) =>
            reviews.map((r) =>
              projectIds.includes(r.projectId)
                ? { ...r, stage: 'Data Collection' as ReviewWorkflowStage }
                : r,
            ),
          );
          console.log('[ReviewService] Bulk Launch Success:', res);
        }),
        // catchError(err => {
        //   console.error('[ReviewService] Bulk Launch Error:', err);
        //   return throwError(() => err);
        // }),
      );
  }

  updateReportedValue(
    projectId: number,
    metricCode: string,
    value: string,
  ): Observable<ApiResponse<boolean>> {
    return this.http
      .patch<
        ApiResponse<boolean>
      >(`${this.url}/${projectId}/metrics/${metricCode}/value`, { value })
      .pipe(
        tap((res) => {
          console.log('[ReviewService] Update Reported Value Success:', res);
        }),
        catchError((err) => {
          this.error.set('Failed to save reported value');
          console.error('[ReviewService] Update Reported Value Error:', err);
          return throwError(() => err);
        }),
      );
  }

  createReview(payload: CreateReviewRequestDto): Observable<number> {
    if (payload.Stage && payload.Stage.toUpperCase() == 'DRAFT') {
      this._savingAsDraft.set(true);
    }

    return this.http.post<ApiResponse<number>>(this.apiUrl + '/SaveReview', payload).pipe(
      catchError((err) => {
        this._savingAsDraft.set(false);
        console.error('[ReviewService] Create Review Error:', err);
        return throwError(() => err);
      }),
      map((res) => {
        return res.data || 0;
      }),
      tap((res) => {
        this._savingAsDraft.set(false);
        console.log('[ReviewService] Create Review Success:', res);
      }),
    );
  }

  getReviewStageOptions(): Observable<{ label: string; value: string }[]> {
    return this.getReviewStages().pipe(
      map((reviewStages) => {
        const options: { label: string; value: string }[] = [];

        for (const stage of reviewStages) {
          options.push({ label: stage.description, value: stage.name });
        }

        return options;
      }),
    );
  }

  getReviewStages(): Observable<ReviewStageLookupDto[]> {
    return this.http
      .get<ApiResponse<ReviewStageLookupDto[]>>(this.apiUrl + '/GetReviewStages')
      .pipe(map((res) => res.data || []));
  }

  getReviewExcelUploads(reviewId: number = 0): Observable<ReviewExcelUploadDto[]> {
    // const  k : ReviewExcelUploadDto
    const headers: HttpHeaders = new HttpHeaders().set('reviewId', String(reviewId));
    return this.http
      .get<
        ApiResponse<ReviewExcelUploadDto[]>
      >(this.apiUrl + '/GetReviewExcelUploads/', { headers })
      .pipe(map((res) => res.data || []));
  }

  saveRiskAdjustmentAction(
    reviewId: number,
    metricRiskResponseJSON: MetricRiskResponseJSON[],
    userId: number,
  ) {
    return this.http
      .post<
        ApiResponse<number>
      >(this.apiUrl + '/SaveRiskAdjustmentAction/' + reviewId + '/' + userId, metricRiskResponseJSON)
      .pipe(
        catchError(() =>
          of<ApiResponse<number>>(<ApiResponse<number>>{ data: 0, message: 'some error occured' }),
        ),
        map((res) => res.data),
      );
  }
  // DownloadReviewExcel
  downloadReviewExcel(fileName: string) {
    const headers: HttpHeaders = new HttpHeaders().set('fileName', fileName);
    return this.http
      .get<ApiResponse<string>>(this.apiUrl + '/DownloadReviewExcel/', { headers })
      .pipe(map((res) => <string>res.data));
  }

  uploadDataCollectionExcel(
    reviewId: number,
    file: File,
    userId: number | null,
  ): Observable<ApiResponse<any[]>> {
    const formData = new FormData();
    formData.append('file', file);
    const headers: HttpHeaders = new HttpHeaders()
      .set('reviewId', reviewId.toString())
      .set('userId', userId?.toString() ?? '0');
    return this.http
      .post<ApiResponse<any[]>>(this.apiUrl + '/' + reviewId + '/upload', formData, { headers })
      .pipe(map((res) => res));
  }

  // toggleReviewStage(input: ToggleReviewStagesJSON[]) {
  //   return this.http.post<ApiResponse<number>>(this.apiUrl + '/ToggleReviewStages', input);
  // }

  fireServiceBus(input: { NotificationType: string; EntityId: number; DocumentId: number }) {
    // string NotificationType { get; set; } = default!;
    // long EntityId { get; set; }
    // long DocumentId { get; set; }
    return this.http.post<ApiResponse<number>>(
      this.apiUrl.replaceAll('Review', 'Notification') + '/publish',
      input,
    );
  }
  // downloadReviewExcel(downloadPath: string) {
  //   const headers: HttpHeaders = new HttpHeaders().set('downloadPath', downloadPath);
  //   return this.http.get<ApiResponse<string>>(downloadPath)
  //   .pipe(
  //     map(res => <string> res.data)
  //   );
  // }
  updateBaselineOrRawValueForMetric(
    reviewId: string,
    input: UpdateReviewMetricsValuesDto[],
    userId: number,
  ) {
    const headers = new HttpHeaders().set('userId', String(userId));
    return this.http.post<ApiResponse<number>>(
      this.apiUrl + '/UpdateBaselineForMetric/' + reviewId,
      input,
      { headers },
    );
  }

  RestatementUpdateBaselineOrRawValueForMetric(
    reviewId: string,
    input: UpdateReviewMetricsValuesDto[],
    userId: number,
  ) {
    const headers = new HttpHeaders().set('userId', String(userId));
    return this.http.post<ApiResponse<number>>(
      this.apiUrl + '/RestatementUpdateBaselineForMetric/' + reviewId,
      input,
      { headers },
    );
  }

  addReviewMetricEvidence(input: {
    reviewId: number;
    metricId: number;
    evidenceTypeId: number;
    files: File[];
    userId: number;
  }): Observable<ApiResponse<boolean>> {
    const formData = new FormData();

    for (const file of input.files) {
      formData.append('files', file);
    }

    const headers: HttpHeaders = new HttpHeaders()
      .set('userId', input.userId.toString())
      .set('evidenceTypeId', input.evidenceTypeId.toString());
    return this.http.post<ApiResponse<boolean>>(
      this.apiUrl + '/AddReviewMetricEvidence/' + input.reviewId + '/' + input.metricId,
      formData,
      { headers },
    );
  }

  deleteMetricEvidence(itemId: string, userId: number) {
    const headers = new HttpHeaders().set('userId', String(userId));

    return this.http.delete<ApiResponse<number>[]>(
      this.apiUrl + '/DeleteReviewMetricEvidence/' + itemId,
      { headers },
    );
  }

  getBaselineRemainder(reviewId: string | number) {
    return this.http
      .get<ApiResponse<BaselineRemainderDto[]>>(this.apiUrl + '/GetBaselineRemainder/' + reviewId)
      .pipe(map((res) => <BaselineRemainderDto[]>res.data));
  }

  takeReviewMetricActionForTopLevel(input: ReviewMetricApproveRejectDto[], userId: number) {
    const headers: HttpHeaders = new HttpHeaders().set('userId', userId.toString());
    return this.http
      .put<ApiResponse<any>>(this.apiUrl + '/ReviewMetricAction/', input, { headers })
      .pipe(map((res) => <BaselineRemainderDto[]>res.data));
  }

  getApprovalProgress(reviewId: number, metricCode: string, userId: number) {
    return this.http
      .get<ApiResponse<ReviewApprovalProgressDto[]>>(
        `${this.apiUrl}/GetReviewApprovalByMetricCode/${reviewId}/${metricCode}`,
        {
          headers: {
            UserId: userId.toString(),
          },
        },
      )
      .pipe(map((res) => res.data || []));
  }

  getAggregationForTopLevelMetric(
    topicName: string,
    periodCode: string,
    role: string,
    userId: number,
  ) {
    // return of([
    //   {
    //     parentCode: 'CV1.1',
    //     parentName: 'Toootal plastic waste valorised',
    //     rawValue: 1000,
    //     adjustedValue: 908,

    //     unit: 'tonnes',
    //     projects: []
    //   }
    //   ,
    //    {
    //     parentCode: 'CV1.2',
    //     parentName: 'Tochnical capacity installed to recover or use plastic waste',
    //     rawValue: 2300,
    //     adjustedValue: 708,

    //     unit: 'tonnes',
    //     projects: []
    //   }
    // ] as TopLevelMetricAggregationRow[]);
    return this.http
      .get<
        ApiResponse<TopLevelMetricAggregationDto[]>
      >(this.apiUrl + '/GetToplevelAggregation/' + topicName + '/' + periodCode + '/' + role + '/' + userId)
      .pipe(map((res) => res.data || []));
  }

  getAggregationForProjectMetric(
    topicName: string,
    periodCode: string,
    role: string,
    userId: number,
  ) {
    // return of([
    //   {
    //     parentCode: 'CV1.1',
    //     parentName: 'Toootal plastic waste valorised',
    //     rawValue: 1000,
    //     adjustedValue: 908,

    //     unit: 'tonnes',
    //     projects: []
    //   }
    //   ,
    //    {
    //     parentCode: 'CV1.2',
    //     parentName: 'Tochnical capacity installed to recover or use plastic waste',
    //     rawValue: 2300,
    //     adjustedValue: 708,

    //     unit: 'tonnes',
    //     projects: []
    //   }
    // ] as TopLevelMetricAggregationRow[]);
    return this.http
      .get<
        ApiResponse<ProjectLevelAggregationDto[]>
      >(this.apiUrl + '/GetProjectLevelAggregationDto/' + topicName + '/' + periodCode + '/' + role + '/' + userId)
      .pipe(map((res) => res.data || []));
  }

  getReviewMetricCodesForAdminOrL4Approval(
    topicName: string,
    periodCode: string,
    projectPinParentCodes: { ProjectPin: string; ParentCode: string }[] = [],
  ) {
    // public long ReviewId { get; set; }
    // public string MetricCode { get; set; }
    // public int Total { get; set; }
    const headers = new HttpHeaders().set(
      'projectPinParentCodes',
      JSON.stringify(projectPinParentCodes),
    );
    return this.http
      .get<
        ApiResponse<ReviewMetricCodeForAdminL4ApprovalRejectionDto[]>
      >(this.apiUrl + '/GetReviewMetricCodesForAdminOrL4Approval/' + topicName + '/' + periodCode, { headers })
      .pipe(map((res) => res.data || []));
  }

  generateExcelAndSendNotification(
    newReviews: NewReviewsDto[],
    userId: number,
  ): Observable<ApiResponse<boolean>> {
    const headers: HttpHeaders = new HttpHeaders().set('userId', String(userId));
    return this.http.post<ApiResponse<boolean>>(
      `${this.apiUrl}/GenerateExcelAndSendNotification`,
      newReviews,
      { headers },
    );
  }

  getCurrentMetricStages(
    reviewIds: number[],
    stageCodeId: number | null,
    metricId: number,
  ): Observable<ApiResponse<unknown>> {
    const params = new HttpParams()
      .set('ReviewIds', reviewIds.join(','))
      .set('StageId', stageCodeId ?? '')
      .set('MetricId', metricId);
    return this.http.get<ApiResponse<unknown>>(`${this.apiUrl}/ReviewGetCurrentMetricStages`, {
      params,
    });
  }

  recallTopLevelMetric(
    input: RecallTopLevelMetricInput,
  ): Observable<ApiResponse<RecallTopLevelMetricResultDto[]>> {
    return this.http.put<ApiResponse<RecallTopLevelMetricResultDto[]>>(
      `${this.apiUrl}/RecallTopLevelMetric`,
      input,
    );
  }

  issueRestatementForReview(input: StartEndRestatementDto) {
    return this.http.put<ApiResponse<RecallTopLevelMetricResultDto[]>>(
      `${this.apiUrl}/IssueRestatementForReview`,
      input,
    );
  }

  updateReviewMetricFRComment(
    input: UpdateReviewMetricFRCommentDto,
  ): Observable<ApiResponse<boolean>> {
    const headers: HttpHeaders = new HttpHeaders().set('userId', String(input.UserId));
    return this.http.put<ApiResponse<boolean>>(
      `${this.apiUrl}/UpdateReviewMetricFRComment`,
      input,
      { headers },
    );
  }

  deleteReviewByIds(reviewIds: number[], userId: number) {
    const headers = new HttpHeaders()
      .set('reviewIds', reviewIds.join(','))
      .set('userId', String(userId));
    return this.http.delete<ApiResponse<boolean>>(`${this.apiUrl}/DeleteReviewByIds`, { headers });
  }
  getValorisationTypes() {
    return this.http
      .get<
        ApiResponse<{ id: number; description: string }[]>
      >(this.apiUrl + '/GetValorisationTypes')
      .pipe(map((res) => res.data || []));
  }

  updateValorisationValue(reviewId: number, metricCode: string, value: number) {
    const headers = new HttpHeaders()
      .set('reviewId', String(reviewId))
      .set('metricCode', metricCode)
      .set('valorisationTypeId', String(value));
    return this.http.put<any>(this.apiUrl + '/UpdateValorisationTypeForMetric', {}, { headers });
  }

  updateReportedLimitAcknowledgedBy(
    reviewId: any,
    metricCode: string,
    metricId: number,
    userId: number | null,
  ) {
    const headers = new HttpHeaders()
      .set('reviewId', String(reviewId))
      .set('metricCode', metricCode)
      .set('metricId', String(metricId))
      .set('userId', String(userId));
    return this.http.put<any>(this.apiUrl + '/UpdateReportedLimitAcknowledgedBy', {}, { headers });
  }
}
