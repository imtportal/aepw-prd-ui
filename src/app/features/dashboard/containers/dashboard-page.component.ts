import { Component, DestroyRef, OnInit, Signal, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { catchError, debounceTime, distinctUntilChanged, map, mergeMap, take, tap } from 'rxjs/operators';
import {
  LucideAngularModule, LucideIconProvider, LUCIDE_ICONS,
  CalendarRange, Rocket, RotateCw
} from 'lucide-angular';
import { CardComponent, CardContentComponent, CardHeaderComponent, CardTitleComponent } from '../../../shared/ui/card/card.component';
import { SearchInputComponent } from '../../../shared/ui/search-input/search-input.component';
import { BadgeComponent } from '../../../shared/ui/badge/badge.component';
import { SelectComponent } from '../../../shared/ui/select/select.component';
import { DataTableComponent, DataColumn } from '../../../shared/ui/data-table/data-table.component';
import { ReviewService } from '../../reviews/services/review.service';
import { PendingRiskAdjustmentReviewService } from '../../reviews/create/services/pending-review.service';
import { ApprovalCycleRecord, PendingRiskAdjustmentReview, RiskOverride } from '../../reviews/create/create-review.types';
import { ApprovalReviewModalComponent, ApprovalSubmission } from '../components/approval-review-modal/approval-review-modal.component';
import { GetReviewFilters, MetricRiskResponseJSON, ReviewExcelUploadDto, ReviewListDto, ReviewWorkflowStage } from '../../reviews/models/review.model';
import { ReviewProgressCellComponent } from '../components/review-progress-cell/review-progress-cell.component';
import { ActiveFiltersComponent } from '../components/active-filters/active-filters.component';
import { ActiveFilterKey, buildFilters } from '../dashboard.types';
import { formatDateTime } from '../../../shared/utils/date.utils';
import { PagedRequest } from '../../../core/models/api-response.model';
import { CATEGORY_BADGE_COLORS } from '../../../shared/constants/badge-colors';
import { of, Subscription, timer } from 'rxjs';
import { LookupService } from '../../../core/services/lookup-service';
import { Metric } from '../../admin/models/metric.model';
import { MetricService } from '../../admin/services/metric.service';
import { mapStageToFormattedKeys, METRIC_CATEGORIES, STAGE_COLORS, upperCasedWithoutSpaceStages as upperCasedWithoutSpaceStages_import } from './dashboard-page.model';
// import { MessageService } from 'primeng/api';

import { CurrentUserService } from '../../../core/services/current-user.service';
import { PeriodService } from '../../reviews/create/services/period.service';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { CommonModule } from '@angular/common';
const ALL_STAGES: ReviewWorkflowStage[] = [
  'Due','Draft','Data Collection','Evidence Collection','Validation','Approval','Closed',
];


type DashboardRow = ReviewListDto & { pendingId?: string; pendingApprovalStatus?: PendingRiskAdjustmentReview['status'] };

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    LucideAngularModule,
    CardComponent, CardContentComponent, CardHeaderComponent, CardTitleComponent,
    BadgeComponent,
    SelectComponent,
    DataTableComponent,
    ReviewProgressCellComponent,
    ActiveFiltersComponent,
    SearchInputComponent,
    ApprovalReviewModalComponent,
    TranslocoPipe
  ],
  providers: [
    { provide: LUCIDE_ICONS, multi: true,
      useValue: new LucideIconProvider({ CalendarRange, Rocket, RotateCw }) },
  ],
  templateUrl: './dashboard-page.component.html',
})
export class DashboardPageComponent {
  protected readonly router          = inject(Router);
  protected readonly reviewSvc             = inject(ReviewService);
  protected readonly periodSvc             = inject(PeriodService);
  protected readonly lookupsvc             = inject(LookupService);
  private  readonly destroyRef       = inject(DestroyRef);
  private  readonly pendingRiskAdjustmentReviewSvc = inject(PendingRiskAdjustmentReviewService);
  private  readonly currentUserSvc = inject(CurrentUserService);
  private readonly translocoService = inject(TranslocoService); 

