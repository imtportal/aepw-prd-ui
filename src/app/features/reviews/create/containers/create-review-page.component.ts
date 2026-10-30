import { Component, computed, effect, inject, Signal, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, take, tap } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule, LucideIconProvider, LUCIDE_ICONS,
  ChevronRight, CircleCheck, Download, Send, Bookmark,
  Loader,
  LoaderCircle,
  Hourglass,
} from 'lucide-angular';
import {
  CardComponent, CardContentComponent, CardHeaderComponent,
  CardTitleComponent, CardDescriptionComponent,
} from '../../../../shared/ui/card/card.component';
import { SelectComponent } from '../../../../shared/ui/select/select.component';
import { HasUnsavedChanges } from '../../../../core/guards/unsaved-changes.guard';
import { ProjectService } from '../../../admin/services/project.service';
import { MetricService } from '../../../admin/services/metric.service';
import { ReviewService } from '../../services/review.service';
import { Metric } from '../../../admin/models/metric.model';
import {
  CreateReviewPayload, RiskOverride, PendingRiskAdjustmentReview,
  CreateReviewRequestDto,
  CreateReviewMetricJsonDto,
  WIZARD_STEPS,
} from '../create-review.types';
import { PendingRiskAdjustmentReviewService } from '../services/pending-review.service';
import { PeriodService } from '../services/period.service';
import { WizardStepperComponent } from '../components/wizard-stepper/wizard-stepper.component';
import { MetricSelectionStepComponent } from '../components/metric-selection-step/metric-selection-step.component';
import { RiskAdjustmentStepComponent } from '../components/risk-adjustment-step/risk-adjustment-step.component';
import { ApprovalReviewModalComponent } from '../../../dashboard/components/approval-review-modal/approval-review-modal.component';
import { of } from 'rxjs';
// import { MessageService } from 'primeng/api';
import { mapStageToFormattedKeys, upperCasedWithoutSpaceStages } from '../../../dashboard/containers/dashboard-page.model';
import { CurrentUserService } from '../../../../core/services/current-user.service';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'app-create-review-page',
  standalone: true,
  imports: [
    RouterLink, FormsModule, LucideAngularModule,
    CardComponent, CardContentComponent, CardHeaderComponent,
    CardTitleComponent, CardDescriptionComponent,
    SelectComponent,
    WizardStepperComponent,
    MetricSelectionStepComponent,
    RiskAdjustmentStepComponent,
    ApprovalReviewModalComponent, 
    TranslocoPipe
  ],
  providers: [
    { provide: LUCIDE_ICONS, multi: true,
      useValue: new LucideIconProvider({ ChevronRight, CircleCheck, Download, Send, Bookmark, Hourglass }) },
  ],
  templateUrl: './create-review-page.component.html',
})
export class CreateReviewPageComponent implements HasUnsavedChanges {
  private readonly projectSvc     = inject(ProjectService);
  private readonly metricSvc      = inject(MetricService);
  private readonly reviewSvc      = inject(ReviewService);
  private readonly pendingRiskAdjustmentReviewSvc = inject(PendingRiskAdjustmentReviewService);
  private readonly currentUserSvc = inject(CurrentUserService);
  private readonly periodSvc      = inject(PeriodService);
  private readonly route          = inject(ActivatedRoute);
  private readonly router         = inject(Router);
  // private readonly messageService = inject(MessageService);
  private readonly translocoService = inject(TranslocoService);

  currentStep = signal(0);
  launched    = signal(false);

  private _excludedInitialized = false;

  // ── Pending-review view mode ─────────────────────────────────────────────
  private readonly pendingIdParam = toSignal(
    this.route.queryParamMap.pipe(map(p => p.get('pendingId'))),
    { initialValue: null },
  );

