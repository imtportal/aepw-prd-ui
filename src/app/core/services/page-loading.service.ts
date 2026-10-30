import { Injectable } from '@angular/core';
import { uiStore } from '../store/ui/ui.store';

@Injectable({ providedIn: 'root' })
export class PageLoadingService {
  start(): void {
    uiStore.setPageLoading(true);
  }

  stop(): void {
    uiStore.setPageLoading(false);
  }
}