  private readonly metricSVC = inject(MetricService);
  protected readonly loading = this.reviewSvc.loading;
  protected readonly error   = this.reviewSvc.error;

  // private messageService = inject(MessageService);
  protected selectedPeriod = '';
  searchId    = signal('');
  filterPM    = signal('');
  filterStage = signal('');

  protected mode = signal<string>('text');
  protected type = signal<string>('square');

  readonly pageData     = signal<DashboardRow[]>([]);
  readonly pageTotal    = signal(0);
  readonly tableLoading = signal(false);
  public readonly upperCasedWithoutSpaceStages = upperCasedWithoutSpaceStages_import;

  // 'Due':                     Color_Codes.Muted,
  // 'Draft':                   Color_Codes.Blue,
  // 'Data Collection':         Color_Codes.AccentGreen,
  // 'RISKADJUSTMENT': Color_Codes.Orange,
  // 'Risk Adjustment': Color_Codes.Orange,
  // 'Evidence Collection':     Color_Codes.Orange,
  // 'Validation':              Color_Codes.LightBlue,
  // 'Approval':                Color_Codes.Green,
  // 'Closed':                  Color_Codes.DarkGrey,
  // 'Risk Adjustment Pending':  Color_Codes.Orange,
  // 'Pending Risk Adjust':  Color_Codes.Orange,
  // 'Pending Review Launch': Color_Codes.Green,
  // 'Risk Adjustment Reviewed': Color_Codes.Green,
  
  

  private readonly debouncedSearch = toSignal(
    toObservable(this.searchId).pipe(debounceTime(300), distinctUntilChanged()),
    { initialValue: '' },
  );

  protected readonly uniquePMs = computed(() =>
    [...new Set(this.reviewSvc.reviews().map(r => r.pm))].sort(),
  );

  activeFilters = computed(() => {

    const pmFilterDisplayValue = this.pmOptions().find(option => option.value === this.filterPM())?.label ?? '';
    const stageFilterDisplayValue = this.stageOptions().find(option => option.value === this.filterStage())?.label ?? '';
    return buildFilters(this.searchId(), pmFilterDisplayValue, stageFilterDisplayValue);
    }
  );

  readonly combinedTableData = computed<DashboardRow[]>(() => [
    // ...this.pendingRiskAdjustmentReviewSvc.reviews().map(pr => this.toDashboardRow(pr)),
    ...this.pageData(),
  ]);

  readonly combinedTotal = computed(() =>
    this.pageTotal() + this.pendingRiskAdjustmentReviewSvc.reviews().length
  );

  readonly selectedPendingId    = signal<string | null>(null);
  readonly selectedPendingReview = toSignal(
    this.selectedPendingId() ? this.pendingRiskAdjustmentReviewSvc.getById(this.selectedPendingId() as string) : of(null)
  );

  approvalModalForPendingReview = signal<PendingRiskAdjustmentReview | null>(null);  
  approvalModalMetrics = signal<Metric[]>([]);
  submittingApprovalDecision = signal<boolean>(false);

