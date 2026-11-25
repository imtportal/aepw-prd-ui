import { inject, Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { PaginationPreferenceService } from '../../../../core/services/pagination-preference.service';
import { PAGINATION_KEYS } from '../../../../shared/constants/pagination.constant';

@Injectable({
  providedIn: 'root',
})
export class ProjectLibraryCacheService {
  private readonly pagination = inject(PaginationPreferenceService);
  private readonly preferencesReset = new Subject<void>();
  readonly preferencesReset$ = this.preferencesReset.asObservable();

  /** Clear sidebar visit filters and page number, preserving the rows-per-page preference. */
  resetPreferences(): void {
    this.pagination.page(PAGINATION_KEYS.PROJECT_LIBRARY).set(0);
    this.preferencesReset.next();
  }
}
