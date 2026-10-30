import {
  ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, linkedSignal, signal,
} from '@angular/core';
import { CommentPanel as CommentPanelComponent } from '../components/comment-panel/comment-panel.component';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  LucideAngularModule, LucideIconProvider, LUCIDE_ICONS,
  ShieldCheck, ChevronsUpDown, MessageSquare,
  FolderUp,
  Upload,
  X,
  LoaderCircle,
  Info,
  Check,
} from 'lucide-angular';
import {
  CardComponent, CardContentComponent,
} from '../../../../shared/ui/card/card.component';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { ReviewService } from '../../services/review.service';
import { EvidenceService } from '../../../evidence/services/evidence.service';
import { AuditService } from '../../../audit/services/audit.service';
import { AIProcessingService } from '../../../ai-processing/services/ai-processing.service';
import { MetricRow, RecallTopLevelMetricInput, ReviewCommentDto, ReviewDetailDto, ReviewDetailPageActionKey, ReviewDto, ReviewItem, ReviewPageRole, StartEndRestatementDto, UpdateReviewMetricsValuesDto } from '../../models/review.model';
import { ReviewDetailTabData, ApprovalStepId } from '../review-detail.types';
import { ReviewHeaderComponent } from '../components/review-header/review-header.component';
import { CategorySummaryBarComponent } from '../components/category-summary-bar/category-summary-bar.component';
import { MetricRowComponent } from '../components/metric-row/metric-row.component';
import { ApprovalSectionComponent } from '../components/approval-section/approval-section.component';
import { CommentThreadComponent } from '../components/comment-thread/comment-thread.component';
import { CATEGORY_BADGE_COLORS } from '../../../../shared/constants/badge-colors';
import { map, mergeMap, Subject, Subscription, take } from 'rxjs';
import { CurrentUserService } from '../../../../core/services/current-user.service';
// import { MessageService } from 'primeng/api';
import { JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { AuthorizationService, AuthStateService, LoginContext } from '../../../../core/auth';
import { ModalComponent } from '../../../../shared/ui/modal/modal.component';
import { ReviewMetricsByIdComponent } from '../components/review-metrics-by-id/review-metrics-by-id.component';
import { ReviewAggregateMetricsComponent } from '../components/review-aggregate-metrics/review-aggregate-metrics.component';
import { ReviewHeaderAction } from '../components/review-header/review-header.model';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { ReviewMetricConfigPageService } from '../components/metric-config/containers/services/review-metric-config-page.service';
import { CategoryApprovalPageComponent } from '../components/category-approval/category-approval-page.component';
import { ReviewMetricsByIdAction, ReviewMetricsByIdActionNames } from '../components/review-metrics-by-id/review-metrics-by-id.types';
import { BreadcrumbComponent, BreadcrumbItemComponent } from '../../../../shared/ui/breadcrumb/breadcrumb.component';
import { BreadcrumbCrumb } from '../../../../core/layout/breadcrumb-crumb.model';
import { ReviewDetailPageFromSource } from './review-detail.model';
// import { ReviewMetricsByIdService } from '../components/review-metrics-by-id/review-metrics-by-id.service';

const TAB_BASE = 'relative flex items-center gap-2 rounded-none rounded-t-md border border-b-0 px-4 py-2.5 text-sm';
const TAB_ACTIVE   = `${TAB_BASE} border-border bg-card shadow-none`;
const TAB_INACTIVE = `${TAB_BASE} border-transparent text-muted-foreground hover:text-foreground`;

@Component({
  selector: 'app-review-detail-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    LucideAngularModule,
    CardComponent, CardContentComponent,
    BadgeComponent,
    ReviewHeaderComponent,
    CategorySummaryBarComponent,
    MetricRowComponent,
    ApprovalSectionComponent,
    CommentThreadComponent,
    ModalComponent,
    ReviewMetricsByIdComponent,
    ReviewAggregateMetricsComponent,
    CommentPanelComponent ,
    CategoryApprovalPageComponent,
    BreadcrumbComponent,
    BreadcrumbItemComponent,
    JsonPipe
  ],
  providers: [
    { provide: LUCIDE_ICONS, multi: true,
      useValue: new LucideIconProvider({ ShieldCheck, ChevronsUpDown, MessageSquare, FolderUp, Info, Upload, LoaderCircle, Check, X, }) },
  ],
  templateUrl: './review-detail-page.component.html',
})
export class ReviewDetailPageComponent {
  id = input.required<string>();
  stageId = input.required<number>();
  protected readonly numericId  = computed(() => Number(this.id()));