  // readonly pendingReview = computed(() => {
  //   const id = this.pendingIdParam();
  //   return id ? this.pendingRiskAdjustmentReviewSvc.getById(id) : undefined;
  // });
  readonly pendingReview = toSignal(
    this.pendingIdParam() ? this.pendingRiskAdjustmentReviewSvc.getById(this.pendingIdParam() as string).pipe(tap(res => res?.projectId ? this.updateMetricsByProject(res.projectId, res.statusDisplayValue || "", this.pendingIdParam()) : {})) : of (undefined)
  );

  // Drafts behave like a fresh review — map 'draft' → 'none' so the risk table
  // is fully editable and shows no approval-state badges.
  readonly pendingStatus = computed(() => {
    const s = this.pendingReview()?.status;
    return (!s || s === 'draft') ? 'none' as const : s;
  });

  readonly savingAsDraft = computed(() => {
    return this.reviewSvc.savingAsDraft()
  });

  readonly isReadOnlyRisk     = computed(() => (this.pendingStatus() === 'pending_approval') || (this.pendingStatus()?.toUpperCase() === 'PENDINGRISKADJUST'));
  readonly rejectionInfo      = computed(() => this.pendingReview()?.rejectionInfo ?? {});
  readonly submittedOverrides = computed(() => {
    const pr = this.pendingReview();
    return (!pr || pr.status === 'draft') ? {} : pr.riskOverrides;
  });

  // ── Step 0 ───────────────────────────────────────────────────────────────
  selectedProjectId = signal<string | null>(null);
  selectedPeriod = signal(this.periodSvc.getCurrentPeriod());

  get projectModel(): string { return this.selectedProjectId() ?? ''; }
  set projectModel(v: string) { this.selectedProjectId.set(v || null); }

  get periodModel(): string { return this.selectedPeriod(); }
  set periodModel(v: string) { this.selectedPeriod.set(v); }

  private readonly _projects = toSignal(
    this.projectSvc.getAllProjects(
      {
        pageNumber: 1,
        pageSize: 1000,
        searchText: null,
        pmUserId: null,
        projectId: null,
        programId: null,
        statusId: null,
        fundingRecipientId: null,
        metricCategories: null
      }
    ).pipe(map(r => r.success ? r.data.items : [])),
    { initialValue: [] },
  );

  readonly hasProjects = computed(() =>
    this._projects().map(p => ({ label: p.title, value: p.pin }))
  );

  readonly projectOptions = computed(() =>
    this._projects().map(p => ({ label: p.title, value: p.projectId }))
  );

  readonly periodOptions = this.periodSvc.periodOptions;
  // readonly periodOptions = toSignal(
  //   this.periodSvc.getReviewPeriods(),
  //   { initialValue: [] }
  // ) as unknown as Signal<Record<string, unknown>[]>;

  readonly loadingReviewPeriods: Signal<boolean> = this.periodSvc.loadingReviewPeriods;

  readonly selectedProjectName = computed(() =>
    this._projects().find(p => p.pin === this.selectedProjectId())?.title ?? ''
  );

  readonly canProceedStep0 = computed(() =>
    this.selectedProjectId() !== null && this.selectedPeriod() !== ''
  );

  public submitForApprovalInProgress = signal<boolean>(false);
  public launchInProgress = signal<boolean>(false);

  // ── Step 1 ───────────────────────────────────────────────────────────────
  selectedCodes = signal(new Set<string>());
  excludedCodes = signal(new Set<string>());

  readonly metricsByCategory = computed(() => {
    const grouped = new Map<number, Metric[]>();
    for (const m of this.metricSvc.metrics()) {
      if (!m.isActive) continue;
      const arr = grouped.get(m.categoryId) ?? [];
      arr.push(m);
      grouped.set(m.categoryId, arr);
    }
    return grouped;
  });

  readonly metricCategoryCount = computed(() => this.metricsByCategory().size);

  readonly metricsLoading = computed(() => {
    return this.metricSvc.metricsLoading();
  });

  // ── Step 2 ───────────────────────────────────────────────────────────────
  riskOverrides = signal<Record<string, RiskOverride>>({});
  previousRAResponseMap = signal<Record<string, { risk: number; comment?: string }>>({});

