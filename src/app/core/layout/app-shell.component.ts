import { Component, computed, inject } from '@angular/core';
import {
  Router,
  RouterOutlet,
  NavigationEnd,
  NavigationStart,
  NavigationCancel,
  NavigationError,
  ActivatedRoute,
} from '@angular/router';
import { filter, map, startWith, tap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { SidebarComponent } from './sidebar.component';
import { HeaderComponent } from './header.component';
import { uiStore } from '../store/ui/ui.store';

const CHUNK_RELOAD_ATTEMPT_KEY = 'app-chunk-reload-attempted';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  templateUrl: './app-shell.component.html',
})
export class AppShellComponent {
  protected readonly uiStore = uiStore;
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  constructor() {
    this.router.events
      .pipe(
        filter(
          (event) =>
            event instanceof NavigationStart ||
            event instanceof NavigationEnd ||
            event instanceof NavigationCancel ||
            event instanceof NavigationError,
        ),
      )
      .subscribe((event) => {
        if (event instanceof NavigationStart) {
          uiStore.setPageLoading(true);
          return;
        }

        if (event instanceof NavigationEnd) {
          uiStore.setPageLoading(false);
          try {
            sessionStorage.removeItem(CHUNK_RELOAD_ATTEMPT_KEY);
          } catch (storageError) {
            console.error('Unable to clear the application chunk retry marker.', storageError);
          }
          return;
        }

        if (event instanceof NavigationCancel) {
          uiStore.setPageLoading(false);
          return;
        }

        if (event instanceof NavigationError) {
          uiStore.setPageLoading(false);
          this.reloadForChunkLoadError(event.error);
        }
      });
  }

  private reloadForChunkLoadError(error: unknown): void {
    const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    if (!/ChunkLoadError|Loading chunk|dynamically imported module|module script/i.test(message)) {
      return;
    }

    try {
      if (sessionStorage.getItem(CHUNK_RELOAD_ATTEMPT_KEY) === 'true') {
        console.error('A lazy-loaded application chunk failed again after reloading.', error);
        return;
      }

      sessionStorage.setItem(CHUNK_RELOAD_ATTEMPT_KEY, 'true');
    } catch (storageError) {
      console.error('Unable to safely retry the failed application chunk load.', storageError);
      return;
    }

    window.location.reload();
  }

  readonly activeUrl = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      tap(() => uiStore.sidebarOpen.set(false)), // auto-close on mobile; CSS md:translate-x-0 ignores this on desktop
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly pageTitle = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      startWith(null),
      map(() => {
        const route = this.router.routerState.root;

        let current = route;

        while (current.firstChild) {
          current = current.firstChild;
        }

        return current.snapshot?.data?.['title'] ?? 'Dashboard';
      }),
    ),
    {
      initialValue: 'Dashboard',
    },
  );

  readonly isReviewDetail = computed(
    () =>
      this.activeUrl().startsWith('/reviews/') &&
      !['create', 'bulk-launch'].some((s) => this.activeUrl().includes(s)),
  );

  readonly mainPadding = computed(() => (this.isReviewDetail() ? '' : 'p-3 sm:p-6'));
}
