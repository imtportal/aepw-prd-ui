import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
import { ApiResponse } from '../../../models/project.model';
import {
  BusinessRoleMappingDetailModel,
  BusinessRoleMappingModel,
  DeleteBusinessRoleMappingResponseDto,
  SaveBusinessRoleMappingRequest,
  SaveBusinessRoleMappingResponse,
} from '../models/business-role.model';

@Injectable({ providedIn: 'root' })
export class BusinessRoleService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/BusinessRoleMapping`;

  getAllBusinessRoleMappings(
    userId: string | null,
  ): Observable<ApiResponse<BusinessRoleMappingModel[]>> {
    let params = new HttpParams();

    if (userId) {
      params = params.set('userId', userId);
    }

    return this.http.get<ApiResponse<BusinessRoleMappingModel[]>>(this.apiUrl, { params }).pipe(
      tap((response) => {
        console.log('[LookupService] Get Business Role Mappings Success:', response);
      }),
      catchError((error) => {
        console.error('[LookupService] Get Business Role Mappings Error:', error);

        return throwError(() => error);
      }),
    );
  }
  saveBusinessRoleMapping(
    payload: SaveBusinessRoleMappingRequest,
  ): Observable<ApiResponse<SaveBusinessRoleMappingResponse>> {
    return this.http
      .post<ApiResponse<SaveBusinessRoleMappingResponse>>(`${this.apiUrl}`, payload)
      .pipe(
        tap((response) => {
          console.log('[BusinessRoleService] Save Business Role Mapping Success:', response);
        }),

        catchError((error) => {
          console.error('[BusinessRoleService] Save Business Role Mapping Error:', error);

          return throwError(() => error);
        }),
      );
  }
  getBusinessRoleMappingById(
    businessRoleMappingId: string,
  ): Observable<ApiResponse<BusinessRoleMappingDetailModel>> {
    return this.http
      .get<ApiResponse<BusinessRoleMappingDetailModel>>(`${this.apiUrl}/${businessRoleMappingId}`)
      .pipe(
        tap((response) => {
          console.log('[BusinessRoleService] Get Business Role Mapping Detail Success:', response);
        }),

        catchError((error) => {
          console.error('[BusinessRoleService] Get Business Role Mapping Detail Error:', error);

          return throwError(() => error);
        }),
      );
  }

  deleteBusinessRoleMapping(
    businessRoleMappingId: string,
    updatedBy: number,
  ): Observable<ApiResponse<DeleteBusinessRoleMappingResponseDto>> {
    const params = new HttpParams().set('updatedBy', updatedBy.toString());

    return this.http
      .delete<ApiResponse<DeleteBusinessRoleMappingResponseDto>>(
        `${this.apiUrl}/${businessRoleMappingId}`,
        { params },
      )
      .pipe(
        tap((response) => {
          console.log('[BusinessRoleService] Delete Business Role Mapping Success:', response);
        }),
        catchError((error) => {
          console.error('[BusinessRoleService] Delete Business Role Mapping Error:', error);
          return throwError(() => error);
        }),
      );
  }
}
