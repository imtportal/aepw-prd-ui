import {
  computed,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  OnInit,
  signal,
  ViewChild,
  WritableSignal,
} from '@angular/core';
import { Component } from '@angular/core';
import {
  LucideAngularModule,
  LucideIconProvider,
  LUCIDE_ICONS,
  ChevronDown,
  ChevronRight,
} from 'lucide-angular';
import { LookupService } from '../../../../../core/services/lookup-service';
import {
  AppUserLookup,
  BusinessRoleUserLookup,
  CategoryLookup,
  CityLookup,
  CountryLookup,
  FundingRecipientLookup,
  MetricCategoryLookup,
  PhaseLookup,
  ProgramLookup,
  RecordTypeLookup,
  StatusLookup,
} from '../../../../../core/models/lookup-model';
import {
  ImpactMasterMetricModel,
  ImpactMasterDetailModel,
  ImpactMasterMetricItemRequest,
  SaveImpactMasterMetricsRequest,
  UpdateImpactMasterRequest,
  MetricCategoryModel,
  CreateImpactMasterRequest,
} from '../../models/project-new.model';
import {
  FormsModule,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { catchError, finalize, forkJoin, map, of, switchMap } from 'rxjs';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder } from '@angular/forms';
import { ImpactMasterService } from '../../services/project-new.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CardComponent, CardContentComponent } from '../../../../../shared/ui/card/card.component';
import { BadgeComponent } from '../../../../../shared/ui/badge/badge.component';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { ToastService } from '../../../../../shared/ui/toast/toast.service';
import { endDateAfterStartValidator } from '../../../../../shared/validators/date.validator';
import { AuthorizationService, AuthStateService } from '../../../../../core/auth';
import { HasUnsavedChanges } from '../../../../../core/guards/unsaved-changes.guard';
import { ActionAccess } from '../../../../../core/auth/models/authorization.model';
import { ProjectDetailsComponent } from '../../components/project-details/project-details';

