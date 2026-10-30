import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { LookupService } from '../../../../../core/services/lookup-service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { CardComponent, CardContentComponent } from '../../../../../shared/ui/card/card.component';
import { BadgeComponent } from '../../../../../shared/ui/badge/badge.component';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { CountryLookup, StatusLookup } from '../../../../../core/models/lookup-model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastService } from '../../../../../shared/ui/toast/toast.service';
import { finalize, forkJoin } from 'rxjs';
import {
  DataColumn,
  DataTableComponent,
} from '../../../../../shared/ui/data-table/data-table.component';
import { LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, Pencil } from 'lucide-angular';
import { DialogComponent } from '../../../../../shared/ui/dialog/dialog.component';
import { ProgramService } from '../../services/program.service';
import {
  InsertProgramRequest,
  ProgramDetailModel,
  UpdateProgramRequest,
} from '../../models/program.model';
import { AuthorizationService, AuthStateService } from '../../../../../core/auth';
import { HasUnsavedChanges } from '../../../../../core/guards/unsaved-changes.guard';
import { ActionAccess } from '../../../../../core/auth/models/authorization.model';

@Component({
  selector: 'program-form-page',
  standalone: true,
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({
        Pencil,
      }),
    },
  ],
  imports: [
    FormsModule,
    NgSelectModule,
    ReactiveFormsModule,
    CardComponent,
    CardContentComponent,
    BadgeComponent,
    ButtonComponent,
    DataTableComponent,
    LucideAngularModule,
    DialogComponent,
  ],
  templateUrl: 'program-form-page.component.html',
})
export class ProgramFormPage implements OnInit, HasUnsavedChanges {
  private readonly authStateService = inject(AuthStateService);
  private readonly authorizationService = inject(AuthorizationService);
  readonly actionAccess = signal<ActionAccess[]>([]);
  private readonly pageKey = 'PROGRAMMANAGEMENT';
  protected readonly canAddProgram = computed(() => {
    const result = this.actionAccess().some((action) => action.key === 'ADD' && action.value);

    console.log('ADD button access:', result);

    return result;
  });

  protected readonly canEditProgram = computed(() => {
    const result = this.actionAccess().some((action) => action.key === 'EDIT' && action.value);

    console.log('EDIT button access:', result);

    return result;
  });
  protected readonly canSaveProgram = computed(() =>
    this.isEditMode() ? this.canEditProgram() : this.canAddProgram(),
  );
  protected readonly canDeleteProgram = computed(() => {
    const result = this.actionAccess().some((action) => action.key === 'DELETE' && action.value);

    console.log('DELETE button access:', result);

    return result;
  });

  private readonly router = inject(Router);
  private readonly programService = inject(ProgramService);
  readonly saving = signal(false);
  protected readonly showAddModal = signal(false);

  readonly isEditMode = signal(false);
  private readonly destroyRef = inject(DestroyRef);
  readonly programId = signal<string | null>(null);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  // Contact
  readonly editingContactIndex = signal<number | null>(null);
  readonly statusOptions = [
    { label: 'Active', value: true },
    { label: 'Inactive', value: false },
  ];
  // Program FORM
  readonly programForm = this.fb.group({
    name: this.fb.control('', Validators.required),
    code: this.fb.control('', Validators.required),
    description: this.fb.control<string | null>(null, Validators.required),
    isActive: this.fb.control<boolean | null>(null, Validators.required),
  });
  hasUnsavedChanges(): boolean {
    if (this.saving()) {
      return false;
    }

    return this.programForm.dirty;
  }
  // NGONINT
  ngOnInit(): void {
    this.loadActionAccess();
    const programId = this.route.snapshot.paramMap.get('programId');
    console.log(programId);
    if (programId) {
      console.log('inside program id true');
      this.loadProgram(programId);
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
        },
        error: (error) => {
          console.error('[Authorization] Failed to load User Management action access:', error);

          this.actionAccess.set([]);
        },
      });
  }
  private createProgram(): void {
    const form = this.programForm.getRawValue();
    const request: InsertProgramRequest = {
      code: form.code ?? '',
      name: form.name ?? '',
      description: form.description,
      isActive: form.isActive ?? true,
      createdBy: String(this.authStateService.getCurrentUserId()!),
    };

    this.saving.set(true);

    this.programService
      .createProgram(request)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          this.programForm.markAsPristine();
          this.toast.success('Program created successfully');
          this.router.navigate(['/admin/programs']);
        },
        error: (error) => {
          console.error(error);

          this.toast.error(error?.error?.message ?? 'Failed to create Funding Recipient.');
        },
      });
  }
  private updateProgram(): void {
    const form = this.programForm.getRawValue();

    const request: UpdateProgramRequest = {
      programId: this.programId()!,
      code: form.code ?? '',
      name: form.name ?? '',
      description: form.description,
      isActive: form.isActive ?? true,
      updatedBy: String(this.authStateService.getCurrentUserId()!),
    };

    this.saving.set(true);

    this.programService
      .updateProgram(request)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          this.programForm.markAsPristine();
          this.toast.success('Program updated successfully');
          this.router.navigate(['/admin/programs']);
        },
        error: console.error,
      });
  }
  private loadProgram(programId: string): void {
    this.isEditMode.set(true);
    this.programId.set(programId);

    this.programService
      .getProgramById(programId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.patchProgramForm(response.data);
        },
        error: () => {
          this.toast.error('Failed to load program.');
        },
      });
  }
  private patchProgramForm(program: ProgramDetailModel): void {
    this.programForm.patchValue({
      code: program.code,
      name: program.name,
      description: program.description,
      isActive: program.isActive,
    });
    this.programForm.markAsPristine();
  }

  onSave(): void {
    if (this.programForm.invalid) {
      this.programForm.markAllAsTouched();

      return;
    }

    if (this.isEditMode()) {
      this.updateProgram();
    } else {
      this.createProgram();
    }
  }

  onBack(): void {
    this.router.navigate(['/admin/programs']);
  }
}
