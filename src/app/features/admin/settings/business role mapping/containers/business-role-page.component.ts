import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  LucideIconProvider,
  LUCIDE_ICONS,
  Plus,
  Trash2,
} from 'lucide-angular';
import { SearchInputComponent } from '../../../../../shared/ui/search-input/search-input.component';
import { CardComponent, CardContentComponent } from '../../../../../shared/ui/card/card.component';
import { DialogComponent } from '../../../../../shared/ui/dialog/dialog.component';
import {
  DataTableComponent,
  DataColumn,
} from '../../../../../shared/ui/data-table/data-table.component';
import { UserRoleCardComponent } from '../../../users/components/user-role-card/user-role-card.component';
import { UserRowComponent } from '../../../users/components/user-row/user-row.component';
import { NgSelectComponent } from '@ng-select/ng-select';
import {
  AppUserLookup,
  BusinessRoleLookup,
  BusinessRoleUserLookup,
  MetricCategoryLookup,
  ProgramLookup,
  ReviewStageLookup,
  SystemRoleLookup,
} from '../../../../../core/models/lookup-model';
import { LookupService } from '../../../../../core/services/lookup-service';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  forkJoin,
  map,
  of,
  Subject,
  switchMap,
} from 'rxjs';
import { BusinessRoleService } from '../services/business-role.service';
import {
  BusinessRoleMappingModel,
  SaveBusinessRoleMappingRequest,
} from '../models/business-role.model';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';
import { PagedRequest } from '../../../../../core/models/api-response.model';
import { ToastService } from '../../../../../shared/ui/toast/toast.service';
import { AuthStateService } from '../../../../../core/auth';

@Component({
  selector: 'business-role-component',
  standalone: true,
  imports: [
    TranslocoPipe,
    FormsModule,
    LucideAngularModule,
    CardComponent,
    CardContentComponent,
    DialogComponent,
    DataTableComponent,
    UserRoleCardComponent,
    UserRowComponent,
    SearchInputComponent,
    NgSelectComponent,
    ReactiveFormsModule,
  ],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Plus, Trash2 }) },
  ],
  templateUrl: './business-role-page.component.html',
})
export class BusinessRoleComponent {
  private readonly businessRoleService = inject(BusinessRoleService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastService);
  private readonly authStateService = inject(AuthStateService);
  readonly showAddModal = signal(false);
  readonly showDeleteModal = signal(false);
  readonly selectedMapping = signal<BusinessRoleMappingModel | null>(null);
  readonly deleteLoading = signal(false);
  // -----------------loading state ------------------------------------
  readonly loading = signal(false);
  readonly editLoading = signal(false);
  // ------------------LOOKUP-----------------------------------------
  readonly systemRoles = signal<SystemRoleLookup[]>([]);
  readonly programs = signal<ProgramLookup[]>([]);

  readonly users = signal<AppUserLookup[]>([]);
  readonly userSearch$ = new Subject<string>();
  readonly metricCategories = signal<MetricCategoryLookup[]>([]);
  // --------------------------------------------------
  readonly businessRoles = signal<BusinessRoleLookup[]>([]);
  readonly reviewStages = signal<ReviewStageLookup[]>([]);
  // ---------------------pagination---------------------------------
  readonly allData = signal<BusinessRoleMappingModel[]>([]);
  readonly pageData = signal<BusinessRoleMappingModel[]>([]);
  readonly pageTotal = signal(0);
  readonly tableState = signal<PagedRequest>({
    page: 0,
    pageSize: 10,
  });
  // --------------------- FILTER ------------------------------------
  readonly selectedBusinessRoleId = signal('');
  readonly selectedCategoryCode = signal('');
  readonly selectedUserId = signal<string | null>(null);
  readonly businessRoleUsers = signal<BusinessRoleUserLookup[]>([]);
  // ----------------------------- FORM ------------------------------
  private readonly fb = inject(FormBuilder);
  readonly editingMappingId = signal<string | null>(null);
  private readonly translocoService = inject(TranslocoService);
  // -----------------------------------------------------------------
  readonly dialogTitle = computed(() =>
    this.editingMappingId()
      ? this.translocoService.translate('BUSINESS_ROLE.EDIT_ROLE')
      : this.translocoService.translate('BUSINESS_ROLE.ADD_ROLE'),
  );
  readonly submitButtonText = computed(() =>
    this.editingMappingId()
      ? this.translocoService.translate('COMMON.UPDATE')
      : this.translocoService.translate('COMMON.ADD'),
  );
  // --------------------------------------------
  protected tableColumns: DataColumn[] = [
    {
      key: 'businessRoleName',
      header: this.translocoService.translate('BUSINESS_ROLE.TABLE.BUSINESS_ROLE'),
      sortable: true,
    },
    {
      key: 'userName',
      header: this.translocoService.translate('BUSINESS_ROLE.TABLE.USER'),
      sortable: true,
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      width: '12%',
      align: 'center',
    },
  ];

