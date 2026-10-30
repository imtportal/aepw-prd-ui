import { Component, DestroyRef, OnInit, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
} from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import {
  LucideAngularModule,
  LucideIconProvider,
  LUCIDE_ICONS,
  Plus,
  Settings2,
  ChevronDown,
  RotateCw,
  LoaderCircle,
} from 'lucide-angular';
import { CardComponent, CardContentComponent } from '../../../../../shared/ui/card/card.component';
import { SelectComponent } from '../../../../../shared/ui/select/select.component';

import {
  DataTableComponent,
  DataColumn,
} from '../../../../../shared/ui/data-table/data-table.component';

// import { createAdminProjectsUiStore } from '../../../store/admin-projects-ui.store';
import { PagedRequest } from '../../../../../core/models/api-response.model';
import {
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  finalize,
  forkJoin,
  Subject,
  Subscription,
  switchMap,
} from 'rxjs';
import {
  AppUserLookup,
  ProjectManagerLookup,
  ReviewStageLookup,
} from '../../../../../core/models/lookup-model';
import { LookupService } from '../../../../../core/services/lookup-service';
import { PageLoadingService } from '../../../../../core/services/page-loading.service';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { AuthStateService, LoginContext } from '../../../../../core/auth';
import { ReviewTaskService } from '../../services/review-task.service';
import { ReviewTaskModel, SeniorLeadershipReviewTask } from '../../models/review-task.model';
import { DatePipe } from '@angular/common';
import { ReviewPageRole } from '../../../../reviews/models/review.model';
import { PeriodOption, PeriodService } from '../../../../reviews/create/services/period.service';
@Component({
  selector: 'app-projects-page',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    LucideAngularModule,
    CardComponent,
    CardContentComponent,
    SelectComponent,
    DatePipe,
    // DialogComponent,
    DataTableComponent,
    // ProjectDetailSheetComponent,
    // SearchInputComponent,
    ButtonComponent,
  ],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({ Plus, Settings2, ChevronDown, RotateCw, LoaderCircle }),
    },
  ],
  templateUrl: './review-task.component.html',
})
export class ReviewTasksComponent implements OnInit {
  private readonly pageLoadingService = inject(PageLoadingService);
  private readonly authStateService = inject(AuthStateService);
  readonly reviewTaskService = inject(ReviewTaskService);

  readonly currentLoggedInUserId = this.authStateService.getCurrentUserId()!;
  private readonly destroyRef = inject(DestroyRef);

  // readonly store = createAdminProjectsUiStore();
  private readonly router = inject(Router);
  private readonly actRoute = inject(ActivatedRoute);

  private readonly _allReviewTasks = signal<ReviewTaskModel[]>([]);
  private readonly _currentPage = signal(0);
  private readonly _pageSize = signal(10);
  //-------------------------------- Pagination variables ------------------------------------------
  readonly totalRecords = signal(0);
  readonly totalPages = signal(0);
  readonly pageData = computed(() => this._allReviewTasks());
  readonly pageTotal = computed(() => this.totalRecords());
  // ---------------------------------------------------------------------------------------------------
  readonly reviewStages = signal<ReviewStageLookup[]>([]);
  readonly reviewPeriodCodes = signal<PeriodOption[]>([]);
  protected selectedStageCode: number | null = null;
  protected selectedPeriodCode: string | null = "all";
  private readonly lookupService = inject(LookupService);
  protected readonly periodSvc = inject(PeriodService);

