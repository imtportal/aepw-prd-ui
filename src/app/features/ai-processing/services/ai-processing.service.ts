import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { ProcessingStatus, QueueItem } from '../models/ai-processing.model';
import { ApiResponse, PaginatedResponse, PagedRequest } from '../../../core/models/api-response.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AIProcessingService {
  private readonly http       = inject(HttpClient);
  private readonly useMocks   = true;                                // flip to false when endpoint is ready
  private readonly apiUrl     = environment.apiBaseUrl  + '/AIProcessing';
  private readonly mockApiUrl = environment.apiBaseUrl2 + '/ai-processing';
  private get url(): string   { return this.useMocks ? this.mockApiUrl : this.apiUrl; }

  private readonly _queue = signal<QueueItem[]>([]);
  readonly queue   = this._queue.asReadonly();
  readonly loading = signal(false);
  readonly error   = signal<string | null>(null);

  loadPaged(params: PagedRequest): Observable<PaginatedResponse<QueueItem>> {
    let p = new HttpParams().set('page', params.page).set('pageSize', params.pageSize);
    if (params.filters) {
      Object.entries(params.filters).forEach(([k, v]) => { if (v) p = p.set(k, v); });
    }
    return this.http.get<PaginatedResponse<QueueItem>>(this.url, { params: p }).pipe(
      tap(res => {
        this._queue.set(res.data);
        console.log('[AIProcessingService] Load Paged Success:', res);
      }),
      catchError(err => {
        console.error('[AIProcessingService] Load Paged Error:', err);
        return throwError(() => err);
      }),
    );
  }

  updateItemStatus(
    id: string,
    status: ProcessingStatus,
    confidence?: number,
  ): Observable<ApiResponse<boolean>> {
    return this.http.patch<ApiResponse<boolean>>(`${this.url}/${id}/status`, { status, confidence }).pipe(
      tap(res => {
        this._queue.update(items =>
          items.map(item =>
            item.id === id
              ? { ...item, status, ...(confidence !== undefined ? { confidence } : {}) }
              : item,
          ),
        );
        console.log('[AIProcessingService] Update Status Success:', res);
      }),
      catchError(err => {
        console.error('[AIProcessingService] Update Status Error:', err);
        return throwError(() => err);
      }),
    );
  }

  reprocess(id: string): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.url}/${id}/reprocess`, {}).pipe(
      tap(res => {
        this._queue.update(items =>
          items.map(item => item.id === id ? { ...item, status: 'queued' as ProcessingStatus } : item),
        );
        console.log('[AIProcessingService] Reprocess Success:', res);
      }),
      catchError(err => {
        console.error('[AIProcessingService] Reprocess Error:', err);
        return throwError(() => err);
      }),
    );
  }

  enqueue(projectId: string, metricCodes: string[]): Observable<ApiResponse<QueueItem[]>> {
    return this.http.post<ApiResponse<QueueItem[]>>(`${this.url}/enqueue`, { projectId, metricCodes }).pipe(
      tap(res => {
        if (res.data) this._queue.update(q => [...q, ...res.data]);
        console.log('[AIProcessingService] Enqueue Success:', res);
      }),
      catchError(err => {
        this.error.set('Failed to enqueue metrics for AI processing');
        console.error('[AIProcessingService] Enqueue Error:', err);
        return throwError(() => err);
      }),
    );
  }
}