  readonly selectedMetrics = computed(() =>
    this.metricSvc.metrics().filter(m => {
      const selectedParentMetricCodes = this.selectedParentMetricCodes();
      if (m.isTopLevel) {
        return selectedParentMetricCodes[m.code]
      }

      if (!m.parentMetricId) {
        return false;
      }

      const parentMetric = this.metricSvc.metrics().find(pm => pm.metricId === m.parentMetricId);
      return selectedParentMetricCodes[parentMetric?.code ?? ''];
      // m.isActive && !this.excludedCodes().has(m.code)
    })
  );

  readonly selectedParentMetricCodes = signal<Record<string, boolean>>({});
  readonly atleastOneTopLevelMetricSelected = computed(() => {
    return Object.values(this.selectedParentMetricCodes()).some(v => v == true);
  })

  readonly hasRiskChanges = computed(() => {
    const overrides  = this.riskOverrides();
    const submitted  = this.submittedOverrides();
    const ps         = this.pendingStatus();
    const rejInfo    = this.rejectionInfo();
    return this.selectedMetrics().some(m => this.needsApproval(m, overrides, submitted, ps, rejInfo));
  });

  readonly allChangedHaveReasons = computed(() => {
    const overrides  = this.riskOverrides();
    const submitted  = this.submittedOverrides();
    const ps         = this.pendingStatus();
    const rejInfo    = this.rejectionInfo();
    return this.selectedMetrics()
      .filter(m => this.needsApproval(m, overrides, submitted, ps, rejInfo))
      .every(m  => (overrides[m.code]?.reason ?? '').trim() !== '');
  });

  private needsApproval(
    m:        Metric,
    overrides: Record<string, RiskOverride>,
    submitted: Record<string, RiskOverride>,
    ps:        string,
    rejInfo:   Record<string, string>,
  ): boolean {
    const o = overrides[m.code];
    if (!o || o.risk === (m.defaultRiskPct ?? 0)) return false;
    // When the overall review was rejected, a metric whose current risk still
    // matches what was submitted and has no rejection info was already approved —
    // it does not need to go through another approval round.
    if (ps === 'rejected' && o.risk === submitted[m.code]?.risk && !rejInfo[m.code]) return false;
    return true;
  }

  // True only when the user has changed at least one value from what was approved.
  // hasRiskChanges() is not usable here because for 'approved' status it always
  // returns true for any metric that differs from the default (even approved ones).
  readonly hasChangesFromApproved = computed(() => {
    const submitted = this.submittedOverrides();
    const overrides = this.riskOverrides();
    return this.selectedMetrics().some(m => {
      const cur = overrides[m.code]?.risk ?? (m.defaultRiskPct ?? 0);
      const app = submitted[m.code]?.risk ?? (m.defaultRiskPct ?? 0);
      return cur !== app;
    });
  });

  readonly showRiskConfirmModal = signal(false);

  readonly riskConfirmReview = computed<PendingRiskAdjustmentReview>(() => {
    const ps        = this.pendingStatus();
    const submitted = this.submittedOverrides();
    const overrides = this.riskOverrides();
    const rejInfo   = this.rejectionInfo();

    // Only include the overrides that represent NEW changes needing approval —
    // not those that were already approved in a prior cycle.
    const newOverrides: Record<string, RiskOverride> = {};
    for (const m of this.selectedMetrics()) {
      const o = overrides[m.code];
      if (!o) continue;

      if (ps === 'approved') {
        // For an approved review: only metrics where current risk differs from the approved baseline
        const approvedRisk = submitted[m.code]?.risk ?? (m.defaultRiskPct ?? 0);
        if (o.risk !== approvedRisk) newOverrides[m.code] = o;
      } else {
        // For fresh ('none') and rejected reviews: use standard needsApproval logic
        if (this.needsApproval(m, overrides, submitted, ps, rejInfo)) newOverrides[m.code] = o;
      }
    }

    return {
      id:             'preview',
      projectId:      this.selectedProjectId() ?? '',
      projectName:    this.selectedProjectName(),
      period:         this.selectedPeriod(),
      metricCodes:    this.selectedMetrics().map(m => m.code),
      mandatoryCodes: [...this.selectedCodes()],
      riskOverrides:  newOverrides,
      status:         'pending_approval',
      createdAt:      new Date().toISOString(),
    };
  });

