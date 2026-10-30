import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UnsavedChangesService {
  readonly visible = signal(false);

  private resolver: ((result: boolean) => void) | null = null;

  confirm(): Promise<boolean> {
    this.visible.set(true);

    return new Promise<boolean>((resolve) => {
      this.resolver = resolve;
    });
  }

  stay(): void {
    this.resolve(false);
  }

  leave(): void {
    this.resolve(true);
  }

  private resolve(result: boolean): void {
    const resolver = this.resolver;

    // Clear first so a subsequent close event
    // cannot resolve the same confirmation again.
    this.resolver = null;
    this.visible.set(false);

    resolver?.(result);
  }
}
