import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import { LucideAngularModule, LucideIconProvider, LUCIDE_ICONS, Plus } from 'lucide-angular';
import { MetricCategoryCardComponent } from '../components/metric-category-card/metric-category-card.component';
import { MetricService } from '../../services/metric.service';
import {
  Metric2,
  MetricCategory2,
  MetricConfigurationSaveRequest,
} from '../../models/metric.model';
import { LookupService } from '../../../../core/services/lookup-service';
import { PageLoadingService } from '../../../../core/services/page-loading.service';
import {
  AppUserLookup,
  BusinessRoleUserLookup,
  MetricCategoryLookup,
  MetricSourceLookup,
  MetricUnitLookup,
  ParentMetricLookup,
} from '../../../../core/models/lookup-model';
import { catchError, forkJoin, map, of } from 'rxjs';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SidebarComponent } from '../../../../shared/ui/sidebar/sidebar.component';
import { NgSelectComponent } from '@ng-select/ng-select';
import { AuthorizationService, AuthStateService } from '../../../../core/auth';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { HasUnsavedChanges } from '../../../../core/guards/unsaved-changes.guard';
import { ActionAccess } from '../../../../core/auth/models/authorization.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// sidebar
type SidebarMode = 'category' | 'metric';
@Component({
  selector: 'app-metrics-page',
  standalone: true,
  imports: [
    LucideAngularModule,
    MetricCategoryCardComponent,
    ReactiveFormsModule,
    SidebarComponent,
    NgSelectComponent,
  ],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({ Plus }),
    },
  ],
  templateUrl: './metrics-page-2.component.html',
})
export class MetricsPageComponent implements OnInit, HasUnsavedChanges {
  private readonly pageLoadingService = inject(PageLoadingService);
  private readonly metricService = inject(MetricService);
  private readonly authStateService = inject(AuthStateService);
  private readonly authorizationService = inject(AuthorizationService);
  readonly actionAccess = signal<ActionAccess[]>([]);
  private readonly pageKey = 'METRICCONFIG';
  protected readonly canEdit = computed(() =>
    this.actionAccess().some((action) => action.key === 'EDIT' && action.value),
  );
  protected readonly canApplicable = computed(() =>
    this.actionAccess().some((action) => action.key === 'APPLICABLE' && action.value),
  );

  protected readonly canICPRequired = computed(() =>
    this.actionAccess().some((action) => action.key === 'ICPREQUIRED' && action.value),
  );

  protected readonly canSource = computed(() =>
    this.actionAccess().some((action) => action.key === 'SOURCE' && action.value),
  );

  protected readonly canRiskRequired = computed(() =>
    this.actionAccess().some((action) => action.key === 'RISKREQUIRED' && action.value),
  );

  protected readonly canCategoryDescription = computed(() =>
    this.actionAccess().some((action) => action.key === 'CATEGORYDESCRIPTION' && action.value),
  );

  protected readonly canSeniorLeadershipTeam = computed(() =>
    this.actionAccess().some((action) => action.key === 'SENIORLEADERSHIPTEAM' && action.value),
  );

  protected readonly canMetricDescription = computed(() =>
    this.actionAccess().some((action) => action.key === 'METRICDESCRIPTION' && action.value),
  );

  protected readonly canGuidingNotes = computed(() =>
    this.actionAccess().some((action) => action.key === 'GUIDINGNOTES' && action.value),
  );