  protected dataCollectionFile: File | null = null;
  
  private readonly route      = inject(ActivatedRoute);
  private readonly router        = inject(Router);
  private readonly authStateService = inject(AuthStateService);
  private readonly actRoute      = inject(ActivatedRoute);
  private readonly svc        = inject(ReviewService);
  private readonly authSvc        = inject(AuthorizationService);
  private readonly evidSvc    = inject(EvidenceService);
  private readonly auditSvc   = inject(AuditService);
  private readonly reviewMetricConfigPageSvc   = inject(ReviewMetricConfigPageService);
  private readonly aiSvc      = inject(AIProcessingService);
  private readonly toastService      = inject(ToastService);
  // private readonly reviewMetricsByIdSVC = inject(ReviewMetricsByIdService);
  private readonly currentUserSVC      = inject(CurrentUserService);
  // private readonly messageService      = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  protected refreshReviewMetricsData = signal<boolean>(false);
  protected isUploadFileDialogOpen = signal(false);
  protected readonly isCommentsPanelOpen      = signal(false);
  private readonly _reviewDetail = signal<ReviewDto | null>(null);
  protected readonly reviewDetail = this._reviewDetail.asReadonly();
  protected uploadingDataCollectionFile = signal<boolean>(false);

  protected catCode = signal<string | null>(null);
  protected periodCode = signal<string | null>(null);
  
  protected fromCatCode = signal<string | null>(null);
  protected fromPeriodCode = signal<string | null>(null);
  protected fromRole = signal<string | null>(null);

  protected role = signal<string | null>(null);
  protected reviewDetailPermissions = signal<{ [key: string]: boolean }>({});
  protected reviewDetailPageActionKey = ReviewDetailPageActionKey;
  protected allowActions = signal<boolean>(false);
  protected stageNameLowerCased = signal<string>('');

  protected restatementModeActive = signal<boolean>(false);
  protected issuingRestatement = signal<boolean>(false);
  protected baselineRawValueForMetricIds_RS = new Map<number, UpdateReviewMetricsValuesDto>();
  
  private queryParams = toSignal(this.actRoute.queryParams, {
    initialValue: {}
  });

  protected readonly entrySource = toSignal(
    this.route.queryParamMap.pipe(map(p => p.get('from'))),
    { initialValue: null as string | null },
  );

  readonly fromQueue = computed(() => this.entrySource() === ReviewDetailPageFromSource.queue);

  readonly breadcrumbTrail = computed<BreadcrumbCrumb[]>(() => {
    const origin: BreadcrumbCrumb = this.fromQueue()
      ? { label: 'Task', href: 'workflow/reviewTasks' }
      : this.entrySource() === 'dashboard'
        ? { label: 'Dashboard', href: '/dashboard' }
        : { label: 'Project Library', href: '/' };
    const title = this.reviewDetail()?.projectName ?? this.id();
    return [origin, { label: title, current: true }];
  });

