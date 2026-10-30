import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AsyncPipe } from '@angular/common';
import {
  AbstractControl,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
} from '@angular/forms';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';
import {
  LucideAngularModule,
  LucideIconProvider,
  LUCIDE_ICONS,
  Plus,
  Settings2,
  ChevronDown,
  MoreVertical,
  Copy,
  Layers,
  Trash2,
  Search,
} from 'lucide-angular';
import { CardComponent, CardContentComponent } from '../../../../../shared/ui/card/card.component';
import { SelectComponent } from '../../../../../shared/ui/select/select.component';

import {
  DataTableComponent,
  DataColumn,
} from '../../../../../shared/ui/data-table/data-table.component';
import { MetricService } from '../../../../admin/services/metric.service';
import {
  ImpactMasterListModel,
  ImpactMasterDetailModel,
  MetricCategoryModel,
  CopyImpactMasterRequest,
  DeleteImpactMasterRequest,
  ImpactMasterFilterOptionsDto,
} from '../../models/project-library-new.model';

import { createAdminProjectsUiStore } from '../../../../admin/store/admin-projects-ui.store';
import { PagedRequest } from '../../../../../core/models/api-response.model';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  forkJoin,
  map,
  Observable,
  of,
  startWith,
  Subject,
  switchMap,
} from 'rxjs';
import {
  AppUserLookup,
  ProjectManagerLookup,
  FundingRecipientLookup,
  MetricCategoryLookup,
  ProgramLookup,
  StatusLookup,
  RecordTypeLookup,
  ImpactMasterLookup,
} from '../../../../../core/models/lookup-model';
import { LookupService } from '../../../../../core/services/lookup-service';
import { PageLoadingService } from '../../../../../core/services/page-loading.service';
import { Router } from '@angular/router';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { ImpactMasterService } from '../../services/project-library-new.service';
import { AuthorizationService, AuthStateService } from '../../../../../core/auth';
import { ToastService } from '../../../../../shared/ui/toast/toast.service';
import { DialogComponent } from '../../../../../shared/ui/dialog/dialog.component';
import { ActionAccess } from '../../../../../core/auth/models/authorization.model';
import { ReviewTaskModel } from '../../../Task/models/review-task.model';

@Component({
  selector: 'app-projects-page',
  standalone: true,
  imports: [
    AsyncPipe,
    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    LucideAngularModule,
    CardComponent,
    CardContentComponent,
    SelectComponent,
    // DialogComponent,
    DataTableComponent,
    // ProjectDetailSheetComponent,
    // SearchInputComponent,
    ButtonComponent,
    DialogComponent,
  ],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({
        Plus,
        Settings2,
        ChevronDown,
        MoreVertical,
        Copy,
        Layers,
        Trash2,
        Search,
      }),
    },
  ],
  templateUrl: './project-library-page.component.html',
  styleUrls: ['./project-library-page.component.css'],
})
export class ProjectLibraryPageComponent implements OnInit {
  private readonly pageLoadingService = inject(PageLoadingService);
  private readonly authStateService = inject(AuthStateService);
  private readonly authorizationService = inject(AuthorizationService);
  readonly actionAccess = signal<ActionAccess[]>([]);
  private readonly pageKey = 'PROJECTMASTER';
  // Action Signals
  protected readonly canAddProject = computed(() =>
    this.actionAccess().some((action) => action.key === 'ADDPRJ' && action.value),
  );

  protected readonly canAddCorporate = computed(() =>
    this.actionAccess().some((action) => action.key === 'ADDCRP' && action.value),
  );

  protected readonly canEditProject = computed(() =>
    this.actionAccess().some((action) => action.key === 'EDITPRJ' && action.value),
  );

  protected readonly canEditCorporate = computed(() =>
    this.actionAccess().some((action) => action.key === 'EDITCRP' && action.value),
  );
  protected readonly canDuplicateIM = computed(() =>
    this.actionAccess().some((action) => action.key === 'DUPLICATEIM' && action.value),
  );

