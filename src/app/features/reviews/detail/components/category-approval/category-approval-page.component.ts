import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import {
  LucideAngularModule, LucideIconProvider, LUCIDE_ICONS,
  SendHorizontal, ChevronDown, ChevronRight,
  LoaderCircle,
  Ban,
} from 'lucide-angular';
import { BadgeComponent } from '../../../../../shared/ui/badge/badge.component';
import { ModalComponent } from '../../../../../shared/ui/modal/modal.component';
import { BreadcrumbComponent, BreadcrumbItemComponent } from '../../../../../shared/ui/breadcrumb/breadcrumb.component';
import { ReviewService } from '../../../services/review.service';
import { MetricService } from '../../../../admin/services/metric.service';
import { ApprovalStage, ProjectLevelAggregationDto, ReviewMetricApproveRejectDto, ReviewPageRole, TopLevelMetricAggregationDto } from '../../../models/review.model';
import { LookupService } from '../../../../../core/services/lookup-service';
import { FormsModule } from '@angular/forms';
import { AuthorizationService, LoginContext } from '../../../../../core/auth';
import { ToastService } from '../../../../../shared/ui/toast/toast.service';
import { NotificationService } from '../../../../../core/services/notification.service';
import { NotificationMessageDto } from '../../../../../core/models/notification.model';
import { ReviewStageLookup } from '../../../../../core/models/lookup-model';
import { ReviewDetailPageFromSource } from '../../containers/review-detail.model';
import { CategoryApprovalPageActionKey, CategoryApprovalPageKey } from './category-approval.model';


function parseNumeric(val: string): number {
  const n = parseFloat(val.replace(/,/g, ''));
  return isNaN(n) ? 0 : n;
}

