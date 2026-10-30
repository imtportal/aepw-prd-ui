import { Injectable, computed, inject } from '@angular/core';
import { AppUser } from '../models/user.model';
import { AuthService } from '../auth/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { ApiResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment';
import { map, tap } from 'rxjs';
import { checkTrailingSlash } from '../../shared/utils/checkTrailingSlash';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  initials: string;
}

@Injectable({ providedIn: 'root' })
export class CurrentUserService {
  private readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);

  private readonly apiUrl = checkTrailingSlash(environment.apiBaseUrl) + 'User';

  readonly currentUser = computed<CurrentUser>(() => ({
    id: this.auth.currentUser()?.account.localAccountId ?? '',
    name: this.auth.displayName(),
    email: this.auth.email(),
    initials: this.auth.initials(),
  }));

  private loggedInUserDetails: AppUser | null = null;

  public get loggedInUser() {
    return this.loggedInUserDetails;
  }

  getCurrentUser() {
    const email = this.auth.email();

    return this.http.get<ApiResponse<AppUser[]>>(this.apiUrl + '/' + email).pipe(
      map((res) => res.data),
      tap((users) => {
        if (users?.length) {
          [this.loggedInUserDetails] = users;
        }
      }),
    );
  }
}
