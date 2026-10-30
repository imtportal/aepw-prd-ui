import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { AuditModuleType, AuditTimelineItem, AuditTimelineRequest } from '../models/audit.model';
import { ApiResponse } from '../../../core/models/api-response.model';
import { environment } from '../../../../environments/environment';
import { checkTrailingSlash } from '../../../shared/utils/checkTrailingSlash';

/** Page size constant — shared by service & component. */
export const AUDIT_PAGE_SIZE = 20;

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${checkTrailingSlash(environment.apiBaseUrl, false)}/Audit/timeline`;

  /** All currently loaded audit items (grows on Load More). */
  readonly items = signal<AuditTimelineItem[]>([]);
  /** True while initial page load is in-flight. */
  readonly loading = signal<boolean>(false);
  /** True while a Load More request is in-flight. */
  readonly loadingMore = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  /**
   * Fetch an audit timeline page from the server.
   * @param req      Request filters + pagination params.
   * @param appendMode  false → replace items (initial load / filter change)
   *                    true  → append items to existing list (Load More)
   */
  getAuditTimeline(
    req: AuditTimelineRequest,
    appendMode = false,
  ): Observable<ApiResponse<AuditTimelineItem[]>> {
    if (appendMode) {
      this.loadingMore.set(true);
    } else {
      this.loading.set(true);
      this.items.set([]); // Instantly clear previous results so old data does not linger during search
    }
    this.error.set(null);

    let params = new HttpParams().set('Module', req.module.toString());

    if (req.fromDate) {
      params = params.set('FromDate', req.fromDate);
    }
    if (req.toDate) {
      params = params.set('ToDate', req.toDate);
    }
    if (req.projectId) {
      params = params.set('ProjectId', req.projectId.toString());
    }
    if (req.programId) {
      params = params.set('ProgramId', req.programId.toString());
    }
    if (req.searchText && req.searchText.trim()) {
      params = params.set('SearchText', req.searchText.trim());
    }
    if (req.metricCode && req.metricCode.trim()) {
      params = params.set('MetricCode', req.metricCode.trim());
    }
    if (req.eventAction) {
      params = params.set('EventAction', req.eventAction);
    }
    // Always send PageNumber & PageSize so backend slices correctly
    params = params.set('PageNumber', (req.pageNumber ?? 1).toString());
    params = params.set('PageSize', (req.pageSize ?? AUDIT_PAGE_SIZE).toString());

    return this.http.get<ApiResponse<AuditTimelineItem[]>>(this.apiUrl, { params }).pipe(
      tap((res) => {
        const newItems = res.data ?? [];
        if (appendMode) {
          // Append new page items to existing list
          this.items.update((prev) => [...prev, ...newItems]);
          this.loadingMore.set(false);
        } else {
          // Replace entire list (filter change / initial load)
          this.items.set(newItems);
          this.loading.set(false);
        }
      }),
      catchError((err) => {
        this.loading.set(false);
        this.loadingMore.set(false);
        const errorMsg = err?.error?.errors?.[0] || err?.error?.message || 'Failed to load audit timeline.';
        this.error.set(errorMsg);
        console.error('[AuditService] Error loading timeline:', err);
        return throwError(() => err);
      }),
    );
  }

  clearItems(): void {
    this.items.set([]);
    this.loading.set(false);
    this.loadingMore.set(false);
    this.error.set(null);
  }

  getEventsForProject(_projectId: string): AuditTimelineItem[] {
    return this.items();
  }
}
