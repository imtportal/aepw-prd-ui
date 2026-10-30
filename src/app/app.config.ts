import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';

import { routes } from './app.routes';
import { MessageService } from 'primeng/api';
import { authInterceptor } from './core/auth/interceptors/auth.interceptor';
import { provideAuthInitializer } from './core/auth';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { API_PROVIDERS } from './core/api/api.providers';

const AEPWPreset = definePreset(Aura, {
  semantic: {
    // ColorScale — numeric palette shades used by PrimeNG token resolution
    primary: {
      50: 'hsl(200,100%,97%)',
      100: 'hsl(200,100%,90%)',
      200: 'hsl(200,100%,80%)',
      300: 'hsl(200,100%,65%)',
      400: 'hsl(200,100%,50%)',
      500: 'hsl(200,100%,40%)',
      600: 'hsl(200,100%,35%)',
      700: 'hsl(200,100%,30%)',
      800: 'hsl(200,100%,25%)',
      900: 'hsl(200,100%,20%)',
      950: 'hsl(200,100%,15%)',
    },
    colorScheme: {
      light: {
        primary: {
          color: 'hsl(200,100%,30%)',
          contrastColor: '#ffffff',
          hoverColor: 'hsl(200,100%,25%)',
          activeColor: 'hsl(200,100%,20%)',
        },
        surface: {
          0: '#ffffff',
          50: 'hsl(200,15%,98%)',
          100: 'hsl(200,15%,95%)',
          200: 'hsl(200,15%,88%)',
          500: 'hsl(205,10%,48%)',
          700: 'hsl(197,29%,25%)',
          900: 'hsl(197,29%,20%)',
        },
        highlight: {
          background: 'hsl(190,43%,91%)',
          focusBackground: 'hsl(190,43%,85%)',
          color: 'hsl(197,29%,25%)',
          focusColor: 'hsl(197,29%,25%)',
        },
      },
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideAnimations(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      withInterceptors([ authInterceptor, loadingInterceptor]),
    ),
    provideAuthInitializer(), // Initialize auth/authorization before app starts
    providePrimeNG({
      theme: {
        preset: AEPWPreset,
        options: { darkModeSelector: false },
      },
    }),
    MessageService, // root-level so errorInterceptor can inject it
    ...API_PROVIDERS,
  ],
};
