import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

import {
  MetricCategoryLookup,
  MetricUnitLookup,
  StatusLookup,
  ProgramLookup,
  AppUserLookup,
  ParentMetricLookup,
  FundingRecipientLookup,
  CountryLookup,
  SystemRoleLookup,
  BusinessRoleLookup,
  ReviewStageLookup,
  ProjectManagerLookup,
  TimeZoneLookupModel,
  MetricSourceLookup,
  RecordTypeLookup,
  ImpactMasterLookup,
  CategoryLookup,
  PhaseLookup,
  BusinessRoleUserLookup,
} from '../models/lookup-model';

import { ApiResponse } from '../../features/admin/models/project.model';
import { ReviewStageLookupDto } from '../../features/reviews/models/review.model';
import { checkTrailingSlash } from '../../shared/utils/checkTrailingSlash';

@Injectable({
  providedIn: 'root',
})
export class LookupService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${checkTrailingSlash(environment.apiBaseUrl, false)}/Lookup`;

  getMetricCategories(): Observable<ApiResponse<MetricCategoryLookup[]>> {
    return this.http
      .get<ApiResponse<MetricCategoryLookup[]>>(`${this.apiUrl}/metric-categories`)
      .pipe(
        tap((response) => {
          console.log('[LookupService] Metric Categories:', response);
        }),
        catchError((error) => {
          console.error('Error fetching metric categories', error);
          return throwError(() => error);
        }),
      );
  }

  getMetricUnits(): Observable<ApiResponse<MetricUnitLookup[]>> {
    return this.http.get<ApiResponse<MetricUnitLookup[]>>(`${this.apiUrl}/metric-units`).pipe(
      tap((response) => {
        console.log('[LookupService] Metric Units:', response);
      }),
      catchError((error) => {
        console.error('Error fetching metric units', error);
        return throwError(() => error);
      }),
    );
  }
  getPrograms(searchTerm?: string): Observable<ApiResponse<ProgramLookup[]>> {
    let params = new HttpParams();

    if (searchTerm?.trim()) {
      params = params.set('searchTerm', searchTerm.trim());
    }

    return this.http.get<ApiResponse<ProgramLookup[]>>(`${this.apiUrl}/programs`, { params }).pipe(
      tap((response) => {
        console.log('[LookupService] Programs:', response);
      }),
      catchError((error) => {
        console.error('Error fetching programs', error);
        return throwError(() => error);
      }),
    );
  }
  getMetricSources(): Observable<ApiResponse<MetricSourceLookup[]>> {
    return this.http.get<ApiResponse<MetricSourceLookup[]>>(`${this.apiUrl}/metric-sources`).pipe(
      tap((response) => {
        console.log('[LookupService] Metric Sources:', response);
      }),
      catchError((error) => {
        console.error('Error fetching metric sources', error);
        return throwError(() => error);
      }),
    );
  }

  getUsers(searchText: string): Observable<ApiResponse<AppUserLookup[]>> {
    return this.http
      .get<ApiResponse<AppUserLookup[]>>(`${this.apiUrl}/app-users`, {
        params: {
          searchText,
        },
      })
      .pipe(
        tap((response) => {
          console.log('[LookupService] Users:', response);
        }),
        catchError((error) => {
          console.error('Error fetching users', error);
          return throwError(() => error);
        }),
      );
  }
  getBusinessRoleUsers(
    roleCode?: string,
    impactMasterId?: string,
  ): Observable<ApiResponse<BusinessRoleUserLookup[]>> {
    let params = new HttpParams();

    if (roleCode) {
      params = params.set('roleCode', roleCode);
    }
    if (impactMasterId) {
      params = params.set('impactMasterId', impactMasterId);
    }
    return this.http
      .get<ApiResponse<BusinessRoleUserLookup[]>>(`${this.apiUrl}/business-role-users`, { params })
      .pipe(
        catchError((error) => {
          console.error('Error fetching business role users', error);
          return throwError(() => error);
        }),
      );
  }
  getProjectManagers(searchTerm: string): Observable<ApiResponse<ProjectManagerLookup[]>> {
    let params = new HttpParams();

    if (searchTerm?.trim()) {
      params = params.set('searchTerm', searchTerm.trim());
    }
    return this.http.get<ApiResponse<ProjectManagerLookup[]>>(`${this.apiUrl}/project-managers`, {
      params: {
        searchTerm,
      },
    });
  }
  getSystemRoles(): Observable<ApiResponse<SystemRoleLookup[]>> {
    return this.http.get<ApiResponse<SystemRoleLookup[]>>(`${this.apiUrl}/system-roles`).pipe(
      tap((response) => {
        console.log('[LookupService] System roles', response);
      }),
      catchError((error) => {
        console.error('Error fetching system roles', error);
        return throwError(() => error);
      }),
    );
  }
  getParentMetrics(): Observable<ApiResponse<ParentMetricLookup[]>> {
    return this.http.get<ApiResponse<ParentMetricLookup[]>>(`${this.apiUrl}/parent-metrics`).pipe(
      tap((response) => {
        console.log('[LookupService] Parent Metrics:', response);
      }),
      catchError((error) => {
        console.error('Error fetching parent metrics', error);
        return throwError(() => error);
      }),
    );
  }
  getCities(): Observable<ApiResponse<CountryLookup[]>> {
    return this.http.get<ApiResponse<CountryLookup[]>>(`${this.apiUrl}/cities`).pipe(
      tap((response) => {
        console.log('[LookupService] Cities:', response);
      }),
      catchError((error) => {
        console.error('Error fetching cities', error);
        return throwError(() => error);
      }),
    );
  }
  getRecordTypes(): Observable<ApiResponse<RecordTypeLookup[]>> {
    return this.http.get<ApiResponse<RecordTypeLookup[]>>(`${this.apiUrl}/record-types`).pipe(
      tap((response) => {
        console.log('[LookupService] Record Types:', response);
      }),
      catchError((error) => {
        console.error('Error fetching record types', error);
        return throwError(() => error);
      }),
    );
  }
  getTimeZones(searchTerm: string): Observable<ApiResponse<TimeZoneLookupModel[]>> {
    return this.http
      .get<ApiResponse<TimeZoneLookupModel[]>>(`${this.apiUrl}/timezones`, {
        params: { searchTerm },
      })
      .pipe(
        tap((response) => {
          console.log('[LookupService] Time Zones:', response);
        }),
        catchError((error) => {
          console.error('Error fetching time zones', error);
          return throwError(() => error);
        }),
      );
  }
  getFundingRecipients(): Observable<ApiResponse<FundingRecipientLookup[]>> {
    return this.http
      .get<ApiResponse<FundingRecipientLookup[]>>(`${this.apiUrl}/funding-recipients`)
      .pipe(
        tap((response) => {
          console.log('[LookupService] Funding Recipients:', response);
        }),
        catchError((error) => {
          console.error('Error fetching funding recipients', error);
          return throwError(() => error);
        }),
      );
  }
  getBusinessRoles(): Observable<ApiResponse<BusinessRoleLookup[]>> {
    return this.http.get<ApiResponse<BusinessRoleLookup[]>>(`${this.apiUrl}/business-roles`).pipe(
      tap((response) => {
        console.log('[LookupService] Business Roles:', response);
      }),
      catchError((error) => {
        console.error('Error fetching business roles', error);
        return throwError(() => error);
      }),
    );
  }

  getReviewStages(): Observable<ApiResponse<ReviewStageLookup[]>> {
    return this.http
      .get<ApiResponse<ReviewStageLookupDto[]>>(this.apiUrl + '/GetReviewStages')
      .pipe(
        map((res) => {
          const data = (res.data || []).map((x) => ({
            reviewStageId: String(x.reviewStageId),
            code: x.code,
            name: x.description,

            stageName: x.name,
          }));

          return { ...res, data };
        }),
      );
  }

  getReviewStagesByUserId(userId: number | string): Observable<ApiResponse<ReviewStageLookup[]>> {
    return this.http
      .get<ApiResponse<ReviewStageLookupDto[]>>(this.apiUrl + '/GetReviewStagesByUserId/' + userId)
      .pipe(
        map((res) => {
          const data = (res.data || []).map((x) => ({
            reviewStageId: String(x.reviewStageId),
            code: x.code,
            name: x.description,
          }));

          return { ...res, data };
        }),
      );
  }

  // getReviewStages(): Observable<ApiResponse<ReviewStageLookup[]>> {
  //   const response: ApiResponse<ReviewStageLookup[]> = {
  //     success: true,
  //     message: '',
  //     data: [
  //       {
  //         reviewStageId: '1',
  //         code: 'RA',
  //         name: 'Risk Adjustment',
  //       },
  //       {
  //         reviewStageId: '2',
  //         code: 'DATA_COLLECTION',
  //         name: 'Data Collection',
  //       },
  //       {
  //         reviewStageId: '3',
  //         code: 'EVIDENCE_COLLECTION',
  //         name: 'Evidence Collection',
  //       },
  //       {
  //         reviewStageId: '4',
  //         code: 'VALIDATION',
  //         name: 'Validation',
  //       },
  //       {
  //         reviewStageId: '5',
  //         code: 'APPROVAL',
  //         name: 'Final Approval',
  //       },
  //       {
  //         reviewStageId: '6',
  //         code: 'CLOSURE',
  //         name: 'Closure',
  //       },
  //     ],
  //   };
  //   return of(response).pipe(
  //     tap((result) => {
  //       console.log('[LookupService] Review Stages:', result);
  //     }),
  //   );
  // }
  getStatusesByModule(
    module: string,
    pageKey?: string,
    impactMasterId?: string | null,
  ): Observable<ApiResponse<StatusLookup[]>> {
    if (!pageKey) {
      pageKey = '';
    }

    const headers = new HttpHeaders().set('pageKey', pageKey);
    let params = new HttpParams();

    if (impactMasterId) {
      params = params.set('impactMasterId', impactMasterId);
      console.log('imapct master id in llokup serive.....' + impactMasterId);
    }
    return this.http
      .get<
        ApiResponse<StatusLookup[]>
      >(`${this.apiUrl}/statuses/${encodeURIComponent(module)}`, { headers, params })
      .pipe(
        tap((response) => {
          console.log(`[LookupService] Statuses for module: ${module}`, response);
        }),
        catchError((error) => {
          console.error(`Error fetching statuses for module: ${module}`, error);
          return throwError(() => error);
        }),
      );
  }
  getImpactMasters(searchTerm?: string): Observable<ApiResponse<ImpactMasterLookup[]>> {
    let params = new HttpParams();

    const term = searchTerm?.trim();

    if (term) {
      params = params.set('searchTerm', term);
    }

    return this.http.get<ApiResponse<ImpactMasterLookup[]>>(`${this.apiUrl}/impact-masters`, {
      params,
    });
  }
  getPhases(): Observable<ApiResponse<PhaseLookup[]>> {
    return this.http.get<ApiResponse<PhaseLookup[]>>(`${this.apiUrl}/phases`).pipe(
      tap((response) => {
        console.log('[LookupService] Phases:', response);
      }),
      catchError((error) => {
        console.error('Error fetching Phases', error);
        return throwError(() => error);
      }),
    );
  }

  getProjectCategories(): Observable<ApiResponse<CategoryLookup[]>> {
    return this.http.get<ApiResponse<CategoryLookup[]>>(`${this.apiUrl}/impact-categories`).pipe(
      tap((response) => {
        console.log('[LookupService] Categories:', response);
      }),
      catchError((error) => {
        console.error('Error fetching Categories', error);
        return throwError(() => error);
      }),
    );
  }
}