  readonly loading = signal(false);
  readonly seniorLeadershipTasks = signal<ReviewTaskModel[]>([
    // {
    //   quarter: 'Q4 - 2025',
    //   categoryCode: 'CV',
    //   categoryName: 'Capture Value from Waste',
    // },
    // {
    //   quarter: 'Q4 - 2025',
    //   categoryCode: 'MW',
    //   categoryName: 'Reduce Unmanaged Waste',
    // },
    // {
    //   quarter: 'Q3 2025',
    //   categoryCode: 'CV',
    //   categoryName: 'Capture Value from Waste',
    // },
    // {
    //   quarter: 'Q3 2025',
    //   categoryCode: 'EE',
    //   categoryName: 'Enable the Ecosystem',
    // },
    // {
    //   quarter: 'Q3 2025',
    //   categoryCode: 'MC',
    //   categoryName: 'Mobilise Capital',
    // },
    // {
    //   quarter: 'Q3 2025',
    //   categoryCode: 'MW',
    //   categoryName: 'Reduce Unmanaged Waste',
    // },
    // {
    //   quarter: 'Q3 2025',
    //   categoryCode: 'SB',
    //   categoryName: 'Create Social Benefit',
    // },
    // {
    //   quarter: 'Q2 2025',
    //   categoryCode: 'CV',
    //   categoryName: 'Capture Value from Waste',
    // },
    // {
    //   quarter: 'Q2 2025',
    //   categoryCode: 'EE',
    //   categoryName: 'Enable the Ecosystem',
    // },
    // {
    //   quarter: 'Q2 2025',
    //   categoryCode: 'MW',
    //   categoryName: 'Reduce Unmanaged Waste',
    // },
    // {
    //   quarter: 'Q2 2025',
    //   categoryCode: 'SB',
    //   categoryName: 'Create Social Benefit',
    // },
  ]);
  readonly isSeniorLeadershipOrAdmin = signal<boolean>(false);
  
  protected queryParamChange = toSignal(this.actRoute.queryParamMap)
  protected periodCodesHavingData = signal<string>("");
  protected readonly pendingTasksForQuartersTextPrefix = signal<string>("No pending tasks for this quarter. Tasks are available in: ");
  constructor() {
    effect(() => {
      const queryParamChange = this.queryParamChange();
      
      console.log("queryParamChange triggered")

      this.updateIsSeniorLeadershipOrAdmin();
      if (queryParamChange && queryParamChange.get('status')) {
        
        const stageFoundInDropdownList = this.reviewStages().some(stage =>  +(queryParamChange.get('status') || "") && (stage.code == String( +(queryParamChange.get('status') || ""))));
        if (stageFoundInDropdownList) {

          this.selectedStageCode = +(queryParamChange.get('status') || "");
        }

        this.refreshImpactMasters();
      }

    })
}

  updateIsSeniorLeadershipOrAdmin() {
    const selectedCode = this.selectedStageCode;

    const selectedStage = this.reviewStages().find((stage) => Number(stage.code) === selectedCode);

    const isSeniorLeadershipOrAdmin =  selectedStage?.name === 'Senior Leadership Approval' || selectedStage?.name === 'Admin';

    this.isSeniorLeadershipOrAdmin.set(isSeniorLeadershipOrAdmin);
  }

  readonly seniorLeadershipTableColumns: DataColumn[] = [
    {
      key: 'periodCode',
      header: 'Review Period',
      headerClass: 'w-20',
    },
    {
      key: 'metricCategories',
      header: 'Category',
      headerClass: 'w-36',
    },
    {
      key: 'action',
      header: 'Action',
      headerClass: 'w-12',
    },
  ];
  readonly tableColumns: DataColumn[] = [
    {
      key: 'impactMasterId',
      header: 'IM ID',
      headerClass: 'w-[70px]',
      sortable: true,
    },
    {
      key: 'pin',
      header: 'PIN',
      sortable: true,
    },
    {
      key: 'recordTypeName',
      header: 'Type',
      headerClass: 'w-[70px]',
      sortable: true,
    },
    {
      key: 'title',
      header: 'Project Title',
      headerClass: 'w-80',
      sortable: true,
    },
    {
      key: 'periodCode',
      header: 'Period',
      headerClass: 'w-[70px]',
      sortable: true,
    },
    {
      key: 'stageName',
      header: 'Review Stage',
      headerClass: 'w-48',
      sortable: true,
    },
    {
      key: 'metricCategories',
      header: 'Metric Categories',
    },
    {
      key: 'updatedOnUTC',
      header: 'Updated On',
      headerClass: 'w-36',
      sortable: true,
    },
    {
      key: 'action',
      header: 'Action',
      headerClass: 'text-right',
      sortable: false,
    },
  ];

