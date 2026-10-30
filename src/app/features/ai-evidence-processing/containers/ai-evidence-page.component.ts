import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import {
  LucideAngularModule, LucideIconProvider, LUCIDE_ICONS,
  Paperclip, CircleCheck, TriangleAlert, Clock,
  Upload, Download, ThumbsUp, Info,
} from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import { SearchInputComponent } from '../../../shared/ui/search-input/search-input.component';
import {
  CardComponent, CardHeaderComponent, CardTitleComponent, CardContentComponent,
} from '../../../shared/ui/card/card.component';
import { SelectComponent } from '../../../shared/ui/select/select.component';
import { DataTableComponent, DataColumn } from '../../../shared/ui/data-table/data-table.component';
import { AiEvidenceService } from '../services/ai-evidence.service';
import { ProcessingFile, FileProcessingStatus } from '../models/ai-evidence.model';
import { AiEvidenceRowComponent } from '../components/ai-evidence-row/ai-evidence-row.component';
import { AiDetailSheetComponent } from '../components/ai-detail-sheet/ai-detail-sheet.component';
import { EvidenceDetailSheetComponent } from '../components/evidence-detail-sheet/evidence-detail-sheet.component';
import { AiStatsRowComponent } from '../components/ai-stats-row/ai-stats-row.component';
import { EvidenceUploadDialogComponent } from '../components/evidence-upload-dialog/evidence-upload-dialog.component';
import { SelectOption } from '../../../shared/models/select-option';
import { PagedRequest } from '../../../core/models/api-response.model';

@Component({
  selector: 'app-ai-evidence-page',
  standalone: true,
  imports: [
    LucideAngularModule,
    FormsModule,
    SearchInputComponent,
    CardComponent, CardHeaderComponent, CardTitleComponent, CardContentComponent,
    SelectComponent,
    DataTableComponent,
    AiEvidenceRowComponent,
    AiDetailSheetComponent,
    EvidenceDetailSheetComponent,
    AiStatsRowComponent,
    EvidenceUploadDialogComponent,
  ],
  providers: [
    { provide: LUCIDE_ICONS, multi: true,
      useValue: new LucideIconProvider({ Paperclip, CircleCheck, TriangleAlert, Clock, Upload, Download, ThumbsUp, Info }) },
  ],
  templateUrl: './ai-evidence-page.component.html',
})
export class AiEvidencePageComponent {
  private readonly svc        = inject(AiEvidenceService);
  private readonly destroyRef = inject(DestroyRef);

  // Filters
  readonly searchQuery      = signal('');
  readonly projectFilter    = signal<string>('all');
  readonly periodFilter     = signal<string>('all');
  readonly statusFilter     = signal<FileProcessingStatus | 'all'>('all');
  readonly confidenceFilter = signal<'all' | 'low' | 'high'>('all');

  // Selection + dialogs
  readonly selectedIds      = signal(new Set<string>());
  readonly showUploadDialog = signal(false);

  // Detail sheet IDs
  private readonly aiDetailId   = signal<string | null>(null);
  private readonly evidDetailId = signal<string | null>(null);

  // Pagination
  readonly pageData  = signal<ProcessingFile[]>([]);
  readonly pageTotal = signal(0);
  readonly loading   = signal(false);

  private readonly debouncedQuery = toSignal(
    toObservable(this.searchQuery).pipe(debounceTime(300), distinctUntilChanged()),
    { initialValue: '' },
  );

  // AI Stats Row counts
  readonly totalCount       = computed(() => this.svc.files().length);
  readonly queuedCount      = computed(() => this.svc.files().filter(f => f.status === 'queued').length);
  readonly processingCount  = computed(() => this.svc.files().filter(f => f.status === 'processing').length);
  readonly completedCount   = computed(() => this.svc.files().filter(f => f.status === 'completed').length);
  readonly needsReviewCount = computed(() => this.svc.files().filter(f => f.status === 'needs-review').length);
  readonly errorCount       = computed(() => this.svc.files().filter(f => f.status === 'error').length);

  // Evidence header pill counts
  readonly pendingCount   = computed(() => this.svc.files().filter(f => f.status === 'pending').length);
  readonly validatedCount = computed(() => this.svc.files().filter(f => f.status === 'validated').length);

  // Actionable files for bulk select
  readonly actionableFiles = computed(() =>
    this.pageData().filter(f => f.status === 'pending' || f.status === 'needs-review'),
  );

  readonly selectAllState = computed<'none' | 'some' | 'all'>(() => {
    if (this.actionableFiles().length === 0 || this.selectedIds().size === 0) return 'none';
    if (this.actionableFiles().every(f => this.selectedIds().has(f.id))) return 'all';
    return 'some';
  });

  // Dynamic filter options from loaded data
  readonly projectOptions = computed<SelectOption[]>(() => [
    { label: 'All Projects', value: 'all' },
    ...[...new Set(this.svc.files().map(f => f.projectId))].map(id => ({ label: id, value: id })),
  ]);

  readonly periodOptions = computed<SelectOption[]>(() => [
    { label: 'All Periods', value: 'all' },
    ...[...new Set(this.svc.files().map(f => f.period))].map(p => ({ label: p, value: p })),
  ]);

