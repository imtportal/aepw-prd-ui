import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule, LucideIconProvider, LUCIDE_ICONS,
  Rocket, Settings,
  LoaderCircle,
  Info,
  RotateCw,
  ChevronRight,
  ArrowRight,
  Check,
  CircleCheckBig,
  Trash,
  Ban
} from 'lucide-angular';
import { SearchInputComponent } from '../../../../shared/ui/search-input/search-input.component';
import { HasUnsavedChanges } from '../../../../core/guards/unsaved-changes.guard';
import { ProjectService } from '../../../admin/services/project.service';
import { ReviewService } from '../../services/review.service';
import { NewReviewsDto, ReviewDetailDto, ReviewDto } from '../../models/review.model';
import { BulkProject, MetricConfig, MetricDto, ProjectStatus } from '../../../admin/models/project.model';
import { SheetComponent } from '../../../../shared/ui/sheet/sheet.component';
import { CardComponent, CardContentComponent } from '../../../../shared/ui/card/card.component';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { SelectComponent } from '../../../../shared/ui/select/select.component';
import { Observable, Subscription, take, timer } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { LookupService } from '../../../../core/services/lookup-service';
import { PageLoadingService } from '../../../../core/services/page-loading.service';
import { StatusLookup } from '../../../../core/models/lookup-model';
import { ModalComponent } from '../../../../shared/ui/modal/modal.component';
import { AuthorizationService, LoginContext } from '../../../../core/auth';
import { BULK_LAUNCH_STATUS_COLORS } from '../bulk-launch.constant';
import { BulkLaunchActionKey, ReviewFilterLabels, ReviewFilterValue } from '../bulk-launch.model';
import { PeriodService } from '../../create/services/period.service';

type BulkProjectSortKey = 'pin' | 'title' | 'l1UserName' | 'programName' | 'statusName';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-bulk-launch-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule, LucideAngularModule,
    SheetComponent,
    CardComponent, CardContentComponent,
    BadgeComponent, SelectComponent,
    SearchInputComponent,
    ModalComponent
  ],
  providers: [
    { provide: LUCIDE_ICONS, multi: true,
      useValue: new LucideIconProvider({ Rocket, Settings, LoaderCircle, Info, RotateCw, ChevronRight, ArrowRight, Check, CircleCheckBig, Trash, Ban }) },
  ],
  templateUrl: './bulk-launch-page.component.html',
})
export class BulkLaunchPageComponent implements HasUnsavedChanges {
  private readonly pageLoadingService = inject(PageLoadingService);
  protected readonly router    = inject(Router);
  private  readonly projectSvc = inject(ProjectService);
  private  readonly reviewSvc  = inject(ReviewService);
  private  readonly lookupSvc  = inject(LookupService);
  private  readonly periodSvc  = inject(PeriodService);
  private  readonly toastSvc = inject(ToastService);
  private readonly authSvc        = inject(AuthorizationService);

  // readonly loading = this.reviewSvc.loading;
  readonly loading = signal<boolean>(false);
  readonly error   = this.reviewSvc.error;

  searchQuery     = signal('');
  filterStatus    = signal<'all' | ProjectStatus>('all');
  reviewStatus    = <ReviewFilterValue>(ReviewFilterValue.Pending);
  reviewFilterValue = ReviewFilterValue;
  reviewStatusOptions = signal<{ label: string; value: string; }[]>(Object.values(ReviewFilterValue).map((value) => {
    const label = ReviewFilterLabels[value];
    return ({ label, value })
  }));
  quarterStatusOptions = signal<{ label: string; value: string; isCurrent?: boolean }[]>([]);
  private readonly createdReviewIds = signal(new Set<number>());
  private readonly pendingImpactIds = signal(new Set<number>());
  readonly selectedImpactIds = computed(() =>
    this.reviewStatus === ReviewFilterValue.Created
      ? this.createdReviewIds()
      : this.pendingImpactIds(),
  );
  sheetOpen       = signal(false);
  configProjectId = signal<number | null>(null);

  private readonly debouncedQuery  = signal('');
  private readonly _configDetail   = signal<ReviewDto | null>(null);
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  readonly bulkProjects = this.projectSvc.bulkProjects;
  protected readonly bulkLaunchActionPermissions = signal<{ [key: string]: boolean }>({});

