import { Component, computed, DestroyRef, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  LucideAngularModule,
  LucideIconProvider,
  LUCIDE_ICONS,
  Plus,
  Trash2,
} from 'lucide-angular';
import { CardComponent, CardContentComponent } from '../../../../shared/ui/card/card.component';
import { DialogComponent } from '../../../../shared/ui/dialog/dialog.component';
import {
  DataTableComponent,
  DataColumn,
} from '../../../../shared/ui/data-table/data-table.component';
import { UserRoleCardComponent } from '../components/user-role-card/user-role-card.component';
import { UserRowComponent } from '../components/user-row/user-row.component';
import { UserRole, UserStatus } from '../../../../core/models/user.model';

import { PagedRequest } from '../../../../core/models/api-response.model';
import { NgSelectModule } from '@ng-select/ng-select';
import { SystemRoleLookup, TimeZoneLookupModel } from '../../../../core/models/lookup-model';
import { LookupService } from '../../../../core/services/lookup-service';
import { PageLoadingService } from '../../../../core/services/page-loading.service';
import {
  AppUserListModel,
  AppUserSaveModel,
  AzureAdUserLookupModel,
  DeleteUserModel,
  UpdateUserRequest,
  UserRoleSummaryModel,
} from '../models/user-model';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  forkJoin,
  map,
  of,
  Subject,
  switchMap,
} from 'rxjs';
import { AdUserService } from '../services/user-service';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { AuthorizationService, AuthStateService } from '../../../../core/auth';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { TranslocoService, TranslocoPipe } from '@jsverse/transloco';
import { ActionAccess } from '../../../../core/auth/models/authorization.model';

const ALL_ROLES: UserRole[] = [
  'Admin',
  'Project Manager',
  'Reviewer',
  'Lead Reviewer',
  'Funding Recipient',
];
const statusOptions = [
  { label: 'Active', value: true },
  { label: 'Inactive', value: false },
];
const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  Admin: 'Full system access, user management, system configuration',
  'Project Manager': 'Manage assigned projects, launch reviews, upload data',
  Reviewer: 'Review and validate submitted data and evidence',
  'Lead Reviewer': 'Approve reviews, manage reviewer assignments',
  'Funding Recipient': 'Submit data via Excel forms, upload evidence files',
};

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
    CardComponent,
    CardContentComponent,
    DialogComponent,
    DataTableComponent,
    UserRoleCardComponent,
    ButtonComponent,
    UserRowComponent,
    NgSelectModule,
    TranslocoPipe,
  ],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Plus, Trash2 }) },
  ],
  templateUrl: './users-page.component.html',
})
export class UsersPageComponent {
  private readonly pageLoadingService = inject(PageLoadingService);
  private readonly authStateService = inject(AuthStateService);
  private readonly authorizationService = inject(AuthorizationService);
  readonly actionAccess = signal<ActionAccess[]>([]);
  private readonly pageKey = 'USERMANAGEMENT';
  //////////////////////////////////////////////
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  readonly selectedStatus = signal<boolean | null>(null);
  private readonly translocoService = inject(TranslocoService);
  //
  readonly users = signal<AzureAdUserLookupModel[]>([]);
  readonly roleSummary = signal<UserRoleSummaryModel[]>([]);
  readonly userTypeahead = new Subject<string>();
  readonly userLoading = signal(false);
  private readonly azureUserService = inject(AdUserService);

  readonly searchQuery = signal('');
  readonly roleFilter = signal<UserRole | 'all'>('all');
  readonly statusFilter = signal<UserStatus | 'all'>('all');
  readonly showAddModal = signal(false);

  // pagination
  readonly totalUsers = signal(0);
  readonly currentPage = signal(1);
  readonly currentPageSize = signal(10);
  readonly loading = signal(false);

  protected readonly allRoles = ALL_ROLES;
  protected readonly roleDescriptions = ROLE_DESCRIPTIONS;
  // --------------------------------------------
  readonly systemRoles = signal<SystemRoleLookup[]>([]);
  readonly timeZones = signal<TimeZoneLookupModel[]>([]);
  readonly selectedFilterRoleId = signal<string | null>(null);
  //
  readonly userSearchResults = signal<AppUserListModel[]>([]);
  readonly selectedSearchUser = signal<AppUserListModel | null>(null);

  readonly userSearchTypeahead = new Subject<string>();
  readonly searchLoading = signal(false);
  readonly appUsers = signal<AppUserListModel[]>([]);
  // -----------------------------------------------------
  readonly isEditMode = signal(false);
  readonly editingUserId = signal<string | null>(null);
  readonly edit = output<string>();
  readonly isDeleteMode = signal(false);
  readonly deletingUser = signal<AppUserListModel | null>(null);
  // --------------------------------------------
  readonly statusOptions = statusOptions;
  tableColumns: DataColumn[] = [];

