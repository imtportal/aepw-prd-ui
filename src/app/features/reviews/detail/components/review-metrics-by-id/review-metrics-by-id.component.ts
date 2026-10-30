import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  untracked,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  LUCIDE_ICONS,
  LucideAngularModule,
  LucideIconProvider,
  CalendarRange,
  Rocket,
  RotateCw,
  ChevronRight,
  ChevronDown,
  Info,
  X,
  Pencil,
  LoaderCircle,
  TriangleAlert,
  Check,
  ChartGantt,
  BadgeCheck,
  Sparkles,
  Rewind,
  ClockFading,
  ClockArrowUp,
  ListRestart,
  History,
} from 'lucide-angular';

import {
  ReviewMetricsByIdService,
  ReviewMetricsCategorySummary,
  ReviewMetricsEvidenceRow,
  ReviewMetricsPageData,
  ReviewMetricsSubMetric,
  ReviewMetricsTopMetric,
} from './review-metrics-by-id.service';
import { CommonModule } from '@angular/common';
import {
  ReviewMetricDto,
  ReviewMetricsByIdAction,
  ReviewMetricsByIdActionNames,
  ReviewMetricsByIdSourceNames,
} from './review-metrics-by-id.types';
import { ReviewService } from '../../../services/review.service';
import { FormsModule } from '@angular/forms';
import {
  EvidenceDto,
  ReviewApprovalProgressDto,
  ReviewDto,
  RecallTopLevelMetricInput,
  StartEndRestatementDto,
  ReviewMetricApproveRejectDto,
  UpdateReviewMetricFRCommentDto,
  UpdateReviewMetricsValuesDto,
} from '../../../models/review.model';
import {
  EMPTY,
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  from,
  map,
  of,
  Subject,
  Subscription,
  switchMap,
  take,
} from 'rxjs';
import { AddEvidenceDropdownComponent } from '../add-evidence-dropdown/add-evidence-dropdown.component';
import { ToastService } from '../../../../../shared/ui/toast/toast.service';
import { AuthorizationService, AuthStateService, LoginContext } from '../../../../../core/auth';
import { AppUserListModel } from '../../../../admin/users/models/user-model';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NgSelectComponent } from '@ng-select/ng-select';
import { LookupService } from '../../../../../core/services/lookup-service';
import { AppUserLookup } from '../../../../../core/models/lookup-model';
import { DialogComponent } from '../../../../../shared/ui/dialog/dialog.component';
import { ModalComponent } from '../../../../../shared/ui/modal/modal.component';
import { MetricEvidenceType } from '../../../../admin/models/metric.model';
import { FormatAmountPipe } from '../../../../../shared/pipes/format-amount.pipe';
import { FileSizeAsString } from '../../../../../shared/pipes/file-size-as-string.pipe';
import { ActionAccess } from '../../../../../core/auth/models/authorization.model';