  protected bulkLaunchInProgress = signal<boolean>(false);
  protected bulkLaunchActionKey = BulkLaunchActionKey;
  

  protected metricsModalOpen = signal<boolean>(false);
  protected selectedImpactsModalOpen = signal<boolean>(false);
  protected launchConfirmationModalOpen = signal<boolean>(false);
  protected confirmationAction = signal<'launch' | 'delete'>('launch');
  protected showL1MetricsSerialNo = signal<string | null>(null);
  protected availableMetrics = computed(() => {

    const impacts = this.bulkProjects();

    for (const im of impacts) {
      if (im.metrics && (im.metrics.length > 0)) {
        return this.getMetricsForModal(im.metrics);
      }
    }

    return [];
  });

  readonly filteredProjects = computed(() => {
    const q      = this.debouncedQuery().toLowerCase();
    const status = this.filterStatus();
    return this.bulkProjects();
    // [].filter(p => {
    //   const matchesQ = !q
    //     || (p.impactMetricId)?.toString().includes(q)
    //     || (p.title)?.toLowerCase().includes(q)
    //     || (p.pmUserName)?.toLowerCase().includes(q);
    //   const matchesStatus = status === 'all' || p.statusName === status;
    //   return matchesQ && matchesStatus;
    // });
  });

  protected readonly sortKey = signal<BulkProjectSortKey | undefined>(undefined);
  protected readonly sortDir = signal<SortDirection | undefined>(undefined);

  readonly sortedProjects = computed(() => {
    const projects = [...this.filteredProjects()];
    const key = this.sortKey();
    const direction = this.sortDir();

    if (!key || !direction) {
      return projects;
    }

    return projects.sort((a, b) => {
      const valueA = a[key];
      const valueB = b[key];

      if (valueA == null && valueB == null) {
        return 0;
      }
      if (valueA == null) {
        return direction === 'asc' ? -1 : 1;
      }
      if (valueB == null) {
        return direction === 'asc' ? 1 : -1;
      }

      const comparison = valueA.localeCompare(valueB, undefined, {
        numeric: true,
        sensitivity: 'base',
      });
      return direction === 'asc' ? comparison : -comparison;
    });
  });

  protected toggleSort(key: BulkProjectSortKey): void {
    if (this.sortKey() === key) {
      if (this.sortDir() === 'asc') {
        this.sortDir.set('desc');
      } else {
        this.sortKey.set(undefined);
        this.sortDir.set(undefined);
      }
      return;
    }

    this.sortKey.set(key);
    this.sortDir.set('asc');
  }

  protected ariaSort(key: BulkProjectSortKey): 'ascending' | 'descending' | null {
    if (this.sortKey() !== key) {
      return null;
    }

    return this.sortDir() === 'asc' ? 'ascending' : 'descending';
  }

  readonly allSelected = computed(() => {
    const filteredProjects = this.filteredProjects();
    const selectedIds = this.selectedImpactIds();

    if (!filteredProjects?.length) {
      return false;
    }

    for (const project of filteredProjects) {
      const id = this.reviewStatus === ReviewFilterValue.Created
        ? +(project.reviewId || 0)
        : project.impactMasterId;

      if (this.reviewStatus == ReviewFilterValue.Created) {
        if (!selectedIds.has(id) && project.allowDeletion) {
          return false;
        } 
      }
      
      if (this.reviewStatus == ReviewFilterValue.Pending) {
        if (!selectedIds.has(id)) {
          return false;
        } 
      }
        
    }
    
    return true;
  });

  readonly configProject = computed(() =>
    this.bulkProjects().find(p => p.impactMasterId === this.configProjectId()) ?? null,
  );

  readonly configMetrics = computed(() => this._configDetail()?.reviewMetrics ?? []);

  readonly selectedTotalMetrics = computed(() => {
    // const all = this.bulkProjects();
    // return Array.from(this.selectedImpactIds()).reduce((sum, id) => {
    //   const p = all.find(proj => proj.impactMetricId === id);
    //   return sum + ((p?.metricConfig || []).filter(m => m.applicability !== 'NotVisible').length ?? 0);
    // }, 0);
    const allProjects = this.bulkProjects();

    for (const im of allProjects) {
      if (im.totalMetrics && !isNaN(im.totalMetrics)) {
        return im.totalMetrics;
      }
    }

    return 0;
  });

