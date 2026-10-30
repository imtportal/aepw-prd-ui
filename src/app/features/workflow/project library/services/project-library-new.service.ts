import { Injectable, inject, signal } from '@angular/core';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import {
  ApiResponse,
  ImpactMasterListModel,
  CreateImpactMasterRequest,
  CreateImpactMasterResponse,
  ImpactMasterDetailModel,
  SaveImpactMasterMetricsRequest,
  UpdateImpactMasterRequest,
  GetImpactMastersRequest,
  ImpactMasterMetricModel,
  MetricCategoryModel,
  CopyImpactMasterRequest,
  CopyImpactMasterResponse,
  DeleteImpactMasterRequest,
  DeleteImpactMasterResponse,
  ImpactMasterFilterOptionsDto,
} from '../models/project-library-new.model';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { PagedResponse } from '../../../../shared/models/paged-response';
import { checkTrailingSlash } from '../../../../shared/utils/checkTrailingSlash';

@Injectable({ providedIn: 'root' })
export class ImpactMasterService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/ImpactMaster`;
  private readonly mockApiUrl = checkTrailingSlash(environment.apiBaseUrl2) + '/ImpactMasters';

  // -----------------------------------------------------------
  // Get list of all the ImpactMasters
  getAllImpactMasters(
    request: GetImpactMastersRequest,
  ): Observable<ApiResponse<PagedResponse<ImpactMasterListModel>>> {
    let params = new HttpParams()
      .set('pageNumber', request.pageNumber)
      .set('pageSize', request.pageSize);

    if (request.searchText) {
      params = params.set('searchText', request.searchText);
    }

    if (request.programId) {
      params = params.set('programId', request.programId);
    }
    if (request.impactMasterId) {
      params = params.set('impactMasterId', request.impactMasterId);
    }

    if (request.statusId) {
      params = params.set('statusId', request.statusId);
    }

    if (request.metricCategories) {
      params = params.set('metricCategories', request.metricCategories);
    }
    if (request.fundingRecipientId) {
      params = params.set('fundingRecipientId', request.fundingRecipientId);
    }
    if (request.l1UserId) {
      params = params.set('l1UserId', request.l1UserId);
    }
    if (request.recordTypeId) {
      params = params.set('recordTypeId', request.recordTypeId);
    }

    if (request.phaseId) {
      params = params.set('phaseId', request.phaseId);
    }

    if (request.categoryId) {
      params = params.set('categoryId', request.categoryId);
    }

    return this.http
      .get<ApiResponse<PagedResponse<ImpactMasterListModel>>>(this.apiUrl, {
        params,
      })
      .pipe(
        tap((response) => {
          console.log('[ImpactMasterService] Get All ImpactMasters Success:', response);
        }),
        catchError((error) => {
          console.error('[ImpactMasterService] Get All ImpactMasters Error:', error);
          return throwError(() => error);
        }),
      );
  }

  //////////////////////////////////////////////////////////////////////////////////////////
  // Get ImpactMaster details by ImpactMaster id
  getImpactMasterById(ImpactMasterId: string): Observable<ApiResponse<ImpactMasterDetailModel>> {
    return this.http
      .get<ApiResponse<ImpactMasterDetailModel>>(`${this.apiUrl}/${ImpactMasterId}`)
      .pipe(
        tap((response) => {
          console.log('[ImpactMasterService] Get ImpactMaster By Id Success:', response);
        }),
        catchError((error) => {
          console.error('[ImpactMasterService] Get ImpactMaster By Id Error:', error);
          return throwError(() => error);
        }),
      );
  }
  //ADD: Save an individual ImpactMaster
  saveImpactMaster(
    request: CreateImpactMasterRequest,
  ): Observable<ApiResponse<CreateImpactMasterResponse>> {
    return this.http.post<ApiResponse<CreateImpactMasterResponse>>(this.apiUrl, request).pipe(
      tap((response) => {
        console.log('[ImpactMasterService] Save ImpactMaster Success:', response);
      }),
      catchError((error) => {
        console.error('[ImpactMasterService] ❌ ERROR RECEIVED');
        console.error('[ImpactMasterService] Status:', error.status);
        console.error('[ImpactMasterService] Error body:', error.error);
        console.error('[ImpactMasterService] Message:', error.error?.message);
        console.error('[ImpactMasterService] ErrorCode:', error.error?.errorCode);
        return throwError(() => error);
      }),
    );
  }

  //EDIT: Save individual ImpactMaster by Id
  saveImpactMasterById(
    impactMetricId: string,
    request: UpdateImpactMasterRequest,
  ): Observable<ApiResponse<boolean>> {
    return this.http.put<ApiResponse<boolean>>(`${this.apiUrl}/${impactMetricId}`, request).pipe(
      tap((response) => {
        console.log('[ImpactMasterService] Update ImpactMaster Success:', response);
      }),
      catchError((error) => {
        console.error('[ImpactMasterService] Update ImpactMaster Error:', error);
        return throwError(() => error);
      }),
    );
  }
  // Initial metrics for create page
  getMetrics(recordTypeId: string): Observable<ApiResponse<MetricCategoryModel[]>> {
    return this.http
      .get<ApiResponse<MetricCategoryModel[]>>(`${this.apiUrl}/metrics`, {
        params: {
          recordTypeId,
        },
      })
      .pipe(
        tap((response) => {
          console.log('[ImpactMasterService] Get Metrics Success:', response);
        }),
        catchError((error) => {
          console.error('[ImpactMasterService] Get Metrics Error:', error);
          return throwError(() => error);
        }),
      );
  }
  // Get Metrics for an individual ImpactMaster
  getMetricsForImpactMaster(
    ImpactMasterId: string,
  ): Observable<ApiResponse<ImpactMasterMetricModel[]>> {
    return this.http
      .get<ApiResponse<ImpactMasterMetricModel[]>>(`${this.apiUrl}/${ImpactMasterId}/metrics`)
      .pipe(
        tap((response) => {
          console.log('[ImpactMasterService] Get Metrics For ImpactMaster Success:', response);
        }),
        catchError((error) => {
          console.error('[ImpactMasterService] Get Metrics For ImpactMaster Error:', error);
          return throwError(() => error);
        }),
      );
  }

  // Save Metrics of an individual ImpactMaster by Id
  saveImpactMasterMetrics(
    impactMetricId: string,
    request: SaveImpactMasterMetricsRequest,
  ): Observable<ApiResponse<boolean>> {
    return this.http
      .post<ApiResponse<boolean>>(`${this.apiUrl}/${impactMetricId}/metrics`, { ...request })
      .pipe(
        tap((response) => {
          console.log('[ImpactMasterService] Save ImpactMaster Metrics Success:', response);
        }),
        catchError((error) => {
          console.error('[ImpactMasterService] Save ImpactMaster Metrics Error:', error);
          return throwError(() => error);
        }),
      );
  }

  // DELETE: Delete ImpactMaster
  deleteImpactMaster(
    request: DeleteImpactMasterRequest,
  ): Observable<ApiResponse<DeleteImpactMasterResponse>> {
    return this.http
      .delete<ApiResponse<DeleteImpactMasterResponse>>(this.apiUrl, {
        body: request,
      })
      .pipe(
        tap((response) => {
          console.log('[ImpactMasterService] Delete ImpactMaster Success:', response);
        }),
        catchError((error) => {
          console.error('[ImpactMasterService] Delete ImpactMaster Error:', error);
          return throwError(() => error);
        }),
      );
  }

  // COPY: Copy ImpactMaster
  copyImpactMaster(
    request: CopyImpactMasterRequest,
  ): Observable<ApiResponse<CopyImpactMasterResponse>> {
    return this.http
      .post<ApiResponse<CopyImpactMasterResponse>>(`${this.apiUrl}/copy`, request)
      .pipe(
        tap((response) => {
          console.log('[ImpactMasterService] Copy ImpactMaster Success:', response);
        }),
        catchError((error) => {
          console.error('[ImpactMasterService] Copy ImpactMaster Error:', error);
          return throwError(() => error);
        }),
      );
  }
  getImpactMasterFilterOptions(
    programId?: string | null,
    recordTypeId?: string | null,
    statusId?: string | null,
  ): Observable<ImpactMasterFilterOptionsDto> {
    let params = new HttpParams();

    if (programId?.trim()) {
      params = params.set('programId', programId.trim());
    }

    if (recordTypeId?.trim()) {
      params = params.set('recordTypeId', recordTypeId.trim());
    }

    if (statusId?.trim()) {
      params = params.set('statusId', statusId.trim());
    }

    return this.http
      .get<ApiResponse<ImpactMasterFilterOptionsDto>>(`${this.apiUrl}/filter-options`, { params })
      .pipe(
        map((res: { data: any }) => {
          console.log('ImpactMasterFilterOptionsDto:', res.data);
          return res.data;
        }),
      );
  }
}
