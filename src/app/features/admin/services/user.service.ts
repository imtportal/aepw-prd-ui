import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { UserListDto, UserStatus } from '../../../core/models/user.model';
import { ApiResponse, PaginatedResponse, PagedRequest } from '../../../core/models/api-response.model';
import { environment } from '../../../../environments/environment';
import { checkTrailingSlash } from '../../../shared/utils/checkTrailingSlash';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http       = inject(HttpClient);
  private readonly useMocks   = true;                                // flip to false when endpoint is ready
  private readonly apiUrl     = checkTrailingSlash(environment.apiBaseUrl, false)  + '/User';
  private readonly mockApiUrl = checkTrailingSlash(environment.apiBaseUrl2, false) + '/users';
  private get url(): string   { return this.useMocks ? this.mockApiUrl : this.apiUrl; }

  private readonly _users = signal<UserListDto[]>([]);
  readonly users   = this._users.asReadonly();
  readonly loading = signal(false);
  readonly error   = signal<string | null>(null);

  loadPaged(params: PagedRequest): Observable<PaginatedResponse<UserListDto>> {
    let p = new HttpParams().set('page', params.page).set('pageSize', params.pageSize);
    if (params.filters) {
      Object.entries(params.filters).forEach(([k, v]) => { if (v) p = p.set(k, v); });
    }
    return this.http.get<PaginatedResponse<UserListDto>>(this.url, { params: p }).pipe(
      tap(res => {
        this._users.set(res.data);
        console.log('[UserService] Load Paged Success:', res);
      }),
      catchError(err => {
        console.error('[UserService] Load Paged Error:', err);
        return throwError(() => err);
      }),
    );
  }

  updateUserStatus(id: string, status: UserStatus): Observable<ApiResponse<boolean>> {
    return this.http.patch<ApiResponse<boolean>>(`${this.url}/${id}/status`, { status }).pipe(
      tap(res => {
        this._users.update(list => list.map(u => u.userId.toString() === id ? { ...u, status } : u));
        console.log('[UserService] Update Status Success:', res);
      }),
      catchError(err => {
        console.error('[UserService] Update Status Error:', err);
        return throwError(() => err);
      }),
    );
  }

  updateUser(id: string, changes: Partial<UserListDto>): Observable<ApiResponse<boolean>> {
    return this.http.put<ApiResponse<boolean>>(`${this.url}/${id}`, changes).pipe(
      tap(res => {
        this._users.update(list => list.map(u => u.userId.toString() === id ? { ...u, ...changes } : u));
        console.log('[UserService] Update User Success:', res);
      }),
      catchError(err => {
        console.error('[UserService] Update User Error:', err);
        return throwError(() => err);
      }),
    );
  }

  addUser(user: Partial<UserListDto>): Observable<ApiResponse<UserListDto>> {
    return this.http.post<ApiResponse<UserListDto>>(this.url, user).pipe(
      tap(res => {
        if (res.data) this._users.update(list => [...list, res.data]);
        console.log('[UserService] Add User Success:', res);
      }),
      catchError(err => {
        console.error('[UserService] Add User Error:', err);
        return throwError(() => err);
      }),
    );
  }
}
