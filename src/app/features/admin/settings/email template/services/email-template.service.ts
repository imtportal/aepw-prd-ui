import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';

import { environment } from '../../../../../../environments/environment';
import { ApiResponse } from '../../../models/project.model';
import {
  EmailNotificationInterpolationKeywordModel,
  EmailNotificationTemplateSaveRequest,
  EmailNotificationTemplateResponse,
} from '../models/email-template.model';

@Injectable({
  providedIn: 'root',
})
export class EmailNotificationTemplateService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiBaseUrl}/EmailNotificationTemplate`;

  getAllInterpolationKeywords(): Observable<
    ApiResponse<EmailNotificationInterpolationKeywordModel[]>
  > {
    return this.http
      .get<
        ApiResponse<EmailNotificationInterpolationKeywordModel[]>
      >(`${this.apiUrl}/interpolation-keywords`)
      .pipe(
        catchError((error) => {
          console.error(
            '[EmailNotificationTemplateService] Get Interpolation Keywords Error:',
            error,
          );
          return throwError(() => error);
        }),
      );
  }

  getAllEmailNotificationTemplates(): Observable<ApiResponse<EmailNotificationTemplateResponse[]>> {
    return this.http
      .get<ApiResponse<EmailNotificationTemplateResponse[]>>(`${this.apiUrl}/email-templates`)
      .pipe(
        catchError((error) => {
          console.error(
            '[EmailNotificationTemplateService] Get Email Notification Templates Error:',
            error,
          );
          return throwError(() => error);
        }),
      );
  }

  saveEmailNotificationTemplate(
    payload: EmailNotificationTemplateSaveRequest,
  ): Observable<ApiResponse<EmailNotificationTemplateResponse>> {
    return this.http
      .post<ApiResponse<EmailNotificationTemplateResponse>>(this.apiUrl, payload)
      .pipe(
        catchError((error) => {
          console.error(
            '[EmailNotificationTemplateService] Save Email Notification Template Error:',
            error,
          );
          return throwError(() => error);
        }),
      );
  }
}