  openApprovalModal(id: string): void   { 
    this.selectedPendingId.set(id); 

    this.metricSVC.getReviewMetrics(id, true) 
    .pipe(
      take(1),
      mergeMap(
        metrics => {
          return this.pendingRiskAdjustmentReviewSvc.getById(id).pipe(
            take(1)
            ,
            catchError(() => {
              this.selectedPendingId.set(null); 
              return of(null);
            })
            ,
            tap(review => {
              if (!review) {
                return;
              }
              const reviewMetrics = review?.reviewMetrics || [];
              
              const approvalHistoryElem: ApprovalCycleRecord = {
                riskOverrides: {},
                newOverrideCodes: reviewMetrics.map(m => m.metricCode),
                status: 'rejected',
                createdAt: ''
              };

              for (const metric of reviewMetrics) {
                if (!metric.riskPctProposed) {
                  continue;
                }
                approvalHistoryElem.riskOverrides[metric.metricCode] = {
                  risk: metric.riskPctProposed,
                  reason: metric.raReason || '',
                }
              }
              
              // review.approvalHistory = [approvalHistoryElem];

              review.newOverrideCodes = undefined;

              if (review.statusDisplayValue && (this.upperCasedWithoutSpaceStages[review.statusDisplayValue] == this.upperCasedWithoutSpaceStages["Pending Risk Adjust"])) {
                // cleaning pending Metric Codes so that they are visible in modal for Approve-Reject action
                const riskOverrides: Record<string, RiskOverride> = {};
                for (const m of review.reviewMetrics || []) {
                  if ((m.raStatus?.toLowerCase() == 'pending') && m.riskPctProposed && (+m.riskPctProposed != m.riskPctEffective)) {
                    riskOverrides[m.metricCode] = review.riskOverrides[m.metricCode];
                  }
                }

                review.riskOverrides = riskOverrides;
              }

              this.approvalModalForPendingReview.set(review); 
            }),
            
            map(() => metrics)
          )
        }
      )
    )

    .subscribe(metrics => {
      this.approvalModalMetrics.set(metrics);
    });
  
  }
  closeApprovalModal(): void            { 
    this.selectedPendingId.set(null);
    this.approvalModalForPendingReview.set(null);
  }

  onApprovalSubmitted(decision: ApprovalSubmission): void {
    const id = this.selectedPendingId();
    if (!id) return;
    
    const metricRiskResponseJSON: MetricRiskResponseJSON[] = [];

    const changedMetrics = decision.changedMetrics as {
      metricId: number;
      code: string;
      name: string;
      defaultRiskPct: number;
      isMandatory: boolean;
      updatedRisk: number;
      pmReason: string;
    }[];

    // MetricId INT,
    // RiskPctProposed numeric(18, 5),
    // RiskPctEffective numeric(18, 5),
    // RAReason NVARCHAR(250),
    // Approved INT
    /*
      changedMetric[0] -> {
        "code": "EE1.1",
        "name": "Organisation Engaged",
        "defaultRiskPct": 4,
        "isMandatory": true,
        "updatedRisk": 2,
        "pmReason": "res2"
      }
      rejectionInfo ->{
        "EE1.18": "finance rejected!!!",
        "MC1.12": "private hai govt thodi... kar diya reject!!"
      } 
    */
    
    for (const metric of changedMetrics) {
      const metricRiskResponseJSONElem: MetricRiskResponseJSON = {} as MetricRiskResponseJSON;
      metricRiskResponseJSONElem.MetricId =  metric.metricId;
      metricRiskResponseJSONElem.RiskPctProposed =  metric.updatedRisk;
      
      metricRiskResponseJSONElem.Approved = decision.rejectionInfo[metric.code] ? 0 : 1; 

      metricRiskResponseJSONElem.RiskPctEffective = metricRiskResponseJSONElem.Approved ? metric.updatedRisk : metric.defaultRiskPct;
      metricRiskResponseJSONElem.RAReason = decision.rejectionInfo[metric.code] || '';

      metricRiskResponseJSON.push(metricRiskResponseJSONElem);
    }

    const userId = this.currentUserSvc.loggedInUser?.userId || 0; //TODO: replace with real value
    console.log({decision, metricRiskResponseJSON});
    
    this.submittingApprovalDecision.set(true);
    this.reviewSvc.saveRiskAdjustmentAction(+id, metricRiskResponseJSON, +(userId)).subscribe(reviewId => {
      console.log('Save risk adjustment action response (reviewId):', reviewId);
      this.submittingApprovalDecision.set(false);

      if (+reviewId) {
        // this.messageService.add({ severity: 'success', summary: 'Submitted', detail: "Risk adjustment decision submitted successfully" });
        this.closeApprovalModal();

        this.reloadFromFilters();
      }

      else {
        // this.messageService.add({ severity: 'error', summary: 'Submission Failed', detail: "Could not submit, please try again" });
      }
    });
  }