  readonly uploadProjectOptions = computed<SelectOption[]>(() =>
    this.projectOptions().filter(o => o.value !== 'all'),
  );

  // Detail sheet items
  readonly aiDetailItem   = computed(() =>
    this.aiDetailId()   ? this.svc.files().find(f => f.id === this.aiDetailId())   ?? null : null,
  );
  readonly evidDetailFile = computed(() =>
    this.evidDetailId() ? this.svc.files().find(f => f.id === this.evidDetailId()) ?? null : null,
  );

  protected readonly tableColumns: DataColumn[] = [
    { key: 'select',         header: '',          sortable: false },
    { key: 'projectName',    header: 'Project',   sortable: true  },
    { key: 'period',         header: 'Period',    sortable: true  },
    { key: 'fileName',       header: 'File Name', sortable: true  },
    { key: 'metricCode',     header: 'Metric',    sortable: true  },
    { key: 'uploadedAt',     header: 'Uploaded',  sortable: true  },
    { key: 'confidence',     header: 'AI %',      sortable: true,  align: 'center' },
    { key: 'status',         header: 'Status',    sortable: true  },
    { key: 'notes',          header: 'Notes',     sortable: false },
    { key: 'actions',        header: 'Actions',   sortable: false },
  ];

  protected readonly statusOptions: SelectOption[] = [
    { label: 'All Status',   value: 'all'          },
    { label: 'Pending',      value: 'pending'      },
    { label: 'Queued',       value: 'queued'       },
    { label: 'Processing',   value: 'processing'   },
    { label: 'Completed',    value: 'completed'    },
    { label: 'Validated',    value: 'validated'    },
    { label: 'Needs Review', value: 'needs-review' },
    { label: 'Rejected',     value: 'rejected'     },
    { label: 'Error',        value: 'error'        },
  ];

  protected readonly confidenceOptions: SelectOption[] = [
    { label: 'All Confidence', value: 'all'  },
    { label: 'Low (<85%)',     value: 'low'  },
    { label: 'High (85%+)',    value: 'high' },
  ];

  private lastParams: PagedRequest = { page: 0, pageSize: 10 };

  onSearchChange(q: string): void                              { this.searchQuery.set(q);      this.reloadFromFilters(); }
  onProjectFilterChange(v: string): void                       { this.projectFilter.set(v);    this.reloadFromFilters(); }
  onPeriodFilterChange(v: string): void                        { this.periodFilter.set(v);     this.reloadFromFilters(); }
  onStatusFilterChange(v: FileProcessingStatus | 'all'): void  { this.statusFilter.set(v);     this.reloadFromFilters(); }
  onConfidenceFilterChange(v: 'all' | 'low' | 'high'): void   { this.confidenceFilter.set(v); this.reloadFromFilters(); }

  private reloadFromFilters(): void {
    this.loadPage({ ...this.lastParams, page: 0, filters: this.buildFilters() });
  }

  onPageChange(params: PagedRequest): void {
    this.loadPage({ ...params, filters: this.buildFilters() });
  }

  private buildFilters(): Record<string, string> {
    return {
      search:     this.debouncedQuery(),
      status:     this.statusFilter(),
      confidence: this.confidenceFilter(),
    };
  }

  private loadPage(params: PagedRequest): void {
    this.lastParams = params;
    this.loading.set(true);
    this.svc.loadPaged(params).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.pageData.set(res.data);
        this.pageTotal.set(res.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  // Selection
  onToggleSelect(id: string): void {
    this.selectedIds.update(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  onSelectAll(): void {
    const actionable = this.actionableFiles();
    if (actionable.every(f => this.selectedIds().has(f.id))) {
      this.selectedIds.set(new Set());
    } else {
      this.selectedIds.set(new Set(actionable.map(f => f.id)));
    }
  }
  onApproveSelected(): void {
    const [firstId] = this.selectedIds();
    if (firstId) this.onOpenAiDetail(firstId);
  }
  onClearSelection(): void { this.selectedIds.set(new Set()); }

  // Approve single (from evidence detail sheet or AI detail sheet)
  onApprove(id: string): void {
    this.svc.updateStatus(id, 'validated');
    this.selectedIds.update(s => { const n = new Set(s); n.delete(id); return n; });
    this.onCloseAiDetail();
  }

  // Reject single (from AI detail sheet)
  onReject(id: string): void {
    this.svc.updateStatus(id, 'rejected');
    this.selectedIds.update(s => { const n = new Set(s); n.delete(id); return n; });
    this.onCloseAiDetail();
  }

  // Reprocess (from AI detail sheet)
  onReprocess(id: string): void { this.svc.reprocess(id); }

  // Detail sheets
  onOpenAiDetail(id: string): void   { this.aiDetailId.set(id); }
  onCloseAiDetail(): void             { this.aiDetailId.set(null); }
  onOpenEvidDetail(id: string): void  { this.evidDetailId.set(id); }
  onCloseEvidDetail(): void           { this.evidDetailId.set(null); }

  onUpload(): void { this.showUploadDialog.set(false); }
}