@Component({
  selector: 'project-form-page',
  standalone: true,
  imports: [
    FormsModule,
    NgSelectModule,
    ReactiveFormsModule,
    CardComponent,
    CardContentComponent,
    BadgeComponent,
    ButtonComponent,
    LucideAngularModule,
    ProjectDetailsComponent,
  ],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({ ChevronDown, ChevronRight }),
    },
  ],
  templateUrl: 'project-form-page.component.html',
})
export class impactFormPage implements OnInit, HasUnsavedChanges {
  private readonly authStateService = inject(AuthStateService);
  private readonly authorizationService = inject(AuthorizationService);
  private readonly pageKey = 'PROJECTMASTER';
  readonly actionAccess = signal<ActionAccess[]>([]);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // type of form
  readonly selectedRecordTypeId = signal<number | null>(null);
  readonly impactType = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('type') ?? 'project')),
    { initialValue: 'project' },
  );
  // signals for types
  readonly isProject = computed(() => this.selectedRecordTypeId() === 1);

  readonly isCorporate = computed(() => this.selectedRecordTypeId() === 2);
  readonly assignedUserLabel = computed(() => (this.isProject() ? 'CPM' : 'Corporate Approver'));

  readonly pageTitle = computed(() =>
    this.isProject() ? 'Create Project Impact' : 'Create Corporate Impact',
  );
  readonly saveButtonText = computed(() => {
    if (this.isEditMode()) {
      return 'Save Changes';
    }

    return this.isProject() ? 'Create Project Record' : 'Create Corporate Record';
  });
  readonly metricsDirty = signal(false);
  expandedCategories = signal<Set<string>>(new Set());
  // /////////////////////////////////DRAFT  ///////////////////////////////////////
  readonly draftStatus = computed(() =>
    this.projectStatus().find((status) => status.statusCode === 'DRAFT'),
  );
  readonly draftStatusId = computed(() => this.draftStatus()?.statusId ?? null);

  readonly canSaveAsDraft = computed(() => {
    const draftStatusId = this.draftStatusId();

    return !!draftStatusId && this.selectedStatusId() === draftStatusId;
  });
  // ////////////////////////////////////////////////////////////////////////////
  private readonly lookupService = inject(LookupService);
  private readonly impactMasterService = inject(ImpactMasterService);
  private readonly toast = inject(ToastService);
  readonly saving = signal(false);
  private readonly destroyRef = inject(DestroyRef);
  // Lookups
  readonly programs = signal<ProgramLookup[]>([]);
  readonly cities = signal<CityLookup[]>([]);
  @ViewChild('cityDropdownContainer')
  cityDropdownContainer!: ElementRef<HTMLElement>;
  @ViewChild('budgetInput')
  budgetInput!: ElementRef<HTMLInputElement>;
  readonly phases = signal<PhaseLookup[]>([]);
  // readonly recordTypes = signal<RecordTypeLookup[]>([]);
  readonly l1Users = signal<BusinessRoleUserLookup[]>([]);
  readonly l2Users = signal<BusinessRoleUserLookup[]>([]);
  readonly l3Users = signal<BusinessRoleUserLookup[]>([]);
  readonly fundingRecipients = signal<FundingRecipientLookup[]>([]);
  readonly projectStatus = signal<StatusLookup[]>([]);
  readonly projectCategories = signal<CategoryLookup[]>([]);
  readonly metricCategories = signal<MetricCategoryLookup[]>([]);

  readonly impactMasterId = signal<string | null>(null);
  readonly projectDetailsId = computed(() => {
    const id = Number(this.impactMasterId());
    return Number.isFinite(id) && id > 0 ? id : null;
  });
  isEditMode = signal(false);
  readonly editableMetrics = signal<MetricCategoryModel[]>([]);
  readonly projectDetail = signal<ImpactMasterDetailModel | null>(null);
  // searches
  // ACTION SIGNALS
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
  protected readonly canSaveRecord = computed(() => {
    if (this.isEditMode()) {
      return this.isProject() ? this.canEditProject() : this.canEditCorporate();
    }

    return this.isProject() ? this.canAddProject() : this.canAddCorporate();
  });

  protected readonly canAssignProjectApprover = computed(() =>
    this.actionAccess().some((action) => action.key === 'ASSIGNPRJAPPROVER' && action.value),
  );

  protected readonly canAssignCorporateApprover = computed(() =>
    this.actionAccess().some((action) => action.key === 'ASSIGNCRPAPPROVER' && action.value),
  );

  protected readonly canEditMetricApplicability = computed(() =>
    this.actionAccess().some((action) => action.key === 'EDITMETRICAPPLICABILITY' && action.value),
  );

  protected readonly canEditRiskAdjustment = computed(() =>
    this.actionAccess().some((action) => action.key === 'EDITRISKADJUSTMENT' && action.value),
  );

  protected readonly canEditBaseline = computed(() =>
    this.actionAccess().some((action) => action.key === 'EDITBASELINE' && action.value),
  );
  // STATUS ----------------------------------------------------------------
  private setDefaultStatus(): void {
    const draftStatus = this.draftStatus();

    if (draftStatus) {
      this.impactForm.controls.statusId.setValue(draftStatus.statusId);
    }
  }
  saveAsDraft(): void {
    console.log('FORM STATUS:', this.impactForm.status);

    Object.entries(this.impactForm.controls).forEach(([name, control]) => {
      console.log(name, {
        value: control.value,
        valid: control.valid,
        touched: control.touched,
        dirty: control.dirty,
        errors: control.errors,
      });
    });
    const draftStatusId = this.draftStatusId();

    if (!draftStatusId) {
      this.toast.error('Draft status is not available.');
      return;
    }

    if (this.impactForm.controls.statusId.value !== draftStatusId) {
      this.toast.error('Please change status to Draft before saving as draft.');
      return;
    }
    const selectedStatusId = this.impactForm.controls.statusId.value;
    if (selectedStatusId !== draftStatusId) {
      this.toast.error('Please change status to Draft before saving as draft.');
      return;
    }

    const titleControl = this.impactForm.controls.title;
    const pinControl = this.impactForm.controls.pin;

    // Mark draft-required fields as touched
    titleControl.markAsTouched();

    if (this.isProject()) {
      pinControl.markAsTouched();
    }

    const title = titleControl.value?.trim() ?? '';
    const pin = pinControl.value?.trim() ?? '';

    // Title required for both Project and Corporate
    if (!title) {
      this.toast.error(
        this.isProject() ? 'Project Title is required.' : 'Corporate Name is required.',
      );
      return;
    }

    // PIN required only for Project
    if (this.isProject() && !pin) {
      this.toast.error('Project PIN is required.');
      return;
    }

    // validation will be added in Part 2
    if (!this.validateDraft()) {
      return;
    }

    // Ensure request contains Draft status
    this.impactForm.controls.statusId.setValue(draftStatusId);

    if (this.isEditMode()) {
      this.updateProject();
    } else {
      this.createProject();
    }
  }
  private validateDraft(): boolean {
    const form = this.impactForm.getRawValue();

    // Title is required for both Project and Corporate
    if (!form.title?.trim()) {
      this.toast.error(
        this.isProject() ? 'Project Title is required.' : 'Corporate Name is required.',
      );
      return false;
    }

    // PIN is required only for Project
    if (this.isProject() && !form.pin?.trim()) {
      this.toast.error('Project PIN is required.');
      return false;
    }

    return true;
  }
  // /////////////////////////////////////////////////////////////////////////////////////////////////
  hasUnsavedChanges(): boolean {
    if (this.saving()) {
      return false;
    }

    return this.impactForm.dirty || this.metricsDirty();
  }
  // selected signals
  readonly selectedProgramId = signal<string | null>(null);
  // readonly selectedFundingRecipientIds = signal<string[]>([]);

  readonly selectedCategoryId = signal<string | null>(null);
  readonly selectedPhaseId = signal<string | null>(null);
  // readonly selectedRecordTypeId = signal<string | null>(null);
  // Country/city signals
  readonly countries = signal<CountryLookup[]>([]);
  readonly hoveredCountry = signal<CountryLookup | null>(null);
  readonly selectedCityIds = signal<string[]>([]);
  readonly citySearch = signal('');
  readonly dropdownOpen = signal(false);
  // //////////////////////////////////////////////////////////////////////////
  readonly selectedFundingRecipients = computed(() => {
    const ids = this.impactForm.controls.fundingRecipientIds.value ?? [];

    return this.fundingRecipients().filter((fr) => ids.includes(fr.fundingRecipientId));
  });
  //////////////////////////////////////////////////////////////////////////
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.dropdownOpen()) {
      return;
    }

    const target = event.target as Node;

    if (this.cityDropdownContainer && !this.cityDropdownContainer.nativeElement.contains(target)) {
      this.dropdownOpen.set(false);
    }
  }
  readonly filteredCities = computed(() => {
    const country = this.hoveredCountry();

    if (!country) {
      return [];
    }

    const search = this.citySearch().toLowerCase();

    return country.cities.filter((c) => c.cityName.toLowerCase().includes(search));
  });
  readonly selectedCities = computed(() => {
    const ids = this.selectedCityIds();

    return this.countries()
      .flatMap((country) =>
        country.cities.map((city) => ({
          ...city,
          countryName: country.countryName,
        })),
      )
      .filter((city) => ids.includes(city.cityId));
  });
  toggleCity(city: CityLookup) {
    const ids = [...this.selectedCityIds()];

    const index = ids.indexOf(city.cityId);

    if (index >= 0) {
      ids.splice(index, 1);
    } else {
      ids.push(city.cityId);
    }

    this.selectedCityIds.set(ids);

    this.impactForm.patchValue({
      cityIds: ids,
    });

    // Mark as touched to trigger validation display
    this.impactForm.controls.cityIds.markAsTouched();
    this.impactForm.controls.cityIds.updateValueAndValidity();
  }
  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.dropdownOpen.update((v) => !v);
  }
  toggleCategory(categoryCode: string): void {
    const current = new Set(this.expandedCategories());

    if (current.has(categoryCode)) {
      current.delete(categoryCode);
    } else {
      current.add(categoryCode);
    }

    this.expandedCategories.set(current);
  }
  isExpanded(categoryCode: string): boolean {
    return this.expandedCategories().has(categoryCode);
  }
  private initializeExpandedCategories(): void {
    this.expandedCategories.set(new Set(this.editableMetrics().map((c) => c.categoryCode)));
  }
  removeFundingRecipient(id: string) {
    const ids = (this.impactForm.controls.fundingRecipientIds.value ?? []).filter((x) => x !== id);

    this.impactForm.controls.fundingRecipientIds.setValue(ids);
    this.impactForm.controls.fundingRecipientIds.markAsTouched();
    this.impactForm.controls.fundingRecipientIds.updateValueAndValidity();
  }

  removeCity(id: string) {
    const ids = this.selectedCityIds().filter((x) => x !== id);

    this.selectedCityIds.set(ids);

    this.impactForm.patchValue({
      cityIds: ids,
    });

    // Mark as touched to trigger validation display
    this.impactForm.controls.cityIds.markAsTouched();
    this.impactForm.controls.cityIds.updateValueAndValidity();
  }
  readonly isFinalSaveMode = signal(false);
  //   this.route.queryParamMap.subscribe(params => {
  //   const type = params.get('type');
  // });
  readonly metricValidationError = signal('');

  // Track validation errors for individual metrics
  readonly metricFieldErrors = signal<Map<string, { riskPct?: string; baselinePct?: string }>>(
    new Map(),
  );

  private readonly invalidSharePointFolderName: ValidatorFn = (
    control: AbstractControl,
  ): ValidationErrors | null => {
    const value = String(control.value ?? '');

    if (!value) {
      return null;
    }

    return /["*:<>?\/\\|\u0000-\u001F\u007F]/u.test(value)
      ? { invalidSharePointCharacters: true }
      : null;
  };

  // Approval level checkboxes
  readonly requireL2Approver = signal(false);
  readonly requireL3Approver = signal(false);
  readonly requireCorporateApprover = signal(false);

  // Parent-child metric expand/collapse
  protected readonly expandedMetrics = signal<Set<string>>(new Set());
  // ////////////////////////////////////////// FORM //////////////////////////////////////////
  private readonly fb = inject(FormBuilder);
  readonly impactForm = this.fb.group(
    {
      pin: this.fb.control('', [Validators.required, this.invalidSharePointFolderName]),
      title: this.fb.control(''),
      description: this.fb.control(''),

      programId: this.fb.control<string | null>(null),
      fundingRecipientIds: this.fb.control<string[]>([]),

      l1UserId: this.fb.control<string | null>(null),
      l2ApproverUserId: this.fb.control<string | null>(null),
      l3ApproverUserId: this.fb.control<string | null>(null),
      corporateApproverUserId: this.fb.control<string | null>(null),

      recordTypeId: this.fb.control<string | null>(null),
      phaseId: this.fb.control<string | null>(null),
      categoryId: this.fb.control<string | null>(null),

      startDate: this.fb.control<string | null>(null),
      endDate: this.fb.control<string | null>(null),
      actualCompletionDate: this.fb.control<string | null>(null),
      lastFieldCheckDate: this.fb.control<string | null>(null),

      // reportingFrequency: this.fb.control<string | null>(null),

      totalFunding: this.fb.control<number | null>(null, [Validators.min(0)]),

      internalReferences: this.fb.control(''),
      fieldCheckReport: this.fb.control(''),

      statusId: this.fb.control<string | null>(null),

      cityIds: this.fb.control<string[]>([]),
    },
    {
      validators: endDateAfterStartValidator,
    },
  );
  form = this.impactForm.getRawValue();
  readonly selectedStatusId = toSignal(this.impactForm.controls.statusId.valueChanges, {
    initialValue: this.impactForm.controls.statusId.value,
  });
  // readonly countryId = toSignal(this.impactForm.controls.countryId.valueChanges, {
  //   initialValue: this.impactForm.controls.countryId.value,
  // });

  ngOnInit(): void {
    this.loadActionAccess();
    const recordTypeId = Number(this.route.snapshot.queryParamMap.get('recordTypeId'));
    console.log('record type id is:' + recordTypeId);
    if (!Number.isNaN(recordTypeId)) {
      this.selectedRecordTypeId.set(recordTypeId);
      this.impactForm.patchValue({
        recordTypeId: recordTypeId.toString(),
      });
    }
    this.configureValidators();

    this.impactForm.updateValueAndValidity();
    const impactMasterId = this.route.snapshot.paramMap.get('impactMasterId');
    ///////////////////////////////////////////////////////////////////

    console.log('imapct master id in form' + impactMasterId);
    if (impactMasterId) {
      this.isEditMode.set(true);
      console.log(impactMasterId);
      this.impactMasterId.set(impactMasterId);
      this.loadLookups(impactMasterId);
      this.loadProject(impactMasterId);
    } else {
      this.loadLookups(null);
      this.loadMetricTemplate();
    }
    this.loadBusinessRoleUsers('L1APPROVER', this.l1Users, impactMasterId ?? undefined);

    this.loadBusinessRoleUsers('L2APPROVER', this.l2Users, impactMasterId ?? undefined);

    this.loadBusinessRoleUsers('L3APPROVER', this.l3Users, impactMasterId ?? undefined);
    // Update validation for date fields and form-level validator
    this.impactForm.controls.startDate.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.impactForm.controls.startDate.updateValueAndValidity({ emitEvent: false });
        this.impactForm.controls.endDate.updateValueAndValidity({ emitEvent: false });
        this.impactForm.updateValueAndValidity();
      });

    this.impactForm.controls.endDate.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.impactForm.controls.startDate.updateValueAndValidity({ emitEvent: false });
        this.impactForm.controls.endDate.updateValueAndValidity({ emitEvent: false });
        this.impactForm.updateValueAndValidity();
      });

    // Ensure ng-select controls update validation state on change
    this.impactForm.controls.programId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.impactForm.controls.programId.updateValueAndValidity({ emitEvent: false });
      });

    this.impactForm.controls.l1UserId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.impactForm.controls.l1UserId.updateValueAndValidity({ emitEvent: false });
      });

    this.impactForm.controls.l2ApproverUserId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.impactForm.controls.l2ApproverUserId.updateValueAndValidity({
          emitEvent: false,
        });

        this.impactForm.updateValueAndValidity({
          emitEvent: false,
        });
      });

    this.impactForm.controls.l3ApproverUserId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.impactForm.controls.l3ApproverUserId.updateValueAndValidity({
          emitEvent: false,
        });

        this.impactForm.updateValueAndValidity({
          emitEvent: false,
        });
      });

    this.impactForm.controls.corporateApproverUserId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.impactForm.controls.corporateApproverUserId.updateValueAndValidity({
          emitEvent: false,
        });
      });

    this.impactForm.controls.recordTypeId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.impactForm.controls.recordTypeId.updateValueAndValidity({ emitEvent: false });
      });

    this.impactForm.controls.categoryId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.impactForm.controls.categoryId.updateValueAndValidity({ emitEvent: false });
      });

    this.impactForm.controls.statusId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.impactForm.controls.statusId.updateValueAndValidity({ emitEvent: false });
      });

    // Initialize approval checkboxes based on existing data in edit mode
    if (this.isEditMode()) {
      const l2Value = this.impactForm.controls.l2ApproverUserId.value;
      const l3Value = this.impactForm.controls.l3ApproverUserId.value;
      if (l2Value) {
        this.requireL2Approver.set(true);
      }
      if (l3Value) {
        this.requireL3Approver.set(true);
      }
    }
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

          this.applyApproverActionPermissions();
        },
        error: (error) => {
          console.error('[Authorization] Failed to load User Management action access:', error);

          this.actionAccess.set([]);

          this.applyApproverActionPermissions();
        },
      });
  }
  /**
   * Enables/disables the approver FormControls based on action access permissions.
   */
  private applyApproverActionPermissions(): void {
    const l2Control = this.impactForm.controls.l2ApproverUserId;
    const l3Control = this.impactForm.controls.l3ApproverUserId;
    const corporateApproverControl = this.impactForm.controls.corporateApproverUserId;
    console.log('can assign project approver', this.canAssignProjectApprover());
    if (this.isCorporate()) {
      if (this.canAssignCorporateApprover()) {
        l2Control.enable({ emitEvent: false });
      } else {
        l2Control.disable({ emitEvent: false });
      }
      l3Control.disable({ emitEvent: false });
    } else if (this.canAssignProjectApprover()) {
      l2Control.enable({ emitEvent: false });
      l3Control.enable({ emitEvent: false });
    } else {
      l2Control.disable({ emitEvent: false });
      l3Control.disable({ emitEvent: false });
    }

    if (this.canAssignCorporateApprover()) {
      corporateApproverControl.enable({ emitEvent: false });
    } else {
      corporateApproverControl.disable({ emitEvent: false });
    }
  }
  // Load Lookups
  private loadLookups(impactMasterId: string | null): void {
    console.log('impact master id in loadlookup...........' + impactMasterId);
    forkJoin({
      programs: this.lookupService.getPrograms(),
      cities: this.lookupService.getCities(),
      statuses: this.lookupService.getStatusesByModule('ImpactMaster', '', impactMasterId),
      phases: this.lookupService.getPhases(),
      projectCategories: this.lookupService.getProjectCategories(),
      fundingRecipients: this.lookupService.getFundingRecipients(),
      metricCategories: this.lookupService.getMetricCategories(),
    }).subscribe({
      next: (result) => {
        this.programs.set(result.programs.data ?? []);
        // Convert cityId to string when receiving from backend
        const countries = (result.cities.data ?? []).map((country) => ({
          ...country,
          cities: country.cities.map((city) => ({
            ...city,
            cityId: String(city.cityId), // Explicit conversion to string
          })),
        }));
        this.countries.set(countries);

        if (countries.length > 0) {
          this.hoveredCountry.set(countries[0]);
        }
        this.fundingRecipients.set(result.fundingRecipients.data ?? []);
        this.phases.set(result.phases.data ?? []);
        this.projectStatus.set(result.statuses.data ?? []);
        // Default status for draft
        if (!this.isEditMode()) {
          this.setDefaultStatus();
        }
        this.projectCategories.set(result.projectCategories.data ?? []);
        this.metricCategories.set(result.metricCategories.data ?? []);
      },
      error: (err) => console.error(err),
    });
  }
  // LOAD PROJECT ON EDIT
  private loadProject(impactMasterId: string): void {
    this.isEditMode.set(true);
    console.log(this.isEditMode());
    this.impactMasterId.set(impactMasterId);
    forkJoin({
      detail: this.impactMasterService.getImpactMasterById(impactMasterId),
      metrics: this.impactMasterService.getMetricsForImpactMaster(impactMasterId),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ detail, metrics }) => {
          this.patchImpactForm(detail.data);
          this.editableMetrics.set(JSON.parse(JSON.stringify(metrics.data)));
          this.initializeParentBaselinePct();
          this.projectDetail.set(detail.data);

          // Seed user dropdowns with currently selected users
          this.setSelectedUser(this.l1Users, detail.data.l1UserId, detail.data.l1UserName);
          this.setSelectedUser(
            this.l2Users,
            detail.data.l2ApproverUserId,
            detail.data.l2ApproverUserName,
          );
          this.setSelectedUser(
            this.l3Users,
            detail.data.l3ApproverUserId,
            detail.data.l3ApproverUserName,
          );
          console.log(detail.data.l3ApproverUserId);
          console.log(detail.data.l3ApproverUserName);

          console.log(detail.data.corporateApproverUserId);
          console.log(detail.data.corporateApproverUserName);
          // Set approval checkboxes based on existing data
          if (detail.data.l2ApproverUserId) {
            this.requireL2Approver.set(true);
          }
          if (detail.data.l3ApproverUserId) {
            this.requireL3Approver.set(true);
          }
          if (this.isCorporate() && detail.data.l2ApproverUserId) {
            this.requireCorporateApprover.set(true);
          }
          // Keep the full funding recipient list available in edit mode and add any
          // selected values that are not already present in the lookup set.
          const selectedFundingRecipients = detail.data.fundingRecipients ?? [];
          if (selectedFundingRecipients.length > 0) {
            const existing = this.fundingRecipients();
            const existingIds = new Set(existing.map((fr) => fr.fundingRecipientId));

            const merged = [
              ...existing,
              ...selectedFundingRecipients
                .filter((fr) => !existingIds.has(fr.fundingRecipientId))
                .map((fr) => ({
                  fundingRecipientId: fr.fundingRecipientId,
                  orgName: fr.fundingRecipientOrgName,
                  name: fr.fundingRecipientName,
                  countryCode: '',
                  countryId: '',
                  countryName: '',
                })),
            ];

            this.fundingRecipients.set(merged);
          }

          // Initialize expanded metrics after loading
          this.initializeExpandedMetrics();
          this.initializeExpandedCategories();

          // Clear any existing validation errors
          this.metricFieldErrors.set(new Map());
        },
      });
  }
  private loadMetricTemplate(): void {
    const recordTypeId = this.selectedRecordTypeId();

    if (recordTypeId === null) {
      return;
    }
    this.impactMasterService.getMetrics(recordTypeId.toString()).subscribe({
      next: (response) => {
        console.log('Metrics API Response:', response);
        console.log('Categories:', response.data);
        this.editableMetrics.set(response.data ?? []);
        this.initializeParentRiskPct();
        this.initializeParentBaselinePct();
        this.initializeExpandedMetrics();
        this.initializeExpandedCategories();
        console.log('Signal value:', this.editableMetrics());

        // Clear any existing validation errors
        this.metricFieldErrors.set(new Map());
      },
    });
  }

  // CREATE PROJECT
  private createProject(): void {
    const form = this.impactForm.getRawValue();

    const request: CreateImpactMasterRequest = {
      pin: this.isProject() ? form.pin : null,
      title: form.title ?? '',

      programId: form.programId || null,
      fundingRecipientIds: form.fundingRecipientIds ?? [],

      l1UserId: form.l1UserId ?? null,
      l2ApproverUserId: form.l2ApproverUserId ?? null,
      l3ApproverUserId: this.isCorporate() ? null : (form.l3ApproverUserId ?? null),
      corporateApproverUserId: form.corporateApproverUserId ?? null,

      recordTypeId: form.recordTypeId ?? '',

      phaseId: form.phaseId || null,
      categoryId: form.categoryId || null,

      description: form.description ?? null,

      startDate: form.startDate || null,
      endDate: form.endDate || null,
      actualCompletionDate: form.actualCompletionDate || null,

      totalFunding: form.totalFunding ?? null,

      internalReferences: form.internalReferences ?? null,
      fieldCheckReport: form.fieldCheckReport ?? null,
      lastFieldCheckDate: form.lastFieldCheckDate || null,

      statusId: form.statusId || null,

      createdBy: this.authStateService.getCurrentUserId()!,
      cityIds: form.cityIds ?? [],
    };

    console.log('[Create Impact Master Request]', request);

    this.saving.set(true);

    this.impactMasterService
      .saveImpactMaster(request)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: (response) => {
          console.log('[Create Project Response]', response);

          const impactMasterId = response.data.impactMasterId;

          const metricRequest = this.buildMetricRequest(impactMasterId);

          console.log('[Save Metrics Request]', JSON.stringify(metricRequest, null, 2));

          this.impactMasterService
            .saveImpactMasterMetrics(impactMasterId, metricRequest)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: (metricResponse) => {
                console.log('[Save Metrics Response]', metricResponse);
                this.impactForm.markAsPristine();
                this.metricsDirty.set(false);
                // redirect to listing page with list refreshed
                this.router.navigate(['/admin/projects']);
                if (this.isCorporate()) {
                  this.toast.success('Corporate Record saved successfully');
                } else {
                  this.toast.success('Project Record saved successfully');
                }

                //
              },
              error: (error) => {
                console.log('Metrics Error', error);
                console.log('Metrics Error Payload', error.error);
                console.log('Metrics Error Status', error.status);
                this.toast.error(error.error?.message ?? 'Metrics failed to save');
              },
            });
        },
        error: (err) => {
          this.toast.error(err.error?.message ?? 'Project failed to create');
          console.error('[Create Project Error]', err);
        },
      });
  }
  private patchImpactForm(project: ImpactMasterDetailModel): void {
    const fundingRecipientIds = (project.fundingRecipients ?? []).map(
      (fr) => fr.fundingRecipientId,
    );

    this.impactForm.patchValue({
      pin: project.pin,
      title: project.title,
      description: project.description,

      programId: project.programId,
      fundingRecipientIds,

      l1UserId: project.l1UserId,
      l2ApproverUserId: project.l2ApproverUserId,
      l3ApproverUserId: this.isCorporate() ? null : project.l3ApproverUserId,
      corporateApproverUserId: project.corporateApproverUserId,

      recordTypeId: project.recordTypeId,
      phaseId: project.phaseId,
      categoryId: project.categoryId,

      startDate: project.startDate?.split('T')[0] ?? null,
      endDate: project.endDate?.split('T')[0] ?? null,
      actualCompletionDate: project.actualCompletionDate?.split('T')[0] ?? null,

      totalFunding: project.totalFunding,

      internalReferences: project.internalReferences,
      fieldCheckReport: project.fieldCheckReport,
      lastFieldCheckDate: project.lastFieldCheckDate?.split('T')[0] ?? null,

      statusId: project.statusId,

      cityIds: (project.cities ?? []).map((c) => String(c.cityId)),
    });

    // Format the existing budget for display.
    if (project.totalFunding !== null && project.totalFunding !== undefined && this.budgetInput) {
      this.budgetInput.nativeElement.value = this.formatBudget(project.totalFunding);
    }

    this.selectedCityIds.set((project.cities ?? []).map((c) => String(c.cityId)));

    // Update validation state for all patched controls
    Object.keys(this.impactForm.controls).forEach((key) => {
      const control = this.impactForm.get(key);
      if (control) {
        control.updateValueAndValidity({ emitEvent: false });
      }
    });
    this.impactForm.updateValueAndValidity();
  }

  ///////////////////////////////////////////////////

  updateProject(): void {
    const impactMasterId = this.impactMasterId();

    console.log(impactMasterId);
    if (!impactMasterId) {
      console.error('[ProjectDetailSheet] Project Id not found');
      return;
    }
    const updatedBy = this.authStateService.getCurrentUserId()!;

    const projectRequest: UpdateImpactMasterRequest = {
      ...this.buildUpdateProjectRequest(),
      updatedBy,
    };

    const metrics: ImpactMasterMetricItemRequest[] = [];

    for (const cat of this.editableMetrics()) {
      this.collectSelected(cat.metrics, metrics);
    }

    const metricsRequest: SaveImpactMasterMetricsRequest = {
      impactMasterId,
      metrics,
      updatedBy,
    };

    this.saving.set(true);

    this.impactMasterService
      .saveImpactMasterById(impactMasterId, projectRequest)
      .pipe(
        switchMap(() =>
          this.impactMasterService.saveImpactMasterMetrics(impactMasterId, metricsRequest),
        ),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          console.log('[ProjectDetailSheet] Project and metrics updated successfully');
          this.impactForm.markAsPristine();
          this.metricsDirty.set(false);
          if (this.isCorporate()) {
            this.toast.success('Corporate Record updated successfully');
          } else {
            this.toast.success('Project Record updated successfully');
          }

          // navigate or show toast here
          // this.router.navigate(['/admin/projects']);
          this.router.navigate(['/admin/projects']);
        },
        error: (err) => {
          console.error('[ProjectDetailSheet] Project update failed', err);

          this.toast.error(err.error?.message ?? 'Failed to update record');
        },
      });
  }

  onSave(): void {
    this.isFinalSaveMode.set(true);
    if (this.isProject()) {
      this.validateRequiredBaselines();
    }

    // Update approval validation before checking form validity
    this.updateApprovalValidation();

    // Mark all form fields as touched to display validation errors
    this.impactForm.markAllAsTouched();
    // Draft cannot be used for final save
    if (!this.validateFinalStatus()) {
      return;
    }
    // Check both metric field errors and form errors
    const hasMetricErrors = this.metricFieldErrors().size > 0;
    const hasFormErrors = this.impactForm.invalid;
    // Metric validation banner should only represent metric errors.
    if (hasMetricErrors) {
      this.metricValidationError.set('Please fill all the mandatory fields.');
      this.toast.error('Please fill all the mandatory fields.');
      return;
    }

    // Form errors are handled by their respective field/section validation messages.
    if (hasFormErrors) {
      this.metricValidationError.set('');

      if (this.impactForm.hasError('atLeastOneApproverRequired')) {
        this.toast.error(
          'At least one approver must be selected: Global Execution Leader or Program Leader.',
        );
      } else {
        this.toast.error('Please fill all the mandatory fields.');
      }

      return;
    }

    this.metricValidationError.set('');

    // Clear any previous metric validation errors
    this.metricValidationError.set('');

    if (this.isEditMode()) {
      console.log('in edit');
      this.updateProject();
    } else {
      this.createProject();
    }
  }

  private validateFinalStatus(): boolean {
    const statusControl = this.impactForm.controls.statusId;
    const draftStatusId = this.draftStatusId();
    const selectedStatusId = statusControl.value;

    if (draftStatusId && selectedStatusId === draftStatusId) {
      statusControl.setErrors({
        ...statusControl.errors,
        draftNotAllowed: true,
      });

      statusControl.markAsTouched();

      this.toast.error('Please change the status from Draft before saving.');

      return false;
    }

    // Remove only our custom error
    if (statusControl.hasError('draftNotAllowed')) {
      const errors = { ...statusControl.errors };
      delete errors['draftNotAllowed'];

      statusControl.setErrors(Object.keys(errors).length ? errors : null);
    }

    return true;
  }

  onBack() {
    this.router.navigate(['/admin/projects']);
  }
  private buildUpdateProjectRequest(): UpdateImpactMasterRequest {
    const form = this.impactForm.getRawValue();

    return {
      impactMasterId: this.impactMasterId() ?? '',

      pin: this.isProject() ? form.pin : null,

      title: form.title ?? '',
      description: form.description ?? null,

      programId: form.programId ?? '',
      fundingRecipientIds: form.fundingRecipientIds ?? [],

      l1UserId: form.l1UserId ?? '',
      l2ApproverUserId: form.l2ApproverUserId ?? null,
      l3ApproverUserId: this.isCorporate() ? null : (form.l3ApproverUserId ?? null),
      corporateApproverUserId: form.corporateApproverUserId ?? null,

      recordTypeId: form.recordTypeId ?? '',

      phaseId: form.phaseId ?? null,
      categoryId: form.categoryId ?? null,

      startDate: form.startDate || null,
      endDate: form.endDate || null,
      actualCompletionDate: form.actualCompletionDate || null,

      totalFunding: form.totalFunding ?? null,

      internalReferences: form.internalReferences ?? null,
      fieldCheckReport: form.fieldCheckReport ?? null,
      lastFieldCheckDate: form.lastFieldCheckDate || null,

      statusId: form.statusId ?? '',

      updatedBy: this.authStateService.getCurrentUserId()!,

      cityIds: form.cityIds ?? [],
    };
  }

  //----------------------------------------- METRIC HANDLERS ----------------------------------------------------------------

  // Build Metric Request
  private buildMetricRequest(impactMasterId: string): SaveImpactMasterMetricsRequest {
    const metrics: ImpactMasterMetricItemRequest[] = [];

    for (const cat of this.editableMetrics()) {
      this.collectSelected(cat.metrics, metrics);
    }

    console.log('[Flattened Metrics]', metrics);
    return {
      impactMasterId: String(impactMasterId),
      metrics,
      updatedBy: this.authStateService.getCurrentUserId()!,
    };
  }

  toggleRequired(catIdx: number, metricIdx: number, childIdx: number): void {
    this.editableMetrics.update((cats) => {
      const clone = structuredClone(cats);

      const child = clone[catIdx].metrics[metricIdx].children[childIdx];

      // child.isRequired = !child.isRequired;

      return clone;
    });
  }
  updateEvidenceRequiredById(metricId: string, evidenceRequiredMin: number): void {
    this.metricsDirty.set(true);
    this.editableMetrics.update((categories) =>
      categories.map((category) => ({
        ...category,
        metrics: category.metrics.map((parent) => ({
          ...parent,
          children: parent.children.map((child) =>
            child.metricId === metricId
              ? {
                  ...child,
                  evidenceRequiredMin,
                }
              : child,
          ),
        })),
      })),
    );
  }
  toggleParent(catIdx: number, metricIdx: number): void {
    this.metricsDirty.set(true);
    this.editableMetrics.update((cats) => {
      const clone = cats.map((c) => ({ ...c, metrics: [...c.metrics] }));
      const metric = { ...clone[catIdx].metrics[metricIdx] };
      const newActive = !metric.isActive;
      metric.isActive = newActive;
      metric.children = metric.children.map((c) => ({ ...c, isActive: newActive }));

      // Recalculate parent riskPct
      metric.riskPct = this.calculateParentRiskPct(metric.children);
      metric.baselinePct = this.calculateParentBaselinePct(metric.children);

      clone[catIdx].metrics[metricIdx] = metric;
      return clone;
    });
  }
  // Count functions for category
  readonly selectedCountForCategory = computed(() => {
    const map = new Map<string, number>();

    for (const cat of this.editableMetrics()) {
      map.set(cat.categoryCode, this.countSelected(cat.metrics));
    }

    return map;
  });
  readonly totalCountForCategory = computed(() => {
    const map = new Map<string, number>();

    for (const cat of this.editableMetrics()) {
      map.set(cat.categoryCode, this.countAll(cat.metrics));
    }

    return map;
  });
  toggleChild(catIdx: number, metricIdx: number, childIdx: number): void {
    this.metricsDirty.set(true);
    this.editableMetrics.update((cats) => {
      const clone = cats.map((c) => ({ ...c, metrics: [...c.metrics] }));
      const metric = { ...clone[catIdx].metrics[metricIdx] };
      const children = [...metric.children];
      children[childIdx] = { ...children[childIdx], isActive: !children[childIdx].isActive };
      // Parent selected only if ALL children are selected
      metric.isActive = children.some((c) => c.isActive);
      metric.children = children;

      // Recalculate parent riskPct
      metric.riskPct = this.calculateParentRiskPct(children);
      metric.baselinePct = this.calculateParentBaselinePct(children);

      clone[catIdx].metrics[metricIdx] = metric;
      return clone;
    });
  }

  updateRiskPctById(metricId: string, rawValue: string): void {
    this.metricsDirty.set(true);
    // Parse and validate value
    let value: number | null = null;
    let errorMessage: string | undefined = undefined;

    if (rawValue !== '') {
      const numValue = Number(rawValue);
      if (isNaN(numValue)) {
        errorMessage = 'Invalid number';
      } else if (numValue < 0) {
        errorMessage = 'Risk adjustment cannot be negative';
      } else if (numValue > 100) {
        errorMessage = 'Risk adjustment cannot exceed 100%';
      } else {
        value = numValue;
      }
    }

    // Update validation error map
    this.metricFieldErrors.update((errors) => {
      const newErrors = new Map(errors);
      const metricErrors = newErrors.get(metricId) || {};
      if (errorMessage) {
        metricErrors.riskPct = errorMessage;
      } else {
        delete metricErrors.riskPct;
      }
      if (Object.keys(metricErrors).length > 0) {
        newErrors.set(metricId, metricErrors);
      } else {
        newErrors.delete(metricId);
      }
      return newErrors;
    });

    this.editableMetrics.update((cats) =>
      cats.map((cat) => ({
        ...cat,
        metrics: cat.metrics.map((m) => {
          // Update children and check if any child was updated
          const updatedChildren = m.children.map((c) => ({
            ...c,
            riskPct: c.metricId === metricId ? value : c.riskPct,
          }));

          // If a child was updated, recalculate parent riskPct
          const childUpdated = updatedChildren.some((c) => c.metricId === metricId);
          const parentRiskPct = childUpdated
            ? this.calculateParentRiskPct(updatedChildren)
            : m.riskPct;

          return {
            ...m,
            riskPct: parentRiskPct,
            children: updatedChildren,
          };
        }),
      })),
    );
  }

  updateBaselinePctById(metricId: string, rawValue: string): void {
    this.metricsDirty.set(true);

    let value: number | null = null;
    let errorMessage: string | undefined = undefined;

    if (rawValue !== '') {
      const numValue = Number(rawValue);

      if (Number.isNaN(numValue)) {
        errorMessage = 'Invalid number';
      } else if (numValue < 0) {
        errorMessage = 'Baseline cannot be negative';
      } else {
        value = numValue;
      }
    } else if (this.isFinalSaveMode() && this.isMetricActive(metricId)) {
      errorMessage = 'Baseline is required';
    }

    this.metricFieldErrors.update((errors) => {
      const newErrors = new Map(errors);
      const metricErrors = { ...newErrors.get(metricId) };

      if (errorMessage) {
        metricErrors.baselinePct = errorMessage;
      } else {
        delete metricErrors.baselinePct;
      }

      if (Object.keys(metricErrors).length > 0) {
        newErrors.set(metricId, metricErrors);
      } else {
        newErrors.delete(metricId);
      }

      if (newErrors.size === 0) {
        this.metricValidationError.set('');
      }
      return newErrors;
    });

    this.editableMetrics.update((cats) =>
      cats.map((cat) => ({
        ...cat,
        metrics: cat.metrics.map((m) => {
          const updatedChildren = m.children.map((c) => ({
            ...c,
            baselinePct: c.metricId === metricId ? value : c.baselinePct,
          }));
          const childUpdated = updatedChildren.some((c) => c.metricId === metricId);

          return {
            ...m,
            baselinePct: childUpdated
              ? this.calculateParentBaselinePct(updatedChildren)
              : m.baselinePct,
            children: updatedChildren,
          };
        }),
      })),
    );
  }
  private countSelected(metrics: ImpactMasterMetricModel[]): number {
    let count = 0;

    for (const metric of metrics) {
      if (metric.isActive) {
        count++;
      }

      if (metric.children?.length) {
        count += this.countSelected(metric.children);
      }
    }

    return count;
  }
  private countAll(metrics: ImpactMasterMetricModel[]): number {
    let count = 0;

    for (const metric of metrics) {
      count++;

      if (metric.children?.length) {
        count += this.countAll(metric.children);
      }
    }

    return count;
  }

  /**
   * Validates that all active child metrics have baseline values.
   * Sets validation errors for metrics missing baselines.
   */
  private validateRequiredBaselines(): void {
    this.metricFieldErrors.update((errors) => {
      const newErrors = new Map(errors);

      // Remove all existing baseline errors first.
      for (const [metricId, metricErrors] of newErrors.entries()) {
        if (metricErrors.baselinePct) {
          const updatedErrors = { ...metricErrors };
          delete updatedErrors.baselinePct;

          if (Object.keys(updatedErrors).length > 0) {
            newErrors.set(metricId, updatedErrors);
          } else {
            newErrors.delete(metricId);
          }
        }
      }

      // Rebuild baseline errors from the CURRENT active child metric values.
      for (const category of this.editableMetrics()) {
        for (const parent of category.metrics) {
          for (const child of parent.children) {
            if (child.isActive && (child.baselinePct === null || child.baselinePct === undefined)) {
              const metricErrors = newErrors.get(child.metricId) || {};

              newErrors.set(child.metricId, {
                ...metricErrors,
                baselinePct: 'Baseline is required',
              });
            }
          }
        }
      }

      return newErrors;
    });
  }

  /**
   * Checks whether the metric is an active child metric.
   */
  private isMetricActive(metricId: string): boolean {
    for (const category of this.editableMetrics()) {
      for (const parent of category.metrics) {
        for (const child of parent.children) {
          if (child.metricId === metricId) {
            return child.isActive;
          }
        }
      }
    }
    return false;
  }

  private collectSelected(
    metrics: ImpactMasterMetricModel[],
    result: ImpactMasterMetricItemRequest[],
  ): void {
    for (const m of metrics) {
      result.push({
        metricId: m.metricId,
        riskPct: m.riskPct,
        baselinePct: m.baselinePct,
        isActive: m.isActive,
      });

      if (m.children?.length) {
        this.collectSelected(m.children, result);
      }
    }
  }

  // Validators  for Save as draft and Save buttons
  private applyProjectValidators(): void {
    this.impactForm.controls.pin.setValidators([
      Validators.required,
      this.invalidSharePointFolderName,
    ]);
    this.impactForm.controls.title.setValidators([Validators.required]);
    this.impactForm.controls.programId.setValidators([Validators.required]);

    this.impactForm.controls.l1UserId.setValidators([Validators.required]);

    this.impactForm.controls.categoryId.setValidators([Validators.required]);

    this.impactForm.controls.startDate.setValidators([Validators.required]);
    // this.impactForm.controls.endDate.setValidators([Validators.required]);

    this.impactForm.controls.totalFunding.setValidators([Validators.required, Validators.min(0)]);

    this.impactForm.controls.statusId.setValidators([Validators.required]);
    this.impactForm.controls.actualCompletionDate.setValidators([]);

    this.impactForm.controls.cityIds.setValidators([this.requiredArrayValidator]);
    this.impactForm.controls.internalReferences.setValidators([this.urlValidator]);
    this.impactForm.controls.fieldCheckReport.setValidators([this.urlValidator]);
    this.impactForm.controls.fundingRecipientIds.setValidators([this.requiredArrayValidator]);

    this.impactForm.setValidators([
      endDateAfterStartValidator,
      this.atLeastOneProjectApproverValidator,
    ]);
  }
  private applyCorporateValidators(): void {
    this.impactForm.controls.title.setValidators([Validators.required]);
    this.impactForm.controls.statusId.setValidators([Validators.required]);
    this.impactForm.controls.l1UserId.setValidators([Validators.required]);

    // this.impactForm.controls.l2ApproverUserId.setValidators([Validators.required]);
  }
  private readonly urlValidator: ValidatorFn = (
    control: AbstractControl,
  ): ValidationErrors | null => {
    const value = String(control.value ?? '').trim();

    // Optional field: empty is valid
    if (!value) {
      return null;
    }

    try {
      const url = new URL(value);

      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return { url: true };
      }

      return null;
    } catch {
      return { url: true };
    }
  };
  private clearAllValidators(): void {
    Object.values(this.impactForm.controls).forEach((control) => {
      control.clearValidators();
    });

    this.impactForm.controls.totalFunding.setValidators([Validators.min(0)]);
  }
  // configure validators
  private configureValidators(): void {
    this.clearAllValidators();

    if (this.isProject()) {
      this.applyProjectValidators();
    } else {
      this.applyCorporateValidators();
    }

    Object.values(this.impactForm.controls).forEach((control) =>
      control.updateValueAndValidity({ emitEvent: false }),
    );

    this.impactForm.updateValueAndValidity();
  }

  private requiredArrayValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;

    return Array.isArray(value) && value.length > 0 ? null : { required: true };
  }

  ///////////////////////////////////////////////////////////////////////////
  private hasAtLeastOneSelectedMetric(): boolean {
    return this.editableMetrics().some((category) =>
      category.metrics.some(
        (parent) => parent.isActive || parent.children.some((child) => child.isActive),
      ),
    );
  }

  /**
   * Calculates the average Risk Adjustment (%) for a parent metric
   * based on its active child metrics that have non-null riskPct values.
   * @param children Array of child metrics
   * @returns Average riskPct or null if no eligible children exist
   */
  private calculateParentRiskPct(children: ImpactMasterMetricModel[]): number | null {
    // Filter children that are active and have a non-null riskPct value
    const validChildren = children.filter(
      (c) => c.isActive && c.riskPct !== null && c.riskPct !== undefined,
    );

    if (validChildren.length === 0) {
      return null;
    }

    const sum = validChildren.reduce((acc, child) => acc + (child.riskPct ?? 0), 0);
    return Math.round((sum / validChildren.length) * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Initializes the parent metric riskPct values by calculating
   * the average of their children's riskPct values.
   * Should be called after loading metrics from the API.
   */
  private initializeParentRiskPct(): void {
    this.editableMetrics.update((cats) =>
      cats.map((cat) => ({
        ...cat,
        metrics: cat.metrics.map((m) => ({
          ...m,
          riskPct: this.calculateParentRiskPct(m.children),
        })),
      })),
    );
  }

  private calculateParentBaselinePct(children: ImpactMasterMetricModel[]): number | null {
    const validChildren = children.filter(
      (child) => child.isActive && child.baselinePct !== null && child.baselinePct !== undefined,
    );

    if (validChildren.length === 0) {
      return null;
    }

    return validChildren.reduce((sum, child) => sum + (child.baselinePct ?? 0), 0);
  }

  private initializeParentBaselinePct(): void {
    this.editableMetrics.update((categories) =>
      categories.map((category) => ({
        ...category,
        metrics: category.metrics.map((metric) => ({
          ...metric,
          baselinePct: this.calculateParentBaselinePct(metric.children),
        })),
      })),
    );
  }

  /**
   * Updates validation for approval fields based on checkbox state.
   * Called when checkboxes change or before save.
   */
  private updateApprovalValidation(): void {
    const l2Control = this.impactForm.controls.l2ApproverUserId;
    const l3Control = this.impactForm.controls.l3ApproverUserId;
    if (this.isProject() && this.requireL2Approver()) {
      l2Control.setValidators([Validators.required]);
    } else {
      l2Control.clearValidators();

      if (
        (this.isProject() && !this.requireL2Approver()) ||
        (this.isCorporate() && !this.requireCorporateApprover())
      ) {
        l2Control.setValue(null, { emitEvent: false });
      }
    }

    if (this.isCorporate()) {
      l3Control.clearValidators();
      l3Control.setValue(null);
    } else if (this.requireL3Approver()) {
      l3Control.setValidators([Validators.required]);
    } else {
      l3Control.clearValidators();
      l3Control.setValue(null);
    }

    l2Control.updateValueAndValidity({ emitEvent: false });
    l3Control.updateValueAndValidity({ emitEvent: false });
    // IMPORTANT:
    // Re-run the form-level atLeastOneProjectApproverValidator.
    this.impactForm.updateValueAndValidity({ emitEvent: false });
  }

  /**
   * Handles Program Leader checkbox change
   */
  onL2CheckboxChange(checked: boolean): void {
    this.requireL2Approver.set(checked);
    this.updateApprovalValidation();
    this.impactForm.updateValueAndValidity({
      emitEvent: false,
    });
  }

  onCorporateApproverCheckboxChange(checked: boolean): void {
    this.requireCorporateApprover.set(checked);
    this.updateApprovalValidation();

    this.impactForm.updateValueAndValidity({
      emitEvent: false,
    });
  }

  /**
   * Handles Global Execution Leader checkbox change
   */
  onL3CheckboxChange(checked: boolean): void {
    this.requireL3Approver.set(checked);
    this.updateApprovalValidation();
  }
  private readonly atLeastOneProjectApproverValidator: ValidatorFn = (
    control: AbstractControl,
  ): ValidationErrors | null => {
    const l2ApproverUserId = control.get('l2ApproverUserId')?.value;
    const l3ApproverUserId = control.get('l3ApproverUserId')?.value;

    if (l2ApproverUserId || l3ApproverUserId) {
      return null;
    }

    return {
      atLeastOneApproverRequired: true,
    };
  };

  /**
   * Ensures the currently selected user is present in a user signal for display in ng-select,
   * without discarding the rest of the list (e.g. the full L2/L3 role list, or prior search results).
   */
  private setSelectedUser(
    target: WritableSignal<AppUserLookup[]>,
    userId?: string | null,
    userName?: string | null,
  ): void {
    if (!userId || !userName) {
      return;
    }

    const existing = target();

    if (existing.some((user) => user.userId === userId)) {
      return;
    }

    target.set([
      ...existing,
      {
        userId: userId,
        displayName: userName,
      },
    ]);
  }

  /**
   * Sets up the user search pipeline for a specific dropdown.
   * Reusable helper method that applies debouncing, minimum search length,
   * and updates the target signal with search results.
   */

  private loadBusinessRoleUsers(
    roleCode: string,
    target: WritableSignal<BusinessRoleUserLookup[]>,
    impactMasterId?: string,
  ): void {
    this.lookupService
      .getBusinessRoleUsers(roleCode, impactMasterId)
      .pipe(
        map((response) => response.data ?? []),
        catchError((error) => {
          console.error(`[Business Role Users] Failed to load ${roleCode}`, error);

          return of<BusinessRoleUserLookup[]>([]);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((users) => {
        // const usersById = new Map(target().map((user) => [user.userId, user]));

        // users.forEach((user) => usersById.set(user.userId, user));

        target.set(users);
      });
  }
  /**
   * Toggles the expand/collapse state of a parent metric.
   * @param metricId The ID of the parent metric to toggle
   * @param event Optional mouse event to stop propagation
   */
  protected toggleMetric(metricId: string, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }

    const expanded = new Set(this.expandedMetrics());

    if (expanded.has(metricId)) {
      expanded.delete(metricId);
    } else {
      expanded.add(metricId);
    }

    this.expandedMetrics.set(expanded);
  }

  /**
   * Checks if a parent metric is currently expanded.
   * @param metricId The ID of the metric to check
   * @returns True if the metric is expanded, false otherwise
   */
  protected isMetricExpanded(metricId: string): boolean {
    return this.expandedMetrics().has(metricId);
  }

  /**
   * Initializes all parent metrics that have children to be expanded by default.
   * Called after metrics are loaded from the API.
   */
  private initializeExpandedMetrics(): void {
    const expanded = new Set<string>();

    this.editableMetrics().forEach((category) => {
      category.metrics.forEach((metric) => {
        if (metric.children && metric.children.length > 0) {
          expanded.add(metric.metricId);
        }
      });
    });

    this.expandedMetrics.set(expanded);
  }

  onBudgetFocus(input: HTMLInputElement): void {
    const value = input.value.replace(/,/g, '');

    input.value = value;
  }

  onBudgetInput(event: Event): void {
    const input = event.target as HTMLInputElement;

    // Remove commas
    let value = input.value.replace(/,/g, '');

    // Allow only numbers and one decimal point
    value = value.replace(/[^\d.]/g, '');

    const firstDotIndex = value.indexOf('.');

    if (firstDotIndex !== -1) {
      value =
        value.substring(0, firstDotIndex + 1) +
        value.substring(firstDotIndex + 1).replace(/\./g, '');
    }

    input.value = value;

    const numericValue = value === '' ? null : Number(value);

    this.impactForm.controls.totalFunding.setValue(numericValue, {
      emitEvent: false,
    });

    this.impactForm.controls.totalFunding.markAsDirty();
    this.impactForm.controls.totalFunding.updateValueAndValidity({
      emitEvent: false,
    });
  }

  onBudgetBlur(input: HTMLInputElement): void {
    const control = this.impactForm.controls.totalFunding;
    const value = control.value;

    if (value === null || value === undefined) {
      input.value = '';
      return;
    }

    input.value = this.formatBudget(value);
  }

  private formatBudget(value: number): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  }

  // ----------------------------------------------------------------------------------------------------
  readonly categoryColors: Record<string, string> = {
    MW: 'bg-[hsl(var(--aepw-blue))] text-[hsl(var(--primary-foreground))]',
    CV: 'bg-[hsl(var(--aepw-green))] text-[hsl(var(--accent-foreground))]',
    EE: 'bg-[hsl(var(--aepw-accent-green))] text-[hsl(var(--aepw-dark-grey))]',
    MC: 'bg-[hsl(var(--aepw-orange))] text-[hsl(var(--destructive-foreground))]',
    SB: 'bg-[hsl(var(--aepw-light-blue))] text-[hsl(var(--aepw-dark-grey))]',
  };
}
