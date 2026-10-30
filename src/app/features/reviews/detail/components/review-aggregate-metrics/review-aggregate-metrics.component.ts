import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
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
} from 'lucide-angular';

import {
  ReviewAggregateMetricsService,
  ReviewMetricsCategorySummary,
  ReviewMetricsEvidenceRow,
  ReviewMetricsPageData,
  ReviewMetricsSubMetric,
  ReviewMetricsTopMetric,
} from './review-aggregate-metrics.service';
import { CommonModule } from '@angular/common';
import {
  ReviewMetricDto,
  ReviewAggregateMetricsAction,
  ReviewAggregateMetricsActionNames,
} from './review-aggregate-metrics.types';
import { ReviewService } from '../../../services/review.service';
import { FormsModule } from '@angular/forms';
import {
  EvidenceDto,
  ReviewApprovalProgressDto,
  ReviewDto,
  ReviewMetricApproveRejectDto,
  UpdateReviewMetricFRCommentDto,
  UpdateReviewMetricsValuesDto,
} from '../../../models/review.model';
import {
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
import { AuthStateService, LoginContext } from '../../../../../core/auth';
import { AppUserListModel } from '../../../../admin/users/models/user-model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgSelectComponent } from '@ng-select/ng-select';
import { LookupService } from '../../../../../core/services/lookup-service';
import { AppUserLookup } from '../../../../../core/models/lookup-model';
import { DialogComponent } from '../../../../../shared/ui/dialog/dialog.component';

@Component({
  selector: 'app-review-aggregate-metrics',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './review-aggregate-metrics.component.html',
  styleUrls: ['./review-aggregate-metrics.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    AddEvidenceDropdownComponent,
    LucideAngularModule,
    NgSelectComponent,
    DialogComponent,
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
        X,
      }),
    },
  ],
})
export class ReviewAggregateMetricsComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly lookupService = inject(LookupService);
  private readonly authStateService = inject(AuthStateService);
  readonly reviewId = input.required<string | number>();
  readonly refreshReviewMetricsData = input.required<boolean>();

  public detailsExpanded = input<boolean>(false);
  public detailsExpansionChange = output<{ reviewId: number; expanded: boolean }>();
  public action = output<ReviewAggregateMetricsAction>();

  private readonly metricsSvc = inject(ReviewAggregateMetricsService);
  protected readonly reviewSvc = inject(ReviewService);
  protected readonly toastService = inject(ToastService);

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
  protected readonly pendingMetricAction = signal<{
    metricCode: string;
    comment: string;
  } | null>(null);
  // protected readonly activeCategoryCode = linkedSignal(() =>
  //   this.categoryTabs()[0]?.code ?? '',
  // );

  public showRecallButton = input<boolean>(false);
  public showViewProgressButton = input<boolean>(false);
  public showApproveTopLevelMetricbutton = input<boolean>(false);
  public showRejectTopLevelMetricbutton = input<boolean>(false);
  public allowEditBaseline = input<boolean>(false);
  public allowEditRawValue = input<boolean>(false);
  public allowEditRiskPercent = input<boolean>(false);
  public allowAddingEvidences = input<boolean>(false);

  protected activeCategoryCode = signal<string>('');
  public reviewDetail = input<ReviewDto | null>();

  protected readonly activeCategory = computed(
    () =>
      this.categoryTabs().find((category) => category.code === this.activeCategoryCode()) ?? null,
  );

  protected readonly visibleTopMetrics = computed<ReviewMetricsTopMetric[]>(
    () =>
      this.reviewData()?.topMetrics.filter(
        (metric) => metric.categoryCode === this.activeCategoryCode(),
      ) ?? [],
  );

  protected readonly totalVisibleMetrics = computed(() =>
    this.visibleTopMetrics().reduce((count, metric) => count + 1 + metric.l1Metrics?.length, 0),
  );

  protected readonly expandedTopMetrics = signal(new Map<string, boolean>());
  protected readonly expandedSubMetrics = signal(new Set<string>());

  protected editingBaselineMetricCodes = signal<Record<string, boolean>>({});
  protected editingRawValueMetricCodes = signal<Record<string, boolean>>({});
  protected editingRiskPercentMetricCodes = signal<Record<string, boolean>>({});
  // protected editingAdditionalDetailsMetricCodes = signal<Record<string, boolean>>({});
  protected additionalDetailsEditFor = signal<string | null>(null);

  protected baselineCalculation = this.metricsSvc.baselineCalculation;
  protected showFrCommentForTopMetricCodes = signal<{ [metricCode: string]: boolean }>({});
  protected additionalDetailsShowForMetric = signal<{ [metricCode: string]: boolean }>({});

  protected approvalProgressRows = signal<ReviewApprovalProgressDto[]>([]);
  protected approvalProgressLoading = signal<boolean>(false);
  protected approvalProgressModalOpenFor = signal<ReviewMetricsTopMetric | null>(null);

  restatementModeActive = input<boolean>(false);
  protected baselineRawValueForMetricIds_RS = new Map<number, UpdateReviewMetricsValuesDto>();
  public baselineRawValueForMetricIds_RSUpdated =
    output<Map<number, UpdateReviewMetricsValuesDto>>();

  constructor() {
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
      const sub = this.metricsSvc.load(this.normalizedReviewId(), userId).subscribe((review) => {
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

  ngOnInit() {
    this.loadValorisationTypeOptions();
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
  private refreshReviewData(): void {
    this.loadReviewDataSub.unsubscribe();
    const userId = this.getUserId() || 0;
    this.loadReviewDataSub = this.metricsSvc
      .load(this.normalizedReviewId(), userId, true)
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
            actionName: ReviewAggregateMetricsActionNames.GoBack,
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

  protected riskPercentage(metric: ReviewMetricDto): string {
    return (metric?.riskOriginal || 0) > 0 ? `${metric.riskOriginal}%` : '0%';
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

  openBaselineEditInputForMetric(metricCode: string): void {
    this.editingBaselineMetricCodes.update((existing) => {
      const next = { ...existing };
      next[metricCode] = true;
      return next;
    });
  }

  openRawValueEditInputForMetric(metricCode: string): void {
    this.editingRawValueMetricCodes.update((existing) => {
      const next = { ...existing };
      next[metricCode] = true;
      return next;
    });
  }

  openRiskPercentEditInputForMetric(metricCode: string): void {
    this.editingRiskPercentMetricCodes.update((existing) => {
      const next = { ...existing };
      next[metricCode] = true;
      return next;
    });
  }

  openAdditionalDetailsEditInputForMetric(metric: ReviewMetricDto): void {
    this.additionalDetailsEditFor.set(metric.metricCode);
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
  }

  forcedBaseline: {
    baselineValue?: string | undefined;
    metricCode?: string | undefined;
    metricId?: number | undefined;
  } = {};

  forceUpdateBaseline() {
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
          if (visibleTopMetric.metricCode != metricCode) {
            continue;
          }
          if (+(visibleTopMetric as any).rawValue - +baselineValue < 0) {
            this.baselineConfirmationModalOpen.set(true);
            this.forcedBaseline = { baselineValue, metricId, metricCode };
            // this.toastService.warning("The quarterly baseline number provided is higher than the reported number. Are you sure you want to proceed?");
            return;
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

    this.reviewSvc
      .updateBaselineOrRawValueForMetric(this.normalizedReviewId(), input, this.getUserId() || 0)
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

  updateRawValueForMetric(metricCode: string, metricId: number, rawValue: string): void {
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
    this.reviewSvc
      .updateBaselineOrRawValueForMetric(this.normalizedReviewId(), input, this.getUserId() || 0)
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

  updateRiskPercentForMetric(metricCode: string, metricId: number, riskPercentValue: string): void {
    this.editingRiskPercentMetricCodes.update((existing) => {
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
          RawValue: null,
          RiskPercentage: +riskPercentValue,
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
    });
    this.reviewSvc
      .updateBaselineOrRawValueForMetric(this.normalizedReviewId(), input, this.getUserId() || 0)
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
    const fileName = $event.files[0]?.name;
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
      this.reviewSvc
        .addReviewMetricEvidence({
          reviewId: +this.normalizedReviewId(),
          metricId,
          evidenceTypeId: $event.evidenceType,
          files: $event.files,
          userId,
        })
        .subscribe(
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
    if (!evidence.fileUriView) {
      this.toastService.error('Evidence file is not available for viewing.');
      return;
    }
    window.open(evidence.fileUriView, '_blank');
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
    this.approvalProgressLoading.set(true);

    const userId = this.authStateService.getCurrentUserId();

    if (userId == null) {
      this.approvalProgressLoading.set(false);
      return;
    }

    this.reviewSvc
      .getApprovalProgress(+this.normalizedReviewId(), topMetric.metricCode, userId)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          this.approvalProgressRows.set(res);
          this.approvalProgressLoading.set(false);
        },
        error: () => {
          this.approvalProgressLoading.set(false);
        },
      });
  }

  closeViewProgressModal(): void {
    this.approvalProgressModalOpenFor.set(null);
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
          this.refreshReviewData();
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

  getStatusLabelForTopMetric(status: string): { show: boolean; class?: string } {
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
    this.action.emit({
      actionName: ReviewAggregateMetricsActionNames.Recall,
      metricCode: topMetric.metricCode,
      reviewId: +this.reviewId(),
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
}
