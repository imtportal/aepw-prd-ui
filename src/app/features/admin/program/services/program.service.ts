import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, tap, throwError } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { ApiResponse } from '../../models/project.model';
import { PagedResponse } from '../../../../shared/models/paged-response';

import {
  GetProgramsRequest,
  InsertProgramRequest,
  ProgramDetailModel,
  ProgramModel,
  UpdateProgramRequest,
} from '../models/program.model';

@Injectable({
  providedIn: 'root',
})
export class ProgramService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/Program`;

  getAllPrograms(
    request: GetProgramsRequest,
  ): Observable<ApiResponse<PagedResponse<ProgramModel>>> {
    const params = {
      pageNumber: request.pageNumber,
      pageSize: request.pageSize,
      searchText: request.searchText ?? '',
      programId: request.programId ?? '',
      isActive: request.isActive ?? '',
    };

    return this.http.get<ApiResponse<PagedResponse<ProgramModel>>>(this.apiUrl, { params }).pipe(
      tap((response) => {
        console.log('[ProgramService] Get Programs Success:', response);
      }),
      catchError((error) => {
        console.error('[ProgramService] Get Programs Error:', error);
        return throwError(() => error);
      }),
    );
  }

  getProgramById(programId: string): Observable<ApiResponse<ProgramDetailModel>> {
    return this.http.get<ApiResponse<ProgramDetailModel>>(`${this.apiUrl}/${programId}`).pipe(
      tap((response) => {
        console.log('[ProgramService] Get Program By Id Success:', response);
      }),
      catchError((error) => {
        console.error('[ProgramService] Get Program By Id Error:', error);
        return throwError(() => error);
      }),
    );
  }

  createProgram(payload: InsertProgramRequest): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(this.apiUrl, payload).pipe(
      tap((response) => {
        console.log('[ProgramService] Insert Program Success:', response);
      }),
      catchError((error) => {
        console.error('[ProgramService] Insert Program Error:', error);
        return throwError(() => error);
      }),
    );
  }

  updateProgram(payload: UpdateProgramRequest): Observable<ApiResponse<boolean>> {
    return this.http.put<ApiResponse<boolean>>(`${this.apiUrl}/${payload.programId}`, payload).pipe(
      tap((response) => {
        console.log('[ProgramService] Update Program Success:', response);
      }),
      catchError((error) => {
        console.error('[ProgramService] Update Program Error:', error);
        return throwError(() => error);
      }),
    );
  }
}
