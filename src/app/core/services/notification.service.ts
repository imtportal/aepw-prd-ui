import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { checkTrailingSlash } from '../../shared/utils/checkTrailingSlash';
import { environment } from '../../../environments/environment';
import { NotificationMessageDto } from '../models/notification.model';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = checkTrailingSlash(environment.apiBaseUrl) + 'Notification';
  

  publishNotification(request : NotificationMessageDto) { 
    return this.http.post<unknown>(this.apiUrl + '/' + "publish", request).pipe(
        
    )
  }
}