  protected readonly tableColumns: DataColumn[] = [ 
    { key: 'reviewId', header: computed(() => this.translocoService.translateObject('BUSINESS_ROLE'))(),            sortable: true,  headerClass: 'whitespace-nowrap' },
    { key: 'project',   header: this.translocoService.translate('DASHBOARD.TABLE.PROJECT', {}, this.translocoService.getActiveLang()),        sortable: true  },
    { key: 'pm',        header: this.translocoService.translate('DASHBOARD.TABLE.PM'),             sortable: true,  headerClass: 'whitespace-nowrap' },
    { key: 'recipient', header: this.translocoService.translate('DASHBOARD.TABLE.RECIPIENT_POC'),  sortable: true,  headerClass: 'whitespace-nowrap' },
    { key: 'stageDisplayValue',     header: this.translocoService.translate('DASHBOARD.TABLE.STAGE'),          sortable: true,  headerClass: 'whitespace-nowrap' },
    { key: 'progress',  header: this.translocoService.translate('DASHBOARD.TABLE.PROGRESS'),       sortable: false, headerClass: 'whitespace-nowrap' },
    { key: 'updatedAt', header: this.translocoService.translate('DASHBOARD.TABLE.UPDATED'),        sortable: true,  headerClass: 'whitespace-nowrap' },
    { key: 'quarter', header: '',        sortable: false,  headerClass: 'whitespace-nowrap' },
  ];


  // protected PERIODS = toSignal(
  //   this.periodSvc.getReviewPeriods(),
  //   { initialValue: [] }
  // ) as unknown as Signal<Record<string, unknown>[]>;

  protected readonly periodsOptions   = toSignal(
    this.periodSvc.getReviewPeriods().pipe(map(periods => [ { label: 'All', value: '' } , ...periods])),
    { initialValue: [] }
  ) as unknown as Signal<Record<string, unknown>[]>;
  protected readonly stageOptions = signal<{ label: string; value: string; }[]>([]);
  // [
  //   { label: 'All Stages', value: 'all' },
  //   ...ALL_STAGES.map(s => ({ label: s, value: s })),
  // ];
  protected readonly pmOptions        = signal<{ label: string; value: string }[]>([{ label: 'All PMs', value: 'all' }]);
  // (() => [
  //   { label: 'All PMs', value: 'all' },
  //   ...this.uniquePMs().map(pm => ({ label: pm, value: pm })),
  // ]);
  protected readonly stageColors      = STAGE_COLORS;
  protected readonly categoryColors   = CATEGORY_BADGE_COLORS;
  protected readonly metricCategories = METRIC_CATEGORIES;
  protected readonly formatDate       = formatDateTime;
  private reloadFromFiltersSub: Subscription = new Subscription();


  public allExcelUploads = signal<ReviewExcelUploadDto[]>([]); //TODO: Remove later

  protected translocoText = computed(() => this.translocoService.translate('BUSINESS_ROLE.EDIT_ROLE'));
  ngOnInit(): void {
    this.setTableColumnHeaders();
    this.getStageOptions();
    this.getPMOptions(true); 

    //TODO: Remove later
    this.reviewSvc.getReviewExcelUploads(0).pipe(take(1)).subscribe(res => {
      this.allExcelUploads.set(res);
    });
  }