  ////////////////////////////////////////////////////////
  private readonly destroyRef = inject(DestroyRef);
  protected readonly categories = signal<MetricCategory2[]>([]);
  private readonly toast = inject(ToastService);
  protected readonly loading = signal(false);
  protected readonly expandedCategories = signal<Set<string>>(new Set());
  // -------------------------------- sidebar -------------------------------------------
  protected readonly showSidebar = signal(false);
  protected readonly sidebarMode = signal<SidebarMode>('category');
  protected readonly selectedCategory = signal<MetricCategory2 | null>(null);
  protected readonly selectedMetric = signal<Metric2 | null>(null);
  protected readonly showAddModal = signal(false);
  // -----------------------------Lookups------------------------------------
  private readonly lookupService = inject(LookupService);
  protected readonly metricCategories = signal<MetricCategoryLookup[]>([]);
  protected readonly metricUnits = signal<MetricUnitLookup[]>([]);
  protected readonly parentMetrics = signal<ParentMetricLookup[]>([]);
  protected readonly metricSources = signal<MetricSourceLookup[]>([]);
  // user
  readonly users = signal<AppUserLookup[]>([]);
  protected readonly l4Users = signal<BusinessRoleUserLookup[]>([]);
  protected readonly icpUsers = signal<BusinessRoleUserLookup[]>([]);
  // ----------------------FORM----------------------------------------
  private readonly fb = inject(FormBuilder);
  protected readonly form = this.fb.group({});
  // forms
  readonly categoryForms = new Map<string, FormGroup>();
  readonly metricForms = new Map<string, FormGroup>();
  // form signals
  protected readonly metricsDirty = signal(false);
  protected readonly selectedCategoryForm = computed(() => {
    const category = this.selectedCategory();
    return category ? this.getCategoryForm(category.categoryId) : null;
  });

  protected readonly selectedMetricForm = computed(() => {
    const metric = this.selectedMetric();
    return metric ? this.getMetricForm(metric.metricId) : null;
  });
  protected readonly sidebarCategory = signal<MetricCategory2 | null>(null);
  protected readonly sidebarTitle = computed(() => {
    const category = this.sidebarCategory();

    if (!category) return '';

    return `${category.categoryName}`;
  });
  protected readonly isParentMetric = computed(() => {
    const metric = this.selectedMetric();

    return !!metric?.children?.length;
  });
  readonly descriptionLength = computed(() => {
    const form = this.selectedMetricForm();

    return form?.get('description')?.value?.length ?? 0;
  });
  protected readonly invalidMetricIds = signal<Set<string>>(new Set());
  protected readonly invalidTopMetricIds = signal<Set<string>>(new Set());
  hasUnsavedChanges(): boolean {
    const categoryFormDirty = Array.from(this.categoryForms.values()).some((form) => form.dirty);

    const metricFormDirty = Array.from(this.metricForms.values()).some((form) => form.dirty);

    return categoryFormDirty || metricFormDirty || this.metricsDirty();
  }