  protected statusOptions = signal([
    { label: 'All Statuses', value: 'all'       },
    // { label: 'Active',       value: 'Active'    },
    // { label: 'Paused',       value: 'Paused'    },
    // { label: 'Completed',    value: 'Completed' },
  ]);

  // enabledMetricCount(p: { metricConfig: MetricConfig[] }): number {
  //   return p.metricConfig.filter(m => m.applicability !== 'NotVisible').length;
  // }

  protected selectedImpacts = signal<BulkProject[]>([]);
  

  protected showSelectedImpactsTooltip = signal<boolean>(false);
  protected selectedQuarter : number | null = null;
  private loadBulkProjectsSubscription: Subscription = new Subscription();
  private loadBulkProjectsTimer: Subscription = new Subscription();
  protected currentPage = signal<number>(0);
  protected totalRows = signal<number>(0);
  protected pageCount = signal<number>(0);
  protected pageSizeOptions = [10, 20, 50] as const;
  constructor() {
    effect(() => {
      const selectedImpactIds = this.selectedImpactIds();
      const selectedProjects = this.reviewStatus === ReviewFilterValue.Created
        ? this.bulkProjects().filter(project => selectedImpactIds.has(+(project.reviewId || 0)))
        : this.projectSvc.selectedImpacts(Array.from(selectedImpactIds));

      this.selectedImpacts.set(selectedProjects);
    })
  }
  ngOnInit(): void {
    this.pageLoadingService.stop();
    this.loadBulkProjects();
    this.getStatusOptions();
    this.getQuarterOptions();
    this.getActionPermissions()
  }
  
  getStatusOptions(): void {
    this.lookupSvc.getStatusesByModule('IMPACT', 'BULKLAUNCH').pipe(take(1)).subscribe(response => {
      const options = response.data?.map(status => ({ label: status.statusName, value: status.statusCode })) ?? [];
      this.statusOptions.set([{ label: 'All Statuses', value: 'all' }, ...options ]);
    });
  }
  
  getQuarterOptions(): void {
    this.periodSvc.getReviewPeriods().pipe(take(1)).subscribe(response => {
      const options = (response || [])?.map(period => ({ label: period.label, value: period.value, isCurrent: period.isCurrent })) ?? [];
      this.quarterStatusOptions.set([ ...options ]);

      if (!this.selectedQuarter) {
        this.reviewPeriodAssignCurrent();
      }
    });
  }
  
  loadBulkProjects(showLoader: boolean = true): void {
    this.loadBulkProjectsSubscription.unsubscribe();
    if (showLoader) {
      this.loading.set(true);
    }
    let obs = this.projectSvc.loadBulkProjects(this.selectedQuarter, this.filterStatus(), this.searchQuery(), this.currentPage(), this.currentPage() * this.itemsPerPage(), this.itemsPerPage())
    
    if (this.reviewStatus == ReviewFilterValue.Created) {
      obs = <any> this.projectSvc.getImpactsWithActiveReviews(this.selectedQuarter, this.currentPage(), this.currentPage() * this.itemsPerPage(), this.itemsPerPage(), this.filterStatus(), this.searchQuery()) 
    }  
             
      
    this.loadBulkProjectsSubscription = (
      obs
    )
    .pipe(take(1)).subscribe(() => {

      for (const p of this.bulkProjects()) {
        if (p.metrics?.length) {
          let count = 1;
          for (const m of p.metrics) {
            if (!m.categoryCode) {
              continue;
            }

            if (this.categoryCodeIndex.has(m.categoryCode)) {
              continue;
            }
            this.categoryCodeIndex.set(m.categoryCode, count);
            count++;
          }
          
          break;
        }
      }

      const [ firstElem ] = this.bulkProjects();
      if (firstElem) {
        // this.currentPage.set(firstElem.pageNo || 0);
        this.totalRows.set(firstElem.totalRows || 0);
        this.pageCount.set(Math.ceil((firstElem.totalRows || 0) / (firstElem.itemsPerPage || this.itemsPerPage())));
      }
      this.loading.set(false);
    },
    () => {
      this.loading.set(false);
    });
  }

