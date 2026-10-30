import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import {
  LucideAngularModule, LucideIconProvider, LUCIDE_ICONS,
  Paperclip, CircleCheck, TriangleAlert, Clock,
  Upload, Download, ThumbsUp,
} from 'lucide-angular';
import { SearchInputComponent } from '../../../shared/ui/search-input/search-input.component';
import { FormsModule } from '@angular/forms';
import {
  CardComponent, CardContentComponent,
} from '../../../shared/ui/card/card.component';
import { SelectComponent } from '../../../shared/ui/select/select.component';
import { DataTableComponent, DataColumn } from '../../../shared/ui/data-table/data-table.component';
import { EvidenceService } from '../services/evidence.service';
import { EvidenceListDto, EvidenceStatus } from '../models/evidence.model';
import { EvidenceRowComponent } from '../components/evidence-row/evidence-row.component';
import { EvidenceDetailSheetComponent } from '../components/evidence-detail-sheet/evidence-detail-sheet.component';
import { EvidenceUploadDialogComponent } from '../components/evidence-upload-dialog/evidence-upload-dialog.component';
import { SelectOption } from '../../../shared/models/select-option';
import { CONFIDENCE_FILTER } from '../../../shared/utils/confidence.constants';
import { PagedRequest } from '../../../core/models/api-response.model';

@Component({
  selector: 'app-evidence-page',
  standalone: true,
  imports: [
    LucideAngularModule,
    FormsModule,
    CardComponent, CardContentComponent,
    SelectComponent,
    DataTableComponent,
    EvidenceRowComponent,
    EvidenceDetailSheetComponent,
    EvidenceUploadDialogComponent,
    SearchInputComponent,
  ],
  providers: [
    { provide: LUCIDE_ICONS, multi: true,
      useValue: new LucideIconProvider({ Paperclip, CircleCheck, TriangleAlert, Clock, Upload, Download, ThumbsUp }) },
  ],
  templateUrl: './evidence-page.component.html',
})
export class EvidencePageComponent {
  private readonly evidSvc    = inject(EvidenceService);
  private readonly destroyRef = inject(DestroyRef);

  readonly searchQuery      = signal('');
  readonly projectFilter    = signal<string>('all');
  readonly periodFilter     = signal<string>('all');
  readonly statusFilter     = signal<EvidenceStatus | 'all'>('all');
  readonly confidenceFilter = signal<'all' | 'low' | 'high'>('all');
  readonly selectedIds      = signal(new Set<string>());
  readonly showUploadDialog = signal(false);
  private readonly detailFileId = signal<string | null>(null);

  readonly pageData  = signal<EvidenceListDto[]>([]);
  readonly pageTotal = signal(0);
  readonly loading   = signal(false);

  private readonly debouncedQuery = toSignal(
    toObservable(this.searchQuery).pipe(debounceTime(300), distinctUntilChanged()),
    { initialValue: '' },
  );

  readonly pendingCount     = computed(() => this.evidSvc.files().filter(f => f.status === 'Pending').length);
  readonly needsReviewCount = computed(() => this.evidSvc.files().filter(f => f.status === 'NeedsReview').length);
  readonly validatedCount   = computed(() => this.evidSvc.files().filter(f => f.status === 'Validated').length);

  readonly actionableFiles = computed(() =>
    this.pageData().filter(f => f.status === 'Pending' || f.status === 'NeedsReview'),
  );

  readonly selectAllState = computed<'none' | 'some' | 'all'>(() => {
    if (this.actionableFiles().length === 0 || this.selectedIds().size === 0) return 'none';
    if (this.actionableFiles().every(f => this.selectedIds().has(f.evidenceId.toString()))) return 'all';
    return 'some';
  });

  readonly projectOptions = computed<SelectOption[]>(() => [
    { label: 'All Projects', value: 'all' },
    ...[...new Set(this.evidSvc.files().map(f => f.projectId))].map(id => ({ label: String(id), value: String(id) })),
  ]);

  readonly periodOptions = computed<SelectOption[]>(() => [
    { label: 'All Periods', value: 'all' },
    ...[...new Set(this.evidSvc.files().map(f => f.period))].map(p => ({ label: p, value: p })),
  ]);

