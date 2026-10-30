import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ReviewPeriodDto } from '../create-review.types';
import { ApiResponse } from '../../../admin/models/project.model';
import { checkTrailingSlash } from '../../../../shared/utils/checkTrailingSlash';

export interface PeriodOption {
  label: string;
  value: string;

  isCurrent?: boolean
}

@Injectable({ providedIn: 'root' })
export class PeriodService {
  /**
   * Returns period options from the current quarter through Q4 of the current year,
   * followed by an Annual entry, in chronological order.
   */

  private readonly http       = inject(HttpClient);
  private readonly useMocks   = true;                                // flip to false when endpoint is ready
  private readonly apiUrl     = checkTrailingSlash(environment.apiBaseUrl, false);
  private readonly _loadingReviewPeriods = signal(false);

  public readonly loadingReviewPeriods = this._loadingReviewPeriods.asReadonly();
  private readonly _periodOptions = signal<PeriodOption[]>([]);
  public readonly periodOptions = this._periodOptions.asReadonly();

  getPeriods(now = new Date()): Observable<PeriodOption[]> {
    const year     = now.getFullYear();
    const currentQ = Math.floor(now.getMonth() / 3) + 1;

    const options: PeriodOption[] = [];
    for (let q = currentQ; q <= 4; q++) {
      const label = `Q${q} ${year}`;
      options.push({ label, value: label });
    }
    const annual = `Annual ${year}`;
    options.push({ label: annual, value: annual });

    return of (options);
  }

  getReviewPeriods(projectId: number | null = null, fromPresent: number = 0, allowCached: boolean = false): Observable<PeriodOption[]> {
    this._loadingReviewPeriods.set(true);
    
    if (this._periodOptions()?.length && allowCached) {
      return of (this._periodOptions());
    }
    
    this._periodOptions.set([]); 
    const headers = new HttpHeaders()
    .set('projectId', projectId ? String(projectId) : '0')
    .set('fromPresent', fromPresent ? String(fromPresent) : '0')
    return this.http.get<ApiResponse<ReviewPeriodDto[]>>(this.apiUrl + "/Review/GetReviewPeriods", { headers })
    .pipe(
      catchError(err => of ({data: [], message: err.message, success: false} as ApiResponse<ReviewPeriodDto[]>)),
      map(res => {
        this._loadingReviewPeriods.set(false);
        return (res.data || [])
        .map(elem => <PeriodOption> ({
          label: elem.periodCode,
          value: String(elem.reviewPeriodId)

          , isCurrent: elem.isCurrent ? true : false
        }))
      })
      , 
      tap(options => {
        this._periodOptions.set(options);
      })
    )
    
    ;
  }

  getCurrentPeriod(now = new Date()): string {
    const year     = now.getFullYear();
    const currentQ = Math.floor(now.getMonth() / 3) + 1;
    return `Q${currentQ} ${year}`;
  }
}
