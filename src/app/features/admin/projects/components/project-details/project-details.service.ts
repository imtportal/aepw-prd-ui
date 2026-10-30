import { inject, Injectable } from '@angular/core';
import { checkTrailingSlash } from '../../../../../shared/utils/checkTrailingSlash';
import { environment } from '../../../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { ImpactMasterDetailDto } from './project-details.model';
import { ApiResponse } from '../../models/project-new.model';

@Injectable({
  providedIn: 'root',
})
export class ProjectDetailsService {
  private readonly http       = inject(HttpClient);
  private readonly useMocks   = false;                                // flip to false when endpoint is ready
  private readonly apiUrl     = checkTrailingSlash(environment.apiBaseUrl)  + 'ImpactMaster';
  private readonly mockApiUrl = checkTrailingSlash(environment.apiBaseUrl2, false) + '/reviews';

  getImpactMasterById(id: number) {
    return this.http.get<ApiResponse<ImpactMasterDetailDto>>(this.apiUrl + '/' + id)
    .pipe(
      map(res => res.data as ImpactMasterDetailDto)
    );
  }
}