function formatNum(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

@Component({
  selector: 'app-category-approval-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, LucideAngularModule, BadgeComponent, ModalComponent, BreadcrumbComponent, BreadcrumbItemComponent],
  providers: [
    { provide: LUCIDE_ICONS, multi: true,
      useValue: new LucideIconProvider({ SendHorizontal, ChevronDown, ChevronRight, LoaderCircle, Ban }) },
  ],
  templateUrl: './category-approval-page.component.html',
})
export class CategoryApprovalPageComponent {
  private readonly route     = inject(ActivatedRoute);
  private readonly router    = inject(Router);
  private readonly lookupSvc    = inject(LookupService);
  private readonly metricSvc = inject(MetricService);
  private readonly authSvc        = inject(AuthorizationService);
  private readonly reviewSvc = inject(ReviewService);
  private readonly notificationSvc = inject(NotificationService);
  private readonly toastSvc = inject(ToastService);

  readonly catCode = toSignal(
    this.route.queryParamMap.pipe(map(p => {
      return p.get('catCode') ?? ''
    })),
    { initialValue: '' },
  );

  readonly role = toSignal(
    this.route.queryParamMap.pipe(map(p => p.get('role') as string | null)),
    { initialValue: null as string | null },
  );
  readonly period = toSignal(
    this.route.queryParamMap.pipe(map(p => p.get('periodCode') ?? '')),
    { initialValue: '' },
  ); 

  readonly category = computed(() => 'CV'); //TODO: Replace with real value 

  readonly topMetrics = signal<TopLevelMetricAggregationDto[]>([]);
  readonly projectMetrics = signal<ProjectLevelAggregationDto[]>([]);
  
  readonly isAdmin            = computed(() => (this.role() || '').toLowerCase() == ReviewPageRole.Admin);
  readonly isSeniorLeadership = computed(() => (this.role() || '').toLowerCase() == ReviewPageRole.SeniorLeadership);

  readonly pushConfirmed = signal(false);

  protected readonly catBadgeClass = signal<string>('');
  protected readonly categoryName = signal<string>('');

  protected loadingTopLevelAggregatedData = signal<boolean>(false);
  protected loadingProjectAggregatedData = signal<boolean>(false);
  readonly fmt = formatNum;

  protected pageActionPermissions = signal<{ [actionKey: string]: boolean }>({});
  protected readonly categoryApprovalPageActionKey = CategoryApprovalPageActionKey;

  protected readonly selectedItems = signal< { title: string; parentCode: string; pin: string; }[]>([]);
  protected approvalRejectionInProgress = signal(false);

  protected rejectionComment = ('');
  protected approvalComment = ('');
  constructor() {
    effect(() => {
      const catCode = this.catCode();
      const period = this.period();

      this.loadReviewStages();
      this.loadTopLevelAggregatedData(catCode, period);
    });

    // updating selected count
    effect(() => {
      this.topMetrics();
      const allTopMetrics = this.topMetrics();

      const selectedItems: { title: string; parentCode: string; pin: string }[] = [];
      console.log('Updating selected count, allTopMetrics:', allTopMetrics);
      let count = 0;
      for (const metric of allTopMetrics) { 
        for (const project of (metric.projects || [])) {
          if (project.selected) {
            selectedItems.push({ title: project.title || '', parentCode: metric.parentCode || '', pin: project.pin || '' });
            count++;
          }
        }
      }

      this.selectedCount.set(count);
      this.selectedItems.set(selectedItems);

    })
  }

  ngOnInit(): void {
    this.getPageActions();
  }

  getPageActions(): void {
    const userId = this.getUserId();

    if (!userId) {
      return;
    }

    this.authSvc.getActionAccess(CategoryApprovalPageKey, userId)
    .pipe(
      take(1)
    )
    .subscribe(res => {
      const pageActionPermissions: { [actionKey: string]: boolean } = {};
      
      for (const actionItem of res.data) {
        pageActionPermissions[actionItem.key] = actionItem.value;
      }

      this.pageActionPermissions.set(pageActionPermissions);
    })
  }

  syncTopLevelAndProjectsAggregations(): void {
    const topMetrics = this.topMetrics();
    const projectMetrics = this.projectMetrics();
    if (!topMetrics?.length) {
      return;
    }

    if (!projectMetrics?.length) {
      return;
    }

    const projectMetricMap = new Map<string, ProjectLevelAggregationDto[]>();
    for (const projectMetric of projectMetrics) {
      const parentCode = projectMetric.parentCode;
      if (!parentCode) {
        continue;
      }

      if (!projectMetricMap.has(parentCode)) {
        projectMetricMap.set(parentCode, []);
      }
      projectMetricMap.get(parentCode)!.push(projectMetric);
    }

    for (const topMetric of topMetrics) {
      const parentCode = topMetric.parentCode;
      
      if (!parentCode) {
        continue;
      }

      if (projectMetricMap.has(parentCode)) {
        topMetric.projects = projectMetricMap.get(parentCode) || [];
      }
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

  onPushToSeniorLeadership(): void {
    this.approvalRejectionInProgress.set(true);
    
    // call function here
    const projectPinParentCodes = this.getProjectPinParentCodes(false);
    const reviewMetricApproveRejectDto: ReviewMetricApproveRejectDto[] = [];
    
    for (const projectPinParentCode of projectPinParentCodes) {
      if (!projectPinParentCode.ReviewId) {
        continue;
      }

      reviewMetricApproveRejectDto.push({
        ReviewId: projectPinParentCode.ReviewId,
        MetricCode: projectPinParentCode.ParentCode,
        Role: 'admin',
        Decision: 'approved'
      });

    }
    console.log({ reviewMetricApproveRejectDto })

    const userId = this.getUserId();
    this.reviewSvc.takeReviewMetricActionForTopLevel(reviewMetricApproveRejectDto, (userId || 0))
    .pipe(
      take(1)
    )
    .subscribe(() => {
      // for notification
      const request: NotificationMessageDto = {
        NotificationType: 'AdminL4Approval',
        ReviewIds: '',
        ReviewMetrics: JSON.stringify(reviewMetricApproveRejectDto)
      }
      this.notificationSvc.publishNotification(request).pipe(take(1)).subscribe(res => console.log("Published notification to service bus, response: ", res));


      this.approvalRejectionInProgress.set(false);

      this.toastSvc.success('Successfully pushed to Senior Leadership');
      this.pushConfirmed.set(true);

      this.goToTaskListPage();
    });

    /* 
      this.reviewSvc.getReviewMetricCodesForAdminOrL4Approval(this.catCode(), this.period(), projectPinParentCodes).pipe(take(1)).subscribe(reviewMetricList => {
        console.log({ reviewMetricList })
        this.approvalRejectionInProgress.set(false); // this should be called when the ApproveReject api gives response

        const reviewMetricApproveRejectDto: ReviewMetricApproveRejectDto[] = [];

        for (const reviewMetricElem of reviewMetricList) {
          reviewMetricApproveRejectDto.push({
            ReviewId: reviewMetricElem.reviewId,
            MetricCode: reviewMetricElem.metricCode,
            Decision: 'Approved',
          });
        }
        console.log({ reviewMetricApproveRejectDto })
      })

    */

    // const input: ReviewMetricApproveRejectDto = new ReviewMetricApproveRejectDto();
    // this.reviewSvc.takeReviewMetricActionForTopLevel(input);
    // this.pushConfirmed.set(true);
  }
 

  protected goToReview(review: ProjectLevelAggregationDto): void {
    if (!review.reviewId) return;
    // alert("Navigating to review with pin: " + pin);
    let role = this.role();
    let stageName = "";
    switch (role) {
      case ReviewPageRole.Admin: 
        stageName = 'Admin';
        break;
      case ReviewPageRole.SeniorLeadership: 
        stageName = 'L4';
        break;      
    }
    const status = this.getStageCodeForRole();

    const from = ReviewDetailPageFromSource.categoryapproval;
    const fromCatCode = this.catCode();
    const fromPeriodCode = this.period();
    const fromRole = this.role();

    this.router.navigate(['/reviews', review.reviewId, status], { queryParams: {  from, fromCatCode, fromPeriodCode, fromRole } });

    // this.router.navigate(['/admin/projects-new', review.impactMasterId], {
    //   queryParams: {
    //     recordTypeId: review.recordTypeId,
    //   },
    // });
  }

  /** Cards start collapsed; a code enters this set once the user expands it. */
  readonly expandedMetrics = signal<Set<string>>(new Set());

  protected isCardCollapsed(code?: string): boolean {
    if (!code) return true;
    return !this.expandedMetrics().has(code);
  }

  protected toggleCard(code?: string): void {
    if (!code) return;

    this.expandedMetrics.update(set => {
      const next = new Set(set);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });
  }  

  protected selectedCount = signal<number>(0);   
  readonly pendingDecision = signal<'approve' | 'reject' | null>(null);

  protected openDecisionModal(decision: 'approve' | 'reject'): void {
    if (this.selectedCount() === 0) return;
    this.pendingDecision.set(decision);
  }

  protected confirmDecision(): void {
    const decision = this.pendingDecision();
    if (!decision) {
      this.toastSvc.error('No decision selected');
      return;
    }


    this.approvalRejectionInProgress.set(true);
    // call function here
    const projectPinParentCodes = this.getProjectPinParentCodes(true);
    const reviewMetricApproveRejectDto: ReviewMetricApproveRejectDto[] = [];
    
    for (const projectPinParentCode of projectPinParentCodes) {
      if (!projectPinParentCode.ReviewId) {
        continue;
      }

      reviewMetricApproveRejectDto.push({
        ReviewId: projectPinParentCode.ReviewId,
        MetricCode: projectPinParentCode.ParentCode,
        Comment: decision === 'approve' ? this.approvalComment : this.rejectionComment,
        Decision: decision === 'approve' ? 'Approved' : 'Rejected',
        Role: 'seniorleadership',
      });

    }
    console.log({ reviewMetricApproveRejectDto })

    const userId = this.getUserId();
    this.reviewSvc.takeReviewMetricActionForTopLevel(reviewMetricApproveRejectDto, (userId || 0))
    .pipe(
      take(1)
    )
    .subscribe(() => {
      this.approvalRejectionInProgress.set(false);

      this.toastSvc.success('Successfully ' + (decision === 'approve' ? 'approved' : 'rejected') + ' the top level metrics for selected projects');
      this.pendingDecision.set(null);
      this.loadTopLevelAggregatedData(this.catCode(), this.period());
      this.pushConfirmed.set(true);

      this.goToTaskListPage();
    });

    /*
        this.reviewSvc.getReviewMetricCodesForAdminOrL4Approval(this.catCode(), this.period(), projectPinParentCodes).pipe(take(1)).subscribe(reviewMetricList => {
          console.log({ reviewMetricList })
          this.approvalRejectionInProgress.set(false); // this should be called when the ApproveReject api gives response
          
          const reviewMetricApproveRejectDto: ReviewMetricApproveRejectDto[] = [];

          const selectedMap: Map<string, boolean> = new Map<string, boolean>();
        
          const allTopMetrics = this.topMetrics();
          
          for (const topMetric of allTopMetrics) {
            for (const project of (topMetric.projects || [])) {
              selectedMap.set(project.parentCode || "", (topMetric.selected ? true : false));
            }
          }

          for (const reviewMetricElem of reviewMetricList) {
            if (!selectedMap.get(reviewMetricElem.parentCode)) {
              continue;
            }
            reviewMetricApproveRejectDto.push({
              ReviewId: reviewMetricElem.reviewId,
              MetricCode: reviewMetricElem.metricCode,
              Decision: decision === 'approve' ? 'Approved' : 'Rejected',
            });
          }
          console.log({ reviewMetricApproveRejectDto })
        })
    */
    // const status: ApprovalStatus = decision === 'approve' ? 'Approved' : 'Rejected';
    // this.selectedKeys.set(new Set());
    // this.pendingDecision.set(null);
  }

  protected cancelDecision(): void {
    this.pendingDecision.set(null);
  }

  onToplevelCheckboxChange(toplevelMetric: TopLevelMetricAggregationDto): void {
    if (!toplevelMetric.parentCode) return;

    const allTopMetrics = this.topMetrics();
    for (const metric of allTopMetrics) {
      if (metric.parentCode === toplevelMetric.parentCode) {
        for (const project of (metric.projects || [])) {
          project.selected = toplevelMetric.selected;
        }
        
        break;
      }
    }
   
    this.topMetrics.set(JSON.parse(JSON.stringify(allTopMetrics)));
  
    this.updateRawAndAdjValueForToplevelMetrics();
  }

  updateRawAndAdjValueForToplevelMetrics(){
    const allTopMetrics = this.topMetrics();

    const topMetricTotalReported: { [metricCode: string]: number } = {  };
    const topMetricTotalRiskAdj: { [metricCode: string]: number } = {  };
    const topMetricTotalEvidenced: { [metricCode: string]: number } = {  };
    // recalculating
    for (const topMetric of allTopMetrics) {
      if (topMetric.parentCode && !topMetricTotalReported[topMetric.parentCode]) {
        topMetricTotalReported[topMetric.parentCode] = 0;
      }
      if (topMetric.parentCode && !topMetricTotalRiskAdj[topMetric.parentCode]) {
        topMetricTotalRiskAdj[topMetric.parentCode] = 0;
      }
      if (topMetric.parentCode && !topMetricTotalEvidenced[topMetric.parentCode]) {
        topMetricTotalEvidenced[topMetric.parentCode] = 0;
      }
      
      for (const project of (topMetric.projects || [])) {
        if (project.selected) {
          if (topMetric.parentCode) {
            topMetricTotalReported[topMetric.parentCode] += (project.rawValue || 0);
            topMetricTotalRiskAdj[topMetric.parentCode] += (project.adjustedValue || 0);
            topMetricTotalEvidenced[topMetric.parentCode] += (project.evidenced || 0);
          }
        }
      }
    }

    // setting the calculated one
    for (const topMetric of allTopMetrics) {
      if (!topMetric.parentCode) {
        continue;
      }
      topMetric.rawValue = topMetricTotalReported[topMetric.parentCode];
      topMetric.adjustedValue = topMetricTotalRiskAdj[topMetric.parentCode];
      topMetric.evidenced = topMetricTotalEvidenced[topMetric.parentCode];
    }
  
    this.topMetrics.set(JSON.parse(JSON.stringify(allTopMetrics)));
  }

  onProjectCheckboxChange(project: ProjectLevelAggregationDto): void {
    if (!project.parentCode) return;
    
    const allTopMetrics = this.topMetrics();

    this.updateRawAndAdjValueForToplevelMetrics();

    for (const metric of allTopMetrics) {
      if (metric.parentCode === project.parentCode) {
        // let allSelected = true;
         

        for (const project of (metric.projects || [])) {
          if (project.selected) {
            metric.selected = true; 
            this.topMetrics.set(JSON.parse(JSON.stringify(allTopMetrics)));
            return;
          }  
        }

        metric.selected = false;
        break;
      }
    }

    this.topMetrics.set(JSON.parse(JSON.stringify(allTopMetrics)));
 
  }

  getProjectPinParentCodes(onlySelected: boolean = false): { ReviewId?: number; ParentCode: string; }[] {
    const projectPinParentCodes: { ReviewId?: number; ParentCode: string; }[] = [];
    const allTopMetrics = this.topMetrics();

    for (const topMetric of allTopMetrics) {
      for (const project of (topMetric.projects || [])) {
        if (onlySelected && !project.selected) {
          continue;
        }


        if (!project.reviewId || !project.parentCode) {
          continue;
        }
        projectPinParentCodes.push({ ReviewId: project.reviewId,   ParentCode: project.parentCode });
      }
    }

    return projectPinParentCodes;
  }

  loadTopLevelAggregatedData(catCode: string, period: string) {
    const userId = this.getUserId();
    if (!userId) {
      return;
    }
    this.loadingTopLevelAggregatedData.set(true);
    this.reviewSvc.getAggregationForTopLevelMetric(catCode, period, this.role() || '', userId).pipe(take(1)).subscribe(rows => {
      this.topMetrics.set((rows || []).map(x =>({...x, selected: true })));

      this.loadingTopLevelAggregatedData.set(false);
      this.syncTopLevelAndProjectsAggregations();
    }, 
    () => {
      this.loadingTopLevelAggregatedData.set(false);
    });

    this.loadingProjectAggregatedData.set(true);
    this.reviewSvc.getAggregationForProjectMetric(catCode, period, this.role() || '', userId).pipe(take(1)).subscribe(rows => {
      this.loadingProjectAggregatedData.set(false);
      
      this.projectMetrics.set((rows || []).map(x => ({ ...x, selected: true })));
      this.topMetrics.set((this.topMetrics() || []).map(x => ({ ...x, selected: true })));
      this.syncTopLevelAndProjectsAggregations();
    },
    () => {
      this.loadingProjectAggregatedData.set(false);
    });

    this.lookupSvc.getMetricCategories().pipe(take(1)).subscribe(res => {
      const categories: any[] = res.data || [];
      for (const category of categories) {
        if (category.categoryCode === catCode) {
          this.catBadgeClass.set(category.color || '');
          this.categoryName.set(category.name || '');
          break;
        }
      }
    });
  }

  protected reviewStages = signal<ReviewStageLookup[]>([]);
  
  loadReviewStages(): void {
    this.lookupSvc.getReviewStages().pipe(take(1)).subscribe(res => {
      this.reviewStages.set(res.data);
    });
  }
  
  getStageCodeForRole(): string | undefined {
    let role = this.role();
    let stageName = "";
    switch (role) {
      case ReviewPageRole.Admin: 
        stageName = 'Admin';
        break;
      case ReviewPageRole.SeniorLeadership: 
        stageName = 'L4';
        break;      
    }
    const status = this.reviewStages().find(x => x.stageName?.toLowerCase() == stageName.toLowerCase())?.code;
    return status;
  }
  
  goToTaskListPage() {
    const status = this.getStageCodeForRole();
    this.router.navigate(['workflow/reviewTasks'], { queryParams: { status } });
    
  }

}