  // ── Step 3 ───────────────────────────────────────────────────────────────
  readonly selectedCategoryCount = computed(() =>
    new Set(this.selectedMetrics().map(m => m.categoryId)).size
  );

  constructor() {
    // For fresh reviews, start with all metrics excluded by default
    effect(() => {
      if (this.pendingReview()) return;
      const metrics = this.metricSvc.metrics();
      if (!metrics.length || this._excludedInitialized) return;
      this._excludedInitialized = true;
      this.excludedCodes.set(new Set(metrics.map(m => m.code)));

      this.selectedCodes.set(new Set());
    });

    // When navigated with ?pendingId=xxx, hydrate wizard state from the saved draft
    effect(() => {
      const review = this.pendingReview();
      if (!review) return;
      const metrics = this.metricSvc.metrics();
      if (!metrics.length) return;

      this.selectedProjectId.set(review.projectId);
      this.selectedPeriod.set(review.period);
      this.selectedCodes.set(new Set(review.mandatoryCodes));

      this.selectedParentMetricCodes.set(
        (review.reviewMetrics || []).filter(m => m.isTopLevel).reduce((acc, m) => {
          acc[m.metricCode] = true;
          return acc;
        }, <Record<string, boolean>> {})
      );

      // for Risk Adjustment page
      // const metricRiskMap: { [metricCode: string]: number } = {};
      // this.metricSvc.updateMetricRiskAdjustment({  'CV1.12': 8.12 });


      const includedSet = new Set(review.metricCodes);
      this.excludedCodes.set(
        new Set(metrics.filter(m => m.isActive && !includedSet.has(m.code)).map(m => m.code))
      );
      // For rejected reviews, clear overrides for rejected metrics so the PM
      // starts fresh — the input will show the default value and status stays 'Rejected'.
      const overrides = { ...review.riskOverrides };
      if (review.status === 'rejected') {
        Object.keys(review.rejectionInfo ?? {}).forEach(code => delete overrides[code]);
      }
      // this.riskOverrides.set(overrides);

      if (review.reviewMetrics) {
        const previousRAResponseMap: Record<string, { risk: number; comment?: string; raStatus?: string; }> = {};
        for (const m of review.reviewMetrics) {
          if (m.riskPctEffective) {
            previousRAResponseMap[m.metricCode] = {
              risk: +m.riskPctEffective,
              comment: m.raReason,
              raStatus: m.raStatus
            }
          }
        }

        this.previousRAResponseMap.set(previousRAResponseMap);
      }


      this.currentStep.set(review.savedAtStep ?? 2);
    });
  }

  protected wizardSteps = signal<{ label: string }[]>([]);
  ngOnInit() {
    this.getTranslations();
    this.getReviewPeriodOptions();
    console.log("Create review page Init...")
    if (+(this.pendingIdParam() || 0) > 0) {
      this.currentStep.set(-1);
    }
    // this.metricSvc.GetMetricsForProject().pipe(take(1)).subscribe();
  }

  // ── Guards / navigation ──────────────────────────────────────────────────
  hasUnsavedChanges(): boolean {
    const pr = this.pendingReview();
    // Non-draft pending reviews (approval flow) have no unsaved changes concept
    if (pr && pr.status !== 'draft') return false;
    return this.currentStep() > 0 && !this.launched();
  }

  goNext(): void {
    this.currentStep.update(s => Math.min(s + 1, 3));
  }

  goBack(): void {
    this.currentStep.update(s => Math.max(s - 1, 0));
  }

