import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  EvidenceDetailResponse,
  SaveEvidenceReviewRequest,
} from '../evidence-review/models/evidence-review.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class EvidenceReviewService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiBaseUrl}/review`;

  getEvidenceReviewById(evidenceId: number, userId: number): Observable<EvidenceDetailResponse> {
    return this.http
      .get<ApiResponse<EvidenceDetailResponse>>(`${this.apiUrl}/evidence/${evidenceId}`, {
        params: {
          userId: userId.toString(),
        },
      })
      .pipe(map((response) => response.data));
  }

  saveEvidenceReview(request: SaveEvidenceReviewRequest): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(
      `${this.apiUrl}/evidence/${request.evidenceId}/extracted-fields`,
      request,
    );
  }
}