  // ---------------------------- ngOnInit ------------------------------------
  ngOnInit(): void {
    this.pageLoadingService.stop();
    this.loadActionAccess();
    this.loadMetrics();
    this.loadLookups();
    this.loadBusinessRoleUsers('L4APPROVER', this.l4Users);
    this.loadBusinessRoleUsers('ICPAPPROVER', this.icpUsers);
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
  private loadBusinessRoleUsers(
    roleCode: string,
    target: WritableSignal<BusinessRoleUserLookup[]>,
  ): void {
    this.lookupService
      .getBusinessRoleUsers(roleCode)
      .pipe(
        map((response) => response.data ?? []),
        catchError((error) => {
          console.error(`[Business Role Users] Failed to load ${roleCode}`, error);

          return of<BusinessRoleUserLookup[]>([]);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((users) => {
        target.set(users);
      });
  }

  protected openCategorySidebar(category: MetricCategory2): void {
    this.sidebarMode.set('category');
    this.selectedCategory.set(category);
    this.sidebarCategory.set(category);
    this.selectedMetric.set(null);
    this.showSidebar.set(true);
    this.applySidebarActionPermissions();
  }
  protected openMetricSidebar(metric: Metric2, category: MetricCategory2): void {
    this.sidebarMode.set('metric');
    this.selectedMetric.set(metric);
    this.selectedCategory.set(null);
    this.sidebarCategory.set(category);
    this.showSidebar.set(true);
    this.applySidebarActionPermissions();
  }
  protected closeSidebar(): void {
    this.showSidebar.set(false);

    this.selectedCategory.set(null);
    this.selectedMetric.set(null);
  }
  // --------------------SAVE---------------------
  private buildSaveRequest(): MetricConfigurationSaveRequest {
    return {
      userId: this.authStateService.getCurrentUserId()!,
      metricCategories: Array.from(this.categoryForms.values()).map((form) => {
        const value = form.getRawValue();
        return {
          categoryId: value.categoryId,
          categoryDescription: value.categoryDescription,
          l4ApproverUserId: value.l4ApproverUserId,
        };
      }),

      metrics: Array.from(this.metricForms.values()).map((form) => {
        const value = form.getRawValue();

        return {
          metricId: value.metricId,
          description: value.description,
          metricHeader: value.metricHeader,
          metricSourceId: value.metricSourceId == null ? null : value.metricSourceId.toString(),
          isICPRequired: value.isICPRequired,
          isRiskAdjustmentRequired: value.isRiskAdjustmentRequired,
          icpApproverUserId: value.icpApproverUserId,
          isActive: value.isActive,
        };
      }),
    };
  }

  protected save(): void {
    const validationErrors: string[] = [];
    const invalidMetricIds = new Set<string>();
    const inconsistentTopMetrics = this.findInconsistentTopMetrics();
    const invalidTopMetricIds = new Set(inconsistentTopMetrics.map((metric) => metric.metricId));
    const inconsistentTopMetricCodes = inconsistentTopMetrics.map((metric) => metric.metricCode);

    this.categories().forEach((category) => {
      category.metrics
        .flatMap((metric) => [metric, ...metric.children])
        .forEach((metric) => {
          const form = this.metricForms.get(metric.metricId);

          if (!form) {
            return;
          }

          const isICPRequired = form.get('isICPRequired')?.value;
          const icpApproverUserId = form.get('icpApproverUserId')?.value;

          if (isICPRequired && !icpApproverUserId) {
            invalidMetricIds.add(metric.metricId);

            validationErrors.push(metric.metricCode);
          }
        });
    });

    this.invalidMetricIds.set(invalidMetricIds);
    this.invalidTopMetricIds.set(invalidTopMetricIds);

    if (validationErrors.length > 0 || inconsistentTopMetricCodes.length > 0) {
      const messages: string[] = [];

      if (validationErrors.length > 0) {
        messages.push(`ICP Approver is required for: ${validationErrors.join(', ')}.`);
      }

      if (inconsistentTopMetricCodes.length > 0) {
        messages.push(
          `L1 metrics under these top-level metrics must use the same ICP Approver: ${inconsistentTopMetricCodes.join(', ')}.`,
        );
      }

      this.toast.error(messages.join(' '), 10_000);

      return;
    }
    const request = this.buildSaveRequest();

    console.group('Saving Metric Configuration');
    console.log('Category Forms');
    console.table(request.metricCategories);
    console.log('Metric Forms');
    console.table(request.metrics);
    console.log('Complete Payload');
    console.log(JSON.stringify(request, null, 2));
    console.groupEnd();
    this.metricService.saveMetricConfiguration(request).subscribe({
      next: (response) => {
        console.log('Save Success', response);
        // Everything currently in the forms has now been persisted.
        this.categoryForms.forEach((form) => {
          form.markAsPristine();
        });

        this.metricForms.forEach((form) => {
          form.markAsPristine();
        });
        this.metricsDirty.set(false);
        this.toast.success("Metric configuration saved successfully'");
        this.closeSidebar();
      },
      error: (error) => {
        this.toast.error('Failed to Metric configuration');
        console.error('Save Failed', error);
      },
    });
  }

  protected saveSidebar(): void {
    // console.log(this.selectedCategory());
    // console.log(this.selectedCategoryForm()?.getRawValue());
    // console.log('L4 Approver', this.selectedCategoryForm()?.get('l4ApproverUserId')?.value);
    console.group('Sidebar Save');

    if (this.sidebarMode() === 'category') {
      console.log('Category Form', this.selectedCategoryForm()?.getRawValue());
      // const formValue = this.selectedCategoryForm()?.getRawValue();

      // const category = this.selectedCategory();

      // if (category && formValue) {
      //   category.l4ApproverUserId = formValue.l4ApproverUserId;
      // }
    }

    if (this.sidebarMode() === 'metric') {
      console.log('Metric Form', this.selectedMetricForm()?.getRawValue());
      if (this.sidebarMode() === 'metric') {
        const formValue = this.selectedMetricForm()?.getRawValue();

        //   const metric = this.selectedMetric();

        //   if (metric && formValue) {
        //     metric.icpApproverUserId = formValue.icpApproverUserId;
        //   }
        // }
      }

      console.groupEnd();

      this.closeSidebar();
    }
  }
  // ---------------------------------------------------
  private loadMetrics(): void {
    this.loading.set(true);

    this.metricService.getMetricHierarchy().subscribe({
      next: (response) => {
        this.categories.set(response.data);
        this.initializeExpandedCategories();
        //////////////////////////////////////
        this.categoryForms.clear();
        this.metricForms.clear();
        response.data.forEach((category) => {
          this.categoryForms.set(category.categoryId, this.createCategoryForm(category));

          category.metrics
            .flatMap((m) => [m, ...m.children])
            .forEach((metric) => {
              this.metricForms.set(metric.metricId, this.createMetricForm(metric));
            });
        });

        // Register parent/child sync AFTER all forms exist
        response.data.forEach((category) => {
          category.metrics.forEach((parent) => {
            this.registerMetricHierarchy(parent);
          });
        });

        // Populate user dropdowns with initial approvers from API (one-time only)
        response.data.forEach((category) => {
          this.addUserIfMissing(this.l4Users, category.l4ApproverUserId, category.l4ApproverName);

          category.metrics
            .flatMap((m) => [m, ...m.children])
            .forEach((metric) => {
              this.addUserIfMissing(
                this.icpUsers,
                metric.icpApproverUserId,
                metric.icpApproverName,
              );
            });
        });

        this.loading.set(false);
      },

      error: (error) => {
        console.error(error);

        this.loading.set(false);
      },
    });
  }
  private addUserIfMissing(
    collection: WritableSignal<AppUserLookup[]>,
    userId: string | null | undefined,
    displayName: string | null | undefined,
  ): void {
    if (!userId || !displayName) {
      return;
    }

    const exists = collection().some((x) => x.userId === userId);

    if (exists) {
      return;
    }

    collection.update((users) => [
      ...users,
      {
        userId,
        displayName,
      } as AppUserLookup,
    ]);
  }
  private loadLookups(): void {
    forkJoin({
      categories: this.lookupService.getMetricCategories(),
      units: this.lookupService.getMetricUnits(),
      parentMetrics: this.lookupService.getParentMetrics(),
      metricSources: this.lookupService.getMetricSources(),
      // users: this.lookupService.getUsers(),
    }).subscribe({
      next: ({ categories, units, metricSources }) => {
        this.metricCategories.set(categories.data);
        this.metricUnits.set(units.data);
        this.metricSources.set(metricSources.data);
        // this.users.set(users.data ?? []);
      },

      error: (error) => {
        console.error('Error loading lookups', error);
      },
    });
  }
  private registerMetricHierarchy(parent: Metric2): void {
    const parentForm = this.metricForms.get(parent.metricId);

    if (!parentForm) {
      return;
    }

    // Parent -> Children
    parentForm.get('isActive')?.valueChanges.subscribe((checked: boolean) => {
      parent.children.forEach((child) => {
        const childForm = this.metricForms.get(child.metricId);

        childForm?.patchValue(
          {
            isActive: checked,
          },
          {
            emitEvent: false,
          },
        );
      });
    });

    // Children -> Parent
    parent.children.forEach((child) => {
      const childForm = this.metricForms.get(child.metricId);
      childForm
        ?.get('icpApproverUserId')
        ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.updateInvalidTopMetricIds());
      childForm
        ?.get('isICPRequired')
        ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.updateInvalidTopMetricIds());

      childForm?.get('isActive')?.valueChanges.subscribe(() => {
        const anySelected = parent.children.some(
          (c) => this.metricForms.get(c.metricId)?.get('isActive')?.value,
        );

        parentForm.patchValue(
          {
            isActive: anySelected,
          },
          {
            emitEvent: false,
          },
        );
      });
    });
  }

  private findInconsistentTopMetrics(): Metric2[] {
    return this.categories().flatMap((category) =>
      category.metrics.filter((topMetric) => {
        const selectedApproverIds = topMetric.children
          .map((child) => this.metricForms.get(child.metricId)?.get('icpApproverUserId')?.value)
          .filter((userId): userId is string => typeof userId === 'string' && userId.length > 0);

        return new Set(selectedApproverIds).size > 1;
      }),
    );
  }

  private updateInvalidTopMetricIds(): void {
    this.invalidTopMetricIds.set(
      new Set(this.findInconsistentTopMetrics().map((metric) => metric.metricId)),
    );
  }

  // -------------------------------------SAVE----------------------------------------------
  private createMetricForm(metric: Metric2): FormGroup {
    const form = this.fb.group({
      metricId: [metric.metricId],
      description: [metric.description],
      metricHeader: [metric.metricHeader],
      metricSourceId: [metric.metricSourceId == null ? null : Number(metric.metricSourceId)],
      isICPRequired: [metric.isICPRequired],
      isRiskAdjustmentRequired: [metric.isRiskAdjustmentRequired],
      icpApproverUserId: [metric.icpApproverUserId],
      isActive: [metric.isActive],
    });

    const isICPControl = form.get('isICPRequired');
    const approverControl = form.get('icpApproverUserId');

    // Initial state
    if (!isICPControl?.value) {
      approverControl?.disable({ emitEvent: false });
    }

    isICPControl?.valueChanges.subscribe((required) => {
      if (required) {
        approverControl?.enable({ emitEvent: false });
      } else {
        approverControl?.reset(null, { emitEvent: false });
        approverControl?.disable({ emitEvent: false });
      }
    });

    return form;
  }
  private createCategoryForm(category: MetricCategory2): FormGroup {
    return this.fb.group({
      categoryId: [category.categoryId],

      categoryDescription: [category.categoryDescription],

      l4ApproverUserId: [category.l4ApproverUserId],
    });
  }
  protected getCategoryForm(categoryId: string): FormGroup {
    return this.categoryForms.get(categoryId)!;
  }
  protected getMetricForm(metricId: string): FormGroup {
    return this.metricForms.get(metricId)!;
  }
  // --------------------------------------------------------------
  private applySidebarActionPermissions(): void {
    const categoryForm = this.selectedCategoryForm();

    if (categoryForm) {
      const leadershipControl = categoryForm.get('l4ApproverUserId');
      const descriptionControl = categoryForm.get('categoryDescription');

      if (this.canCategoryDescription()) {
        descriptionControl?.enable({ emitEvent: false });
      } else {
        descriptionControl?.disable({ emitEvent: false });
      }
      if (this.canSeniorLeadershipTeam()) {
        leadershipControl?.enable({ emitEvent: false });
      } else {
        leadershipControl?.disable({ emitEvent: false });
      }
    }

    const metricForm = this.selectedMetricForm();

    if (metricForm) {
      const icpApproverControl = metricForm.get('icpApproverUserId');

      if (this.canICPRequired() && metricForm.get('isICPRequired')?.value) {
        icpApproverControl?.enable({ emitEvent: false });
      } else {
        console.log('-----------------------');
        console.log(this.canICPRequired());
        icpApproverControl?.disable({ emitEvent: false });
      }
      // Description / Guiding Notes
      const descriptionControl = metricForm.get('description');

      if (this.isParentMetric()) {
        if (this.canMetricDescription()) {
          descriptionControl?.enable({ emitEvent: false });
        } else {
          descriptionControl?.disable({ emitEvent: false });
        }
      } else {
        if (this.canGuidingNotes()) {
          descriptionControl?.enable({ emitEvent: false });
        } else {
          descriptionControl?.disable({ emitEvent: false });
        }
      }
    }
  }

  // ----------------------------------------------------------------------------------------
  protected onToggleCategory(categoryId: string): void {
    const updated = new Set(this.expandedCategories());

    if (updated.has(categoryId)) {
      updated.delete(categoryId);
    } else {
      updated.add(categoryId);
    }

    this.expandedCategories.set(updated);
  }
  private initializeExpandedCategories(): void {
    const expanded = new Set<string>();

    this.categories().forEach((category) => {
      expanded.add(category.categoryId);
    });

    this.expandedCategories.set(expanded);
  }
  protected readonly totalMetrics = computed(
    () =>
      this.categories()
        .flatMap((c) => c.metrics)
        .flatMap((m) => [m, ...m.children]).length,
  );
}