  protected showRestatementButton = signal<boolean>(true); 
  constructor() {
    effect(() => {
      // setInterval(() => {
      //   console.log("stage", this.stageId())
      // }, 2000)
      const periodCode = this.periodCode();

      const userId = this.authStateService.getCurrentUserId() || 0;
      this.svc.getReviewByReviewId({reviewId: this.numericId().toString(), userId, stageId: this.stageId()})
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(review => {
          this._reviewDetail.set(review ?? null);

          this.stageNameLowerCased.set((review.stageName || "").toLowerCase());
          this.allowActions.set(review.stageDisplayValue?.toLowerCase().replaceAll(' ', '') != 'closed' ? true : false);
          this.showRestatementButton.set(review.stageDisplayValue?.toLowerCase().replaceAll(' ', '') == 'closed' ? true : false);
          
          this.restatementModeActive.set(review.stageDisplayValue?.toLowerCase().replaceAll(' ', '') == 'restatement' ? true : false);

          if (review) {
            this._comments.set(this.mapComments(review.comments ?? []) );
          }

          if (!this.periodCode() && !this.catCode() /* determining if we are indeed not it category approval page */) {
            if (review.atLeastOneMetricAssigned === false) {
              this.openConfirmationModal("No Metrics Assigned", "There are no metrics available for this review. You'll be redirected to the previous page.", false, true)
              this.confirmationModalSubscription.unsubscribe();
              this.confirmationModalSubscription = this.confirmationModalAction.subscribe(() => {
                this.goBack();
              });
            }
          }
          
          // ("review.atleastonemetricassigned: " + review.atLeastOneMetricAssigned)
        });

        // const userId = this.getUserId();
        if (userId) {
          this.authSvc.getActionAccess('REVIEWDETAIL', userId).pipe(take(1)).subscribe(res => {
            const permissions = res.data;
            console.log({ permissions })

            const reviewDetailPermissions = this.reviewDetailPermissions();
            for (const action of permissions) {
              reviewDetailPermissions[action.key] = action.value;
            }

            this.reviewDetailPermissions.set(JSON.parse(JSON.stringify(reviewDetailPermissions)));
          });
        }
    });
      
    effect(() => {
      const params = <{[key: string]: any}> this.queryParams();

      if (params['catCode']) {
        this.catCode.set(params['catCode']);
      }
      else {
        this.catCode.set(null)
      }
      
      if (params['periodCode']) {
        this.periodCode.set(params['periodCode']);
      }
      else {
        this.periodCode.set(null)
      }

      if (params['role']) {
        this.role.set(params['role'].toLowerCase());
      }
      else {
        this.role.set('');
      }


      if (params['fromCatCode']) {
        this.fromCatCode.set(params['fromCatCode']);
      }
      
      if (params['fromPeriodCode']) {
        this.fromPeriodCode.set(params['fromPeriodCode']);
      }

      if (params['fromRole']) {
        this.fromRole.set(params['fromRole']);
      }
    });

    // this.auditSvc.loadPaged({ page: 0, pageSize: 1000 })
    //   .pipe(takeUntilDestroyed(this.destroyRef))
    //   .subscribe();
  }

  protected reviewPageRole: typeof ReviewPageRole = ReviewPageRole;
  protected reviewDetailsExpanded = signal<boolean>(true);
  protected confirmationModalOpen = signal<boolean>(false);
  protected confirmationModalHeaderText = signal<string>("");
  protected confirmationModalText = signal<string | null>(null);
  protected confirmationModalIconName = signal<string>("info");
  protected confirmationModalActionText = signal<string>("Confirm");
  protected confirmationModalCommentPlaceholder = signal<string>("Add a comment...");
  protected confirmationModalComment = "";
  protected showConfirmationModalComment = signal<boolean>(false);
  protected confirmationModalShowCancelButton = signal<boolean>(true);
  protected confirmLoader = signal<boolean>(false);

  protected confirmationModalAction = new Subject<void>();

  protected readonly review       = computed(() =>
    this.svc.reviews().find(r => r.reviewId === this.numericId()) ?? null,
  );
  protected readonly reviewItem   = computed(() =>
    this.svc.reviewerQueue().find(r => r.projectId === this.numericId()) ?? null,
  );
  protected readonly auditEvents = computed(() =>
    this.auditSvc.getEventsForProject(this.id()),
  );

  readonly loading = computed(() =>
    this.svc.loading() || this.evidSvc.loading() || this.auditSvc.loading(),
  );
  readonly error = computed(() =>
    this.svc.error() ?? this.evidSvc.error() ?? this.auditSvc.error(),
  );

  protected readonly tabActive   = TAB_ACTIVE;
  protected readonly tabInactive = TAB_INACTIVE;

  private readonly _comments = signal<ReviewCommentDto[]>([]);
  protected readonly comments = computed(() => {
    return this._comments()
  });
  protected addingComments = signal<ReviewCommentDto[]>([]);
  
  readonly tabData = computed<ReviewDetailTabData[]>(() => {
    const d = this.reviewDetail();
    if (!d) return [];
    const cats = [...new Set(d.reviewMetrics.map((m: MetricRow) => m.categoryCode))];
    return [
      ...cats.map(code => {
        const catMetrics = d.reviewMetrics.filter((m: MetricRow) => m.categoryCode === code);
        return {
          id:         code,
          label:      code,
          code,
          evUploaded: catMetrics.reduce((s, m) => s + m.evidenceUploadCount, 0),
          evRequired: catMetrics.reduce((s, m) => s + (m.evidenceCount || 0), 0),
          // hasPending: catMetrics.some(m => m.evidenceFiles.some(f => f.status === 'pending')),
          hasPending: false,
          badgeClass: CATEGORY_BADGE_COLORS[code] ?? 'bg-muted text-muted-foreground',
        };
      }),
      {
        id:         'approval',
        label:      'Approval & Comments',
        code:       'approval',
        evUploaded: 0,
        evRequired: 0,
        hasPending: false,
        badgeClass: '',
      },
    ];
  });

