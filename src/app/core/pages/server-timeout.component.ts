import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-server-timeout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 class="text-3xl font-semibold">Server unavailable</h1>
      <p class="max-w-xl text-xl text-gray-600">
        We are having trouble connecting to the server. The service may be temporarily
        unavailable.<br />
        Please check your connection and try again in a moment.
      </p>
    </section>
  `,
})
export class ServerTimeoutComponent {}