  onContinueToLaunch(): void {
    const pendingStatus = this.pendingStatus();
    const allCasesForPendingRiskAdjust = mapStageToFormattedKeys({ "Pending Risk Adjust": "true", "Pending Review Launch": "true" });
    // const needsConfirmation = [this.pendingStatus()] === "true"
    //   ? this.hasChangesFromApproved()
    //   : this.hasRiskChanges();
    
    if (pendingStatus == "none" || upperCasedWithoutSpaceStages[pendingStatus] == "DRAFT") {
      const metrics = this.selectedMetrics();
      const riskOverrides = this.riskOverrides();
      // Commented Out, since the risk adjustment no longer needs a different path
      // for (const metric of metrics) {
      //   if (
      //       (riskOverrides[metric.code] != undefined) 
      //       && (metric.defaultRiskPct) 
      //       && (+riskOverrides[metric.code].risk != +(metric.defaultRiskPct))
      //     ) {
      //       this.showRiskConfirmModal.set(true);
      //       return;
      //   }
      // }

      this.goNext();
    }

    if (allCasesForPendingRiskAdjust[pendingStatus] == "true") {
      const riskOverrides = this.riskOverrides();
      const previousRAResponseMap = this.previousRAResponseMap();
      
      const allRiskOverrideCodes = Object.keys(riskOverrides);
      
      let needsConfirmation = false;
      for (const code of allRiskOverrideCodes) {
        if (riskOverrides[code]?.risk != previousRAResponseMap[code]?.risk) {
          needsConfirmation = true;
          break;
        }
      }

      needsConfirmation = false; // hard coding it false, since the risk adjustment no longer needs a different path

      if (needsConfirmation) { 
        this.showRiskConfirmModal.set(true);
      } else {
        this.goNext();
      }
 
    }
  
    // const needsConfirmation = allCasesForPendingRiskAdjust[pendingStatus] == "true";
    // if (needsConfirmation) { 
    //   this.showRiskConfirmModal.set(true);
    // } else {
    //   this.goNext();
    // }
  }

  // ── Event handlers ───────────────────────────────────────────────────────
  onToggleCode(code: string): void {
    this.selectedCodes.update(s => {
      const n = new Set(s);
      n.has(code) ? n.delete(code) : n.add(code);
      return n;
    });
  }

  onToggleCategoryAll(event: { codes: string[]; selectAll: boolean }): void {
    this.selectedCodes.update(s => {
      const n = new Set(s);
      if (event.selectAll) {
        event.codes.forEach(c => n.add(c));
      } else {
        event.codes.forEach(c => n.delete(c));
      }
      return n;
    });
  }

  onToggleExclude(code: string): void {
    this.excludedCodes.update(s => {
      const n = new Set(s);
      n.has(code) ? n.delete(code) : n.add(code);
      return n;
    });
  }

  onOverrideChange(event: { code: string; risk: number; reason: string }): void {
    const pendingReview = this.pendingReview();

    
    this.riskOverrides.update(r => ({
      ...r,
      [event.code]: { risk: event.risk, reason: event.reason },
    }));

    if (pendingReview) {
      const reviewMetrics = pendingReview.reviewMetrics;

      console.log({ reviewMetrics, riskOverrides: this.riskOverrides() });
    }
  }