  get roleFilterModel(): string {
    return this.roleFilter();
  }
  set roleFilterModel(v: string) {
    this.roleFilter.set(v as UserRole | 'all');
    this.reloadFromFilters();
  }
  // ---------------------------------------------------------------
  protected readonly authState = inject(AuthStateService);
  readonly userId = this.authState.getCurrentUserId();
  protected readonly canAddUser = computed(() => {
    const result = this.actionAccess().some((action) => action.key === 'ADD' && action.value);
    return result;
  });

  protected readonly canEditUser = computed(() => {
    const result = this.actionAccess().some((action) => action.key === 'EDIT' && action.value);

    return result;
  });

  protected readonly canDeleteUser = computed(() => {
    const result = this.actionAccess().some((action) => action.key === 'DELETE' && action.value);
    return result;
  });
  // -----------------------------------------------------
  readonly selectedUser = signal<AzureAdUserLookupModel | null>(null);
  readonly selectedRoleId = signal<string | null>(null);
  private readonly lookupService = inject(LookupService);

  // Reactive Form
  userForm!: FormGroup;
  // -------------------------------------------

  ngOnInit(): void {
    this.pageLoadingService.stop();
    this.loadActionAccess();
    this.translocoService.load('en').subscribe(() => {
      this.initializeTableColumns();
    });
    this.initializeForm();
    this.loadLookups();
    this.loadUsers();
    this.loadRoleSummary();
    this.initializeTableColumns();
    // search typeahead
    this.userSearchTypeahead
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        switchMap((term) => {
          const searchTerm = term?.trim() ?? '';

          if (searchTerm.length < 3) {
            this.searchLoading.set(false);
            return of<AppUserListModel[]>([]);
          }

          this.searchLoading.set(true);

          return this.azureUserService
            .getUsers(1, 20, searchTerm, this.selectedFilterRoleId() ?? undefined)
            .pipe(
              map((response) => response.data?.items ?? []),
              catchError((error) => {
                console.error('Failed to search users', error);
                return of<AppUserListModel[]>([]);
              }),
              finalize(() => this.searchLoading.set(false)),
            );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((users) => {
        this.userSearchResults.set(users);
      });
    this.userTypeahead
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        switchMap((term) => {
          const searchTerm = term?.trim() ?? '';

          if (searchTerm.length < 3) {
            this.userLoading.set(false);
            return of<AzureAdUserLookupModel[]>([]);
          }

          this.userLoading.set(true);

          return this.azureUserService.searchUsers(searchTerm).pipe(
            map((response) => response.data ?? []),
            catchError((error) => {
              console.error('Failed to search users', error);
              return of<AzureAdUserLookupModel[]>([]);
            }),
            finalize(() => this.userLoading.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((users) => {
        this.users.set(users);
        console.log('Azure users:', users);
      });
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
          this.initializeTableColumns();
        },
        error: (error) => {
          console.error('[Authorization] Failed to load User Management action access:', error);

          this.actionAccess.set([]);
        },
      });
  }
  onUserClear(): void {
    this.users.set([]);
    this.userTypeahead.next('');
  }
  private initializeTableColumns(): void {
    this.tableColumns = [
      {
        key: 'displayName',
        header: this.translocoService.translate('USERS.TABLE.USER'),
        sortable: true,
        width: '28%',
      },
      {
        key: 'roleName',
        header: this.translocoService.translate('USERS.TABLE.ROLE'),
        sortable: true,
        width: '22%',
      },
      {
        key: 'isActive',
        header: this.translocoService.translate('USERS.TABLE.STATUS'),
        sortable: true,
        width: '14%',
      },
      {
        key: 'lastLoginUtc',
        header: this.translocoService.translate('USERS.TABLE.LAST_LOGIN'),
        sortable: true,
        width: '21%',
      },
    ];

    if (this.canDeleteUser()) {
      console.log('in table column', this.canDeleteUser());
      this.tableColumns.push({
        key: 'actions',
        header: this.translocoService.translate('USERS.TABLE.ACTIONS'),
        sortable: false,
        width: '15%',
      });
    }
  }
  openDeleteDialog(user: AppUserListModel): void {
    if (!this.canDeleteUser()) {
      return;
    }

    this.deletingUser.set(user);
    this.isDeleteMode.set(true);
    this.isEditMode.set(false);
    this.showAddModal.set(true);
  }
  confirmDeleteUser(): void {
    const user = this.deletingUser();

    if (!user) {
      return;
    }

    const request: DeleteUserModel = {
      userId: user.userId,
      updatedBy: String(this.authStateService.getCurrentUserId()!),
    };

    this.azureUserService
      .deleteUser(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const result = response.data;

          if (result?.hasPendingReviews) {
            const reviewIds = result.pendingReviewIds
              ?.split(',')
              .map((id) => id.trim())
              .filter(Boolean)
              .join(', ');

            this.toast.error(
              `User cannot be deleted because they have pending reviews: ${reviewIds}`,
            );

            return;
          }

          if (result?.isDeleted) {
            this.toast.success(this.translocoService.translate('USERS.MESSAGES.USER_DELETED'));

            this.showAddModal.set(false);
            this.resetAddUserForm();

            this.loadUsers();
            this.loadRoleSummary();
          }
        },
        error: (error) => {
          console.error('[UserService] Delete User Error:', error);

          const message =
            error?.error?.message ??
            this.translocoService.translate('USERS.MESSAGES.USER_DELETE_FAILED');
          this.showAddModal.set(false);
          this.resetAddUserForm();
          this.toast.error(message);
          return;
        },
      });
  }
  private initializeForm(): void {
    this.userForm = this.fb.group({
      user: [null, Validators.required],
      roleId: [null, Validators.required],
      timeZoneId: this.fb.control<number | null>(null, Validators.required),
      isActive: [true, Validators.required],
    });
  }

  // dropdown lookups
  private loadLookups(): void {
    forkJoin({
      systemRoles: this.lookupService.getSystemRoles(),
    }).subscribe({
      next: (result) => {
        this.systemRoles.set(result.systemRoles.data ?? []);
      },
      error: (error) => {
        console.error('Failed to load lookups', error);
      },
    });

    this.lookupService
      .getTimeZones('')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.timeZones.set(result.data ?? []);
        },
        error: (error) => {
          console.error('Failed to load time zones', error);
        },
      });
  }

  private loadUsers(): void {
    this.loading.set(true);

    this.azureUserService
      .getUsers(
        this.currentPage(),
        this.currentPageSize(),
        this.searchQuery() || undefined,
        this.selectedFilterRoleId() || undefined,
        this.selectedStatus(),
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.appUsers.set(response.data?.items ?? []);
          this.totalUsers.set(response.data?.totalCount ?? 0);

          this.loading.set(false);
        },
        error: (error) => {
          console.error('Failed to load users', error);
          this.loading.set(false);
        },
      });
  }

  private loadRoleSummary(): void {
    this.azureUserService
      .getRoleSummary()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.roleSummary.set(response.data ?? []);
        },
        error: (error) => {
          console.error('Failed to load role summary', error);
        },
      });
  }
  // -----------------------------------------------------

  onAddUser(): void {
    console.log('in add user function');
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      console.error('Please fill all required fields');
      return;
    }

    const formValue = this.userForm.value;
    const selectedUser = formValue.user as AzureAdUserLookupModel;

    const request: AppUserSaveModel = {
      azureAdObjectId: selectedUser.id,
      upn: selectedUser.userPrincipalName ?? '',
      displayName: selectedUser.displayName ?? '',
      email: selectedUser.mail ?? selectedUser.userPrincipalName ?? '',
      firstName: selectedUser.givenName,
      lastName: selectedUser.surname,
      phone: selectedUser.mobilePhone,
      jobTitle: selectedUser.jobTitle,
      createdBy: String(this.authStateService.getCurrentUserId()!),
      systemRoleId: formValue.roleId,
      timeZoneId: formValue.timeZoneId,
    };

    this.azureUserService
      .createUser(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          console.log('User created successfully', response);
          this.toast.success(this.translocoService.translate('USERS.MESSAGES.USER_CREATED'));
          this.showAddModal.set(false);
          this.resetAddUserForm();
          this.loadUsers(); // Reload the user list
          this.loadRoleSummary(); // Update KPI cards
        },
        error: (error) => {
          this.toast.error(
            error.error?.message ??
              this.translocoService.translate('USERS.MESSAGES.USER_CREATE_FAILED'),
          );
          this.cancelAddUser();
          // Optionally show error message to user
        },
      });
  }
  openAddDialog(): void {
    if (!this.canAddUser()) {
      return;
    }
    this.isEditMode.set(false);
    this.editingUserId.set(null);
    this.resetAddUserForm();
    this.userForm.reset({
      user: null,
      roleId: null,
      timeZoneId: null,
      isActive: true,
    });
    this.userForm.get('user')?.setValidators(Validators.required);
    this.userForm.get('user')?.updateValueAndValidity();
    this.showAddModal.set(true);
  }
  private resetAddUserForm(): void {
    this.selectedUser.set(null);
    this.selectedRoleId.set(null);
    // this.selectedTimeZone.set(null);
    this.userSearchResults.set([]);
    this.users.set([]);
    // this.timeZones.set([]);
    this.isEditMode.set(false);
    // set isactive to default
    this.isDeleteMode.set(false);
    this.editingUserId.set(null);
    this.deletingUser.set(null);
  }
  cancelAddUser(): void {
    this.showAddModal.set(false);
    this.resetAddUserForm();
    this.isDeleteMode.set(false);
    this.deletingUser.set(null);
  }

  openEditDialog(userId: string): void {
    if (!this.canEditUser()) {
      return;
    }
    this.isEditMode.set(true);
    this.editingUserId.set(userId);

    this.azureUserService
      .getUserById(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const user = res.data;

          this.selectedUser.set({
            id: user.azureAdObjectId,
            displayName: user.displayName,
            givenName: user.firstName,
            surname: user.lastName,
            userPrincipalName: user.upn,
            mail: user.email,
            mobilePhone: user.phone,

            jobTitle: user.jobTitle,
          });

          this.users.set([this.selectedUser()!]);
          this.selectedRoleId.set(user.systemRoleId);

          // Patch form values (user field is disabled in edit mode)
          this.userForm.patchValue({
            user: this.selectedUser(),
            roleId: user.systemRoleId,
            timeZoneId: user.timeZoneId,
            isActive: user.isActive,
          });

          // Remove required validator from user field in edit mode
          this.userForm.get('user')?.clearValidators();
          this.userForm.get('user')?.updateValueAndValidity();

          this.showAddModal.set(true);
        },
      });
  }
  saveUser(): void {
    console.log('in save user button handler');
    this.userForm.markAllAsTouched();
    if (this.userForm.invalid) {
      console.log(this.userForm.value);
      console.log(this.userForm.getRawValue());

      Object.keys(this.userForm.controls).forEach((key) => {
        const control = this.userForm.get(key);

        console.log({
          control: key,
          value: control?.value,
          valid: control?.valid,
          errors: control?.errors,
          status: control?.status,
        });
      });

      return;
    }
    console.log('form valid');
    if (this.isEditMode()) {
      this.onUpdateUser();
    } else {
      console.log('in add condition');
      this.onAddUser();
    }
  }
  onUpdateUser(): void {
    if (!this.editingUserId()) {
      return;
    }

    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      // console.error('Please select Role and Time Zone.');
      this.toast.info(this.translocoService.translate('USERS.VALIDATION.SELECT_ROLE_TIMEZONE'));
      return;
    }

    const formValue = this.userForm.value;
    const request: UpdateUserRequest = {
      userId: this.editingUserId()!,
      systemRoleId: formValue.roleId.toString(),
      timeZoneId: formValue.timeZoneId,
      isActive: formValue.isActive,
      updatedBy: String(this.authStateService.getCurrentUserId()!), // TODO: Logged in user
    };

    this.azureUserService
      .updateUser(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success(this.translocoService.translate('USERS.MESSAGES.USER_UPDATED'));
          this.showAddModal.set(false);
          this.resetAddUserForm();
          this.loadUsers();
          this.loadRoleSummary(); // Update KPI cards
        },
        error: (error) => {
          this.toast.error(this.translocoService.translate('USERS.MESSAGES.USER_UPDATE_FAILED'));
        },
      });
  }
  // SEARCH
  onSearch(): void {
    this.searchQuery.set(this.selectedSearchUser()?.displayName ?? '');
    this.currentPage.set(1);
    this.loadUsers();
  }
  onSearchUserClear(): void {
    this.selectedSearchUser.set(null);
    this.searchQuery.set('');
    this.userSearchTypeahead.next('');
    this.userSearchResults.set([]);
    this.loadUsers();
  }
  // FILTERS
  onRoleFilterChange(roleId: string | null): void {
    this.selectedFilterRoleId.set(roleId);

    // If the role filter changes, reset pagination and reload immediately.
    this.currentPage.set(1);
    this.loadUsers();
  }

  onStatusFilterChange(status: boolean | null): void {
    this.selectedStatus.set(status);

    this.currentPage.set(1);
    this.loadUsers();
  }

  onSearchUserChange(user: AppUserListModel | null): void {
    this.selectedSearchUser.set(user);

    // Keep searchQuery in sync with the selected user.
    this.searchQuery.set(user?.displayName ?? '');

    this.currentPage.set(1);
    this.loadUsers();
  }
  private reloadFromFilters(): void {
    this.currentPage.set(1);
    this.loadUsers();
  }
  onClearFilters(): void {
    this.selectedSearchUser.set(null);
    this.selectedFilterRoleId.set(null);
    this.selectedStatus.set(null);

    this.searchQuery.set('');
    this.userSearchResults.set([]);

    this.userSearchTypeahead.next('');

    this.currentPage.set(1);

    this.loadUsers();
  }
  onPageChange(request: PagedRequest): void {
    this.currentPage.set(request.page + 1); // convert 0-based -> 1-based
    this.currentPageSize.set(request.pageSize);

    this.loadUsers();
  }
  protected onUserRowClick(userId: string): void {
    if (!this.canEditUser()) {
      return;
    }

    this.openEditDialog(userId);
  }
}
