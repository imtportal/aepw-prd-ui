import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 class="text-3xl font-semibold">Access denied</h1>
      <p class="max-w-xl text-xl text-gray-600">
        You do not have permission to view this page.<br />
        Contact your administrator if you believe this is a mistake.
      </p>

      <!-- <a routerLink="/" class="text-sm font-medium underline">Back to home</a> -->
    </section>
  `,
})
export class UnauthorizedComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  ngOnInit(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    const redirectedByGuard = this.route.snapshot.queryParamMap.get('fromGuard') === '1';

    // The guard has just redirected here.
    // Remove the marker so the next browser refresh can retry.
    if (redirectedByGuard) {
      const queryParams = { ...this.route.snapshot.queryParams };
      delete queryParams['fromGuard'];

      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams,
        replaceUrl: true,
      });

      return;
    }

    // Only retry automatically when the browser page was refreshed.
    const navigationEntry = performance.getEntriesByType('navigation')[0] as
      | PerformanceNavigationTiming
      | undefined;

    if (navigationEntry?.type !== 'reload' || !returnUrl) {
      return;
    }

    // Only allow navigation to a URL on this application.
    try {
      const target = new URL(returnUrl, window.location.origin);

      if (target.origin !== window.location.origin) {
        return;
      }

      const internalUrl = target.pathname + target.search + target.hash;

      void this.router.navigateByUrl(internalUrl);
    } catch {
      // Ignore an invalid return URL.
    }
  }
}