  readonly uploadProjectOptions = computed<SelectOption[]>(() =>
    this.projectOptions().filter(o => o.value !== 'all'),
  );

  readonly detailFile = computed(() =>
    this.detailFileId() ? this.evidSvc.files().find(f => f.evidenceId.toString() === this.detailFileId()) ?? null : null,
  );

  protected readonly tableColumns: DataColumn[] = [
    { key: 'select',      header: '',         sortable: false },
    { key: 'projectName', header: 'Project',  sortable: true  },
    { key: 'period',      header: 'Period',   sortable: true  },
    { key: 'fileName',    header: 'File Name',sortable: true  },
    { key: 'metricCode',  header: 'Metric',   sortable: true  },
    { key: 'uploadedAt',  header: 'Uploaded', sortable: true  },
    { key: 'aiConfidence',header: 'AI %',     sortable: true, align: 'center' },
    { key: 'status',      header: 'Status',   sortable: true  },
    { key: 'notes',       header: 'Notes',    sortable: false },
    { key: 'actions',     header: '',         sortable: false },
  ];

  protected readonly statusOptions: SelectOption[] = [
    { label: 'All Status',   value: 'all'        },
    { label: 'Pending',      value: 'Pending'     },
    { label: 'Processing',   value: 'Processing'  },
    { label: 'Needs Review', value: 'NeedsReview' },
    { label: 'Validated',    value: 'Validated'   },
    { label: 'Rejected',     value: 'Rejected'    },
  ];

  protected readonly confidenceOptions: SelectOption[] = [
    { label: 'All Confidence', value: 'all' },
    { label: 'Low (<85%)', value: 'low' },
    { label: 'High (85%+)', value: 'high' },
  ];

  private lastParams: PagedRequest = { page: 0, pageSize: 10 };

  onSearchChange(q: string): void             { this.searchQuery.set(q); this.reloadFromFilters(); }
  onProjectFilterChange(v: string): void      { this.projectFilter.set(v); this.reloadFromFilters(); }
  onPeriodFilterChange(v: string): void       { this.periodFilter.set(v); this.reloadFromFilters(); }
  onStatusFilterChange(v: EvidenceStatus | 'all'): void { this.statusFilter.set(v); this.reloadFromFilters(); }
  onConfidenceFilterChange(v: 'all' | 'low' | 'high'): void { this.confidenceFilter.set(v); this.reloadFromFilters(); }

  private reloadFromFilters(): void {
    this.loadPage({ ...this.lastParams, page: 0, filters: this.buildFilters() });
  }

  onPageChange(params: PagedRequest): void {
    this.loadPage({ ...params, filters: this.buildFilters() });
  }

  private buildFilters(): Record<string, string> {
    return {
      search: this.debouncedQuery(),
      status: this.statusFilter(),
    };
  }

  private loadPage(params: PagedRequest): void {
    this.lastParams = params;
    this.loading.set(true);
    this.evidSvc.loadPaged(params).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.pageData.set(res.data);
        this.pageTotal.set(res.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onToggleSelect(id: string): void {
    this.selectedIds.update(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  onSelectAll(): void {
    const actionable = this.actionableFiles();
    if (actionable.every(f => this.selectedIds().has(f.evidenceId.toString()))) {
      this.selectedIds.set(new Set());
    } else {
      this.selectedIds.set(new Set(actionable.map(f => f.evidenceId.toString())));
    }
  }

  onApprove(id: string): void {
    this.evidSvc.updateStatus(Number(id), 'Validated');
  }

  onApproveSelected(): void {
    this.selectedIds().forEach(id => this.evidSvc.updateStatus(Number(id), 'Validated'));
    this.selectedIds.set(new Set());
  }

  onClearSelection(): void       { this.selectedIds.set(new Set()); }
  onOpenDetail(id: string): void { this.detailFileId.set(id); }
  onCloseDetail(): void          { this.detailFileId.set(null); }
  onUpload(): void               { this.showUploadDialog.set(false); }
}
