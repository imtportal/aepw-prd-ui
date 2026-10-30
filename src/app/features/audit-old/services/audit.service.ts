import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { AuditEvent } from '../models/audit.model';
import { ApiResponse, PaginatedResponse, PagedRequest } from '../../../core/models/api-response.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly http       = inject(HttpClient);
  private readonly useMocks   = true;                                // flip to false when endpoint is ready
  private readonly apiUrl     = environment.apiBaseUrl  + '/Audit';
  private readonly mockApiUrl = environment.apiBaseUrl2 + '/audit-events';
  private get url(): string   { return this.useMocks ? this.mockApiUrl : this.apiUrl; }

  private readonly _events = signal<AuditEvent[]>([]);
  readonly events  = this._events.asReadonly();
  readonly loading = signal(false);
  readonly error   = signal<string | null>(null);

  loadPaged(params: PagedRequest): Observable<PaginatedResponse<AuditEvent>> {
    let p = new HttpParams().set('page', params.page).set('pageSize', params.pageSize);
    if (params.filters) {
      Object.entries(params.filters).forEach(([k, v]) => { if (v) p = p.set(k, v); });
    }
    return this.http.get<PaginatedResponse<AuditEvent>>(this.url, { params: p }).pipe(
      tap(res => {
        this._events.set(res.data);
        console.log('[AuditService] Load Paged Success:', res);
      }),
      catchError(err => {
        console.error('[AuditService] Load Paged Error:', err);
        return throwError(() => err);
      }),
    );
  }

  getEventsForProject(_projectId: string): AuditEvent[] {
    return this._events();
  }

  addEvent(event: AuditEvent): Observable<ApiResponse<AuditEvent>> {
    return this.http.post<ApiResponse<AuditEvent>>(this.url, event).pipe(
      tap(res => {
        if (res.data) this._events.update(events => [res.data, ...events]);
        console.log('[AuditService] Add Event Success:', res);
      }),
      catchError(err => {
        console.error('[AuditService] Add Event Error:', err);
        return throwError(() => err);
      }),
    );
  }
}