  protected readonly canDeleteIM = computed(() =>
    this.actionAccess().some((action) => action.key === 'DELETEIM' && action.value),
  );

  readonly currentLoggedInUserId = this.authStateService.getCurrentUserId()!;
  private readonly toast = inject(ToastService);
  readonly isMyProjects = signal(false);
  private readonly impactMasterService = inject(ImpactMasterService);
  private readonly destroyRef = inject(DestroyRef);
  readonly metricSvc = inject(MetricService);
  readonly store = createAdminProjectsUiStore();
  readonly openActionMenuId = signal<string | null>(null);
  private readonly router = inject(Router);
  // delete
  readonly showDeleteModal = signal(false);
  readonly deletingImpactMaster = signal<ImpactMasterListModel | null>(null);
  // create menu
  readonly showCreateMenu = signal(false);
  readonly openMenuUpward = signal(false);
  // selected signals
  readonly selectedImpactMaster = signal<ImpactMasterListModel | null>(null);
  readonly selectedImpactMasterDetail = signal<ImpactMasterDetailModel | null>(null);
  readonly selectedImpactMasterMetrics = signal<MetricCategoryModel[] | null>(null);
  readonly detailOpen = signal(false);
  readonly loading = signal(false);
  readonly searchQuery = signal('');
  private readonly _allImpactMasters = signal<ImpactMasterListModel[]>([]);
  private readonly _currentPage = signal(0);
  private readonly _pageSize = signal(10);
  //-------------------------------- Pagination variables ------------------------------------------
  readonly totalRecords = signal(0);
  readonly totalPages = signal(0);
  readonly pageData = computed(() => this._allImpactMasters());
  readonly pageTotal = computed(() => this.totalRecords());
  // ---------------------------------------------------------------------------------------------------
  readonly programs = signal<ProgramLookup[]>([]);
  readonly recordTypes = signal<RecordTypeLookup[]>([]);
  // readonly countries = signal<CountryLookup[]>([]);
  readonly impactMasterStatus = signal<StatusLookup[]>([]);
  private readonly lookupService = inject(LookupService);
  readonly metricCategories = signal<MetricCategoryLookup[]>([]);
  readonly saving = signal(false);
  readonly projectManagers = signal<ProjectManagerLookup[]>([]);
  // project - server-side typeahead
  readonly selectedImpactMasterId = signal<string | null>(null);
  readonly impactMasterSearch$ = new Subject<string>();
  // ACTIONS --------------------------------------------------------