  protected downLoadExcelUpload(upload: ReviewExcelUploadDto): void {
    console.log("downloading: ", upload)

    if (!upload.blobUri?.trim()) {
      return;
    }
    // const downloadPath: string = upload.blobUri.replaceAll('https://', '').trim();
    const fileName: string = upload.fileName
    // this.reviewSvc.downloadReviewExcel(downloadPath)
    // .pipe(take(1))
    // .subscribe(base64String => {
    //   const byteCharacters = atob(base64String); // decode Base64
    //   const byteNumbers = new Array(byteCharacters.length);
    //   for (let i = 0; i < byteCharacters.length; i++) {
    //     byteNumbers[i] = byteCharacters.charCodeAt(i);
    //   }
    //   const byteArray = new Uint8Array(byteNumbers);

    //   const blob = new Blob([byteArray], {
    //     type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    //   });

    //   const link = document.createElement("a");
    //   link.href = URL.createObjectURL(blob);
    //   link.download = downloadPath;
    //   link.click();
    // })
    this.reviewSvc.downloadReviewExcel(fileName)
    .pipe(take(1))
    .subscribe(base64String => {
      const byteCharacters = atob(base64String); // decode Base64
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      const blob = new Blob([byteArray], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
    })
  }

  protected stageColor(stage: string): string {
    return STAGE_COLORS[stage as ReviewWorkflowStage] ?? '';
  }

  private lastParams: PagedRequest = { page: 0, pageSize: 10 };

  onSearchChange(q: string): void {
    this.searchId.set(q);
    this.reloadFromFilters();
  }

  onFilterPMChange(v: string): void {
    this.filterPM.set(v);
    this.reloadFromFilters();
  }

  onFilterStageChange(v: string): void {
    this.filterStage.set(v);
    this.reloadFromFilters();
  }

  onFilterPeriodChange(v: string): void {
    this.selectedPeriod = v;
    this.reloadFromFilters();
  }

  onResetFilters(): void {
    this.searchId.set('');
    this.filterPM.set('');
    this.filterStage.set('');
    this.selectedPeriod = '';
    this.reloadFromFilters();
  }

  private reloadFromFilters(): void {
    this.reloadFromFiltersSub.unsubscribe();

    this.reloadFromFiltersSub = timer(800).subscribe(() => {
      this.loadPage({ ...this.lastParams, page: 0, filters: this.buildFilters() });
    });
  }

  onPageChange(params: PagedRequest): void {
    this.loadPage({ ...params, filters: this.buildFilters() });
  }

  private buildFilters(): Record<string, string> {
    return {
      search: this.debouncedSearch(),
      pm:     this.filterPM(),
      stage:  this.filterStage(),
    };
  }

  private loadPage(params: PagedRequest): void {
    this.lastParams = params;
    this.tableLoading.set(true);

    const filters: GetReviewFilters = new GetReviewFilters();  
    filters.Project = this.searchId() || "";
  
    filters.PM = this.filterPM();
  
    filters.Stage = this.filterStage();

    filters.ReviewPeriodId = this.selectedPeriod || "";

    if (params.sortBy && params.sortBy.toLowerCase() && params.sortBy.trim()) {
      const sortBy = params.sortBy.trim().toLowerCase();

      switch (sortBy) {
        case "recipient": 
          filters.SortBy = "FundingRecipientName"; 
          break;
          
        case "project": 
          filters.SortBy = "ProjectName"; 
          break;

        case "pm": 
          filters.SortBy = "PM"; 
          break;

        case "stagedisplayvalue": 
          filters.SortBy = "Stage"; 
          break;
          
        case "updatedat": 
          filters.SortBy = "UpdatedOnUTC"; 
          break;
          
        default: 
          filters.SortBy = "ReviewId";
          break;
      }
    }


    filters.SortDesc = (params.sortDir === 'desc') ? 1 : 0;
    
    this.reviewSvc.getReviews(filters).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.pageData.set(res.data.map(x => ({...x, pendingId: String(x.reviewId)})));
        this.pageTotal.set(res.total);
        this.tableLoading.set(false);
      },
      error: () => this.tableLoading.set(false),
    });
  }

  protected clearFilter(key: ActiveFilterKey): void {
    if (key === 'filterPM')    { this.filterPM.set('');    this.reloadFromFilters(); }
    if (key === 'filterStage') { this.filterStage.set(''); this.reloadFromFilters(); }
    if (key === 'searchId')    { this.searchId.set('');       this.reloadFromFilters(); }
  }

  protected clearAllFilters(): void {
    this.filterPM.set('');
    this.filterStage.set('');
    this.searchId.set('');
    this.reloadFromFilters();
  }

  private toDashboardRow(pr: PendingRiskAdjustmentReview): DashboardRow {
    // const stage: ReviewWorkflowStage =
    //   pr.status === 'draft'                              ? 'Draft' :
    //   (pr.status === 'approved' || pr.status === 'rejected') ? 'Risk Adjustment Reviewed' :
    //                                                        'Risk Adjustment Pending';
    const stage: ReviewWorkflowStage =
      pr.status === 'draft'                              
        ? 'Draft' 
        : pr.status == 'PENDINGRISKADJUST'
          ? ('Pending Risk Adjust')
          : pr.status as ReviewWorkflowStage ;

    return {
      reviewId:              0,
      projectId:             Number(pr.projectId),
      project:               pr.projectName,
      pm:                    '—',
      recipient:             '—',
      stage,
      dataCompletionPct:     0,
      evidenceConfirmedPct:  0,
      updatedAt:             pr.createdAt,
      pendingId:             pr.id,
      pendingApprovalStatus: pr.status,
    };
  }

  
  getStageOptions() {
    this.reviewSvc.getReviewStageOptions().pipe(take(1)).subscribe(options => {
      this.stageOptions.set(options);
    });
  }

  getPMOptions(dontIncludeAllOption = false) {
    this.lookupsvc.getProjectManagers("")
    .pipe(take(1))
    .subscribe(res => {
      const resOptions = res.data;
      const options = [{ label: 'All PMs', value: 'all' }];

      if (dontIncludeAllOption) {
        for (const optionIndex in options) {
          if (options[optionIndex].value?.toLowerCase() === 'all') {
            options.splice(Number(optionIndex), 1);
            break;
          }
        }
      }

      for (const option of resOptions) {
        if (option.userId) {
          options.push({ label: option.displayName, value: option.userId });
        }
      }

      this.pmOptions.set(options);
    });
  }

  protected rowClicked(review: ReviewListDto) {
    console.log('rowClicked', review);  
    if (!review.stageDisplayValue?.trim()) {
      return;
    }

    
    switch(
      this.upperCasedWithoutSpaceStages[review.stageDisplayValue.trim()]
    ) {
      case "DRAFT":
        this.router.navigate(['/reviews/create'], { queryParams: { pendingId: review.reviewId }  });
        break;
      case "PENDINGREVIEWLAUNCH":
        this.router.navigate(['/reviews/create'], { queryParams: { pendingId: review.reviewId }  });
        break;
      case "PENDINGRISKADJUST":
        this.router.navigate(['/reviews/create'], { queryParams: { pendingId: review.reviewId }  });
        break;
      case "DATACOLLECTION":
        this.router.navigate(['/reviews', review.reviewId]);
        break;
        default: 
        this.router.navigate(['/reviews', review.reviewId]);
        // this.router.navigate(['/reviews'], { queryParams: { pendingId: review.reviewId }  });
        break;
    }
    
  }

  setTableColumnHeaders() {
    this.translocoService.selectTranslation().pipe(take(1)).subscribe(() => {
      const map = (
        {
          reviewId: this.translocoService.translate('DASHBOARD.TABLE.ID')
          , project: this.translocoService.translate('DASHBOARD.TABLE.PROJECT')
          , pm: this.translocoService.translate('DASHBOARD.TABLE.PM')
          , recipient: this.translocoService.translate('DASHBOARD.TABLE.RECIPIENT_POC')
          , stageDisplayValue: this.translocoService.translate('DASHBOARD.TABLE.STAGE')
          , progress: this.translocoService.translate('DASHBOARD.TABLE.PROGRESS')
          , updatedAt: this.translocoService.translate('DASHBOARD.TABLE.UPDATED')

        }
      );

      const k = this.tableColumns;
      
      for (const col of this.tableColumns) {
        col.header = map[col.key as keyof typeof map] || col.header;
      }

    })
  }
 
}