@Component({
  selector: 'app-review-metrics-by-id',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './review-metrics-by-id.component.html',
  styleUrls: ['./review-metrics-by-id.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    AddEvidenceDropdownComponent,
    LucideAngularModule,
    NgSelectComponent,
    DialogComponent,
    ModalComponent,
    FormatAmountPipe,
    FileSizeAsString,
  ],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({
        CalendarRange,
        Rocket,
        RotateCw,
        ChevronDown,
        ChevronRight,
        BadgeCheck,
        Info,
        Pencil,
        LoaderCircle,
        TriangleAlert,
        Check,
        ChartGantt,
        Sparkles,
        Rewind,
        ClockArrowUp,
        ListRestart,
        History,
        X,
      }),
    },
  ],
})
export class ReviewMetricsByIdComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly lookupService = inject(LookupService);
  private readonly authStateService = inject(AuthStateService);
  private readonly authorizationService = inject(AuthorizationService);
  protected readonly authState = inject(AuthStateService);
  protected readonly canAccessEvidenceReview = computed(() =>
    this.authState.hasPageAccess('EVIDENCEREVIEW'),
  );
  readonly actionAccess = signal<ActionAccess[]>([]);
  private readonly pageKey = 'REVIEWDETAIL';
  ///////////////////////////////////////////////////////

  protected readonly canReassignUser = computed(() => {
    const result = this.actionAccess().some(
      (action) => action.key === 'TASKREASSIGNMENT' && action.value,
    );
    console.log('TASKREASSIGNMENT button access:', result);
    return result;
  });

  ///////////////////////////////////////////////////////////
  protected reviewMetricsByIdSourceNames = ReviewMetricsByIdSourceNames;
  public sourcePage = input<ReviewMetricsByIdSourceNames>(
    this.reviewMetricsByIdSourceNames.ReviewDetail,
  );
  readonly reviewId = input.required<string | number>();
  readonly stageId = input.required<number | null>();
  readonly refreshReviewMetricsData = input.required<boolean>();
  readonly fromDate = input('');
  readonly toDate = input('');

  public detailsExpanded = input<boolean>(false);
  public detailsExpansionChange = output<{ reviewId: number; expanded: boolean }>();
  public action = output<ReviewMetricsByIdAction>();

  private readonly metricsSvc = inject(ReviewMetricsByIdService);
  protected readonly reviewSvc = inject(ReviewService);
  protected readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  private readonly pendingMetricScroll = signal<string | null>(null);
  private focusedMetricKey: string | null = null;

  // public evidenceTypeList = signal<MetricEvidenceType[]>([]);

  protected readonly loading = this.metricsSvc.loading;
  protected readonly error = this.metricsSvc.error;
  //////////////////////////////////////////////////////////////////////////////
  // user typeahead toggle signal
  readonly userSearchTypeahead = new Subject<string>();
  readonly searchLoading = signal(false);
  protected readonly editingAssigneeRow = signal<string | null>(null);

  protected readonly selectedAssigneeUsers = signal<Record<string, AppUserLookup | null>>({});
  protected readonly assigneeUpdateInProgress = signal<Record<string, boolean>>({});

  protected readonly userSearchResults = signal<AppUserLookup[]>([]);

  // ///////////////////////////////////
  protected readonly uploadingEvidenceForMetricCode = signal<Record<string, string>>({});
  protected updatingBaseline = signal<Record<string, boolean>>({});
  protected showBaselineCalculationMetricCode = signal<Record<string, boolean>>({});
  protected updatingRawValue = signal<Record<string, boolean>>({});
  protected updatingRiskPercent = signal<Record<string, boolean>>({});
  private readonly normalizedReviewId = computed(() => String(this.reviewId()));
  protected readonly modalInfoMetric = signal<ReviewMetricDto | null>(null);
  protected valorizationOptions = signal<{ id: number; description: string }[]>([]);

  protected readonly reviewData = signal<ReviewMetricsPageData | null>(null);

  protected baselineConfirmationModalOpen = signal<boolean>(false);
  protected updatingVT = signal<{ [metricCode: string]: boolean }>({});
  protected readonly categoryTabs = computed<ReviewMetricsCategorySummary[]>(
    () => this.reviewData()?.categories ?? [],
  );

  protected actionForTopLevelMetric = signal<{
    metricCode: string;
    comment: string;
    decision?: 'approved' | 'rejected' | '';
    actioninProgress: boolean;
  } | null>(null);
  protected readonly metricActionConfirmationVisible = signal(false);
  protected readonly metricActionConfirmation = signal<'approved' | 'rejected' | null>(null);
  protected readonly restatementConfirmationVisible = signal(false);
  protected readonly restatementComment = signal('');
  private readonly pendingRestatementValues = signal<UpdateReviewMetricsValuesDto[] | null>(null);
  protected readonly pendingMetricAction = signal<{
    metricCode: string;
    comment: string;
  } | null>(null);
  // protected readonly activeCategoryCode = linkedSignal(() =>
  //   this.categoryTabs()[0]?.code ?? '',
  // );

  public showRecallButton = input<boolean>(false);
  public showRestatementButton = input<boolean>(false);

  public showViewProgressButton = input<boolean>(false);
  public showApproveTopLevelMetricbutton = input<boolean>(false);
  public showRejectTopLevelMetricbutton = input<boolean>(false);
  public allowEditBaseline = input<boolean>(false);
  public allowEditRawValue = input<boolean>(false);
  public allowEditRiskPercent = input<boolean>(false);
  public allowAddingEvidences = input<boolean>(false);
  public allowViewEvidence = input<boolean>(false);
  public allowDeleteEvidence = input<boolean>(false);

  protected activeCategoryCode = signal<string>('');
  public reviewDetail = input<ReviewDto | null>();
  public projectId = input<string | number | null>();
  public projectName = input<string | null>();

  protected readonly activeCategory = computed(
    () =>
      this.categoryTabs().find((category) => category.code === this.activeCategoryCode()) ?? null,
  );

  protected totalVisibleMetricsForCategory = signal<{ [metricCode: string]: number }>({});
  protected readonly visibleTopMetrics = computed<ReviewMetricsTopMetric[]>(
    () =>
      this.reviewData()?.topMetrics.filter(
        (metric) => metric.categoryCode === this.activeCategoryCode(),
      ) ?? [],
  );

  protected readonly totalVisibleMetrics = computed(() =>
    this.visibleTopMetrics().reduce((count, metric) => {
      return count + metric.l1Metrics?.length;
    }, 0),
  );

  protected readonly expandedTopMetrics = signal(new Map<string, boolean>());
  protected readonly expandedSubMetrics = signal(new Set<string>());

  protected editingBaselineMetricCodes = signal<Record<string, boolean>>({});
  protected editingRawValueMetricCodes = signal<Record<string, boolean>>({});
  protected editingRiskPercentMetricCodes = signal<Record<string, boolean>>({});
  // protected editingAdditionalDetailsMetricCodes = signal<Record<string, boolean>>({});
  protected additionalDetailsEditFor = signal<string | null>(null);
  protected additionalDetailsPrevValue = signal<string>('');

  protected baselineCalculation = this.metricsSvc.baselineCalculation;
  protected showFrCommentForTopMetricCodes = signal<{ [metricCode: string]: boolean }>({});
  protected additionalDetailsShowForMetric = signal<{ [metricCode: string]: boolean }>({});

  protected approvalProgressRows = signal<ReviewApprovalProgressDto[]>([]);
  protected approvalProgressLoading = signal<boolean>(false);
  protected approvalProgressModalOpenFor = signal<ReviewMetricsTopMetric | null>(null);

  restatementModeActive = input<boolean>(false);
  protected readonly editingRestatement = signal(false);
  protected readonly confirmingRestatement = signal(false);
  private readonly originalRestatementValues = new Map<
    number,
    {
      baseline: number | undefined;
      rawValue: number | undefined;
      riskOriginal: number | undefined;
    }
  >();
  protected baselineRawValueForMetricIds_RS = new Map<number, UpdateReviewMetricsValuesDto>();
  public baselineRawValueForMetricIds_RSUpdated =
    output<Map<number, UpdateReviewMetricsValuesDto>>();

  protected readonly recallModalOpen = signal(false);
  protected readonly recallMetricCode = signal('');
  protected readonly recallComment = signal('');
  protected readonly recallLoader = signal(false);
  protected readonly recallStagesLoading = signal(false);
  private recallMetric: ReviewMetricsTopMetric | null = null;
  private readonly recallConfirmationAction = new Subject<void>();
  private recallConfirmationSubscription = new Subscription();

  constructor() {
    this.destroyRef.onDestroy(() => this.recallConfirmationSubscription.unsubscribe());

    effect(() => {
      const metricCode = this.queryParams().get('tlm')?.trim() ?? '';
      const review = this.reviewData();
      untracked(() => this.focusRequestedMetric(metricCode, review));

      this.updateTotalVisibleMetricsForCategory();
    });

    afterRenderEffect(() => {
      const metricCode = this.pendingMetricScroll();
      if (!metricCode || this.loading() || !this.detailsExpanded()) {
        return;
      }

      const row = Array.from(
        this.host.nativeElement.querySelectorAll<HTMLElement>('[data-review-metric-code]'),
      ).find((element) => element.getAttribute('data-review-metric-code') === metricCode);

      if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'end' });
        this.pendingMetricScroll.set(null);
      }
    });

    // search typeahead
    this.userSearchTypeahead
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => {
          const searchTerm = term?.trim() ?? '';

          if (searchTerm.length < 3) {
            this.searchLoading.set(false);
            return of<AppUserLookup[]>([]);
          }

          this.searchLoading.set(true);

          return this.lookupService.getUsers(searchTerm).pipe(
            map((response) => response.data ?? []),
            catchError((error) => {
              console.error('[Stage Assignee User Typeahead]', error);
              return of<AppUserLookup[]>([]);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((users) => {
        this.userSearchResults.set(users);
        this.searchLoading.set(false);
      });
    this.metricsSvc.refreshReviewMetricsData.subscribe(() => {
      this.refreshReviewData();
    });

    effect((onCleanup) => {
      const refreshReviewMetricsData = this.refreshReviewMetricsData();
      this.refreshReviewData();
    });

    effect((onCleanup) => {
      const userId = this.getUserId() || 0;
      const sub = this.metricsSvc
        .load(
          {
            reviewId: this.normalizedReviewId(),
            userId,
            stageId: this.stageId(),
            sourcePage: this.sourcePage(),
          },
          false,
        )
        .subscribe((review) => {
          this.reviewData.set(review);
          this.calculateCategoryPendingCounts();

          if (review) {
            const firstCategory = review.categories[0]?.code ?? '';

            if (!this.activeCategoryCode()) {
              this.activeCategoryCode.set(firstCategory);
            }
          }
        });

      onCleanup(() => sub.unsubscribe());
    });
  }

  private focusRequestedMetric(metricCode: string, review: ReviewMetricsPageData | null): void {
    if (!metricCode) {
      this.focusedMetricKey = null;
      this.pendingMetricScroll.set(null);
      return;
    }
    if (!review || review.reviewId !== this.normalizedReviewId()) {
      return;
    }

    const focusKey = `${review.reviewId}:${metricCode}`;
    if (this.focusedMetricKey === focusKey) {
      return;
    }

    const topMetric = review.topMetrics.find(
      (metric) =>
        metric.metricCode === metricCode ||
        metric.l1Metrics.some((child) => child.metricCode === metricCode),
    );
    if (!topMetric) {
      this.pendingMetricScroll.set(null);
      return;
    }

    this.focusedMetricKey = focusKey;
    this.activeCategoryCode.set(topMetric.categoryCode);
    this.expandedTopMetrics.update((existing) => new Map(existing).set(topMetric.metricCode, true));
    this.expandedSubMetrics.update((existing) => {
      const expanded = new Set(existing);
      const children =
        topMetric.metricCode === metricCode
          ? topMetric.l1Metrics
          : topMetric.l1Metrics.filter((child) => child.metricCode === metricCode);
      children.forEach((child) => expanded.add(child.metricCode));
      return expanded;
    });
    this.pendingMetricScroll.set(metricCode);

    if (!this.detailsExpanded()) {
      this.expansionChanged();
    }
  }

  ngOnInit() {
    this.loadValorisationTypeOptions();
    this.loadActionAccess();
  }
  private loadActionAccess(): void {
    const userId = this.authStateService.getCurrentUserId();

    if (!userId) {
      console.error('[Authorization] Current user ID not available.');
      return;
    }

    this.authorizationService
      .getActionAccess(this.pageKey, userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.actionAccess.set(response.data ?? []);

          console.log('[Authorization] User Management action access:', response.data);
        },
        error: (error) => {
          console.error('[Authorization] Failed to load User Management action access:', error);

          this.actionAccess.set([]);
        },
      });
  }

  loadValorisationTypeOptions(): void {
    this.reviewSvc
      .getValorisationTypes()
      .pipe(take(1))
      .subscribe((res) => {
        this.valorizationOptions.set(res);
      });
  }

  ////////////////////////////////////////////////////////////////////////
  protected categoryPendingCount = signal<{
    [categoryCode: string]: { totalCount: number; doneCount: number };
  }>({});

  onEditAssigneeUser(row: ReviewApprovalProgressDto): void {
    const rowKey = this.assigneeRowKey(row);
    this.editingAssigneeRow.set(rowKey);

    this.selectedAssigneeUsers.update((users) => ({
      ...users,
      [rowKey]: null,
    }));

    this.userSearchResults.set([]);
    this.userSearchTypeahead.next('');
  }
  onAssigneeUserChange(row: ReviewApprovalProgressDto, user: AppUserLookup | null): void {
    const rowKey = this.assigneeRowKey(row);
    this.selectedAssigneeUsers.update((users) => ({
      ...users,
      [rowKey]: user,
    }));
  }
  saveAssigneeUser(
    row: ReviewApprovalProgressDto,
    selectedUser = this.selectedAssigneeUsers()[this.assigneeRowKey(row)],
  ): void {
    if (!selectedUser) {
      this.toastService.warning('Please select a user.');
      return;
    }

    const rowKey = this.assigneeRowKey(row);
    const updatedBy = this.authStateService.getCurrentUserId();
    if (!updatedBy) {
      this.toastService.error('User ID not found. Please log in again.');
      return;
    }

    this.assigneeUpdateInProgress.update((updates) => ({ ...updates, [rowKey]: true }));

    this.reviewSvc
      .updateReviewApprovalAssignee({
        reviewId: row.reviewId,
        reviewStageCode: Number(row.stage),
        metricCode: row.metricCode,
        currentAssigneeUserId: row.assigneeUserId,
        newAssigneeUserId: Number(selectedUser.userId),
        updatedBy,
      })
      .pipe(
        take(1),
        finalize(() =>
          this.assigneeUpdateInProgress.update((updates) => ({ ...updates, [rowKey]: false })),
        ),
      )
      .subscribe({
        next: (response) => {
          if (response.success === false || response.data === false) {
            this.toastService.error(response.message || 'Failed to update assignee.');
            return;
          }

          row.assigneeUserId = Number(selectedUser.userId);
          row.assigneeUserName = selectedUser.displayName;
          this.approvalProgressRows.update((rows) => [...rows]);
          this.editingAssigneeRow.set(null);
          this.selectedAssigneeUsers.update((users) => ({ ...users, [rowKey]: null }));
          this.closeViewProgressModal();
          this.toastService.success(
            `Assignee for metric code "${row.metricCode}" and stage "${
              row.stageDisplayName || row.stage
            }" has been changed to "${selectedUser.displayName}".`,
          );
        },
        error: () => this.toastService.error('Failed to update assignee. Please try again.'),
      });
  }
  cancelAssigneeEdit(): void {
    this.editingAssigneeRow.set(null);
    this.userSearchResults.set([]);
    this.userSearchTypeahead.next('');
  }

  openMetricActionConfirmation(decision: 'approved' | 'rejected'): void {
    const action = this.actionForTopLevelMetric();
    if (!action) {
      return;
    }

    this.pendingMetricAction.set({ metricCode: action.metricCode, comment: action.comment });
    this.actionForTopLevelMetric.set(null);
    this.metricActionConfirmation.set(decision);
    this.metricActionConfirmationVisible.set(true);
  }

  cancelMetricActionConfirmation(): void {
    this.metricActionConfirmationVisible.set(false);
    this.metricActionConfirmation.set(null);
    this.pendingMetricAction.set(null);
  }

  confirmMetricAction(): void {
    const decision = this.metricActionConfirmation();
    const pendingAction = this.pendingMetricAction();
    if (!decision || !pendingAction) {
      return;
    }

    this.actionForTopLevelMetric.set({
      ...pendingAction,
      decision,
      actioninProgress: false,
    });
    this.metricActionConfirmationVisible.set(false);
    this.toplevelMetricActionTrigger(decision);
    this.metricActionConfirmation.set(null);
    this.pendingMetricAction.set(null);
  }

  getPendingMetricName(): string | undefined {
    const metricCode = this.pendingMetricAction()?.metricCode;
    return metricCode;
    // return (
    //   this.reviewData()?.topMetrics.find((metric) => metric.metricCode === metricCode)
    //     ?.metricName ||
    //   metricCode ||
    //   ''
    // );
  }

  getPendingStageName(): string {
    return (
      this.reviewData()?.stageDisplayValue ||
      this.reviewData()?.phaseLabel ||
      this.reviewData()?.stage ||
      ''
    );
  }

  protected assigneeRowKey(row: ReviewApprovalProgressDto): string {
    return `${row.reviewId}:${row.metricCode}:${row.stage}`;
  }
  ////////////////////////////////////////////////////////////////////////
  private loadReviewDataSub: Subscription = new Subscription();
  private refreshReviewData(navigateBackIfApplicable = false): void {
    this.loadReviewDataSub.unsubscribe();
    const userId = this.getUserId() || 0;
    this.loadReviewDataSub = this.metricsSvc
      .load(
        {
          reviewId: this.normalizedReviewId(),
          userId,
          stageId: this.stageId(),
          sourcePage: this.sourcePage(),
        },
        false,
      )
      .subscribe((review) => {
        const existingReviewData = this.reviewData();
        if (
          review?.stage &&
          existingReviewData?.stage &&
          existingReviewData?.stage !== review.stage
        ) {
          this.toastService.info(
            `Review stage has changed to ${review.stageDisplayValue || review.stage}.`,
          );
          this.action.emit({
            actionName: ReviewMetricsByIdActionNames.GoBack,
            metricCode: '',
            reviewId: +this.reviewId(),
          });
        }

        this.reviewData.set(review);

        if (review && !this.activeCategoryCode()) {
          const firstCategory = review.categories[0]?.code ?? '';
          this.activeCategoryCode.set(firstCategory);
        }

        //checking if the active category code exists in the newly loaded review data, if not, set it to the first category
        if (review && !review.categories.some((c) => c.code === this.activeCategoryCode())) {
          this.activeCategoryCode.set(review.categories[0]?.code ?? '');
        } else {
        }

        this.calculateCategoryPendingCounts();

        if (navigateBackIfApplicable) {
          this.navigateBackIfApplicable();
        }
      });
  }

  navigateBackIfApplicable(): void {
    const reviewData = this.reviewData();

    for (const topMetric of reviewData?.topMetrics || []) {
      if (topMetric.status?.toLowerCase() == 'pending') {
        return;
      }
    }

    this.toastService.info(`All metrics have been addressed`);

    this.action.emit({
      actionName: ReviewMetricsByIdActionNames.GoBack,
      metricCode: '',
      reviewId: +this.reviewId(),
    });
  }

  protected readonly allExpandedForActiveCategory = computed(() => {
    const allCodes = this.visibleTopMetrics().flatMap((metric) =>
      metric.l1Metrics.map((subMetric) => subMetric.metricCode),
    );

    return allCodes.length > 0 && allCodes.every((code) => this.expandedSubMetrics().has(code));
  });

  protected setActiveCategory(code: string): void {
    this.activeCategoryCode.set(code);
  }

  protected isTopMetricExpanded(topMetricCode: string): boolean {
    return this.expandedTopMetrics().get(topMetricCode) || false;
  }

  protected toggleTopMetric(topMetricCode: string): void {
    const existingMap = this.expandedTopMetrics();

    existingMap.set(topMetricCode, !existingMap.get(topMetricCode));

    this.expandedTopMetrics.set(existingMap);
  }

  protected toggleSubMetric(subMetricCode: string): void {
    this.expandedSubMetrics.update((existing) => {
      const next = new Set(existing);
      if (next.has(subMetricCode)) {
        next.delete(subMetricCode);
      } else {
        next.add(subMetricCode);
      }
      return next;
    });
  }

  protected toggleExpandAll(): void {
    const allCodes = this.visibleTopMetrics().flatMap((metric) =>
      metric.l1Metrics.map((subMetric) => subMetric.metricCode),
    );

    this.expandedSubMetrics.update((existing) => {
      const next = new Set(existing);
      if (this.allExpandedForActiveCategory()) {
        allCodes.forEach((code) => next.delete(code));
      } else {
        allCodes.forEach((code) => next.add(code));
      }
      return next;
    });
  }

  protected isL1Expanded(subMetricCode: string): boolean {
    return this.expandedSubMetrics().has(subMetricCode);
  }

  protected evidenceFor(subMetric: ReviewMetricsSubMetric): ReviewMetricsEvidenceRow[] {
    return subMetric.evidenceRows;
  }

  protected filteredEvidences(evidences: EvidenceDto[] | undefined): EvidenceDto[] {
    const fromDate = this.fromDate();
    const toDate = this.toDate();

    return (evidences ?? []).filter((evidence) => {
      if (!fromDate && !toDate) {
        return true;
      }

      const uploadedTime = Date.parse(evidence.uploadedUtc);
      const uploadedDate = Number.isNaN(uploadedTime)
        ? ''
        : new Date(uploadedTime).toISOString().slice(0, 10);

      return (
        !!uploadedDate &&
        (!fromDate || uploadedDate >= fromDate) &&
        (!toDate || uploadedDate <= toDate)
      );
    });
  }

  protected formatNumber(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') {
      return '—';
    }

    if (typeof value === 'number') {
      return value.toLocaleString('en-US');
    }

    const parsed = Number(value.toString().replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed.toLocaleString('en-US') : value.toString();
  }

  protected riskAdjustedValue(metric: ReviewMetricDto): string {
    const reported = Number(metric.rawValue);
    const riskPercent = Number(metric.riskOriginal ?? 0);
    if (
      metric.rawValue === null ||
      metric.rawValue === undefined ||
      // !Number.isFinite(reported) ||
      !Number.isFinite(riskPercent)
    ) {
      return '—';
    }

    return this.formatNumber((reported * riskPercent) / 100);
  }

  protected displayValue(metric: ReviewMetricsSubMetric): string {
    return this.formatNumber(metric.reported);
  }

  protected confidenceClass(confidencePct: number): string {
    if (confidencePct >= 90) {
      return 'text-[hsl(var(--aepw-green))]';
    }

    if (confidencePct >= 80) {
      return 'text-[hsl(var(--aepw-orange))]';
    }

    return 'text-muted-foreground';
  }

  protected trackByCategory(_index: number, category: { code: string }): string {
    return category.code;
  }

  protected trackByTopMetric(_index: number, topMetricCode: string): string {
    return topMetricCode;
  }

  protected showHideModalInfo(metric: ReviewMetricsTopMetric | ReviewMetricDto | null): void {
    if (!metric) {
      this.modalInfoMetric.set(null);
      return;
    }

    this.modalInfoMetric.set({
      metricName: metric.metricName,
      metricCode: metric.metricCode,
      isTopLevel: true,
      metricDescription: metric.metricDescription || '',
    } as ReviewMetricDto);
  }

  private oldBaselineValueForMetrics = signal<{ [metricCode: string]: number | undefined }>({});

  openBaselineEditInputForMetric(metricCode: string, baselineValue: number | undefined): void {
    const oldBaselineValueForMetrics = this.oldBaselineValueForMetrics();

    oldBaselineValueForMetrics[metricCode] = baselineValue;

    this.oldBaselineValueForMetrics.set(oldBaselineValueForMetrics);

    this.editingBaselineMetricCodes.update((existing) => {
      const next = { ...existing };
      next[metricCode] = true;
      return next;
    });
  }

  protected limitRiskPercent(subMetric: ReviewMetricDto, input: HTMLInputElement): void {
    const value = input.valueAsNumber;
    if (Number.isNaN(value) || (value >= 0 && value <= 100)) {
      return;
    }

    const clamped = Math.min(100, Math.max(0, value));
    input.value = String(clamped);
    subMetric.riskOriginal = clamped;
  }

  toggleRestatement(): void {
    if (this.confirmingRestatement() || this.restatementConfirmationVisible()) {
      return;
    }

    if (!this.editingRestatement()) {
      this.originalRestatementValues.clear();
      for (const topMetric of this.reviewData()?.topMetrics ?? []) {
        for (const subMetric of topMetric.l1Metrics ?? []) {
          this.originalRestatementValues.set(subMetric.metricId, {
            baseline: subMetric.baseline,
            rawValue: subMetric.rawValue,
            riskOriginal: subMetric.riskOriginal,
          });
        }
      }
      this.editingRestatement.set(true);
      this.setRestatementSectionsExpanded(true);
      return;
    }

    const children = (this.reviewData()?.topMetrics ?? []).flatMap(
      (metric) => metric.l1Metrics ?? [],
    );
    const isFilled = (value: unknown) => value !== null && value !== undefined && value !== '';
    const numericValue = (value: unknown) => (isFilled(value) ? Number(value) : null);
    const changedChildren = children.filter((child) => {
      const original = this.originalRestatementValues.get(child.metricId);
      return (
        original &&
        (numericValue(child.baseline) !== numericValue(original.baseline) ||
          numericValue(child.rawValue) !== numericValue(original.rawValue) ||
          numericValue(child.riskOriginal) !== numericValue(original.riskOriginal))
      );
    });
    const invalidChild = changedChildren.find((child) => {
      const reported = Number(child.rawValue);
      const risk = Number(child.riskOriginal);
      const riskFilled = isFilled(child.riskOriginal);
      const baselineChanged =
        numericValue(child.baseline) !==
        numericValue(this.originalRestatementValues.get(child.metricId)?.baseline);
      return (
        (baselineChanged &&
          (!isFilled(child.baseline) || !Number.isFinite(Number(child.baseline)))) ||
        !isFilled(child.rawValue) ||
        !Number.isFinite(reported) ||
        (child.isRiskAdjustmentRequired && !riskFilled) ||
        (riskFilled && (!Number.isFinite(risk) || risk < 0 || risk > 100))
      );
    });
    if (invalidChild) {
      this.toastService.error(
        `Enter valid Baseline and Reported values and a Risk % between 0 - 100 for ${invalidChild.metricCode}.`,
      );
      return;
    }

    const values: UpdateReviewMetricsValuesDto[] = changedChildren.map((child) => ({
      MetricId: child.metricId,
      Baseline:
        numericValue(child.baseline) !==
        numericValue(this.originalRestatementValues.get(child.metricId)?.baseline)
          ? Number(child.baseline)
          : null,
      RawValue: Number(child.rawValue),
      RiskPercentage: isFilled(child.riskOriginal) ? Number(child.riskOriginal) : null,
      RestatementComment: null,
    }));

    if (!values.length) {
      this.toastService.warning('No restatement changes to save.');
      return;
    }

    this.pendingRestatementValues.set(values);
    this.restatementComment.set('');
    this.restatementConfirmationVisible.set(true);
  }

  cancelRestatementConfirmation(): void {
    if (this.confirmingRestatement()) {
      return;
    }
    this.restatementConfirmationVisible.set(false);
    this.pendingRestatementValues.set(null);
    this.restatementComment.set('');
  }

  confirmRestatement(): void {
    const values = this.pendingRestatementValues();
    if (!values?.length || this.confirmingRestatement()) {
      return;
    }

    const comment = this.restatementComment().trim();
    if (!comment) {
      this.toastService.error('Comment is required for Restatement');
      return;
    }
    const userId = this.getUserId();
    if (!userId) {
      this.toastService.error('User ID not found. Please log in again.');
      return;
    }
    const input: StartEndRestatementDto = {
      ReviewId: +this.reviewId(),
      UserId: userId,
      Comment: comment,
      Start: false,
      Metrics: values.map((value) => ({ MetricId: value.MetricId })),
    };

    this.confirmingRestatement.set(true);
    const restatementValues: UpdateReviewMetricsValuesDto[] = values.map((value) => ({
      ...value,
      RestatementComment: comment,
    }));
    this.reviewSvc
      .RestatementUpdateBaselineOrRawValueForMetric(
        this.normalizedReviewId(),
        restatementValues,
        userId,
      )
      .pipe(
        take(1),
        switchMap((response) => {
          if (response.success === false) {
            this.toastService.error(response.message || 'Failed to save restatement changes.');
            return EMPTY;
          }
          return this.reviewSvc.issueRestatementForReview(input).pipe(take(1));
        }),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.confirmingRestatement.set(false)),
      )
      .subscribe({
        next: (response) => {
          if (response.success === false) {
            this.toastService.error(response.message || 'Failed to confirm the restatement.');
            return;
          }
          this.restatementConfirmationVisible.set(false);
          this.pendingRestatementValues.set(null);
          this.restatementComment.set('');
          this.editingRestatement.set(false);
          this.originalRestatementValues.clear();
          this.setRestatementSectionsExpanded(false);
          this.refreshReviewData();
        },
        error: () =>
          this.toastService.error('Failed to confirm the restatement. Please try again.'),
      });
  }

  cancelRestatement(): void {
    if (this.confirmingRestatement()) {
      return;
    }

    for (const topMetric of this.reviewData()?.topMetrics ?? []) {
      for (const subMetric of topMetric.l1Metrics ?? []) {
        const original = this.originalRestatementValues.get(subMetric.metricId);
        if (original) {
          subMetric.baseline = original.baseline;
          subMetric.rawValue = original.rawValue;
          subMetric.riskOriginal = original.riskOriginal;
        }
      }
    }
    this.originalRestatementValues.clear();
    this.editingRestatement.set(false);
    this.setRestatementSectionsExpanded(false);
  }

  private setRestatementSectionsExpanded(expanded: boolean): void {
    const topMetrics = this.reviewData()?.topMetrics ?? [];
    this.expandedTopMetrics.set(
      new Map(expanded ? topMetrics.map((metric) => [metric.metricCode, true] as const) : []),
    );
    this.expandedSubMetrics.set(
      new Set(
        expanded
          ? topMetrics.flatMap((metric) =>
              (metric.l1Metrics ?? []).map((subMetric) => subMetric.metricCode),
            )
          : [],
      ),
    );
    if (this.detailsExpanded() !== expanded) {
      this.expansionChanged();
    }
  }

  openRawValueEditInputForMetric(metricCode: string): void {
    this.editingRawValueMetricCodes.update((existing) => {
      const next = { ...existing };
      next[metricCode] = true;
      return next;
    });
  }

  openRiskPercentEditInputForMetric(metricCode: string, value: number | undefined): void {
    const preservedRiskPercentage = this.preservedRiskPercentage();

    if (value) {
      preservedRiskPercentage[metricCode] = value;
    }

    this.editingRiskPercentMetricCodes.update((existing) => {
      const next = { ...existing };
      next[metricCode] = true;
      return next;
    });
  }

  openAdditionalDetailsEditInputForMetric(metric: ReviewMetricDto): void {
    this.additionalDetailsEditFor.set(metric.metricCode);
    this.additionalDetailsPrevValue.set(metric.frComment || '');
  }

  protected updatingAdditionalDetailsFor = signal<string | null>(null);
  saveAdditionalDetailsForMetric(metric: ReviewMetricDto | null): void {
    const userId = this.getUserId();

    if (!userId) {
      this.toastService.error('User ID not found. Please log in again.');
      return;
    }

    this.updatingAdditionalDetailsFor.set(metric?.metricCode || null);
    const input: UpdateReviewMetricFRCommentDto = {
      ReviewId: +this.reviewId(),
      MetricId: metric?.metricId || 0,
      MetricCode: metric?.metricCode || '',
      Comment: metric?.frComment || '',
      UserId: <number>userId,
    };
    this.reviewSvc.updateReviewMetricFRComment(input).subscribe(
      (res) => {
        if (res?.data) {
          // this.toastService.success('Additional details updated successfully.');
          this.refreshReviewData();
        }
        this.updatingAdditionalDetailsFor.set(null);
        this.cancelAdditionalDetailsEdit(metric?.metricCode || '');
      },
      () => {
        this.updatingAdditionalDetailsFor.set(null);
        this.toastService.error('Failed to update additional details. Please try again.');
      },
    );
  }

  cancelAdditionalDetailsEdit(metricCode: string): void {
    this.additionalDetailsEditFor.set(null);

    const additionalDetailsPrevValue = this.additionalDetailsPrevValue();

    const review = this.reviewData();
    const topMetrics = review?.topMetrics;

    for (const topMetric of topMetrics || []) {
      for (const l1Metric of topMetric?.l1Metrics || []) {
        if (l1Metric.metricCode == metricCode) {
          l1Metric.frComment = additionalDetailsPrevValue;
        }
      }
    }
  }

  openTopMetricActionPopup(topMetric: ReviewMetricsTopMetric) {
    for (const subMetric of topMetric.l1Metrics) {
      if (
        subMetric.rawValue != undefined &&
        subMetric.rawValue != null &&
        subMetric.baseline != undefined &&
        subMetric.baseline != null &&
        subMetric.rawValue < subMetric.baseline
      ) {
        this.approvalCheck.set(topMetric.metricCode);
        this.baselineConfirmationModalOpen.set(true);
        return;
      }
    }

    this.actionForTopLevelMetric.set({
      metricCode: topMetric.metricCode,
      comment: '',
      decision: '',
      actioninProgress: false,
    });
  }

  protected approvalCheck = signal<string | null>(null);

  forcedBaseline: {
    oldBaselineValue?: string;
    baselineValue?: string | undefined;
    metricCode?: string | undefined;
    metricId?: number | undefined;
  } = {};

  forceUpdateBaseline() {
    if (this.approvalCheck()) {
      const topMetricCode: string = <string>this.approvalCheck();
      this.actionForTopLevelMetric.set({
        metricCode: topMetricCode,
        comment: '',
        decision: '',
        actioninProgress: false,
      });
      this.approvalCheck.set(null);
      this.baselineConfirmationModalOpen.set(false);
      return;
    }

    if (
      !this.forcedBaseline.metricCode ||
      !this.forcedBaseline.metricId ||
      !this.forcedBaseline.baselineValue
    ) {
      return;
    }
    this.baselineConfirmationModalOpen.set(false);

    this.updateBaselineForMetric(
      this.forcedBaseline.metricCode || '',
      this.forcedBaseline.metricId || 0,
      this.forcedBaseline.baselineValue || '',
      true,
    );
  }

  updateBaselineForMetric(
    metricCode: string,
    metricId: number,
    baselineValue: string,
    forceUpdate: boolean = false,
  ): void {
    if (!forceUpdate) {
      const visibleTopMetrics = this.visibleTopMetrics();
      if (baselineValue) {
        for (const visibleTopMetric of visibleTopMetrics) {
          // if (visibleTopMetric.metricCode != metricCode) {
          //   continue;
          // }
          const l1Metrics = visibleTopMetric.l1Metrics;
          for (const l1Metric of l1Metrics) {
            if (l1Metric.metricCode != metricCode) {
              continue;
            }

            if (+(l1Metric as any).rawValue - +baselineValue < 0) {
              // const oldBaselineValue = oldBaselineValue()[metricCode];
              this.baselineConfirmationModalOpen.set(true);
              this.forcedBaseline = { baselineValue, metricId, metricCode };
              // this.toastService.warning("The quarterly baseline number provided is higher than the reported number. Are you sure you want to proceed?");
              return;
            }
          }
        }
      }
    }

    this.editingBaselineMetricCodes.update((existing) => {
      const next = { ...existing };
      next[metricCode] = false;
      return next;
    });

    if (this.restatementModeActive()) {
      const existingBaselineRawValue =
        this.baselineRawValueForMetricIds_RS.get(metricId) ||
        <UpdateReviewMetricsValuesDto>{
          MetricId: metricId,
          Baseline: +baselineValue,
          RawValue: null,
          RiskPercentage: null,
          RestatementComment: null,
        };

      existingBaselineRawValue.Baseline = +baselineValue;

      this.baselineRawValueForMetricIds_RS.set(metricId, existingBaselineRawValue);
      this.baselineRawValueForMetricIds_RSUpdated.emit(this.baselineRawValueForMetricIds_RS);
      return;
    }

    const loaderUpdate = (metricCode: string, val: boolean) => {
      this.updatingBaseline.update((existing) => {
        const next = { ...existing };
        next[metricCode] = val;
        return next;
      });
    };

    loaderUpdate(metricCode, true);

    const input: UpdateReviewMetricsValuesDto[] = [];

    input.push({
      MetricId: metricId,
      Baseline: baselineValue ? Number(baselineValue) : null,
      RawValue: null,
      RiskPercentage: null,
      RestatementComment: null,
    });

    const userId = this.getUserId();

    this.reviewSvc
      .updateBaselineOrRawValueForMetric(this.normalizedReviewId(), input, userId || 0)
      .subscribe(
        () => {
          loaderUpdate(metricCode, false);
          this.refreshReviewData();
        },
        () => {
          loaderUpdate(metricCode, false);
          this.toastService.error('Failed to update Baseline. Please try again.');
        },
      );
  }

  maxLimitExceededForReported(metricCode: string, rawValue: string) {
    const review = this.reviewData();
    const topMetrics = review?.topMetrics;

    for (const topMetric of topMetrics || []) {
      for (const l1Metric of topMetric?.l1Metrics || []) {
        if (l1Metric.metricCode == metricCode) {
          if (l1Metric.reportedLimit && +rawValue > +l1Metric.reportedLimit) {
            if (l1Metric.reportedLimitAcknowledgedBy) {
              return false;
            }

            if (l1Metric.reportedLimitMsg) {
              this.showReportedLimitReachedMessage(l1Metric.reportedLimitMsg);
              return true;
            }
          }

          break;
        }
      }
    }

    return false;
  }

  preserveRawValueBeforeExceedingLimit(metricCode: string, rawValue: number | undefined) {
    // if (rawValue) {
    this.rawValueBeforeExceedingLimit.set(<Record<string, number>>{
      [metricCode]: +(rawValue || '0'),
    });
    // }
  }

  protected updatingReportedLimitAcknowledgedBy = signal<boolean>(false);
  overrideReportedLimit() {
    const rawValueBeforeExceedingLimit = this.rawValueBeforeExceedingLimit();
    console.log(815);

    // if (!Object.entries(rawValueBeforeExceedingLimit)?.length) {
    //   return;
    // }
    const userId = this.getUserId();

    const review = this.reviewData();
    const topMetrics = review?.topMetrics;

    const [metricCode] = Object.entries(rawValueBeforeExceedingLimit)[0];

    if (metricCode) {
      for (const topMetric of topMetrics || []) {
        for (const l1Metric of topMetric?.l1Metrics || []) {
          if (l1Metric.metricCode == metricCode) {
            const metricId = l1Metric.metricId;
            l1Metric.reportedLimitAcknowledgedBy = userId || undefined;
            const rawValue = l1Metric.rawValue;
            // api call to set
            this.updatingReportedLimitAcknowledgedBy.set(true);
            this.reviewSvc
              .updateReportedLimitAcknowledgedBy(this.reviewId(), metricCode, metricId, userId)
              .pipe(take(1))
              .subscribe(
                () => {
                  this.updatingReportedLimitAcknowledgedBy.set(false);
                  this.closeReportedLimitReachedMessage();
                  this.updateRawValueForMetric(metricCode, metricId, String(rawValue));
                },
                () => {
                  this.updatingReportedLimitAcknowledgedBy.set(false);
                },
              );
            break;
          }
        }
      }
    }
  }

  updateRawValueForMetric(metricCode: string, metricId: number, rawValue: string): void {
    if (this.maxLimitExceededForReported(metricCode, rawValue)) {
      // this.showReportedLimitReachedMessage(l1Metric.reportedLimitMsg);
      return;
    }

    this.editingRawValueMetricCodes.update((existing) => {
      const next = { ...existing };
      next[metricCode] = false;
      return next;
    });

    if (this.restatementModeActive()) {
      const existingBaselineRawValue =
        this.baselineRawValueForMetricIds_RS.get(metricId) ||
        <UpdateReviewMetricsValuesDto>{
          MetricId: metricId,
          Baseline: null,
          RawValue: +rawValue,
          RiskPercentage: null,
          RestatementComment: null,
        };

      existingBaselineRawValue.RawValue = +rawValue;

      this.baselineRawValueForMetricIds_RS.set(metricId, existingBaselineRawValue);
      this.baselineRawValueForMetricIds_RSUpdated.emit(this.baselineRawValueForMetricIds_RS);
      return;
    }

    const loaderUpdate = (metricCode: string, val: boolean) => {
      this.updatingRawValue.update((existing) => {
        const next = { ...existing };
        next[metricCode] = val;
        return next;
      });
    };

    loaderUpdate(metricCode, true);
    const input: UpdateReviewMetricsValuesDto[] = [];

    input.push({
      MetricId: metricId,
      Baseline: null,
      RawValue: rawValue ? Number(rawValue) : null,
      RiskPercentage: null,
      RestatementComment: null,
    });
    const userId = this.getUserId();

    this.reviewSvc
      .updateBaselineOrRawValueForMetric(this.normalizedReviewId(), input, userId || 0)
      .subscribe(
        () => {
          loaderUpdate(metricCode, false);
          this.refreshReviewData();
        },
        () => {
          loaderUpdate(metricCode, false);
          this.toastService.error('Failed to update the reported value. Please try again.');
        },
      );
  }

  private preservedRiskPercentage = signal<{ [metricCode: string]: number }>({});

  updateRiskPercentForMetric(metricCode: string, metricId: number, riskPercentValue: string): void {
    this.editingRiskPercentMetricCodes.update((existing) => {
      const next = { ...existing };
      next[metricCode] = false;
      return next;
    });

    if (!isNaN(+riskPercentValue) && (+riskPercentValue > 100 || +riskPercentValue < 0)) {
      this.toastService.error('Risk % should be between 0 - 100');
      riskPercentValue = String(this.preservedRiskPercentage()[metricCode] || 100);
      // return;
    }

    if (this.restatementModeActive()) {
      const existingBaselineRawValue =
        this.baselineRawValueForMetricIds_RS.get(metricId) ||
        <UpdateReviewMetricsValuesDto>{
          MetricId: metricId,
          Baseline: null,
          RawValue: null,
          RiskPercentage: +riskPercentValue,
          RestatementComment: null,

          UpdatingRiskPercentage: true,
        };

      existingBaselineRawValue.RiskPercentage = +riskPercentValue;

      this.baselineRawValueForMetricIds_RS.set(metricId, existingBaselineRawValue);
      this.baselineRawValueForMetricIds_RSUpdated.emit(this.baselineRawValueForMetricIds_RS);
      return;
    }

    const loaderUpdate = (metricCode: string, val: boolean) => {
      this.updatingRiskPercent.update((existing) => {
        const next = { ...existing };
        next[metricCode] = val;
        return next;
      });
    };

    loaderUpdate(metricCode, true);
    const input: UpdateReviewMetricsValuesDto[] = [];

    input.push({
      MetricId: metricId,
      Baseline: null,
      RawValue: null,
      RiskPercentage: riskPercentValue ? Number(riskPercentValue) : null,
      RestatementComment: null,

      UpdatingRiskPercentage: true,
    });

    const userId = this.getUserId();
    this.reviewSvc
      .updateBaselineOrRawValueForMetric(this.normalizedReviewId(), input, userId || 0)
      .subscribe(
        () => {
          loaderUpdate(metricCode, false);
          this.refreshReviewData();
        },
        () => {
          loaderUpdate(metricCode, false);
        },
      );
  }

  getUserId(): number | null {
    let userId: number | null = null;
    const loginContextStr = sessionStorage.getItem('loginContext');

    try {
      if (loginContextStr) {
        const loginContext = <LoginContext>JSON.parse(loginContextStr);
        userId = loginContext?.userDetails.userId || null;
      }
    } catch (error) {
      userId = null;
    }

    return userId;
  }

  filesSelected($event: any, metricId: number, metricCode: string): void {
    console.log({ $event });
    const fileName =
      $event.files.length > 1
        ? '(' + $event.files.length + ') evidences being uploaded...'
        : $event.files[0]?.name;
    const evidenceTypeId = $event.evidenceType;
    const updateLoader = (code: string, fileName: string | null) => {
      this.uploadingEvidenceForMetricCode.update((existing) => {
        if (fileName == null) {
          delete existing[code];
          return existing;
        }
        existing[code] = fileName;
        return existing;
      });
    };

    const userId = this.getUserId();
    if (userId) {
      updateLoader(metricCode, fileName);

      const input: {
        reviewId: number;
        metricId: number;
        evidenceTypeId: number;
        files: File[];
        userId: number;
      } = {
        reviewId: +this.normalizedReviewId(),
        metricId,
        evidenceTypeId,
        files: $event.files,
        userId,
      };

      this.reviewSvc.addReviewMetricEvidence(input).subscribe(
        () => {
          updateLoader(metricCode, null);
          this.refreshReviewData();
          this.toastService.success('Evidence added successfully');
        },
        () => {
          updateLoader(metricCode, null);
        },
      );
    }
  }

  viewEvidence(evidence: EvidenceDto): void {
    if (!this.authState.hasPageAccess('EVIDENCEREVIEW')) {
      this.toastService.error('You do not have access to Evidence Review Page');
      return;
    }

    this.router.navigate(['/reviews/evidence-review'], {
      queryParams: {
        evidenceId: evidence.evidenceId,
        returnUrl: this.router.url,
      },
    });

    // if (!evidence.fileUriView) {
    //   this.toastService.error('Evidence file is not available for viewing.');
    //   return;
    // }
    // window.open(evidence.fileUriView, '_blank');
  }

  downloadEvidence(evidence: EvidenceDto): void {
    if (!evidence.fileUriView) {
      this.toastService.error('Evidence file is not available for download.');
      return;
    }

    const link = document.createElement('a');
    link.href = evidence.fileUriDownload;
    link.download = evidence.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  protected deleteEvidenceItemId = signal<string | null>(null);
  protected evidenceDeletionInProgress = signal<boolean>(false);

  promptDeleteEvidence(evidence: EvidenceDto): void {
    this.deleteEvidenceItemId.set(evidence?.itemId);
  }

  cancelEvidenceDeletion(): void {
    this.deleteEvidenceItemId.set(null);
  }

  confirmDeleteEvidence(): void {
    const userId = this.getUserId();

    this.evidenceDeletionInProgress.set(true);
    const deleteEvidenceItemId = this.deleteEvidenceItemId();
    if (!deleteEvidenceItemId) {
      this.toastService.error('No evidence item selected for deletion.');
      return;
    }

    this.reviewSvc
      .deleteMetricEvidence(deleteEvidenceItemId as string, userId || 0)
      .pipe(take(1))
      .subscribe(
        (res) => {
          this.evidenceDeletionInProgress.set(false);

          this.deleteEvidenceItemId.set(null);
          this.refreshReviewData();

          if (res[0]?.success) {
            this.toastService.success('Evidence deleted successfully.');
          } else {
            this.toastService.error('Failed to delete evidence.');
          }
        },
        () => {
          this.evidenceDeletionInProgress.set(false);
        },
      );
  }

  updateBaselineCaluclationvisiblity(metricCode: string, val: boolean): void {
    const showBaselineCalculationMetricCode = this.showBaselineCalculationMetricCode();
    showBaselineCalculationMetricCode[metricCode] = val;

    this.showBaselineCalculationMetricCode.set(showBaselineCalculationMetricCode);
  }

  getBaselineCalc(metricCode: string) {
    const rid: number = <number>this.reviewId();
    return this.baselineCalculation() && rid && this.baselineCalculation()[rid]
      ? this.baselineCalculation()[rid][metricCode]
      : '—';
  }

  openViewProgressModal(topMetric: ReviewMetricsTopMetric): void {
    this.approvalProgressRows.set([]);
    this.approvalProgressModalOpenFor.set(topMetric);

    const userId = this.authStateService.getCurrentUserId();

    if (userId == null) {
      this.approvalProgressLoading.set(false);
      return;
    }

    this.approvalProgressLoading.set(true);
    this.reviewSvc
      .getApprovalProgress(+this.normalizedReviewId(), topMetric.metricCode, userId)
      .pipe(take(1))
      .subscribe(
        (res) => {
          this.approvalProgressRows.set(res);
          this.approvalProgressLoading.set(false);
        },
        () => {
          this.approvalProgressLoading.set(false);
        },
      );
  }

  closeViewProgressModal(): void {
    this.approvalProgressModalOpenFor.set(null);
  }

  openApprovalAuditTimeline(): void {
    const detail = this.reviewDetail();

    const impactMasterId =
      detail?.impactMasterId ||
      this.projectId() ||
      this.route.snapshot.paramMap.get('impactMasterId') ||
      '';

    const projectName = detail?.projectName || this.projectName() || '';

    const metricCode = this.approvalProgressModalOpenFor()?.metricCode || '';

    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/audit'], {
        queryParams: {
          module: 'ReviewApproval',
          projectId: String(impactMasterId),
          projectName: projectName,
          metricCode: metricCode,
          preset: '30d',
        },
      }),
    );
    window.open(url, '_blank');
  }

  toplevelMetricActionTrigger(decision: 'approved' | 'rejected'): void {
    const currentValuesForAction = this.actionForTopLevelMetric();
    if (!currentValuesForAction) {
      return;
    }

    if (decision == 'rejected') {
      if (!currentValuesForAction.comment || currentValuesForAction.comment.trim() === '') {
        this.toastService.error('Please provide a comment for rejection.');
        return;
      }
    }

    currentValuesForAction.actioninProgress = true;
    currentValuesForAction.decision = decision;

    this.actionForTopLevelMetric();

    const input: ReviewMetricApproveRejectDto = {
      ReviewId: +this.reviewId(),
      MetricCode: currentValuesForAction.metricCode,
      Decision: decision,
      Comment: currentValuesForAction.comment,
    };

    if (this.reviewData()?.stage) {
      input.StageCode = this.reviewData()?.stage;
    }

    this.reviewSvc
      .takeReviewMetricActionForTopLevel([input], this.getUserId() as number)
      .pipe(take(1))
      .subscribe(
        () => {
          this.toastService.success(
            'Metric ' +
              this.actionForTopLevelMetric()?.metricCode +
              (' ' + decision + ' ') +
              'successfully.',
          );
          this.refreshReviewData(true);
          this.actionForTopLevelMetric.set(null);
        },
        () => {
          const currentValuesForAction = this.actionForTopLevelMetric();
          this.actionForTopLevelMetric.set({
            ...(currentValuesForAction as {
              metricCode: string;
              comment: string;
              decision?: 'approved' | 'rejected' | '';
              actioninProgress: boolean;
            }),
            actioninProgress: false,
          });
          this.toastService.error('Failed to take action on the metric. Please try again.');
        },
      );
  }

  getStatusLabelForTopMetric(
    row: ReviewApprovalProgressDto | ReviewMetricsTopMetric,
    status: string,
  ): { show: boolean; class?: string } {
    if (status?.toLowerCase() === 'approved') {
      return {
        class: 'bg-[hsl(var(--aepw-green)/0.15)] text-[hsl(var(--aepw-green))]',
        show: true,
      };
    }
    if (status?.toLowerCase() === 'rejected') {
      return { class: 'bg-red-100 text-[hsl(var(--destructive))]', show: true };
    }

    if (status?.toLowerCase() === 'pending') {
      if (((row as ReviewMetricsTopMetric).rejectedInSubsequentStages || 0) > 0) {
        return {
          class:
            'bg-[hsl(var(--aepw-yellow)/0.12)] font-semibold inline-flex items-center ng-star-inserted px-2.5 py-1 rounded-full shrink-0 text-[11px]',
          show: true,
        };
      }
      return {
        class:
          'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold bg-muted text-muted-foreground',
        show: true,
      };
    }

    return { class: '', show: false };
  }

  expansionChanged(): void {
    this.detailsExpansionChange.emit({
      reviewId: +(this.reviewId() || '0'),
      expanded: this.detailsExpanded(),
    });
  }

  recallAction(topMetric: ReviewMetricsTopMetric) {
    if (this.recallStagesLoading() || this.recallModalOpen()) {
      return;
    }

    this.recallMetric = topMetric;
    this.recallMetricCode.set(topMetric.metricCode);
    this.recallComment.set('');
    this.recallModalOpen.set(true);

    this.recallConfirmationSubscription.unsubscribe();
    this.recallConfirmationSubscription = this.recallConfirmationAction.subscribe(() =>
      this.confirmRecall(),
    );
  }

  protected confirmRecallFromModal(): void {
    this.recallConfirmationAction.next();
  }

  protected closeRecallModal(): void {
    if (this.recallLoader()) {
      return;
    }
    this.recallConfirmationSubscription.unsubscribe();
    this.recallLoader.set(false);
    this.recallModalOpen.set(false);
    this.recallMetric = null;
  }

  private confirmRecall(): void {
    const comment = this.recallComment().trim();
    if (!comment) {
      this.toastService.error('Comment is required to recall the review metric');
      return;
    }

    const userId = this.getUserId();
    const metricCode = this.recallMetricCode();
    const metric = this.recallMetric;
    if (!userId || !metricCode || !metric || this.recallLoader()) {
      if (!userId) {
        this.toastService.error('User ID not found. Please log in again.');
      }
      return;
    }

    const input: RecallTopLevelMetricInput = {
      TopLevelMetricCode: metricCode,
      ReviewId: +this.reviewId(),
      Recallcomment: comment,
      UserId: userId,
    };

    this.recallLoader.set(true);
    this.recallStagesLoading.set(true);
    this.reviewSvc
      .getCurrentMetricStages([input.ReviewId], Number(metric.currentStage), metric.metricId)
      .pipe(
        take(1),
        switchMap((response) => {
          this.recallStagesLoading.set(false);
          if (response.success === false) {
            this.toastService.error(response.message || 'Failed to load current metric stages');
            return EMPTY;
          }
          return this.reviewSvc.recallTopLevelMetric(input).pipe(
            take(1),
            catchError(() => {
              this.toastService.error(`Failed to recall review metric ${metricCode}`);
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.recallLoader.set(false);
          this.recallStagesLoading.set(false);
        }),
      )
      .subscribe({
        next: () => {
          this.recallLoader.set(false);
          this.closeRecallModal();
          this.toastService.success(`Review metric ${metricCode} recalled successfully`);
          this.refreshReviewData();
        },
        error: () => {
          this.toastService.error('Failed to load current metric stages. Please try again.');
        },
      });
  }

  showHideFrCommentForMetric(
    topMetric: ReviewMetricsTopMetric | ReviewMetricDto,
    val: boolean,
  ): void {
    const showFrCommentForTopMetricCodes = this.showFrCommentForTopMetricCodes();
    showFrCommentForTopMetricCodes[topMetric.metricCode] = val;

    this.showFrCommentForTopMetricCodes.set(showFrCommentForTopMetricCodes);
  }

  showHideAdditionalDetailsTooltip(metricCode: string, val: boolean): void {
    const additionalDetailsShowForMetric = this.additionalDetailsShowForMetric();
    additionalDetailsShowForMetric[metricCode] = val;

    this.additionalDetailsShowForMetric.set(additionalDetailsShowForMetric);
  }

  protected showRiskAdjTooltipForMetricCode = signal<{ [metricCode: string]: boolean }>({});
  showHideRiskAdjTooltipForMetricCode(metricCode: string, val: boolean): void {
    const showRiskAdjTooltipForMetricCode = this.showRiskAdjTooltipForMetricCode();
    showRiskAdjTooltipForMetricCode[metricCode] = val;

    this.showRiskAdjTooltipForMetricCode.set(
      JSON.parse(JSON.stringify(showRiskAdjTooltipForMetricCode)),
    );
  }

  calculateCategoryPendingCounts() {
    // this.categoryPendingCount.set({});
    const categoryPendingCount = {} as {
      [categoryCode: string]: { totalCount: number; doneCount: number };
    };
    const reviewData = this.reviewData();

    const categories = reviewData?.categories || [];

    // reviewMetricId:     number;
    //   metricId:           number;
    //   parentMetricId?: number;
    //   metricCode:         string;
    //   metricName:         string;
    //   categoryId?:           number;
    //   categoryCode:           string;
    //   categoryName?:           string;

    //   categoryColor?: string;
    //   rawValue?: number;
    //   adjustedValue?: number;

    //   metricDescription?: string;

    //   unit:               string;
    //   frComment?:         string;
    //   reportedValue:      string;
    //   pmStatus:           ReviewApprovalStatus;
    //   reviewStatus:       ReviewApprovalStatus;
    //   leadStatus:         ReviewApprovalStatus;
    //   finalStatus?:       ReviewApprovalStatus;
    //   isTopLevel?:        boolean;
    //   parentCode?:        string;
    //   optional?:          boolean;
    //   validationWarning?: string;
    //   evidenceUploadCount:   number;
    //   // evidenceCount:   number;
    //   evidenceFiles:      DetailEvidenceFile[];

    //   reviewId?: number;
    //   applicability?: string;
    //   riskOriginal?: number;
    //   riskPctEffective?: number;
    //   raStatus?: string;
    //   validationStatus?: string;
    //   evidenceCount: number;
    //   isRequired?: number;
    //   baseline?: number;
    //   riskPctProposed?: number;
    //   raReason?: string;
    //   raReviewComment?: string;
    //   evidences?: EvidenceDto[];

    //   status?: string;
    //   allowAction?: boolean;

    for (const metric of reviewData?.topMetrics || []) {
      if (!metric.isTopLevel) {
        continue;
      }

      categoryPendingCount[metric.categoryCode] = {
        totalCount: (categoryPendingCount[metric.categoryCode]?.totalCount || 0) + 1,
        doneCount:
          (categoryPendingCount[metric.categoryCode]?.doneCount || 0) +
          (metric.status?.toLowerCase() == 'approved' ? 1 : 0),
      };
    }

    this.categoryPendingCount.set(categoryPendingCount);
  }

  updateVt(metricCode: string, $event: any) {
    const value: number = typeof $event == 'string' ? $event : ($event as any).target.value;
    const updatingVT = this.updatingVT();
    updatingVT[metricCode] = true;
    this.updatingVT.set(JSON.parse(JSON.stringify(updatingVT)));
    this.reviewSvc
      .updateValorisationValue(+this.normalizedReviewId(), metricCode, value)
      .pipe(take(1))
      .subscribe((res) => {
        const updatingVT = this.updatingVT();
        updatingVT[metricCode] = false;
        this.updatingVT.set(JSON.parse(JSON.stringify(updatingVT)));
      });
  }

  closeBaselineConfirmationModal() {
    const reviewData = this.reviewData();
    const topMetrics = reviewData?.topMetrics || [];
    for (const metric of topMetrics) {
      const l1metrics = metric.l1Metrics;
      for (const l1Metric of l1metrics) {
        if (
          this.forcedBaseline.metricCode == l1Metric.metricCode ||
          this.forcedBaseline.metricId == l1Metric.metricId
        ) {
          const oldBaselineValueForMetrics = this.oldBaselineValueForMetrics();

          this.editingBaselineMetricCodes.update((existing) => {
            const next = { ...existing };
            next[l1Metric.metricCode] = false;
            return next;
          });

          l1Metric.baseline = oldBaselineValueForMetrics[l1Metric.metricCode];
        }
      }
    }

    this.reviewData.set(<ReviewMetricsPageData>{ ...reviewData, topMetrics });

    this.baselineConfirmationModalOpen.set(false);
  }

  protected reportedLimitReachedMessage = signal<string>('');
  private rawValueBeforeExceedingLimit = signal<Record<string, number>>({});
  showReportedLimitReachedMessage(msg: string) {
    this.reportedLimitReachedMessage.set(msg);
  }

  closeReportedLimitReachedMessage() {
    const review = this.reviewData();
    const topMetrics = review?.topMetrics;

    const rawValueBeforeExceedingLimit = this.rawValueBeforeExceedingLimit();
    const metricCode =
      Object.keys(rawValueBeforeExceedingLimit).length > 0
        ? Object.keys(rawValueBeforeExceedingLimit)[0]
        : '';
    const previousRawValue = rawValueBeforeExceedingLimit[metricCode] || null;

    for (const topMetric of topMetrics || []) {
      for (const l1Metric of topMetric?.l1Metrics || []) {
        if (l1Metric.metricCode == metricCode) {
          if (previousRawValue) {
            l1Metric.rawValue = previousRawValue;
          }

          break;
        }
      }
    }

    this.reportedLimitReachedMessage.set('');
  }

  protected viewProgressButtonTooltip = signal<{ [metricCode: string]: boolean }>({});
  protected takeActionButtonTooltip = signal<{ [metricCode: string]: boolean }>({});
  updateViewProgressButtonTooltip(metricCode: string, show: boolean) {
    const viewProgressButtonTooltip = this.viewProgressButtonTooltip();

    viewProgressButtonTooltip[metricCode] = show ? true : false;

    this.viewProgressButtonTooltip.set(viewProgressButtonTooltip);
  }

  updateTakeActionButtonTooltip(metricCode: string, show: boolean) {
    const takeActionButtonTooltip = this.takeActionButtonTooltip();

    takeActionButtonTooltip[metricCode] = show ? true : false;

    this.takeActionButtonTooltip.set(takeActionButtonTooltip);
  }

  updateTotalVisibleMetricsForCategory(): void {
    const totalVisibleMetricsForCategory = <{ [metricCode: string]: number }>{};

    const reviewData = this.reviewData();

    for (const topMetric of reviewData?.topMetrics || []) {
      totalVisibleMetricsForCategory[topMetric.categoryCode] =
        (totalVisibleMetricsForCategory[topMetric.categoryCode] || 0) +
        (topMetric.l1Metrics || []).length;
    }

    this.totalVisibleMetricsForCategory.set(totalVisibleMetricsForCategory);
  }
}
