import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { EvidenceListDto, EvidenceStatus, EvidenceDetailDto } from '../models/evidence.model';
import { ApiResponse, PaginatedResponse, PagedRequest } from '../../../core/models/api-response.model';
import { environment } from '../../../../environments/environment';
import { checkTrailingSlash } from '../../../shared/utils/checkTrailingSlash';

@Injectable({ providedIn: 'root' })
export class EvidenceService {
  private readonly http       = inject(HttpClient);
  private readonly useMocks   = true;                                // flip to false when endpoint is ready
  private readonly apiUrl     = checkTrailingSlash(environment.apiBaseUrl, false)  + '/Evidence';
  private readonly mockApiUrl = checkTrailingSlash(environment.apiBaseUrl2, false) + '/evidence';
  private get url(): string   { return this.useMocks ? this.mockApiUrl : this.apiUrl; }

  private readonly _files = signal<EvidenceListDto[]>([]);
  readonly files   = this._files.asReadonly();
  readonly loading = signal(false);
  readonly error   = signal<string | null>(null);

  loadPaged(params: PagedRequest): Observable<PaginatedResponse<EvidenceListDto>> {
    let p = new HttpParams().set('page', params.page).set('pageSize', params.pageSize);
    if (params.filters) {
      Object.entries(params.filters).forEach(([k, v]) => { if (v) p = p.set(k, v); });
    }
    return this.http.get<PaginatedResponse<EvidenceListDto>>(this.url, { params: p }).pipe(
      tap(res => {
        this._files.set(res.data);
        console.log('[EvidenceService] Load Paged Success:', res);
      }),
      catchError(err => {
        console.error('[EvidenceService] Load Paged Error:', err);
        return throwError(() => err);
      }),
    );
  }

  updateStatus(evidenceId: number, status: EvidenceStatus): Observable<ApiResponse<boolean>> {
    return this.http.patch<ApiResponse<boolean>>(`${this.url}/${evidenceId}/status`, { status }).pipe(
      tap(res => {
        this._files.update(files =>
          files.map(f => f.evidenceId === evidenceId ? { ...f, status } : f),
        );
        console.log('[EvidenceService] Update Status Success:', res);
      }),
      catchError(err => {
        console.error('[EvidenceService] Update Status Error:', err);
        return throwError(() => err);
      }),
    );
  }

  getDetailFiles(projectId: number): Observable<ApiResponse<EvidenceDetailDto[]>> {
    return this.http.get<ApiResponse<EvidenceDetailDto[]>>(`${this.url}/detail/${projectId}`).pipe(
      tap(res => {
        console.log('[EvidenceService] Get Detail Files Success:', res);
      }),
      catchError(err => {
        console.error('[EvidenceService] Get Detail Files Error:', err);
        return throwError(() => err);
      }),
    );
  }

  addFile(file: EvidenceListDto): Observable<ApiResponse<EvidenceListDto>> {
    return this.http.post<ApiResponse<EvidenceListDto>>(this.url, file).pipe(
      tap(res => {
        if (res.data) this._files.update(files => [res.data, ...files]);
        console.log('[EvidenceService] Add File Success:', res);
      }),
      catchError(err => {
        console.error('[EvidenceService] Add File Error:', err);
        return throwError(() => err);
      }),
    );
  }
}
