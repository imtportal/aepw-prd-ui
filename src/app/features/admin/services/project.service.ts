import { Injectable, inject, signal } from '@angular/core';
import { catchError, Observable, tap, throwError } from 'rxjs';
import {
  Project,
  BulkProject,
  ApiResponse,
  ProjectListModel,
  CreateProjectRequest,
  CreateProjectResponse,
  ProjectDetailModel,
  SaveProjectMetricsRequest,
  MetricCategoryDto,
  UpdateProjectRequest,
  GetProjectsRequest,
} from '../models/project.model';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { PagedResponse } from '../../../shared/models/paged-response';
import { checkTrailingSlash } from '../../../shared/utils/checkTrailingSlash';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly http = inject(HttpClient);
  private readonly impactDetailsMap = signal<Map<number, BulkProject>>(new Map<number, BulkProject>());
  private readonly useMocks = false; // real endpoint ready
  private readonly apiUrl = `${checkTrailingSlash(environment.apiBaseUrl, false)}`;
  private readonly mockApiUrl = `${checkTrailingSlash(environment.apiBaseUrl2, false)}/projects`;
  private get url(): string {
    return this.useMocks ? this.mockApiUrl : this.apiUrl;
  }

  private readonly _bulkProjects = signal<BulkProject[]>([]);
  readonly bulkProjects = this._bulkProjects.asReadonly();

  // -----------------------------------------------------------
  // Get list of all the projects
  getAllProjects(
    request: GetProjectsRequest,
  ): Observable<ApiResponse<PagedResponse<ProjectListModel>>> {
    let params = new HttpParams()
      .set('pageNumber', request.pageNumber)
      .set('pageSize', request.pageSize);

    if (request.searchText) {
      params = params.set('searchText', request.searchText);
    }

    if (request.programId) {
      params = params.set('programId', request.programId);
    }
    if (request.projectId) {
      params = params.set('projectId', request.projectId);
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
    if (request.pmUserId) {
      params = params.set('pmUserId', request.pmUserId);
    }

    return this.http
      .get<ApiResponse<PagedResponse<ProjectListModel>>>(this.apiUrl, {
        params,
      })
      .pipe(
        tap((response) => {
          console.log('[ProjectService] Get All Projects Success:', response);
        }),
        catchError((error) => {
          console.error('[ProjectService] Get All Projects Error:', error);
          return throwError(() => error);
        }),
      );
  }

  //////////////////////////////////////////////////////////////////////////////////////////
  // Get project details by project id
  getProjectById(projectId: number): Observable<ApiResponse<ProjectDetailModel>> {
    return this.http.get<ApiResponse<ProjectDetailModel>>(`${this.apiUrl}/${projectId}`).pipe(
      tap((response) => {
        console.log('[ProjectService] Get Project By Id Success:', response);
      }),
      catchError((error) => {
        console.error('[ProjectService] Get Project By Id Error:', error);
        return throwError(() => error);
      }),
    );
  }
  //Create new project
  saveProject(request: CreateProjectRequest): Observable<ApiResponse<CreateProjectResponse>> {
    return this.http.post<ApiResponse<CreateProjectResponse>>(this.url, request).pipe(
      tap((response) => {
        console.log('[ProjectService] Save Project Success:', response);
      }),
      catchError((error) => {
        console.error('[ProjectService] Save Project Error:', error);
        return throwError(() => error);
      }),
    );
  }
  // Get Metrics for an individual project
  getMetricsForProject(projectId: string): Observable<ApiResponse<MetricCategoryDto[]>> {
    return this.http.get<ApiResponse<MetricCategoryDto[]>>(`${this.url}/${projectId}/metrics`).pipe(
      tap((response) => {
        console.log('[ProjectService] Get Metrics For Project Success:', response);
      }),
      catchError((error) => {
        console.error('[ProjectService] Get Metrics For Project Error:', error);
        return throwError(() => error);
      }),
    );
  }

  
  //EDIT: Edit project by Id
  saveProjectById(
    projectId: string,
    request: UpdateProjectRequest,
  ): Observable<ApiResponse<boolean>> {
    return this.http.put<ApiResponse<boolean>>(`${this.apiUrl}/${projectId}`, request).pipe(
      tap((response) => {
        console.log('[ProjectService] Update Project Success:', response);
      }),
      catchError((error) => {
        console.error('[ProjectService] Update Project Error:', error);
        return throwError(() => error);
      }),
    );
  }
  //Update: Save Metrics of an individual project by Id
  saveProjectMetrics(
    projectId: string,
    request: SaveProjectMetricsRequest,
    updatedBy: string,
  ): Observable<ApiResponse<boolean>> {
    return this.http
      .post<
        ApiResponse<boolean>
      >(`${this.url}/${projectId}/metrics`, { ...request, projectId }, { params: { updatedBy } })
      .pipe(
        tap((response) => {
          console.log('[ProjectService] Save Project Metrics Success:', response);
        }),
        catchError((error) => {
          console.error('[ProjectService] Save Project Metrics Error:', error);
          return throwError(() => error);
        }),
      );
  }


  getImpactsWithActiveReviews(period: number | null, pageNo: number, skippedRows: number, itemsPerPage: number, status: string, impactName: string) {
    const headers = new HttpHeaders()
      .set('pageNo', String(pageNo))
      .set('skippedRows', String(skippedRows))
      .set('itemsPerPage', String(itemsPerPage))
      .set('period', String((period == null) ? '' : period))
      .set('status', String(status == "all" ? "" : status))
      .set('impactName', impactName)
    return this.http.get<ApiResponse<BulkProject[]>>(`${this.url}/Review/GetImpactsWithActiveReviews`, {headers}).pipe(
      tap(res => {
        if (res && res.data) {
          this._bulkProjects.set(res.data);
        }

      })
    )
  }


  loadBulkProjects(selectedQuarter: number | null, status: string, impactName: string, pageNo: number, skippedRows: number, itemsPerPage: number): Observable<ApiResponse<BulkProject[]>> {
    let headers = ((selectedQuarter !== null) ? new HttpHeaders().set('quarter',  selectedQuarter.toString()) : new HttpHeaders());

    headers = headers
    // .set('quarter', selectedQuarter)
    .set('impactName', impactName)
    .set('pageNo', String(pageNo))
    .set('skippedRows', String(skippedRows))
    .set('itemsPerPage', String(itemsPerPage))

    if (!status || status.toLowerCase() === 'all') {
      headers = headers.set('status', '');
    }
    else {
      headers = headers.set('status', status);
    }

    return this.http.get<ApiResponse<BulkProject[]>>(`${this.apiUrl}/Review/GetLaunchableImpacts`, { headers }).pipe(
      tap((res) => {
        if (res.data) {
          this._bulkProjects.set(res.data)
          // preserve impacts data
          const impactDetailsMap = this.impactDetailsMap();
          for (const project of res.data) {
            if (project.impactMasterId && project) {
              impactDetailsMap.set(project.impactMasterId, project);
            }
          }

          this.impactDetailsMap.set(impactDetailsMap);
        };
        console.log('[ProjectService] Load Bulk Projects Success:', res);
      }),
      catchError((err) => {
        console.error('[ProjectService] Load Bulk Projects Error:', err);
        return throwError(() => err);
      }),
    );
  }

  public selectedImpacts(impactMasterIds: number[]): BulkProject[] {
    const impactDetailsMap = this.impactDetailsMap();
    const selectedProjects: BulkProject[] = [];
    for (const id of impactMasterIds) {
      const project = impactDetailsMap.get(id);
      if (project) {
        selectedProjects.push(project);
      }
    }
    return selectedProjects;
  }
}