  // Global search
  private readonly impactMasterSearchTerm = signal('');
  // global search
  readonly impactMasterFilterOptions = signal<ImpactMasterFilterOptionsDto | null>(null);
  @ViewChild('impactMasterSelect')
  impactMasterSelect!: NgSelectComponent;
  /////////////////////////////////////////////////////////////////
  readonly impactmasters$: Observable<ImpactMasterLookup[]> = this.impactMasterSearch$.pipe(
    startWith(''),
    debounceTime(300),
    distinctUntilChanged(),
    switchMap((term) => {
      // Return empty array for short terms instead of EMPTY to keep the stream alive
      if (!term || term.trim().length < 3) {
        return of<ImpactMasterLookup[]>([]);
      }

      return this.lookupService.getImpactMasters(term.trim()).pipe(
        map((response) => response.data ?? []),
        catchError((error) => {
          console.error('[ImpactMaster Typeahead]', error);
          // Return empty array instead of EMPTY to keep the stream alive
          return of<ImpactMasterLookup[]>([]);
        }),
      );
    }),
    takeUntilDestroyed(this.destroyRef),
  );
  // Funding recipient - server-side typeahead
  readonly selectedFundingRecipientId = signal<string | null>(null);
  readonly fundingRecipientSearch$ = new Subject<string>();
  readonly fundingRecipients$: Observable<FundingRecipientLookup[]> =
    this.fundingRecipientSearch$.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((term) => {
        if (!term || term.trim().length < 3) {
          return of<FundingRecipientLookup[]>([]);
        }
        return this.lookupService.getFundingRecipients().pipe(
          map((response) => response.data ?? []),
          catchError((error) => {
            console.error('[FundingRecipient Typeahead]', error);
            return of<FundingRecipientLookup[]>([]);
          }),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    );
  // selected
  readonly selectedL1UserId = signal<string | null>(null);
  readonly selectedProgramId = signal<string | null>(null);
  readonly selectedRecordTypeId = signal<string | null>(null);
  readonly selectedStatusId = signal<string | null>(null);
  readonly selectedMetricCategories = signal<string[]>([]);

  //
  readonly statuses = signal<StatusLookup[]>([]);
  readonly pmSearch$ = new Subject<string>();
  // ---------------------------------------------------------------------------------------------------
  @ViewChild('createMenuContainer')
  createMenuContainer!: ElementRef<HTMLElement>;
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node;

    // Close Create menu when clicking outside
    if (
      this.showCreateMenu() &&
      this.createMenuContainer &&
      !this.createMenuContainer.nativeElement.contains(target)
    ) {
      this.showCreateMenu.set(false);
    }

    // Close Action menu when clicking outside
    if (this.openActionMenuId()) {
      this.openActionMenuId.set(null);
    }
  }
  protected readonly canEditImpactMaster = (impactMaster: ImpactMasterListModel): boolean =>
    impactMaster.recordTypeName === 'Project'
      ? this.canEditProject()
      : impactMaster.recordTypeName === 'Corporate'
        ? this.canEditCorporate()
        : false;
  // ---------------------------------------------------------------------------------------------------

  protected readonly tableColumns = computed<DataColumn[]>(() => {
    const columns: DataColumn[] = [
      {
        key: 'impactMasterId',
        header: 'ID',
        sortable: true,
        width: '8%',
      },
      {
        key: 'pin',
        header: 'PIN',
        sortable: true,
        width: '11%',
      },
      {
        key: 'title',
        header: 'Project',
        sortable: true,
        width: '20%',
      },
      {
        key: 'recordTypeName',
        header: 'Sources',
        sortable: true,
        width: '7%',
      },
      {
        key: 'fundingRecipientNames',
        header: 'Funding Recipient',
        sortable: true,
        width: '21%',
      },
      {
        key: 'statusName',
        header: 'Status',
        sortable: true,
        align: 'center',
        width: '12%',
      },
    ];

    return columns;
  });

  ngOnInit(): void {
    this.pageLoadingService.stop();
    this.loadActionAccess();
    this.loading.set(true);
    this.loadLookups();
    this.refreshImpactMasters();
    this.loadImpactMasterFilterOptions();
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
  private loadImpactMasterFilterOptions(): void {
    this.impactMasterService
      .getImpactMasterFilterOptions(
        this.selectedProgramId() || null,
        this.selectedRecordTypeId() || null,
        this.selectedStatusId() || null,
      )
      .subscribe({
        next: (result) => {
          this.impactMasterFilterOptions.set(result);
          console.log('ImpactMasterFilterOptionsDto:', result);
        },
        error: (error) => {
          console.error('Failed to load impact master filter options', error);
        },
      });
  }
  private loadLookups(): void {
    forkJoin({
      programs: this.lookupService.getPrograms(),
      recordTypes: this.lookupService.getRecordTypes(),
      statuses: this.lookupService.getStatusesByModule('ImpactMaster'),
      metricCategories: this.lookupService.getMetricCategories(),
    }).subscribe({
      next: (result) => {
        this.programs.set(result.programs.data ?? []);
        this.impactMasterStatus.set(result.statuses.data ?? []);
        this.recordTypes.set(result.recordTypes.data ?? []);
        this.metricCategories.set(result.metricCategories.data ?? []);
      },
      error: (error) => {
        console.error('Failed to load lookups', error);
      },
    });
  }

  private refreshImpactMasters(): void {
    this.loading.set(true);
    this.impactMasterService
      .getAllImpactMasters({
        pageNumber: this._currentPage() + 1,
        pageSize: this._pageSize(),
        recordTypeId: this.selectedRecordTypeId() || null,
        searchText: this.searchQuery(),
        l1UserId: this.selectedL1UserId() || null,
        programId: this.selectedProgramId() || null,
        impactMasterId: this.selectedImpactMasterId() || null,
        statusId: this.selectedStatusId() || null,
        fundingRecipientId: this.selectedFundingRecipientId() || null,
        metricCategories: this.selectedMetricCategories().length
          ? this.selectedMetricCategories().join(',')
          : null,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (response) => {
          const pagedData = response.data;

          this.totalRecords.set(pagedData.totalRecords);

          this.totalPages.set(pagedData.totalPages);

          this._allImpactMasters.set(
            pagedData.items.map((p: any) => ({
              ...p,
              metricCategoryList: p.metricCategories ? p.metricCategories.split(',') : [],
            })),
          );
        },
        error: (err) => console.error(err),
      });
  }
  //////////////////////////////////////////////////////////////////////
  toggleCreateMenu(): void {
    console.log('inisde toggle menu');
    this.showCreateMenu.update((v) => !v);
  }
  createImpact(recordType: RecordTypeLookup): void {
    this.showCreateMenu.set(false);

    this.router.navigate(['/admin/projects-new'], {
      queryParams: {
        recordTypeId: recordType.recordTypeId,
      },  
    });
  }
  /////////////////////////////////////////////////////////////////////
  onEditImpactMaster(impactMaster: ImpactMasterListModel): void {
     this.router.navigate(['/admin/projects-info', impactMaster.impactMasterId], {
       queryParams: {
         from: 'library',
         recordTypeId: impactMaster.recordTypeId,
       },
     });
   }

  onAddImpactMaster() {
    this.router.navigate(['/admin/projects-new']);
  }
  // GLOBAL SEARCH
  onImpactMasterSearch(event: { term: string }): void {
    this.impactMasterSearchTerm.set(event.term ?? '');
  }
  onImpactMasterSearchEnter(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    const searchText = this.impactMasterSelect?.searchTerm?.trim() ?? '';

    if (!searchText) {
      return;
    }

    // Keep the typed search text
    this.impactMasterSearchTerm.set(searchText);

    // Clear any previously selected IM
    this.selectedImpactMasterId.set(null);

    // Apply global search
    this.searchQuery.set(searchText);
    this._currentPage.set(0);

    // Close dropdown without selecting an option
    this.impactMasterSelect.close();

    this.refreshImpactMasters();
  }

  onGlobalSearchClick(): void {
    const searchText = this.impactMasterSearchTerm().trim();

    if (!searchText) {
      return;
    }

    this.selectedImpactMasterId.set(null);
    this.searchQuery.set(searchText);
    this._currentPage.set(0);

    this.impactMasterSelect.close();

    this.refreshImpactMasters();
  }

  private applyGlobalSearch(searchText: string): void {
    searchText = searchText.trim();

    if (!searchText) {
      return;
    }

    // Global search must not use the selected IM.
    this.selectedImpactMasterId.set(null);

    this.searchQuery.set(searchText);
    this._currentPage.set(0);

    this.refreshImpactMasters();
  }
  onSearchChange(q: string): void {
    this.searchQuery.set(q);
    this._currentPage.set(0);

    this.refreshImpactMasters();
  }

  onPageChange(params: PagedRequest): void {
    this._currentPage.set(params.page);
    this._pageSize.set(params.pageSize);

    this.refreshImpactMasters();
  }
  // No longer needed - using Observable directly with async pipe
  onProjectFilterChange(value: string | null): void {
    this.selectedImpactMasterId.set(value);

    if (value) {
      this.searchQuery.set('');
      this.impactMasterSearchTerm.set('');
    }

    this._currentPage.set(0);
    this.refreshImpactMasters();
  }

  onProgramFilterChange(value: string | null): void {
    this.selectedProgramId.set(value);
    this._currentPage.set(0);
    this.refreshImpactMasters();
    this.loadImpactMasterFilterOptions();
  }

  onRecordTypeFilterChange(value: string | null): void {
    this.selectedRecordTypeId.set(value);
    this._currentPage.set(0);
    this.refreshImpactMasters();
    this.loadImpactMasterFilterOptions();
  }

  onStatusFilterChange(value: string | null): void {
    this.selectedStatusId.set(value);
    this._currentPage.set(0);
    this.refreshImpactMasters();
    this.loadImpactMasterFilterOptions();
  }
  onFundingRecipientFilterChange(value: string | null): void {
    this.selectedFundingRecipientId.set(value);

    if (!value) {
      this._currentPage.set(0);
      this.refreshImpactMasters();
    }
  }

  ///////////////////////////////////////////////////////////////////////////////////
  // FILTER HANDLERS
  onMyProjectsChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;

    this.isMyProjects.set(checked);

    this.selectedL1UserId.set(checked ? String(this.currentLoggedInUserId) : null);

    this._currentPage.set(0);
    this.refreshImpactMasters();
  }
  applyFilters(): void {
    this._currentPage.set(0);
    this.refreshImpactMasters();
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.impactMasterSearchTerm.set('');

    this.selectedProgramId.set(null);
    this.selectedStatusId.set(null);
    this.selectedRecordTypeId.set(null);

    this.selectedMetricCategories.set([]);

    // Reset typeahead selections - the observables will handle clearing their items
    this.selectedImpactMasterId.set(null);
    this.selectedFundingRecipientId.set(null);
    this.selectedL1UserId.set(null);
    this.isMyProjects.set(false);

    this.projectManagers.set([]);

    this._currentPage.set(0);

    this.refreshImpactMasters();
    this.loadImpactMasterFilterOptions();
  }
  onPmFilterChange(value: string | null): void {
    this.selectedL1UserId.set(value);

    if (!value) {
      this._currentPage.set(0);
      this.refreshImpactMasters();
    }
  }
  // DELETE: ImpactMaster
  onDeleteImpactMaster(impactMaster: ImpactMasterListModel): void {
    const request: DeleteImpactMasterRequest = {
      impactMasterId: String(impactMaster.impactMasterId),
      updatedBy: String(this.currentLoggedInUserId),
    };

    this.saving.set(true);

    this.impactMasterService
      .deleteImpactMaster(request)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: (response) => {
          const data = response.data;

          if (!data) {
            return;
          }

          if (data.hasPendingReviews) {
            console.error('Record cannot be deleted. Pending reviews:', data.pendingReviewIds);
            this.toast.error(`Record cannot be deleted. Pending reviews: ${data.pendingReviewIds}`);

            // Show your toast/dialog here
            return;
          }

          if (!data.isDeleted) {
            this.toast.error('Record not found or already deleted.');

            // Show your toast/dialog here
            return;
          }
          // Delete successful
          this.toast.success('Record deleted successfully.');
          // Successfully deleted
          this.refreshImpactMasters();
        },
        error: (error) => {
          if (error.status === 400) {
            this.toast.error(
              error.error?.message ?? 'Record cannot be deleted because it has pending reviews.',
            );
            return;
          }

          if (error.status === 404) {
            console.error('[ProjectsPageComponent] Record not found:', error.error?.message);
            this.toast.error(error.error?.message ?? 'Record not found or already deleted.');
            // Show API error message in toast
            return;
          }
          this.toast.error(error.error?.message ?? 'Failed to delete Record. Please try again.');

          console.error('[ProjectsPageComponent] Delete ImpactMaster Error:', error);
        },
      });
  }

  // COPY: ImpactMaster
  onCopyImpactMaster(impactMaster: ImpactMasterListModel): void {
    const request: CopyImpactMasterRequest = {
      impactMasterId: String(impactMaster.impactMasterId),
      createdBy: String(this.currentLoggedInUserId),
    };

    this.saving.set(true);

    this.impactMasterService
      .copyImpactMaster(request)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: (response) => {
          const copiedImpactMasterId = response.data?.impactMasterId;
          console.log('in copy handler');
          console.log(copiedImpactMasterId);
          if (!copiedImpactMasterId) {
            this.toast.error('Duplicate Record could not be created.');
            return;
          }

          this.toast.success('Duplicate Record created successfully.');

          // Refresh the list after successful copy
          this.refreshImpactMasters();
        },

        error: (error) => {
          this.toast.error(error.error?.message ?? 'Failed to create duplicate. Please try again.');

          console.error('[ProjectsPageComponent] Copy ImpactMaster Error:', error);
        },
      });
  }

  // toggleActionMenu(impactMasterId: string): void {
  //   this.openActionMenuId.update((currentId) =>
  //     currentId === impactMasterId ? null : impactMasterId,
  //   );
  // }

  toggleActionMenu(impactMasterId: string, button: HTMLElement): void {
    if (this.openActionMenuId() === impactMasterId) {
      this.openActionMenuId.set(null);
      return;
    }

    const buttonRect = button.getBoundingClientRect();

    const scrollContainer = button.closest('.overflow-y-auto');

    if (scrollContainer) {
      const containerRect = scrollContainer.getBoundingClientRect();

      const spaceBelow = containerRect.bottom - buttonRect.bottom;
      const spaceAbove = buttonRect.top - containerRect.top;

      const menuHeight = 100;
      const gap = 8;

      this.openMenuUpward.set(spaceBelow < menuHeight + gap && spaceAbove > spaceBelow);
    } else {
      this.openMenuUpward.set(false);
    }

    this.openActionMenuId.set(impactMasterId);
  }

  closeActionMenu(): void {
    this.openActionMenuId.set(null);
  }

  onDuplicate(impactMaster: ImpactMasterListModel): void {
    this.closeActionMenu();
    this.onCopyImpactMaster(impactMaster);
  }

  onDelete(impactMaster: ImpactMasterListModel): void {
    this.closeActionMenu();
    this.onDeleteImpactMaster(impactMaster);
  }
  openDeleteConfirmation(impactMaster: ImpactMasterListModel): void {
    this.openActionMenuId.set(null);
    this.deletingImpactMaster.set(impactMaster);
    this.showDeleteModal.set(true);
  }

  cancelDeleteImpactMaster(): void {
    this.showDeleteModal.set(false);
    this.deletingImpactMaster.set(null);
  }

  confirmDeleteImpactMaster(): void {
    const impactMaster = this.deletingImpactMaster();

    if (!impactMaster) {
      return;
    }

    this.showDeleteModal.set(false);

    this.onDeleteImpactMaster(impactMaster);

    this.deletingImpactMaster.set(null);
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
    Draft: 'bg-[hsl(var(--aepw-yellow)/0.12)] text-[hsl(var(--aepw-yellow))]',
    'Active with reporting': 'bg-[hsl(var(--aepw-green)/0.12)] text-[hsl(var(--aepw-green))]',

    'Active with no reporting': 'bg-[hsl(var(--aepw-blue)/0.12)] text-[hsl(var(--aepw-blue))]',

    'Closed with further reporting':
      'bg-[hsl(var(--aepw-orange)/0.12)] text-[hsl(var(--aepw-orange))]',

    'Closed with no further reporting':
      'bg-[hsl(var(--aepw-dark-grey)/0.12)] text-[hsl(var(--aepw-dark-grey))]',
  };
}