  reloadReviewComments(): void {
    const userId = this.authStateService.getCurrentUserId() || 0;
    this.svc.getReviewByReviewId({reviewId: this.numericId().toString(), userId, stageId: this.stageId()})
      .pipe(take(1))
      .subscribe(review => {
        if (review && review.comments) {
          // this._reviewDetail.set(review);
          this._comments.set(this.mapComments(review?.comments ?? []));
        }
      });
  }

  readonly activeTab = linkedSignal(() => this.tabData()[0]?.id ?? 'approval');

  expandedMetrics = signal(new Set<string>());

  readonly activeMetrics = computed(() => {
    const d = this.reviewDetail();
    if (!d) return [];
    return d.reviewMetrics.filter((m: MetricRow) => m.categoryCode === this.activeTab());
  });

  readonly pendingApprovalCount = computed(() => {
    const item = this.reviewItem();
    if (!item) return 0;
    const keys: (keyof ReviewItem)[] = ['pmStatus', 'reviewerStatus', 'leadStatus', 'finalStatus'];
    return keys.filter(k => item[k] === 'Pending').length;
  });

  protected setActiveTab(val: string | number): void {
    this.activeTab.set(String(val));
  }

  toggleExpand(metricCode: string): void {
    this.expandedMetrics.update(s => {
      const n = new Set(s);
      n.has(metricCode) ? n.delete(metricCode) : n.add(metricCode);
      return n;
    });
  }

  expandAllInCategory(category: string): void {
    const codes      = this.metricsForCategory(category).map(m => m.metricCode);
    const allExpanded = codes.length > 0 && codes.every(c => this.expandedMetrics().has(c));
    this.expandedMetrics.update(s => {
      const n = new Set(s);
      if (allExpanded) {
        codes.forEach(c => n.delete(c));
      } else {
        codes.forEach(c => n.add(c));
      }
      return n;
    });
  }

  protected metricsForCategory(category: string): MetricRow[] {
    return this.reviewDetail()?.reviewMetrics.filter((m: MetricRow) => m.categoryCode === category) ?? [];
  }

  protected allExpandedForCategory(category: string): boolean {
    const codes = this.metricsForCategory(category).map(m => m.metricCode);
    return codes.length > 0 && codes.every(c => this.expandedMetrics().has(c));
  }

  protected onApprove(stepId: ApprovalStepId): void  { this.svc.updateApprovalStep(this.numericId(), stepId, 'approved'); }
  protected onReject(stepId: ApprovalStepId): void   { this.svc.updateApprovalStep(this.numericId(), stepId, 'rejected'); }
  protected onRecycle(stepId: ApprovalStepId): void  { this.svc.updateApprovalStep(this.numericId(), stepId, 'recycled'); }
  
  readonly aiProcessingCodes = signal(new Set<string>());

