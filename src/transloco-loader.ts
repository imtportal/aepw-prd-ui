import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Translation, TranslocoLoader } from '@jsverse/transloco';
import { tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  private readonly http = inject(HttpClient);

  getTranslation(lang: string) {
    console.log('Loading language:', lang);

    return this.http.get<Translation>(`/i18n/${lang}.json`).pipe(
      tap((response) => {
        console.log('Translation Response:', response);
      }),
    );
  }
}
