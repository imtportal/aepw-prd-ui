import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule, LucideIconProvider, LUCIDE_ICONS, Info,
} from 'lucide-angular';
import {
  CardComponent, CardHeaderComponent, CardTitleComponent, CardContentComponent,
} from '../../../shared/ui/card/card.component';
import { SelectComponent } from '../../../shared/ui/select/select.component';
import { DataTableComponent, DataColumn } from '../../../shared/ui/data-table/data-table.component';
import { AIProcessingService } from '../services/ai-processing.service';
import { ProcessingStatus, QueueItem } from '../models/ai-processing.model';
import { AiStatsRowComponent } from '../components/ai-stats-row/ai-stats-row.component';
import { AiQueueRowComponent } from '../components/ai-queue-row/ai-queue-row.component';
import { AiDetailSheetComponent } from '../components/ai-detail-sheet/ai-detail-sheet.component';
import { SelectOption } from '../../../shared/models/select-option';
import { PagedRequest } from '../../../core/models/api-response.model';

@Component({
  selector: 'app-ai-processing-page',
  standalone: true,
  imports: [
    FormsModule,
    LucideAngularModule,
    CardComponent, CardHeaderComponent, CardTitleComponent, CardContentComponent,
    SelectComponent,
    DataTableComponent,
    AiStatsRowComponent,
    AiQueueRowComponent,
    AiDetailSheetComponent,
  ],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Info }) },
  ],
  templateUrl: './ai-processing-page.component.html',
})
export class AIProcessingPageComponent {
  private readonly aiSvc      = inject(AIProcessingService);
  private readonly destroyRef = inject(DestroyRef);

  readonly statusFilter = signal<ProcessingStatus | 'all'>('all');
  private readonly detailItemId = signal<string | null>(null);

  readonly pageData  = signal<QueueItem[]>([]);
  readonly pageTotal = signal(0);
  readonly loading   = signal(false);

  readonly totalCount       = computed(() => this.aiSvc.queue().length);
  readonly queuedCount      = computed(() => this.aiSvc.queue().filter(i => i.status === 'queued').length);
  readonly processingCount  = computed(() => this.aiSvc.queue().filter(i => i.status === 'processing').length);
  readonly completedCount   = computed(() => this.aiSvc.queue().filter(i => i.status === 'completed').length);
  readonly needsReviewCount = computed(() => this.aiSvc.queue().filter(i => i.status === 'needs-review').length);
  readonly errorCount       = computed(() => this.aiSvc.queue().filter(i => i.status === 'error').length);

  readonly detailItem = computed(() =>
    this.detailItemId() ? this.aiSvc.queue().find(i => i.id === this.detailItemId()) ?? null : null,
  );

  protected readonly tableColumns: DataColumn[] = [
    { key: 'projectName',   header: 'Project Name', sortable: true  },
    { key: 'period',        header: 'Period',        sortable: true  },
    { key: 'fileName',      header: 'File Name',     sortable: true  },
    { key: 'metricCode',    header: 'Metric',        sortable: true  },
    { key: 'uploadedAt',    header: 'Uploaded',      sortable: true  },
    { key: 'processingTime',header: 'Duration',      sortable: false, align: 'center' },
    { key: 'confidence',    header: 'AI %',          sortable: true,  align: 'center' },
    { key: 'status',        header: 'Status',        sortable: true  },
    { key: 'notes',         header: 'Notes',         sortable: false },
    { key: 'actions',       header: 'Actions',       sortable: false },
  ];

  protected readonly statusOptions: SelectOption[] = [
    { label: 'All', value: 'all' },
    { label: 'Queued', value: 'queued' },
    { label: 'Processing', value: 'processing' },
    { label: 'Completed', value: 'completed' },
    { label: 'Review', value: 'needs-review' },
    { label: 'Errors', value: 'error' },
  ];

  private lastParams: PagedRequest = { page: 0, pageSize: 10 };

  onFilterChange(status: ProcessingStatus | 'all'): void {
    this.statusFilter.set(status);
    this.loadPage({ ...this.lastParams, page: 0, filters: { status } });
  }

  onPageChange(params: PagedRequest): void {
    this.loadPage({ ...params, filters: { status: this.statusFilter() } });
  }

  private loadPage(params: PagedRequest): void {
    this.lastParams = params;
    this.loading.set(true);
    this.aiSvc.loadPaged(params).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.pageData.set(res.data);
        this.pageTotal.set(res.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onOpenDetail(id: string): void  { this.detailItemId.set(id); }
  onCloseDetail(): void           { this.detailItemId.set(null); }
  onReprocess(id: string): void   { this.aiSvc.reprocess(id); }
}