  onLaunch(): void {
    const projectId = this.selectedProjectId();
    if (!projectId) return;

    // const payload: CreateReviewPayload = {
    //   projectId,
    //   projectName:   this.selectedProjectName(),
    //   period:        this.selectedPeriod(),
    //   metricCodes:   this.selectedMetrics().map(m => m.code),
    //   riskOverrides: this.riskOverrides(),
    //   // status:        'data_collection', // older code by claude
    //   status:        'DATACOLLECTION',
    // }; 
    const payLoad: CreateReviewRequestDto = new CreateReviewRequestDto();

    this.pendingIdParam();
    payLoad.ReviewId = +(this.pendingIdParam() || 0);
    payLoad.ProjectId = +this.projectModel;
    payLoad.ReviewPeriodId = +this.periodModel;
    payLoad.Stage = "DATACOLLECTION"; 

    // payLoad.SubmittedUtc = "null";
    // payLoad.ClosedUtc = null;
    // payLoad.DataCompletionPct = "null";
    // payLoad.EvidenceConfirmedPct = "null";
    // payLoad.IsRestated = "null";
    payLoad.UserId = this.currentUserSvc.loggedInUser?.userId || 0; 
    // hereherehere
    const reviewMetrics = this.getReviewMetrics();
    payLoad.ReviewMetrics = reviewMetrics; 

    console.log("payLoad for launch", payLoad);

    this.launchInProgress.set(true);
    this.reviewSvc.createReview(payLoad)
    .pipe(take(1))
    .subscribe(
      (reviewId) => {
        // on success
        // this.pendingRiskAdjustmentReviewSvc.update(existing.id, draftData);
        // this.pendingRiskAdjustmentReviewSvc.add(draftData);
        
        if (reviewId) {
          this.currentStep.set(0);
          this.launchInProgress.set(false);
          this.launched.set(true);
        }
        else {
          this.launchInProgress.set(false);
          // this.messageService.add({ severity: 'error', summary: 'Launch Failed', detail: 'An error occurred while launching the review. Please try again.' });
        }

        // this.router.navigate(['/'], { queryParams: { pendingId: reviewId } });
      },
      () => {
        this.launchInProgress.set(false);

      }
    );

  }

  onSubmitForApproval(): void {
    // const projectId = this.selectedProjectId();
    // if (!projectId) return;
    
    // const payload: CreateReviewPayload = {
    //   projectId,
    //   projectName:   this.selectedProjectName(),
    //   period:        this.selectedPeriod(),
    //   metricCodes:   this.selectedMetrics().map(m => m.code),
    //   riskOverrides: this.riskOverrides(),
    //   status:        'risk_adjustment_pending',
    // };
    // // this.reviewSvc.createReview(payload);
    // this.launched.set(false);
    // // Below section will be removed after integrating real endpoints
    // const newOverrideCodes = Object.keys(this.riskConfirmReview().riskOverrides);
    // this.pendingRiskAdjustmentReviewSvc.add({
    //   projectId,
    //   projectName:      this.selectedProjectName(),
    //   period:           this.selectedPeriod(),
    //   metricCodes:      this.selectedMetrics().map(m => m.code),
    //   mandatoryCodes:   [...this.selectedCodes()],
    //   riskOverrides:    this.riskOverrides(),  // full overrides (needed for correct state restore)
    //   newOverrideCodes,                        // only the new codes for reviewer display
    //   status:           'pending_approval',
    // });

    const payLoad: CreateReviewRequestDto = new CreateReviewRequestDto();
    
    payLoad.ReviewId = +(this.pendingIdParam() || 0);
    payLoad.ProjectId = +this.projectModel;
    payLoad.ReviewPeriodId = +this.periodModel;
    payLoad.Stage = 'PENDINGRISKADJUST';
    // payLoad.SubmittedUtc = "null";
    // payLoad.ClosedUtc = null;
    // payLoad.DataCompletionPct = "null";
    // payLoad.EvidenceConfirmedPct = "null";
    // payLoad.IsRestated = "null";
    payLoad.UserId = this.currentUserSvc.loggedInUser?.userId || 0; //TODO: replace with real data later
    
    
    const reviewMetrics = this.getReviewMetrics();
    payLoad.ReviewMetrics = reviewMetrics;
    
    this.submitForApprovalInProgress.set(true);
    this.reviewSvc.createReview(payLoad)
    .pipe(take(1))
    .subscribe(
      () => {
        // on success
        // this.pendingRiskAdjustmentReviewSvc.update((payLoad.ReviewId), draftData);
        this.currentStep.set(0);
        this.router.navigate(['/']);
        this.submitForApprovalInProgress.set(false);
        this.showRiskConfirmModal.set(false);
      },
      () => {
        // this.messageService.add({ severity: 'error', summary: 'Submission Failed', detail: 'An error occurred while submitting for approval. Please try again.' });
        this.submitForApprovalInProgress.set(false);
      }
    );

    // // Reset step so the unsaved-changes guard doesn't block navigation
    // this.currentStep.set(0);
    // this.router.navigate(['/']);
  }

