import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { FundingRecipient } from '../models/funding-recipient.model';
import { ApiResponse, PaginatedResponse, PagedRequest } from '../../../core/models/api-response.model';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FundingRecipientService {
  private readonly http       = inject(HttpClient);
  private readonly useMocks   = true;                                // flip to false when endpoint is ready
  private readonly apiUrl     = environment.apiBaseUrl  + '/FundingRecipient';
  private readonly mockApiUrl = environment.apiBaseUrl2 + '/funding-recipients';
  private get url(): string   { return this.useMocks ? this.mockApiUrl : this.apiUrl; }

  private readonly _recipients = signal<FundingRecipient[]>([]);
  readonly recipients = this._recipients.asReadonly();

  loadPaged(params: PagedRequest): Observable<PaginatedResponse<FundingRecipient>> {
    let p = new HttpParams().set('page', params.page).set('pageSize', params.pageSize);
    if (params.filters) {
      Object.entries(params.filters).forEach(([k, v]) => { if (v) p = p.set(k, v); });
    }
    return this.http.get<PaginatedResponse<FundingRecipient>>(this.url, { params: p }).pipe(
      tap(res => {
        this._recipients.set(res.data);
        console.log('[FundingRecipientService] Load Paged Success:', res);
      }),
      catchError(err => {
        console.error('[FundingRecipientService] Load Paged Error:', err);
        return throwError(() => err);
      }),
    );
  }

  getRecipient(id: number): FundingRecipient | null {
    return this._recipients().find(r => r.fundingRecipientId === id) ?? null;
  }

  updateRecipient(id: number, changes: Partial<FundingRecipient>): Observable<ApiResponse<boolean>> {
    return this.http.put<ApiResponse<boolean>>(`${this.url}/${id}`, changes).pipe(
      tap(res => {
        this._recipients.update(list =>
          list.map(r => r.fundingRecipientId === id ? { ...r, ...changes } : r),
        );
        console.log('[FundingRecipientService] Update Recipient Success:', res);
      }),
      catchError(err => {
        console.error('[FundingRecipientService] Update Recipient Error:', err);
        return throwError(() => err);
      }),
    );
  }

  addRecipient(recipient: FundingRecipient): Observable<ApiResponse<FundingRecipient>> {
    return this.http.post<ApiResponse<FundingRecipient>>(this.url, recipient).pipe(
      tap(res => {
        if (res.data) this._recipients.update(list => [...list, res.data]);
        console.log('[FundingRecipientService] Add Recipient Success:', res);
      }),
      catchError(err => {
        console.error('[FundingRecipientService] Add Recipient Error:', err);
        return throwError(() => err);
      }),
    );
  }
}
