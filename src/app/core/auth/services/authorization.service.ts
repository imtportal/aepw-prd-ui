import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, tap, throwError } from 'rxjs';

import { ApiResponse } from '../../models/api-response.model';
import { ActionAccess, LoginContext, PageAccess } from '../models/authorization.model';
import { environment } from '../../../../environments/environment';
import { checkTrailingSlash } from '../../../shared/utils/checkTrailingSlash';

@Injectable({
  providedIn: 'root',
})
export class AuthorizationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = checkTrailingSlash(environment.apiBaseUrl) + 'authorization';

  getLoginContext(): Observable<ApiResponse<LoginContext>> {
    const url = `${this.apiUrl}/me`;
    console.log('[Authorization] GET /authorization/me started');
    console.log('[Authorization] API URL:', url);

    return this.http.get<ApiResponse<LoginContext>>(url).pipe(
      tap((response) => {
        console.log('[Authorization] Response received');
        console.log('[Authorization] Success:', response.success);
        console.log('[Authorization] Response data:', response.data);
      }),
      catchError((error) => {
        console.error('[Authorization] API Call Failed:', error);
        // Pass the error along to whoever subscribed to this observable
        return throwError(() => error);
      }),
    );
  }

  /** Always hits the backend so revoked permissions take effect on the next navigation. */
  getPageAccess(pageKey: string, userId: number): Observable<ApiResponse<PageAccess | null>> {
    const url = `${this.apiUrl}/user/${userId}/page/${encodeURIComponent(pageKey)}/access`;

    return this.http.get<ApiResponse<PageAccess | null>>(url).pipe(
      catchError((error) => {
        console.error('[Authorization] Page access API failed:', error);

        return throwError(() => error);
      }),
    );
  }

  getActionAccess(pageKey: string, userId: number): Observable<ApiResponse<ActionAccess[]>> {
    const url = `${this.apiUrl}/user/${userId}/page/${pageKey}/actions`;

    console.log('[Authorization] GET action access:', url);

    return this.http.get<ApiResponse<ActionAccess[]>>(url).pipe(
      tap((response) => {
        console.log('[Authorization] Action access response:', response);
      }),
      catchError((error) => {
        console.error('[Authorization] Action access API failed:', error);

        return throwError(() => error);
      }),
    );
  }
}
