import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReviewService } from '../../reviews/services/review.service';
import { CurrentUserService } from '../../../core/services/current-user.service';
import { ReviewItem } from '../../reviews/models/review.model';
import {
  ApprovalStage, QueueTab,
  STAGE_TO_STEP_ID, APPROVAL_STAGE_ORDER,
} from '../reviewer-queue.types';
import { KpiBarComponent } from '../components/kpi-bar/kpi-bar.component';
import { QueueItemRowComponent } from '../components/queue-item-row/queue-item-row.component';
import { DataTableComponent, DataColumn } from '../../../shared/ui/data-table/data-table.component';
import {
  TabsComponent, TabListComponent, TabComponent,
  TabPanelsComponent, TabPanelComponent,
} from '../../../shared/ui/tabs/tabs.component';
import { PagedRequest } from '../../../core/models/api-response.model';

@Component({
  selector: 'app-reviewer-page',
  standalone: true,
  imports: [
    KpiBarComponent,
    QueueItemRowComponent,
    DataTableComponent,
    TabsComponent, TabListComponent, TabComponent,
    TabPanelsComponent, TabPanelComponent,
  ],
  templateUrl: './reviewer-page.component.html',
})
export class ReviewerPageComponent {
  private readonly reviewSvc  = inject(ReviewService);
  private readonly userSvc    = inject(CurrentUserService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading     = this.reviewSvc.loading;
  readonly error       = this.reviewSvc.error;
  readonly currentUser = this.userSvc.currentUser;
  readonly myQueue     = this.reviewSvc.reviewerQueue;

  readonly pageData    = signal<ReviewItem[]>([]);
  readonly pageTotal   = signal(0);
  readonly tableLoading = signal(false);

  readonly pendingMetricsCount = computed(() =>
    this.myQueue().reduce((sum, item) => sum + item.totalMetrics - item.approvedMetrics, 0),
  );

  readonly materialFlagsCount = computed(() =>
    this.myQueue().filter(item => item.materialFlags > 0).length,
  );

  readonly rejectionsCount = computed(() =>
    this.myQueue().reduce((sum, item) => sum + item.rejectedMetrics, 0),
  );

  selectedTab = signal<ApprovalStage>('PM Review');

  readonly queueTabs = computed<QueueTab[]>(() =>
    APPROVAL_STAGE_ORDER.map(stage => ({
      id:    stage,
      label: stage,
      count: this.myQueue().filter(item => item.currentApprovalStage === stage).length,
    })),
  );

  protected readonly tableColumns: DataColumn[] = [
    { key: 'projectId',             header: 'ID',      sortable: true, headerClass: 'whitespace-nowrap' },
    { key: 'projectName',           header: 'Project', sortable: true  },
    { key: 'period',                header: 'Period',  sortable: true, headerClass: 'whitespace-nowrap' },
    { key: 'currentApprovalStage',  header: 'Stage',   sortable: true, headerClass: 'whitespace-nowrap' },
    { key: 'pm',                    header: 'PM',      sortable: true, headerClass: 'whitespace-nowrap' },
    { key: 'totalMetrics',          header: 'Metrics', sortable: true, headerClass: 'whitespace-nowrap' },
    { key: 'materialFlags',         header: 'Flags',   sortable: true, headerClass: 'whitespace-nowrap' },
    { key: 'lastActivity',          header: 'Updated', sortable: true, headerClass: 'whitespace-nowrap' },
    { key: 'actions',               header: 'Actions', sortable: false, headerClass: 'whitespace-nowrap' },
  ];

  setTab(val: string | number): void {
    this.selectedTab.set(val as ApprovalStage);
  }

  onPageChange(params: PagedRequest): void {
    this.tableLoading.set(true);
    this.reviewSvc.loadPagedQueue({ ...params, filters: { stage: this.selectedTab() } }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.pageData.set(res.data);
        this.pageTotal.set(res.total);
        this.tableLoading.set(false);
      },
      error: () => this.tableLoading.set(false),
    });
  }

  onApprove(projectId: number): void { this._act(projectId, 'approved'); }
  onReject (projectId: number): void { this._act(projectId, 'rejected'); }
  onRecycle(projectId: number): void { this._act(projectId, 'recycled'); }

  private _act(
    projectId: number,
    action: 'approved' | 'rejected' | 'recycled',
  ): void {
    const item = this.myQueue().find(i => i.projectId === projectId);
    if (!item) return;
    const stepId = STAGE_TO_STEP_ID[item.currentApprovalStage as ApprovalStage];
    this.reviewSvc.updateApprovalStep(projectId, stepId, action);
  }
}