  hasUnsavedChanges(): boolean {
    return this.selectedImpactIds().size > 0;
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);

    this.filtersChanged();
  }

  filtersChanged(): void {
    this.loadBulkProjectsTimer.unsubscribe();
    
    this.currentPage.set(0);

    this.loadBulkProjectsTimer = timer(1000).subscribe(() => {
      this.loadBulkProjects(true);
    })
  }

  toggleSelect(id: number): void {
    const selectedIds = this.reviewStatus === ReviewFilterValue.Created
      ? this.createdReviewIds
      : this.pendingImpactIds;

    selectedIds.update(s => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return (n);
    });
  }

  toggleCheckbox(event: Event, id: number): void {
    event.preventDefault();
    event.stopPropagation();
    this.toggleSelect(id);
  }

  toggleRowSelection(project: BulkProject): void {
    const id = this.reviewStatus === ReviewFilterValue.Created
      ? +(project.reviewId || 0)
      : project.impactMasterId;

    this.toggleSelect(id);
  }

  isProjectSelected(project: BulkProject): boolean {
    const id = this.reviewStatus === ReviewFilterValue.Created
      ? +(project.reviewId || 0)
      : project.impactMasterId;

    return this.selectedImpactIds().has(id);
  }

  toggleSelectAll($event: Event): void {
    const selectedIds = this.reviewStatus === ReviewFilterValue.Created
      ? this.createdReviewIds
      : this.pendingImpactIds;
    const existingSelectedIds = selectedIds();
    const filteredProjects = this.filteredProjects();
    if (($event.target as any).checked) {
      for (const project of filteredProjects) {

        // patch for Deletion check

        if (this.reviewStatus === ReviewFilterValue.Created) {
          if (project.reviewId && !project.allowDeletion) {
            continue;
          }
        }

        existingSelectedIds.add(this.reviewStatus === ReviewFilterValue.Created
          ? +(project.reviewId || 0)
          : project.impactMasterId);
      } 
    } else {
      for (const project of filteredProjects) {
        existingSelectedIds.delete(this.reviewStatus === ReviewFilterValue.Created
          ? +(project.reviewId || 0)
          : project.impactMasterId);
      } 
    }

    selectedIds.set(new Set(existingSelectedIds));
  }

  fireServiceBus(): void {
    // public string NotificationType { get; set; } = default!;
    // public long EntityId { get; set; }
    // public long DocumentId { get; set; }

    // this.reviewSvc.fireServiceBus({
    //   NotificationType: 1,
    //   EntityId: 1,
    //   DocumentId: 1,

    // });

  }

  openConfig(projectId: number): void {
    this.configProjectId.set(projectId);
    this._configDetail.set(null);
    this.reviewSvc.getReviewDetail(projectId).subscribe(res => {
      this._configDetail.set(res.data ?? null);
    });
    this.sheetOpen.set(true);
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

  onLaunch(): void {
    this.closeLaunchModal();
    this.toastSvc.info('Bulk Launch in progress...');
    
    const failureHandler = (): void => {
      this.resetSelectedImpactIds();
      this.bulkLaunchInProgress.set(false);
      this.toastSvc.toasts.set([]);
      this.toastSvc.error('Unable to launch. Please try again');
    }
    this.bulkLaunchInProgress.set(true);
    const ids = Array.from(this.selectedImpactIds());

   const userId = this.getUserId();

    this.reviewSvc.bulkLaunch(ids, userId ?? 0, String(this.selectedQuarter))
    .pipe(take(1))
    .subscribe(res => { 
      if (res.data) {
        this.bulkLaunchInProgress.set(false);
        this.resetSelectedImpactIds();
        
        this.toastSvc.toasts.set([]);
        this.toastSvc.success('Bulk Launch successful');
        
        this.loadBulkProjects();
        const newReviewsResult: NewReviewsDto[] = res.data;
        const newReviews: NewReviewsDto[] = [];

        for (const newReview of (newReviewsResult || [])) {
          if (!newReview.reviewId) {
            continue;
          }

          newReviews.push(newReview);
        }

        const userId = this.getUserId();

        if (userId) {
          this.reviewSvc.generateExcelAndSendNotification(newReviews, <number> userId).pipe(take(1)).subscribe((res) => {
            console.log('Excel generation and notification sending response', res);
          },
          (err) => {
            console.log("generateExcelAndSendNotification error:", err)

            const reviewIds = newReviews.map(x => x.reviewId);
            this.toastSvc.error("Internal error: the " + (reviewIds.length > 1 ? "reviews" : "review") + " could not be launched - reviews have been made Pending again");
            this.reviewSvc.deleteReviewByIds(reviewIds, userId || 0)
            .pipe(take(1))
            .subscribe(res => { 
              this.loadBulkProjects();
              console.log("Deleted review id transactions: " , reviewIds) 
            });
          });
        }
      }

      else {
        failureHandler();
      }
    },
    failureHandler);
    // this.router.navigate(['/reviews']);
  }

  getStatusColor(statusName?: string) {
    switch (statusName) { 
      case 'Active':
        return 'rgb(220 252 231 / var(--tw-bg-opacity, 1))';
      // case 'Paused':
      //   return 'hsl(var(--aepw-yellow))'; 
      default: 
        return null;
    }
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.filterStatus.set('all');
    // this.selectedQuarter = null;

    const quarterStatusOptions = this.quarterStatusOptions();

    for (const periodOption of quarterStatusOptions) {
      if (periodOption.isCurrent) {
        this.selectedQuarter = +periodOption.value
        break;
      }
    }

    this.loadBulkProjects(true);
  }
  readonly CATEGORY_COLORS: Record<number, string> = {
    1: 'rounded px-2 py-0.5 text-xs font-bold bg-[hsl(var(--aepw-blue))] text-[hsl(var(--primary-foreground))]',
    2: 'rounded px-2 py-0.5 text-xs font-bold bg-[hsl(var(--aepw-green))] text-[hsl(var(--accent-foreground))]',
    3: 'rounded px-2 py-0.5 text-xs font-bold bg-[hsl(var(--aepw-accent-green))] text-[hsl(var(--aepw-dark-grey))]',
    4: 'rounded px-2 py-0.5 text-xs font-bold bg-[hsl(var(--aepw-orange))] text-[hsl(var(--destructive-foreground))]',
    5: 'rounded px-2 py-0.5 text-xs font-bold bg-[hsl(var(--aepw-light-blue))] text-[hsl(var(--aepw-dark-grey))]',
  };
  showHideMetricsModal(open: boolean): void {
    this.metricsModalOpen.set(open);
  }
  showHideSelectedImpactsModal(open: boolean): void {
    this.selectedImpactsModalOpen.set(open);
  }

  private categoryCodeIndex: Map<string, number> = new Map();

  categoryColor(cat: string): string {
    const index = this.categoryCodeIndex.get(cat);
    
    return index && this.CATEGORY_COLORS[index] ? this.CATEGORY_COLORS[index] : 'rounded px-2 py-0.5 text-xs font-bold bg-muted text-muted-foreground';
  }

  getMetricsForModal(metrics: MetricDto[]): { topLevelMetric: MetricDto; childMetrics: MetricDto[] }[] {
    // const impacts = this.bulkProjects();

    const result: { topLevelMetric: MetricDto; childMetrics: MetricDto[] }[] = [];

    const parentChildMap: Map<string, {topLevelMetric: MetricDto; childMetrics: MetricDto[]}> = new Map();

    for (const metric of metrics) {
      if (metric.isTopLevel) {
        if (!parentChildMap.has(metric.metricId)) {
          parentChildMap.set(metric.metricId, { topLevelMetric: metric, childMetrics: [] });
        }
      }
    }

    for (const metric of metrics) {
      if (metric.isTopLevel) { 
        continue;
      }

      if (!metric.parentMetricId) {
        continue;
      }

      const existingChildMetrics = parentChildMap.get(metric.parentMetricId)?.childMetrics || [];

      existingChildMetrics.push(metric);

      const existingParentRecord = parentChildMap.get(metric.parentMetricId);

      if (existingParentRecord) {
        existingParentRecord.childMetrics = existingChildMetrics;
      
        parentChildMap.set(metric.parentMetricId, existingParentRecord);
      }

    }
    
    return Array.from(parentChildMap.values());
  }

  statusColorClass(status?: string): string {
    return BULK_LAUNCH_STATUS_COLORS[(status || '').replaceAll(' ', '').toLowerCase()] ?? '';
  }

  getActionPermissions(): void {
    const userId = this.getUserId();
    if (userId) {
      this.authSvc.getActionAccess('BULKLAUNCH', userId)
      .pipe(take(1))
      .subscribe(res => {
        const permissions = res.data
        console.log({ permissions })

        const bulkLaunchActionPermissions = this.bulkLaunchActionPermissions();
        for (const action of permissions) {
          bulkLaunchActionPermissions[action.key] = action.value;
        }

        this.bulkLaunchActionPermissions.set(JSON.parse(JSON.stringify(bulkLaunchActionPermissions)));
      });
    }
  }

  openDeleteModal(): void {
    const bulkLaunchActionPermissions = this.bulkLaunchActionPermissions();
    

    if (!this.selectedImpactIds()?.size) {
      this.toastSvc.error('Please select at least one project to delete.');
      return;
    }
    
    this.confirmationAction.set('delete');
    this.launchConfirmationModalOpen.set(true);
  }

  openLaunchModal(): void {
    const bulkLaunchActionPermissions = this.bulkLaunchActionPermissions();
    if (!bulkLaunchActionPermissions[this.bulkLaunchActionKey.ADD]) {
      this.toastSvc.error('You do not have permission to launch projects.');
      return;
    }

    if (!this.selectedImpactIds()?.size) {
      this.toastSvc.error('Please select at least one project to launch.');
      return;
    }
    this.confirmationAction.set('launch');
    this.launchConfirmationModalOpen.set(true);
  }
  
  closeLaunchModal(): void {
    this.launchConfirmationModalOpen.set(false);
  }

  onDeleteReviews(): void {
    const reviewIds: number[] = [];

    const filteredProjects = this.filteredProjects();
    const selectedImpact = this.selectedImpactIds();

    for (const filteredProject of filteredProjects) {
      if (selectedImpact.has(+ (filteredProject.reviewId || 0) )) {
        reviewIds.push(+ (filteredProject.reviewId || 0) );
      } 
    }

    this.bulkLaunchInProgress.set(true);
    const userId = this.getUserId();
    this.closeLaunchModal();
    this.reviewSvc.deleteReviewByIds(reviewIds, userId || 0).pipe(take(1))
    .subscribe(res => {
      this.bulkLaunchInProgress.set(false);
      if (res.data) {
        this.resetSelectedImpactIds();
        this.toastSvc.success("Reviews deleted successfully");
        this.loadBulkProjects();
      } else {
        this.toastSvc.error("Unable to delete reviews. Please try again");
      }
    }, () => {
      this.bulkLaunchInProgress.set(false);
      this.toastSvc.error("Unable to delete reviews. Please try again");
    });
  }

  goToPage(page: number): void {
    this.currentPage.set(page);

    this.loadBulkProjects(true);
  }

  toggleSelectedImpactsTooltip(val: boolean): void {
    if (!this.selectedImpactIds()?.size) {
      this.showSelectedImpactsTooltip.set(false);
      return;
    }
    this.showSelectedImpactsTooltip.set(val);
  }

  protected itemsPerPage = signal<number>(10);
  onItemsPerPageChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.itemsPerPage.set(Number(target.value));

    this.loadBulkProjects(true);
  }


  reviewPeriodAssignCurrent() {
    const quarterStatusOptions = this.quarterStatusOptions(); 

    for (const periodCode of quarterStatusOptions) {
      if (!this.selectedQuarter && periodCode.isCurrent) {
        this.selectedQuarter = +periodCode?.value;
      }
    }
  }

  protected showCheckboxTooltip = signal<{ [reviewId: string]: boolean }>({})
  showHideCheckboxTooltip(reviewId: string | number, show: boolean) {
    if (reviewId == undefined) {
      return;
    }
    const showCheckboxTooltip = this.showCheckboxTooltip();

    showCheckboxTooltip[String(reviewId)] = show ? true : false;

    this.showCheckboxTooltip.set(showCheckboxTooltip);
  }


  resetSelectedImpactIds() {
    this.createdReviewIds.set(new Set<number>());
    this.pendingImpactIds.set(new Set<number>());
  }

}
