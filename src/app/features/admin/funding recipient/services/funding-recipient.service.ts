import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, tap, throwError } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { ApiResponse } from '../../models/project.model';
import {
  CreateFundingRecipientRequest,
  FundingRecipient,
  FundingRecipientDetailModel,
  GetFundingRecipientsRequest,
  UpdateFundingRecipientRequest,
} from '../models/funding-recipient.model';
import { PagedResponse } from '../../../../shared/models/paged-response';


@Injectable({ providedIn: 'root' })
export class FundingRecipientService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/FundingRecipient`;

  getAllFundingRecipients(
    request: GetFundingRecipientsRequest,
  ): Observable<ApiResponse<PagedResponse<FundingRecipient>>> {
    const params = {
      pageNumber: request.pageNumber,
      pageSize: request.pageSize,
      searchText: request.searchText ?? '',
      fundingRecipientId: request.fundingRecipientId ?? '',
      isActive: request.isActive ?? '',
    };

    return this.http
      .get<ApiResponse<PagedResponse<FundingRecipient>>>(this.apiUrl, { params })
      .pipe(
        tap((response) => {
          console.log('[FundingRecipientService] Get Funding Recipients Success:', response);
        }),
        catchError((error) => {
          console.error('[FundingRecipientService] Get Funding Recipients Error:', error);
          return throwError(() => error);
        }),
      );
  }

  createFundingRecipient(payload: CreateFundingRecipientRequest): Observable<ApiResponse<number>> {
    return this.http.post<ApiResponse<number>>(this.apiUrl, payload).pipe(
      tap((response) => {
        console.log('[FundingRecipientService] Create Funding Recipient Success:', response);
      }),

      catchError((error) => {
        console.error('[FundingRecipientService] Create Funding Recipient Error:', error);

        return throwError(() => error);
      }),
    );
  }

  updateFundingRecipient(payload: UpdateFundingRecipientRequest): Observable<ApiResponse<boolean>> {
    return this.http
      .put<ApiResponse<boolean>>(`${this.apiUrl}/${payload.fundingRecipientId}`, payload)
      .pipe(
        tap((response) => {
          console.log('[FundingRecipientService] Update Funding Recipient Success:', response);
        }),

        catchError((error) => {
          console.error('[FundingRecipientService] Update Funding Recipient Error:', error);

          return throwError(() => error);
        }),
      );
  }
  getFundingRecipientById(
    fundingRecipientId: number,
  ): Observable<ApiResponse<FundingRecipientDetailModel>> {
    return this.http
      .get<ApiResponse<FundingRecipientDetailModel>>(`${this.apiUrl}/${fundingRecipientId}`)
      .pipe(
        tap((response) => {
          console.log('[FundingRecipientService] Get Funding Recipient By Id Success:', response);
        }),

        catchError((error) => {
          console.error('[FundingRecipientService] Get Funding Recipient By Id Error:', error);

          return throwError(() => error);
        }),
      );
  }
}
