import {
  Component,
  input,
  output,
  computed,
  signal,
  linkedSignal,
  effect,
  inject,
  untracked,
  TemplateRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { PagedRequest } from '../../../core/models/api-response.model';
import { PaginationPreferenceService } from '../../../core/services/pagination-preference.service';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '../../constants/pagination.constant';
import { FormsModule } from '@angular/forms';

export interface DataColumn {
  key: string;
  header: string;
  sortable?: boolean;
  headerClass?: string;
  align?: 'left' | 'center' | 'right';
  /** Preferred column width */
  width?: string;

  /** Minimum width before horizontal scrolling occurs */
  minWidth?: string;
}

@Component({
  selector: 'ui-data-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, FormsModule],
  templateUrl: './data-table.component.html',
})
export class DataTableComponent<T = unknown> {
  readonly columns = input.required<DataColumn[]>();
  readonly data = input.required<T[]>();
  readonly total = input<number>(0);
  readonly loading = input<boolean>(false);
  readonly initialPageSize = input<number>(10);
  /**
   * Optional unique page identifier. When set, the current page and rows per page are restored
   * from and persisted to PaginationPreferenceService; the parent is then responsible for the
   * initial data load, using the same preference signals. When omitted, behaviour is unchanged.
   */
  readonly paginationKey = input<string | null>(null);

  readonly noRecordsFoundText = input<string>('No records found.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly rowTemplate = input.required<TemplateRef<any>>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly headerTemplate = input<TemplateRef<any> | null>(null);
  /** When set, the table body scrolls within this height and the thead becomes sticky. */
  readonly maxBodyHeight = input<string>('');

  readonly pageChange = output<PagedRequest>();

  // readonly maxBodyHeight = input<string>('');

  protected readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

  private readonly pagination = inject(PaginationPreferenceService);
  private readonly persistedPage = computed(() => {
    const key = this.paginationKey();
    return key ? this.pagination.page(key) : null;
  });
  private readonly persistedPageSize = computed(() => {
    const key = this.paginationKey();
    return key ? this.pagination.pageSize(key) : null;
  });

  // With a paginationKey these follow the persisted preference; otherwise they are plain local state.
  readonly currentPage = linkedSignal(() => this.persistedPage()?.() ?? 0);
  protected readonly currentPageSize = linkedSignal(
    () => this.persistedPageSize()?.() ?? DEFAULT_PAGE_SIZE,
  );
  // sorting
  readonly sortKey = signal<string | undefined>(undefined);
  readonly sortDir = signal<'asc' | 'desc' | undefined>(undefined);

  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.currentPageSize())),
  );

  protected readonly rangeStart = computed(() =>
    this.total() === 0 ? 0 : this.currentPage() * this.currentPageSize() + 1,
  );

  protected readonly rangeEnd = computed(() =>
    Math.min((this.currentPage() + 1) * this.currentPageSize(), this.total()),
  );

  protected readonly skeletonRows = computed(() => Array(this.currentPageSize()).fill(null));

  private sawLoading = false;

  constructor() {
    // A restored page can be past the last page (e.g. records were deleted); once data has
    // loaded, fall back to the last valid page.
    effect(() => {
      if (!this.paginationKey()) return;

      if (this.loading()) {
        this.sawLoading = true;
        return;
      }
      if (!this.sawLoading) return;

      const lastPage = Math.max(0, Math.ceil(this.total() / this.currentPageSize()) - 1);
      if (this.currentPage() > lastPage) {
        untracked(() => {
          this.applyPagination(lastPage, this.currentPageSize());
          this.emit();
        });
      }
    });
  }

  protected thClass(col: DataColumn): string {
    const align =
      col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left';
    return `px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground ${align} ${col.headerClass ?? ''}`;
  }

  protected ariaSort(key: string): string | null {
    if (this.sortKey() !== key) return null;
    return this.sortDir() === 'asc' ? 'ascending' : 'descending';
  }
  // SORT LOGIC ON CURRENT DATA
  protected toggleSort(key: string): void {
    if (this.sortKey() === key) {
      if (this.sortDir() === 'asc') {
        this.sortDir.set('desc');
      } else {
        this.sortKey.set(undefined);
        this.sortDir.set(undefined);
      }
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
  }
  private compareValues(a: unknown, b: unknown): number {
    // numbers
    if (typeof a === 'number' && typeof b === 'number') {
      return a - b;
    }

    // null handling
    if (a == null && b == null) {
      return 0;
    }

    if (a == null) {
      return -1;
    }

    if (b == null) {
      return 1;
    }

    return String(a).localeCompare(String(b), undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  }
  readonly sortedData = computed(() => {
    const rows = [...this.data()];

    const key = this.sortKey();
    const dir = this.sortDir();

    if (!key || !dir) {
      return rows;
    }

    return rows.sort((a, b) => {
      const valueA = (a as Record<string, unknown>)[key];
      const valueB = (b as Record<string, unknown>)[key];

      const result = this.compareValues(valueA, valueB);

      return dir === 'asc' ? result : -result;
    });
  });

  //////////////////////////////////////////////////////////////////////////
  protected goTo(page: number): void {
    this.applyPagination(page, this.currentPageSize());
    this.emit();
  }

  protected onPageSizeChange(event: Event): void {
    const size = +(event.target as HTMLSelectElement).value;
    this.applyPagination(0, size);
    this.emit();
  }

  private applyPagination(page: number, pageSize: number): void {
    this.currentPageSize.set(pageSize);
    this.currentPage.set(page);

    const key = this.paginationKey();
    if (key) {
      this.pagination.pageSize(key).set(pageSize);
      this.pagination.page(key).set(page);
    }
  }

  private emit(): void {
    this.pageChange.emit({
      page: this.currentPage(),
      pageSize: this.currentPageSize(),
      sortBy: this.sortKey(),
      sortDir: this.sortDir(),
    });
  }

  /** Call this from parent ngOnInit to trigger the initial load with default page size. */
  ngOnInit(): void {
    // Keyed tables already hold the restored state and the parent performs the initial load.
    if (this.paginationKey()) return;

    this.currentPageSize.set(this.initialPageSize());
    this.emit();
  }
}