  protected readonly loadingLookups = signal<boolean>(false);

  ngOnInit(): void {
    this.pageLoadingService.stop();
    
    this.loadLookups();
    this.loading.set(true);
  }
  private loadLookups(): void {
    const userId = this.getUserId();
    this.loadingLookups.set(true);
    forkJoin({
      reviewStages: this.lookupService.getReviewStagesByUserId(String(userId)),
      reviewPeriodCodes: this.periodSvc.getReviewPeriods(null, 0, true)
    }).subscribe({
      next: (result) => {
        this.reviewStages.set(result.reviewStages.data ?? []);
        this.reviewPeriodCodes.set(result.reviewPeriodCodes ?? []);
        this.reviewStageAssignFirst();
        // this.reviewPeriodAssignCurrent();
        this.refreshImpactMasters();

        this.loadingLookups.set(false);
      },
      error: (error) => {
        this.loadingLookups.set(false);
        console.error('Failed to load lookups', error);
      },
    });
  }

  private getReviewApprovalTasksSubscription: Subscription = new Subscription();
  protected refreshImpactMasters(): void {
    const userId = this.authStateService.getCurrentUserId();
    
    this.periodCodesHavingData.set("");
    this.loading.set(true);

    this.getReviewApprovalTasksSubscription.unsubscribe();
    this.getReviewApprovalTasksSubscription = this.reviewTaskService
      .getReviewApprovalTasks({
        pageNumber: this._currentPage() + 1,
        pageSize: this._pageSize(),
        periodCode: this.selectedPeriodCode,
        stageCode: (this.selectedStageCode && this.selectedStageCode != null) ? Number(this.selectedStageCode) : null,
        userId: <number> userId, 
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          
          // console.log("line 326 this.loading.set(false)")
          // this.loading.set(false)
        }
      
      ),
      )
      .subscribe({
        next: (response) => {
          const pagedData = response.data;

          let periodCodesHavingData = response.message;
          this.periodCodesHavingData.set(periodCodesHavingData);

          this.totalRecords.set(pagedData.totalRecords);

          this.totalPages.set(pagedData.totalPages);

          const adminRecords: ReviewTaskModel[] = [];
          
          for (const record of (pagedData.items || [])) {
            if (['admin', 'l4'].includes(record.stageName?.toLowerCase())) {
              adminRecords.push(record);
            }

          }

          // if (adminRecords.length > 0) {
            this.seniorLeadershipTasks.set(adminRecords);
          // }

          this.updateIsSeniorLeadershipOrAdmin();

          this._allReviewTasks.set(
            pagedData.items.map((p) => ({
              ...p,
              metricCategoryList: p.metricCategories ? p.metricCategories.split(',') : [],
            })),
          );

          this.getReviewApprovalTasksSubscription.unsubscribe();

          // console.log("line 367 this.loading.set(false)")
          this.loading.set(false)
        },
        error: (err) => {
          this.loading.set(false)
          
          console.error(err)
        },
      });
  }

  /////////////////////////////////////////////////////////////////////

  onPageChange(params: PagedRequest): void {
    this._currentPage.set(params.page);
    this._pageSize.set(params.pageSize);

    this.refreshImpactMasters();
  }
  onStageChange(stageCode: number | string | null): void {
    if (stageCode === null) {
      return;
    }

    this.selectedStageCode = (Number(stageCode));
    this._currentPage.set(0);
    this.updateIsSeniorLeadershipOrAdmin();
    this.router.navigate([''], { queryParams: {status: stageCode} })
    this.refreshImpactMasters();
  }

  onQuarterChange(periodCode: string | null): void {
    this.selectedPeriodCode = (String(periodCode));
    this._currentPage.set(0);
    // this.updateIsSeniorLeadershipOrAdmin();
    // this.router.navigate([''], { queryParams: {status: stageCode} })
    this.refreshImpactMasters();
  }

  ///////////////////////////////////////////////////////////////////////////////////
  // FILTER HANDLERS

  applyFilters(): void {
    this._currentPage.set(0);
    this.refreshImpactMasters();
  }

  reviewStageAssignFirst() {
    const reviewStages = this.reviewStages();
    const [ firstReviewStage ] = reviewStages; 
    const stageFoundInDropdownList = this.reviewStages().some(stage => this.selectedStageCode && (stage.code == String(this.selectedStageCode)));
    if (+firstReviewStage?.code && (!this.selectedStageCode || !stageFoundInDropdownList)) {
      this.selectedStageCode = +firstReviewStage?.code;
    }
  }

  reviewPeriodAssignCurrent() {
    const reviewPeriodCodes = this.reviewPeriodCodes();

    for (const periodCode of reviewPeriodCodes) {
      if (!this.selectedPeriodCode && periodCode.isCurrent) {
        this.selectedPeriodCode = periodCode?.label;
      }
    }
  }

  clearFilters(): void {
    this.reviewStageAssignFirst();
    this._currentPage.set(0);
    this.refreshImpactMasters();
  }

  ///////////////////////////////////////////////////////////////////////////////////////

  protected readonly recordTypeColors: Record<string, string> = {
    Project: 'bg-[hsl(var(--aepw-blue)/0.12)] text-[hsl(var(--aepw-blue))]',

    Corporate: 'bg-[hsl(var(--aepw-orange)/0.12)] text-[hsl(var(--aepw-orange))]',
  };
  protected readonly projectCategoryColors: Record<string, string> = {
    Pilot: 'bg-[hsl(var(--aepw-blue)/0.12)] text-[hsl(var(--aepw-blue))]',

    'Fast Track': 'bg-[hsl(var(--aepw-green)/0.12)] text-[hsl(var(--aepw-green))]',

    Anchor: 'bg-[hsl(var(--aepw-orange)/0.12)] text-[hsl(var(--aepw-orange))]',

    Other: 'bg-[hsl(var(--aepw-dark-grey)/0.12)] text-[hsl(var(--aepw-dark-grey))]',
  };
  protected readonly statusColors: Record<string, string> = {
    'Active with reporting': 'bg-[hsl(var(--aepw-green)/0.12)] text-[hsl(var(--aepw-green))]',

    'Active with no reporting': 'bg-[hsl(var(--aepw-blue)/0.12)] text-[hsl(var(--aepw-blue))]',

    'Closed with further reporting':
      'bg-[hsl(var(--aepw-orange)/0.12)] text-[hsl(var(--aepw-orange))]',

    'Closed with no further reporting':
      'bg-[hsl(var(--aepw-dark-grey)/0.12)] text-[hsl(var(--aepw-dark-grey))]',
  };

  goToReview(task: ReviewTaskModel): void {
    if (!task.metricCategories){
      return;
    }
    
    if (!task.periodCode) {
      return;
    }

    if (!task.stageName) {
      return;
    }

    let role: string = task.stageName?.toLowerCase();

    switch (role) {
      case "admin":
        role = ReviewPageRole.Admin;
        break;
      case "l4":
        role = ReviewPageRole.SeniorLeadership;
        break;
    }


    if ([ReviewPageRole.Admin, ReviewPageRole.SeniorLeadership].includes(<ReviewPageRole> role)) {
      this.router.navigate(['/reviews/1/1'], <NavigationExtras> { queryParams: { periodCode: task.periodCode, catCode: task.metricCategories, role } });
    }
    
    else {
      this.router.navigate(['/reviews/', task.reviewId, this.selectedStageCode], { queryParams: { from: 'queue' } });
    }

  }

  getUserId(): number | null {
    let userId: number | null = null;
    const loginContextStr = sessionStorage.getItem('loginContext');

    try {
      if (loginContextStr) {
        const loginContext = <LoginContext> JSON.parse(loginContextStr);
        userId = loginContext?.userDetails.userId ||  null;
      }
    }
    catch(error) {
      userId = null;
    }

    return userId;
  }

  protected showProjectTitleTooltip = signal<number | null>(null);
  showHideProjectTitleTooltip(impactMasterId: number | null) {
    this.showProjectTitleTooltip.set(impactMasterId);
  }
}
