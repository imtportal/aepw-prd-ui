import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, tap, throwError } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { ApiResponse } from '../../models/project.model';
import {
  AppUserDetailModel,
  AppUserListModel,
  AppUserSaveModel,
  AzureAdUserLookupModel,
  DeleteUserModel,
  DeleteUserResponseModel,
  PaginatedResult,
  UpdateUserRequest,
  UpdateUserResponse,
  UserRoleSummaryModel,
} from '../models/user-model';

@Injectable({ providedIn: 'root' })
export class AdUserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/User`;

  searchUsers(term: string): Observable<ApiResponse<AzureAdUserLookupModel[]>> {
    const params = new HttpParams().set('term', term);

    return this.http.get<ApiResponse<AzureAdUserLookupModel[]>>(this.apiUrl, { params }).pipe(
      tap((response) => {
        console.log('[UserService] Search Users Success:', response);
      }),

      catchError((error) => {
        console.error('[UserService] Search Users Error:', error);

        return throwError(() => error);
      }),
    );
  }

  getUsers(
    pageNumber: number = 1,
    pageSize: number = 10,
    searchText?: string,
    systemRoleId?: string,
    isActive?: boolean | null,
  ): Observable<ApiResponse<PaginatedResult<AppUserListModel>>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString());
    if (isActive !== null && isActive !== undefined) {
      params = params.set('isActive', isActive.toString());
    }
    if (searchText?.trim()) {
      params = params.set('searchText', searchText.trim());
    }

    if (systemRoleId) {
      params = params.set('systemRoleId', systemRoleId);
    }

    return this.http
      .get<ApiResponse<PaginatedResult<AppUserListModel>>>(`${this.apiUrl}/all`, {
        params,
      })
      .pipe(
        tap((response) => {
          console.log('[UserService] Get Users Success:', response);
        }),
        catchError((error) => {
          console.error('[UserService] Get Users Error:', error);
          return throwError(() => error);
        }),
      );
  }
  createUser(request: AppUserSaveModel): Observable<ApiResponse<{ userId: number }>> {
    return this.http.post<ApiResponse<{ userId: number }>>(this.apiUrl, request).pipe(
      tap((response) => {
        console.log('[UserService] Create User Success:', response);
      }),
      catchError((error) => {
        console.error('[UserService] Create User Error:', error);
        return throwError(() => error);
      }),
    );
  }
  getUserById(userId: string | number): Observable<ApiResponse<AppUserDetailModel>> {
    return this.http.get<ApiResponse<AppUserDetailModel>>(`${this.apiUrl}/${userId}`).pipe(
      tap((response) => {
        console.log('[UserService] Get User By Id Success:', response);
      }),
      catchError((error) => {
        console.error('[UserService] Get User By Id Error:', error);
        return throwError(() => error);
      }),
    );
  }
  updateUser(request: UpdateUserRequest): Observable<ApiResponse<UpdateUserResponse>> {
    return this.http.put<ApiResponse<UpdateUserResponse>>(`${this.apiUrl}`, request).pipe(
      tap((response) => {
        console.log('[UserService] Update User Success:', response);
      }),
      catchError((error) => {
        console.error('[UserService] Update User Error:', error);
        return throwError(() => error);
      }),
    );
  }
  deleteUser(request: DeleteUserModel): Observable<ApiResponse<DeleteUserResponseModel>> {
    return this.http
      .delete<ApiResponse<DeleteUserResponseModel>>(this.apiUrl, { body: request })
      .pipe(
        tap((response) => {
          console.log('[UserService] Delete User Success:', response);
        }),
        catchError((error) => {
          console.error('[UserService] Delete User Error:', error);
          return throwError(() => error);
        }),
      );
  }
  getRoleSummary(): Observable<ApiResponse<UserRoleSummaryModel[]>> {
    return this.http.get<ApiResponse<UserRoleSummaryModel[]>>(`${this.apiUrl}/role-summary`).pipe(
      tap((response) => {
        console.log('[UserService] Get Role Summary Success:', response);
      }),
      catchError((error) => {
        console.error('[UserService] Get Role Summary Error:', error);
        return throwError(() => error);
      }),
    );
  }
}
