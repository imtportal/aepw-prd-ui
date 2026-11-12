import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 class="text-3xl font-semibold">Access denied</h1>
      <p class="max-w-xl text-xl text-gray-600">
        You do not have permission to view this page.<br> Contact your administrator if you believe this
        is a mistake.
      </p>

      <!-- <a routerLink="/" class="text-sm font-medium underline">Back to home</a> -->
    </section>
  `,
})
export class UnauthorizedComponent {}
