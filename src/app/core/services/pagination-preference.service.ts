import { effect, inject, Injectable, Injector, signal, untracked, WritableSignal } from '@angular/core';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '../../shared/constants/pagination.constant';

interface PaginationEntry {
  /** Zero-based page index. */
  page: WritableSignal<number>;
  pageSize: WritableSignal<number>;
}

interface StoredPagination {
  page: number;
  pageSize: number;
}

const STORAGE_PREFIX = 'aepw:pagination:';

/**
 * Keeps the current page and rows-per-page of each page independently and persists them in
 * localStorage, so they survive navigation, refresh, and browser tab closure.
 * Pages are identified by an explicit key supplied by the owning page.
 */
@Injectable({ providedIn: 'root' })
export class PaginationPreferenceService {
  private readonly injector = inject(Injector);
  private readonly entries = new Map<string, PaginationEntry>();

  /** Zero-based current page for the given key. Writes are persisted automatically. */
  page(key: string): WritableSignal<number> {
    return this.entry(key).page;
  }

  /** Rows per page for the given key. Writes are persisted automatically. */
  pageSize(key: string): WritableSignal<number> {
    return this.entry(key).pageSize;
  }

  private entry(key: string): PaginationEntry {
    let entry = this.entries.get(key);

    if (!entry) {
      // untracked: the entry may be first requested from within a reactive context.
      entry = untracked(() => this.createEntry(key));
      this.entries.set(key, entry);
    }

    return entry;
  }

  private createEntry(key: string): PaginationEntry {
    const stored = this.read(key);
    const entry: PaginationEntry = {
      page: signal(stored.page),
      pageSize: signal(stored.pageSize),
    };

    // Bound to the root injector so persistence outlives the component that requested the key.
    effect(() => this.write(key, { page: entry.page(), pageSize: entry.pageSize() }), {
      injector: this.injector,
    });

    return entry;
  }

  private read(key: string): StoredPagination {
    const fallback: StoredPagination = { page: 0, pageSize: DEFAULT_PAGE_SIZE };

    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + key);
      if (!raw) {
        return fallback;
      }

      const parsed = JSON.parse(raw) as Partial<StoredPagination> | null;
      const pageSize = Number(parsed?.pageSize);
      const page = Number(parsed?.page);

      return {
        page: Number.isInteger(page) && page >= 0 ? page : 0,
        pageSize: (PAGE_SIZE_OPTIONS as readonly number[]).includes(pageSize)
          ? pageSize
          : DEFAULT_PAGE_SIZE,
      };
    } catch {
      return fallback;
    }
  }

  private write(key: string, value: StoredPagination): void {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    } catch {
      // Storage unavailable or full: pagination simply won't persist.
    }
  }
}
