import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, tap, throwError } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { ApiResponse } from '../../projects/models/project-new.model';


import {
  RolePageActionAccessModel,
  RolePageAccessModel,
  SaveRolePageActionAccessRequest,
  SaveRolePageAccessRequest,
} from '../models/user-control-access.model';

@Injectable({
  providedIn: 'root',
})
export class UserControlAccessService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/role-access`;

  // -----------------------------------------------------------
  // Get role-page access matrix
  getRolePageAccess(): Observable<ApiResponse<RolePageAccessModel[]>> {
    return this.http.get<ApiResponse<RolePageAccessModel[]>>(`${this.apiUrl}/pages`).pipe(
      tap((response) => {
        console.log('[RoleAccessService] Get Role Page Access Success:', response);
      }),
      catchError((error) => {
        console.error('[RoleAccessService] Get Role Page Access Error:', error);
        return throwError(() => error);
      }),
    );
  }

  // -----------------------------------------------------------
  // Get role-page action access matrix for a page
  getRolePageActionAccess(
    pageStructureId: number,
  ): Observable<ApiResponse<RolePageActionAccessModel[]>> {
    return this.http
      .get<
        ApiResponse<RolePageActionAccessModel[]>
      >(`${this.apiUrl}/pages/${pageStructureId}/actions`)
      .pipe(
        tap((response) => {
          console.log('[RoleAccessService] Get Role Page Action Access Success:', response);
        }),
        catchError((error) => {
          console.error('[RoleAccessService] Get Role Page Action Access Error:', error);
          return throwError(() => error);
        }),
      );
  }
  // -----------------------------------------------------------
  // Save role-page access
  saveRolePageAccess(request: SaveRolePageAccessRequest): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/pages`, request).pipe(
      tap((response) => {
        console.log('[RoleAccessService] Save Role Page Access Success:', response);
      }),
      catchError((error) => {
        console.error('[RoleAccessService] Save Role Page Access Error:', error);
        return throwError(() => error);
      }),
    );
  }

  // -----------------------------------------------------------
  // Save role-page action access
  saveRolePageActionAccess(
    request: SaveRolePageActionAccessRequest,
  ): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/pages/actions`, request).pipe(
      tap((response) => {
        console.log('[RoleAccessService] Save Role Page Action Access Success:', response);
      }),
      catchError((error) => {
        console.error('[RoleAccessService] Save Role Page Action Access Error:', error);
        return throwError(() => error);
      }),
    );
  }
}