  onSaveDraft(): void {
    const projectId = this.selectedProjectId();
    if (!projectId) return;

    const existing = this.pendingReview();
    const rawOverrides = this.riskOverrides();
    const riskOverrides = (existing?.status === 'approved' || existing?.status === 'rejected')
      ? Object.fromEntries(Object.entries(rawOverrides).map(([c, o]) => [c, { risk: o.risk, reason: '' }]))
      : rawOverrides;

    const draftData = {
      projectId,
      projectName:    this.selectedProjectName(),
      period:         this.selectedPeriod(),
      metricCodes:    this.selectedMetrics().map(m => m.code),
      mandatoryCodes: [...this.selectedCodes()],
      riskOverrides,
      status:         'draft' as const,
    };

    if (existing?.status === 'draft') {
      // updating the draft

      const payLoad: CreateReviewRequestDto = new CreateReviewRequestDto();

      payLoad.ReviewId = +(this.pendingIdParam() || 0);
      payLoad.ProjectId = +this.projectModel;
      payLoad.ReviewPeriodId = +this.periodModel;
      payLoad.Stage = "DRAFT";
      // payLoad.SubmittedUtc = "null";
      // payLoad.ClosedUtc = null;
      // payLoad.DataCompletionPct = "null";
      // payLoad.EvidenceConfirmedPct = "null";
      // payLoad.IsRestated = "null";
      payLoad.UserId = this.currentUserSvc.loggedInUser?.userId || 0;

      const reviewMetrics = this.getReviewMetrics();
      payLoad.ReviewMetrics = reviewMetrics;
      this.reviewSvc.createReview(payLoad)
      .pipe(take(1))
      .subscribe(
        () => {
          // on success
          this.pendingRiskAdjustmentReviewSvc.update(existing.id, draftData);
          this.currentStep.set(0);
          this.router.navigate(['/']);
        }
      );
      
    } else {
      // creating new Draft
      const payLoad: CreateReviewRequestDto = new CreateReviewRequestDto();

      this.pendingIdParam();
      payLoad.ReviewId = +(this.pendingIdParam() || 0);
      payLoad.ProjectId = +this.projectModel;
      payLoad.ReviewPeriodId = +this.periodModel;
      payLoad.Stage = "DRAFT";


      // payLoad.SubmittedUtc = "null";
      // payLoad.ClosedUtc = null;
      // payLoad.DataCompletionPct = "null";
      // payLoad.EvidenceConfirmedPct = "null";
      // payLoad.IsRestated = "null";
      payLoad.UserId = this.currentUserSvc.loggedInUser?.userId || 0; 
      
      const reviewMetrics = this.getReviewMetrics();
      payLoad.ReviewMetrics = reviewMetrics;
      // {
        // "metricId": 2,
        // "code": "CV1.1",
        // "name": "Total plastic waste valorised",
        // "description": "Total plastic waste valorised",
        // "categoryId": 2,
        // "unit": "tonnes",
        // "isTopLevel": false,
        // "parentMetricId": null,
        // "isCorporate": false,
        // "defaultRiskPct": 8,
        // "evidenceRequiredMin": 1,
        // "isActive": true,
        // "effectiveFromUtc": "2026-05-25T14:00:42.4275153",
        // "createdBy": 0
      // }


      console.log("payLoad for draft", payLoad);

      this.reviewSvc.createReview(payLoad)
      .pipe(take(1))
      .subscribe(
        (reviewId) => {
          // on success
          // this.pendingRiskAdjustmentReviewSvc.update(existing.id, draftData);
          this.pendingRiskAdjustmentReviewSvc.add(draftData);
          this.currentStep.set(0);
          this.router.navigate(['/'], { queryParams: { pendingId: reviewId } });
        }
      );

    }

  }

