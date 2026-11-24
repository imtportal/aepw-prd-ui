import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin, of, Subject, Subscription, switchMap, timer } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { DataColumn, DataTableComponent } from '../../../../../shared/ui/data-table/data-table.component';
import { CardComponent, CardContentComponent } from '../../../../../shared/ui/card/card.component';
import { PagedRequest } from '../../../../../core/models/api-response.model';
import { AppUserLookup, ParentMetricLookup, ProgramLookup, RecordTypeLookup, ReviewStageLookup } from '../../../../../core/models/lookup-model';
import { AuthStateService } from '../../../../../core/auth';
import { LookupService } from '../../../../../core/services/lookup-service';
import { ReviewTaskService } from '../../services/review-task.service';
import { ReviewStageListDto } from '../../models/review-stage.model';
import { PeriodOption, PeriodService } from '../../../../reviews/create/services/period.service';

@Component({
  selector: 'app-review-stage',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, FormsModule, ButtonComponent, DataTableComponent, CardComponent, CardContentComponent],
  templateUrl: './review-stage.component.html',
})
export class ReviewStageComponent implements OnInit {
  private readonly reviewTaskService = inject(ReviewTaskService);
  private readonly router = inject(Router);
  private readonly lookupService = inject(LookupService);
  private readonly periodService = inject(PeriodService);
  private readonly authStateService = inject(AuthStateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly filterChanges = new Subject<'search' | 'clear'>();
  private readonly table = viewChild<DataTableComponent<ReviewStageListDto>>(DataTableComponent);
  private rowsRequest?: Subscription;

  readonly rows = signal<ReviewStageListDto[]>([]);
  readonly totalRecords = signal(0);
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly loadingLookups = signal(false);
  readonly lookupError = signal('');
  readonly reviewStages = signal<ReviewStageLookup[]>([]);
  readonly periods = signal<PeriodOption[]>([]);
  readonly tlms = signal<ParentMetricLookup[]>([]);
  readonly programs = signal<ProgramLookup[]>([]);
  readonly recordTypes = signal<RecordTypeLookup[]>([]);
  readonly assignedUsers = signal<AppUserLookup[]>([]);
  readonly searchText = signal('');
  readonly selectedReviewStageId = signal<string | null>(null);
  readonly selectedPeriod = signal<string | null>(null);
  readonly selectedTlmId = signal<string | null>(null);
  readonly selectedProgramId = signal<string | null>(null);
  readonly selectedRecordTypeId = signal<string | null>(null);
  readonly selectedAssignedUserId = signal<string | null>(null);
  readonly myProjectsOnly = signal(true);
  readonly reviewScope = signal<'current' | 'all'>('current');

  private readonly currentPage = signal(0);
  private readonly pageSize = signal(10);
  private readonly sortBy = signal('updatedOn');
  private readonly sortDirection = signal<'asc' | 'desc'>('desc');

  constructor() {
    this.filterChanges
      .pipe(
        switchMap((change) => (change === 'clear' ? of(undefined) : timer(1500))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.resetPageAndLoad());
  }

  readonly columns: DataColumn[] = [
    { key: 'impactMasterId', header: 'IM ID', sortable: true },
    { key: 'pin', header: 'PIN', sortable: true },
    { key: 'projectType', header: 'Type', sortable: true },
    { key: 'projectTitle', header: 'IM Name', sortable: true, headerClass: 'min-w-64' },
    { key: 'reportingPeriod', header: 'Period', sortable: true },
    { key: 'topLevelMetric', header: 'TLM', sortable: true },
    { key: 'reviewStage', header: 'Review Stage', sortable: true },
    { key: 'program', header: 'Program', sortable: true },
    {key : 'assignedUser', header: 'Assigned User', sortable: true},
    { key: 'approverName', header: 'Approver Name', sortable: true },
    { key: 'updatedOn', header: 'Updated On', sortable: true },
  ];

  protected readonly projectTypeColors: Record<string, string> = {
    Project: 'bg-[hsl(var(--aepw-blue)/0.12)] text-[hsl(var(--aepw-blue))]',
    Corporate: 'bg-[hsl(var(--aepw-orange)/0.12)] text-[hsl(var(--aepw-orange))]',
  };

  ngOnInit(): void {
    this.loadLookups();
  }

  onPageChange(page: PagedRequest): void {
    this.currentPage.set(page.page);
    this.pageSize.set(page.pageSize);
    this.sortBy.set(page.sortBy ?? 'updatedOn');
    this.sortDirection.set(page.sortDir ?? 'desc');
    if (this.loadingLookups()) {
      return;
    }

    this.loadRows();
  }

  onSearchChange(value: string): void {
    this.searchText.set(value);
    this.filterChanges.next('search');
  }

  onReviewStageChange(value: string): void {
    this.selectedReviewStageId.set(value || null);
    this.resetPageAndLoad();
  }

  onPeriodChange(value: string): void {
    this.selectedPeriod.set(value || null);
    this.resetPageAndLoad();
  }

  onTlmChange(value: string): void {
    this.selectedTlmId.set(value || null);
    this.resetPageAndLoad();
  }

  onProgramChange(value: string): void {
    this.selectedProgramId.set(value || null);
    this.resetPageAndLoad();
  }

  onRecordTypeChange(value: string): void {
    this.selectedRecordTypeId.set(value || null);
    this.resetPageAndLoad();
  }

  onAssignedUserChange(value: string): void {
    this.selectedAssignedUserId.set(value || null);
    this.resetPageAndLoad();
  }

  onMyProjectsChange(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) {
      return;
    }

    this.myProjectsOnly.set(event.target.checked);
    this.resetPageAndLoad();
  }

  onReviewScopeChange(value: 'current' | 'all'): void {
    this.reviewScope.set(value);
    this.resetPageAndLoad();
  }

  clearFilters(): void {
    this.searchText.set('');
    this.selectedReviewStageId.set(null);
    this.selectedPeriod.set(this.getDefaultPeriod());
    this.selectedTlmId.set(null);
    this.selectedProgramId.set(null);
    this.selectedRecordTypeId.set(null);
    this.selectedAssignedUserId.set(null);
    this.myProjectsOnly.set(true);
    this.reviewScope.set('current');
    this.filterChanges.next('clear');
  }

  private loadLookups(): void {
    const userId = this.authStateService.getCurrentUserId();
    if (userId == null) {
      this.lookupError.set('Unable to load filter options for the current user.');
      return;
    }

    this.loadingLookups.set(true);
    forkJoin({
      reviewStages: this.lookupService.getReviewStages(),
      periods: this.periodService.getReviewPeriods(null, 0, true),
      tlms: this.lookupService.getTopLevelMetrics(),
      programs: this.lookupService.getPrograms(),
      recordTypes: this.lookupService.getRecordTypes(),
      assignedUsers: this.lookupService.getUsers(''),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (lookups) => {
          this.reviewStages.set(lookups.reviewStages.data ?? []);
          const periods = lookups.periods ?? [];
          const defaultPeriod = this.getDefaultPeriod(periods);
          this.periods.set(
            periods.some((period) => period.label === defaultPeriod)
              ? periods
              : [{ label: defaultPeriod, value: defaultPeriod, isCurrent: true }, ...periods],
          );
          this.selectedPeriod.set(defaultPeriod);
          this.tlms.set(lookups.tlms.data ?? []);
          this.programs.set(lookups.programs.data ?? []);
          this.recordTypes.set(lookups.recordTypes.data ?? []);
          this.assignedUsers.set(lookups.assignedUsers.data ?? []);
          this.loadingLookups.set(false);
          this.resetPageAndLoad();
        },
        error: (error: unknown) => {
          console.error('Failed to load review stage filter options', error);
          this.lookupError.set('Unable to load filter options. Please try again.');
          this.loadingLookups.set(false);
          this.resetPageAndLoad();
        },
      });
  }

  private getDefaultPeriod(periods: PeriodOption[] = this.periods()): string {
    const currentPeriodCode = this.periodService.getCurrentPeriod();
    return (
      periods.find((period) => period.isCurrent)?.label ??
      periods.find((period) => period.label === currentPeriodCode)?.label ??
      currentPeriodCode
    );
  }

  private resetPageAndLoad(): void {
    this.currentPage.set(0);
    this.table()?.currentPage.set(0);
    this.loadRows();
  }

  private loadRows(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.rowsRequest?.unsubscribe();
    this.rowsRequest = this.reviewTaskService
      .getReviewStageList({
        search: this.searchText().trim() || null,
        reviewStageId: this.toId(this.selectedReviewStageId()),
        reportingPeriod: this.selectedPeriod(),
        tlmId: this.toId(this.selectedTlmId()),
        programId: this.toId(this.selectedProgramId()),
        recordTypeId: this.toId(this.selectedRecordTypeId()),
        l1UserId: this.myProjectsOnly() ? this.authStateService.getCurrentUserId() : null,
        assignedUserId: this.toId(this.selectedAssignedUserId()),
        reviewScope: this.reviewScope(),
        pageNumber: this.currentPage() + 1,
        pageSize: this.pageSize(),
        sortBy: this.sortBy(),
        sortDirection: this.sortDirection(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.rows.set(response.data.items);
          this.totalRecords.set(response.data.totalRecords);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          console.error('Failed to load review stage tasks', error);
          this.errorMessage.set('Unable to load review stage tasks. Please try again.');
          this.loading.set(false);
        },
      });
  }

  private toId(value: string | null): number | null {
    if (value === null) {
      return null;
    }

    const id = Number(value);
    return Number.isFinite(id) ? id : null;
  }

  backToReviewTasks(): void {
    void this.router.navigate(['/workflow/reviewTasks']);
  }
}