  // -----------------------------------------------------
  readonly selectedRoleId = signal<string | null>(null);
  private readonly lookupService = inject(LookupService);
  // -------------------------------------------
  readonly businessRoleForm = this.fb.group({
    businessRoleId: ['', Validators.required],
    userId: ['', Validators.required],
    categoryCode: [''],
    reviewStageCode: [''],
  });

  changeLanguage(lang: string): void {
    this.translocoService.setActiveLang(lang);
  }

  ngOnInit(): void {
    this.userSearch$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => {
          const searchTerm = term?.trim() ?? '';

          if (searchTerm.length < 3) {
            return of<AppUserLookup[]>([]);
          }

          return this.lookupService.getUsers(searchTerm).pipe(
            map((response) => response.data ?? []),
            catchError((error) => {
              console.error('[Business Role User Typeahead]', error);
              return of<AppUserLookup[]>([]);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((users) => {
        this.users.set(users);
      });
    console.log(this.translocoService.translate('COMMON.ADD'));
    setTimeout(() => {
      console.log('Delayed Translation:', this.translocoService.getTranslation('en'));
      console.log(this.translocoService.translate('COMMON.ADD'));
    }, 3000);
    this.translocoService.load('en').subscribe(() => {
      this.initializeTableColumns();
    });
    this.loadLookups();
    this.loadPage();
  }
  onUserClear(): void {
    this.users.set([]);
    this.userSearch$.next('');
  }
  private initializeTableColumns(): void {
    this.tableColumns = [
      {
        key: 'businessRoleName',
        header: this.translocoService.translate('BUSINESS_ROLE.TABLE.BUSINESS_ROLE'),
        sortable: true,
      },
      {
        key: 'userName',
        header: this.translocoService.translate('BUSINESS_ROLE.TABLE.USER'),
        sortable: true,
      },
      {
        key: 'actions',
        header: 'Actions',
        sortable: false,
        width: '12%',
        align: 'center',
      },
    ];
  }

  private loadLookups(): void {
    forkJoin({
      programs: this.lookupService.getPrograms(),
      businessRoleUsers: this.lookupService.getBusinessRoleUsers(),
      metricCategories: this.lookupService.getMetricCategories(),
      businessRoles: this.lookupService.getBusinessRoles(),

      reviewStages: this.lookupService.getReviewStages(),
    }).subscribe({
      next: (result) => {
        this.programs.set(result.programs.data ?? []);
        this.businessRoleUsers.set(result.businessRoleUsers.data ?? []);
        this.metricCategories.set(result.metricCategories.data ?? []);
        // this.users.set(result.users.data ?? []);
        this.businessRoles.set(result.businessRoles.data ?? []);
        // this.reviewStages.set(result.reviewStages.data ?? []);
      },
      error: (error) => {
        console.error('Failed to load lookups', error);
      },
    });
  }
  constructor() {
    effect(() => {
      console.log('Dialog Title:', this.dialogTitle());
      console.log('Button Text:', this.submitButtonText());
    });
  }
  private loadPage(): void {
    this.loading.set(true);
    this.businessRoleService
      .getAllBusinessRoleMappings(this.selectedUserId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const data = response.data ?? [];

          this.allData.set(data);
          this.applyTableOperations();

          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }
  onUserFilterChange(value: string | null): void {
    console.log('Selected userId:', value);
    this.selectedUserId.set(value);

    this.resetToFirstPage();

    this.loadPage();
  }
  saveBusinessRole(): void {
    console.log('in save business role');
    if (this.businessRoleForm.invalid) {
      console.log('in save business role invalid');
      this.businessRoleForm.markAllAsTouched();
      return;
    }

    const formValue = this.businessRoleForm.getRawValue();

    const payload: SaveBusinessRoleMappingRequest = {
      businessRoleMappingId: this.editingMappingId(),

      businessRoleId: formValue.businessRoleId!,
      userId: formValue.userId!,
      reviewStageCode: formValue.reviewStageCode || null,

      categoryCode: formValue.categoryCode || null,

      isActive: true,
    };
    const isEditing = this.editingMappingId() !== null;

    this.businessRoleService
      .saveBusinessRoleMapping(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success(
            this.translocoService.translate(
              isEditing
                ? 'BUSINESS_ROLE.MESSAGES.MAPPING_UPDATED'
                : 'BUSINESS_ROLE.MESSAGES.MAPPING_CREATED',
            ),
          );
          this.showAddModal.set(false);

          this.businessRoleForm.reset();

          this.editingMappingId.set(null);

          this.loadPage();
        },
        error: (error) => {
          this.toast.error(
            error.error?.message ??
              this.translocoService.translate('BUSINESS_ROLE.MESSAGES.MAPPING_SAVE_FAILED'),
          );
          console.error(error);
        },
      });
  }

  openDeleteDialog(businessRoleMappingId: string): void {
    if (this.deleteLoading()) {
      return;
    }

    const mapping = this.allData().find(
      (item) => item.businessRoleMappingId === businessRoleMappingId,
    );

    if (!mapping) {
      this.toast.error('Business role mapping could not be found.');
      return;
    }

    this.selectedMapping.set(mapping);
    this.showDeleteModal.set(true);
  }

  cancelDeleteMapping(): void {
    if (this.deleteLoading()) {
      return;
    }

    this.closeDeleteDialog();
  }

  onDeleteDialogClosed(): void {
    if (!this.deleteLoading()) {
      this.selectedMapping.set(null);
    }
  }

  confirmDeleteMapping(): void {
    if (this.deleteLoading()) {
      return;
    }

    const mapping = this.selectedMapping();
    if (!mapping) {
      return;
    }

    const updatedBy = this.authStateService.getCurrentUserId();
    if (updatedBy === null) {
      this.toast.error(
        'Unable to delete the business role mapping because the current user is unavailable.',
      );
      return;
    }

    this.deleteLoading.set(true);
    this.businessRoleService
      .deleteBusinessRoleMapping(mapping.businessRoleMappingId, updatedBy)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.deleteLoading.set(false)),
      )
      .subscribe({
        next: (response) => {
          if (!response.success || !response.data?.isDeleted) {
            this.toast.error(response.message?.trim() || 'Failed to delete business role mapping.');
            this.showDeleteModal.set(true);
            return;
          }
          this.toast.success('Business role mapping successfully deleted.');

          this.closeDeleteDialog();
          this.loadPage();
        },
        error: (error) => {
          console.error('[BusinessRoleService] Delete Business Role Mapping Error:', error);
          const message = error?.error?.message ?? 'Failed to delete business role mapping.';
          this.toast.error(message);
          // this.showDeleteModal.set(true);
        },
      });
  }
  private closeDeleteDialog(): void {
    this.showDeleteModal.set(false);
    console.log('delete signal value' + this.showDeleteModal());
    this.selectedMapping.set(null);
  }
  editMapping(row: BusinessRoleMappingModel): void {
    this.editLoading.set(true);

    this.businessRoleService
      .getBusinessRoleMappingById(row.businessRoleMappingId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const data = response.data;

          if (!data) {
            this.loading.set(false);
            return;
          }

          this.editingMappingId.set(data.businessRoleMappingId);

          this.addUserIfMissing(data.userId, data.userName);

          this.businessRoleForm.patchValue({
            businessRoleId: data.businessRoleId,
            userId: data.userId,

            categoryCode: data.categoryCode,
            reviewStageCode: data.reviewStageCode,
          });

          this.showAddModal.set(true);
          // this.toast.success('Saved business role mapping successfully');
          this.editLoading.set(false);
        },
        error: (error) => {
          this.editLoading.set(false);

          console.error('Failed to load business role mapping details', error);
          this.toast.error('Failed to load business role mapping details');
        },
      });
  }

  private addUserIfMissing(userId: string, displayName: string): void {
    if (this.users().some((user) => user.userId === userId)) {
      return;
    }

    this.users.update((users) => [...users, { userId, displayName }]);
  }

  openAddDialog(): void {
    this.editingMappingId.set(null);

    this.businessRoleForm.reset();

    this.showAddModal.set(true);
  }
  // ------------------------------- PAGINATION AND SORTING FUNCTION -------------------------------------------------
  onTableChange(request: PagedRequest): void {
    this.tableState.set(request);

    this.applyTableOperations();
  }
  private applyTableOperations(): void {
    let data = [...this.allData()];

    // Business Role filter
    if (this.selectedBusinessRoleId() !== '') {
      data = data.filter((x) => x.businessRoleId === this.selectedBusinessRoleId());
    }

    // Metric Classification filter
    if (this.selectedCategoryCode() !== '') {
      data = data.filter((x) => x.categoryCode === this.selectedCategoryCode());
    }

    const state = this.tableState();

    // sorting
    if (state.sortBy && state.sortDir) {
      data.sort((a, b) => {
        const valueA = a[state.sortBy as keyof BusinessRoleMappingModel] ?? '';

        const valueB = b[state.sortBy as keyof BusinessRoleMappingModel] ?? '';

        const comparison = String(valueA).localeCompare(String(valueB));

        return state.sortDir === 'asc' ? comparison : -comparison;
      });
    }

    this.pageTotal.set(data.length);

    // paging
    const start = state.page * state.pageSize;
    const end = start + state.pageSize;

    this.pageData.set(data.slice(start, end));
  }
  // FILTER METHODS
  onBusinessRoleFilterChange(value: string | null): void {
    this.selectedBusinessRoleId.set(value ?? '');

    this.resetToFirstPage();

    this.applyTableOperations();
  }

  onCategoryFilterChange(value: string): void {
    this.selectedCategoryCode.set(value);

    this.resetToFirstPage();

    this.applyTableOperations();
  }

  clearFilters(): void {
    this.selectedBusinessRoleId.set('');
    this.selectedUserId.set(null);
    this.loadPage();
    this.selectedCategoryCode.set('');
    this.resetToFirstPage();
    this.applyTableOperations();
  }
  private resetToFirstPage(): void {
    this.tableState.update((state) => ({
      ...state,
      page: 0,
    }));
  }
}