  getReviewMetrics() {
    const reviewMetrics: CreateReviewMetricJsonDto[] = [];
      
    const selectedMetrics = this.selectedMetrics();
    const selectedCodes = this.selectedCodes();
    const riskOverrides = this.riskOverrides();

    for (const selectedMetric of selectedMetrics) {
      const reviewMetric = new CreateReviewMetricJsonDto();

      reviewMetric.MetricId = selectedMetric.metricId;
      // reviewMetric.IsRequired = selectedCodes.has(selectedMetric.code) ? 1 : 0; // no longer needed since IsRequired will be decided by excel

      if (riskOverrides[selectedMetric.code]) {
        reviewMetric.RiskPctProposed = riskOverrides[selectedMetric.code].risk;
        reviewMetric.RaReason = riskOverrides[selectedMetric.code].reason;
      }
      else {
        reviewMetric.RiskPctProposed = null;
        reviewMetric.RaReason = null; 
      }
      
      reviewMetrics.push(reviewMetric);
    }

    return reviewMetrics;
  }

  updateMetricsByProject(projectId: string, statusDisplayValue: string = "", pendingIdParam: string | null = null) {
    // const statusDisplayValue = this.pendingReview()?.statusDisplayValue;
    if (pendingIdParam && +pendingIdParam) {
      this.metricSvc.GetMetricsForProject(+projectId, statusDisplayValue, +pendingIdParam).pipe(take(1)).subscribe();
      return;
    }
    
    this.metricSvc.GetMetricsForProject(+projectId).pipe(take(1)).subscribe();

    // this.getReviewPeriodOptions(projectId);
  }

  createAnother(): void {
    this._excludedInitialized = false;
    this.launched.set(false);
    this.currentStep.set(0);
    this.selectedProjectId.set(null);
    this.selectedPeriod.set('');
    this.selectedCodes.set(new Set());
    this.excludedCodes.set(
      new Set(this.metricSvc.metrics().filter(m => m.isActive).map(m => m.code))
    );
    this.riskOverrides.set({});
  }

  getTranslations(): void {
    this.translocoService.selectTranslation().pipe(take(1))
    .subscribe(() => {
      const wizardSteps: { label: string }[] = [];

      for (const step of WIZARD_STEPS) {
        let jsonKey = "CREATE_REVIEW.TABS.";

        switch (step.key?.toUpperCase()) {
          case "PROJECT" :
            jsonKey += "PROJECT"
            break;
          case "METRICS" :
            jsonKey += "METRICS"
            break;
          case "RISK_ADJUSTMENT" :
            jsonKey += "RISK_ADJUSTMENT"
            break;
          case "LAUNCH" :
            jsonKey += "LAUNCH"
            break;
        }

        const label = this.translocoService.translate(jsonKey);
        wizardSteps.push({ label });
      }

      this.wizardSteps.set(wizardSteps);
    });
  }

  selectedParentMetricIdUpdated($event: { code: string; value: boolean; }) {
    this.selectedParentMetricCodes.update(s => ({
      ...s,
      [$event.code]: $event.value
    }));
  }

  getReviewPeriodOptions(projectId?: string) {
    console.log("projectUpdated, ProjectId: ", projectId);

    if (projectId) {
      this.periodSvc.getReviewPeriods(+projectId, 1).pipe(take(1)).subscribe();
      return;
    }

    return this.periodSvc.getReviewPeriods(null, 1).pipe(take(1)).subscribe();
    
  }

  ngOnDestroy() {
    // alert("ngOnDestroy of Create Review Page")
    // this.metricSvc.updateAllMetricsActiveState(true);
  }
}