  protected onAiProcess(topLevelMetricCode: string): void {
    const subCodes = this.metricsForCategory(this.activeTab())
      .filter(m => m.parentCode === topLevelMetricCode)
      .map(m => m.metricCode);
    if (!subCodes.length) return;

    this.aiProcessingCodes.update(s => new Set([...s, topLevelMetricCode]));
    this.aiSvc.enqueue(String(this.id()), subCodes)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next:  () => this.aiProcessingCodes.update(s => { const n = new Set(s); n.delete(topLevelMetricCode); return n; }),
        error: () => this.aiProcessingCodes.update(s => { const n = new Set(s); n.delete(topLevelMetricCode); return n; }),
      });
  }

  protected onReportedValueChange(metricCode: string, value: string): void {
    this.svc.updateReportedValue(this.numericId(), metricCode, value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }
 
  protected onDrag($event: any) {

    console.log("On Drag", $event)
  }

  protected uploadClickWithoutFileCounter = 0;
  protected uploadDataCollectionFile(file: File | undefined): void {
    if (!file) {
      this.uploadClickWithoutFileCounter++;
      if (this.uploadClickWithoutFileCounter >= 3) {
        this.toastService.error('No file selected for upload');
        this.uploadClickWithoutFileCounter = 0;
      }
      return;
    }
    this.uploadingDataCollectionFile.set(true);
    this.svc.uploadDataCollectionExcel(this.numericId(), file, this.getUserId())
    .pipe(take(1))
    .subscribe({
      next:  (res) => {
          this.uploadingDataCollectionFile.set(false);
          this.dataCollectionFile = null;
          // this.reloadReviewComments();
          
          if (res.success) {
            this.isUploadFileDialogOpen.set(false);
            this.refreshReviewMetricsData.set(!this.refreshReviewMetricsData());
            this.toastService.success(res.message || "Data collection file uploaded successfully");
          }
          else {
            this.toastService.error(res.message || "Failed to upload data collection file. Please try again");
          }


          
        },
        error: () => {
          this.uploadingDataCollectionFile.set(false);
          this.toastService.error('Failed to upload data collection file. Please try again');
          // this.dataCollectionFile = null;
        },
      });
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
  
  protected onHeaderAction(_action: ReviewHeaderAction, uploadDataCollectionFileInput?: HTMLInputElement): void {
    
    if (_action === ReviewHeaderAction.UploadExcel) {
      this.isUploadFileDialogOpen.set(true);
    } 

    if (_action === ReviewHeaderAction.AddComment) {
      this.isCommentsPanelOpen.set(true);
    } 

    if (_action === ReviewHeaderAction.EditMetrics) {
      this.reviewMetricConfigPageSvc.setReviewDetail(this.reviewDetail());
      this.router.navigate(['/reviews/metric-config', this.id()], <NavigationExtras>{ queryParams: { stage: this.stageId() } });
    }  

    if (_action === ReviewHeaderAction.StartRestatement) {
      this.issuingRestatement.set(true);

      const userId = this.getUserId();
      this.toastService.info('Issuing restatement for the review, please wait');
      
      const input: StartEndRestatementDto = {
        ReviewId: this.numericId(),
        UserId: userId ?? 0,
        Comment: "",
        Start: true,
        Metrics: []
      }
      this.svc.issueRestatementForReview(input).pipe(take(1)).subscribe(res => {
        this.toastService.success('Issuing restatement successful');
        this.restatementModeActive.set(true);
      },
      () => {
        this.toastService.error('Failed to issue restatement');
        this.restatementModeActive.set(false);
      });

    } 
    if (_action === ReviewHeaderAction.EndRestatement) {
      this.openConfirmationModal("Confirm Restatement", "Please enter comment for the restatement", true);
      this.confirmationModalSubscription.unsubscribe();
      this.confirmationModalSubscription = this.confirmationModalAction.subscribe(() => {
        if (!this.confirmationModalComment) {
          this.toastService.error('Comment is required for Restatement');
          return;
        }
        
        const userId = this.getUserId();
        this.confirmationModalSubscription.unsubscribe();
        this.confirmLoader.set(true);

        const baselineRawValueUpdateInput: UpdateReviewMetricsValuesDto[] = Array.from(this.baselineRawValueForMetricIds_RS.values());

        console.log({ baselineRawValueUpdateInput });
        if (userId) {
          this.svc.updateBaselineOrRawValueForMetric(String(this.numericId()), baselineRawValueUpdateInput, userId)
          .pipe(
            mergeMap(() => {
              
              const input: StartEndRestatementDto = {    
                ReviewId: this.numericId(),
                UserId: userId ?? 0,
                Comment: this.confirmationModalComment,
                Start: false,
                Metrics: []
              };

              for (const metric of baselineRawValueUpdateInput) {
                input.Metrics.push({
                  MetricId: metric.MetricId,
                  // MetricCode:   metric.MetricCode
                });
              }

              return this.svc.issueRestatementForReview(input).pipe(take(1));
            }),
            take(1)
          )
          .subscribe(res => {
            this.closeConfirmationModal();
            this.toastService.success('Restatement concluded, changes applied');
          })
        }

        this.restatementModeActive.set(false);
      });
      // this.restatementModeActive.set(false);
    }

    if (_action === ReviewHeaderAction.GoBack) {
      this.goBack();
    }
  }


  protected onAddComment($event: { body: string; mentionedUsers: number[] }): void         { 
    const userId = this.getUserId();
    const { body, mentionedUsers } = $event;
    if (userId) {
      this.addingComments.set([
         { 
          reviewCommentId: 0,
          reviewId: this.numericId(),
          authorUserId: userId,
          authorName: this.currentUserSVC.loggedInUser?.displayName ?? '',
          // role,
          body,
          createdUtc: new Date().toISOString(),
          createdOnUtc: new Date().toISOString(),
          createdBy: userId,
          isActive: 1
        },
        ...this.addingComments()
      ]);
      this.svc.addComment(this.numericId(), body, mentionedUsers , this.stageId(), userId)
      .pipe(take(1))
      .subscribe(res => {
        if (!res.data) {
          // this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Unable to add comment, some error occured' });
        }
        
        this.reloadReviewComments();
        this.addingComments.set([]);
      },
      () => {
        this.addingComments.set([]);
      });
    }

    else {
      this.toastService.error('Unable to add comment. User ID not found.');
    }
  }

  formatTime(date: Date) {
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const day = date.getUTCDate().toString().padStart(2, '0');
    const month = monthNames[date.getMonth()];
    const years = date.getFullYear().toString().substring(2, 4);
    const hours = date.getHours() > 12 ? (date.getHours() - 12).toString().padStart(2, '0') : date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
    return `${day} ${month} ${years} ${hours}:${minutes} ${ampm}`;
  }

  mapComments(comments: ReviewCommentDto[]): ReviewCommentDto[] {
    const result: ReviewCommentDto[] = [];

    for (const comment of comments) {
      comment.createdOnUtc = new Date(comment.createdOnUtc).toLocaleString() + " UTC";
      comment.createdOnUtc = this.formatTime(new Date(comment.createdOnUtc));

      result.push(comment);
    }

    return result;
  }

  openConfirmationModal(heading: string, text: string, showConfirmationModalComment: boolean = false, forceConfirmation = false) {
    this.confirmationModalHeaderText.set(heading);
    this.confirmationModalText.set(text);
    this.showConfirmationModalComment.set(showConfirmationModalComment);
    this.confirmationModalOpen.set(true);
    this.confirmationModalShowCancelButton.set(forceConfirmation ? false : true);
  }

  closeConfirmationModal(): void {
    this.confirmLoader.set(false);
    this.confirmationModalSubscription.unsubscribe();
    this.confirmationModalOpen.set(false);
    this.confirmationModalShowCancelButton.set(true);
  }

  confirmActionFromModal(): void {
    this.confirmationModalAction.next();
  }

  private confirmationModalSubscription: Subscription = new Subscription();
  reviewMetricByIdAction($event: ReviewMetricsByIdAction) {
    if ($event.actionName == ReviewMetricsByIdActionNames.Recall) {
      const userId = this.getUserId();
      this.openConfirmationModal('Recall Review Metric', `Please add comment to recall this review for the metric ${$event.metricCode} ?`, true);

      this.confirmationModalSubscription.unsubscribe();
      this.confirmationModalSubscription = this.confirmationModalAction.subscribe(() => {
        if (!this.confirmationModalComment) {
          this.toastService.error('Comment is required to recall the review metric');
          return;
        }

        this.confirmationModalSubscription.unsubscribe();
        this.confirmLoader.set(true);

        if (userId && $event.metricCode) {
          const input: RecallTopLevelMetricInput = {
            TopLevelMetricCode: $event.metricCode,
            ReviewId: +($event.reviewId || this.numericId()),
            Recallcomment: this.confirmationModalComment,
            UserId: userId,
          };

          this.svc.recallTopLevelMetric(input)
          .pipe(take(1))
          .subscribe(() => {
            this.confirmLoader.set(false);
            this.toastService.success('Review metric' + $event.metricCode + ' recalled successfully');
          },
          () => {
            this.confirmLoader.set(false);
            this.toastService.error('Failed to recall review metric ' + $event.metricCode);
          })
          ;
        }
      });
    }

    if ($event.actionName == ReviewMetricsByIdActionNames.GoBack) {
      this.goBack();
    }
  } 

  goBack(): void {
    const reviewDetail = this.reviewDetail();
    const entrySource = this.entrySource() || ReviewDetailPageFromSource.queue;
    if (entrySource == ReviewDetailPageFromSource.queue) {
      if (reviewDetail?.stage) {
        const stage = reviewDetail?.stage;
        this.router.navigate(['workflow/reviewTasks'], { queryParams: { status: stage } });
        return;
      }
    }
    
    if (entrySource == ReviewDetailPageFromSource.categoryapproval) {
      if (this.fromCatCode() && this.fromPeriodCode() && this.fromRole()) {
        this.router.navigate(['reviews/1/1'], { queryParams: { catCode: this.fromCatCode(), periodCode: this.fromPeriodCode(), role: this.fromRole() } });
        return;
      }
    }
      
    // this.router.navigate(['workflow/reviewTasks']);
  }

  baselineRawValueForMetricIds_RSUpdated($event: Map<number, UpdateReviewMetricsValuesDto > ) {
    
    
    this.baselineRawValueForMetricIds_RS = $event;
  }
  
}