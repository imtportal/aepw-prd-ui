import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, catchError, distinctUntilChanged, finalize, map, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { JsonPipe, NgClass } from '@angular/common';
import {
  EvidenceDataType,
  EvidenceDetailResponse,
  EvidenceField,
  EvidencePage,
  SaveEvidenceReviewRequest,
} from '../models/evidence-review.model';
import { EvidenceReviewService } from '../../services/evidence-review.service';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { ActionAccess } from '../../../../core/auth/models/authorization.model';
import { AuthorizationService, AuthStateService } from '../../../../core/auth';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { HasUnsavedChanges } from '../../../../core/guards/unsaved-changes.guard';

type ExtractedFieldForm = FormGroup<{
  evidenceDetailId: FormControl<number | null>;
  evidenceFieldId: FormControl<number>;
  pageNumber: FormControl<number>;
  property: FormControl<string>;
  label: FormControl<string>;
  value: FormControl<string | null>;
  dataType: FormControl<EvidenceDataType>;
  required: FormControl<boolean>;
  // confidence: FormControl<number | null>;
}>;

type LineItemForm = FormGroup<{
  evidenceDetailId: FormControl<number>;
  evidenceFieldId: FormControl<number>;
  pageNumber: FormControl<number | null>;
  name: FormControl<string>;
  value: FormControl<string | null>;
}>;

@Component({
  selector: 'app-evidence-review',
  standalone: true,
  imports: [ReactiveFormsModule, JsonPipe, ButtonComponent, NgClass],
  templateUrl: './evidence-review-page.component.html',
})
export class EvidenceReviewComponent implements OnInit, HasUnsavedChanges {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  // actions
  private readonly authStateService = inject(AuthStateService);
  private readonly authorizationService = inject(AuthorizationService);
  private readonly toastService = inject(ToastService);
  readonly actionAccess = signal<ActionAccess[]>([]);
  private readonly pageKey = 'EVIDENCEREVIEW';
  // Action signals
  protected readonly canOpenOriginalEvidence = computed(() =>
    this.actionAccess().some((action) => action.key === 'OPENORIGINALEVIDENCE' && action.value),
  );

  protected readonly canDownloadEvidence = computed(() =>
    this.actionAccess().some((action) => action.key === 'DOWNLOADEVIDENCE' && action.value),
  );

  protected readonly canDownloadRawOutput = computed(() =>
    this.actionAccess().some((action) => action.key === 'DOWNLOADRAWOUTPUT' && action.value),
  );

  protected readonly canSaveEvidenceReview = computed(() =>
    this.actionAccess().some((action) => action.key === 'SAVE' && action.value),
  );
  // Pagination
  readonly currentPage = signal(1);

  readonly pageNumbers = computed(() => [
    ...new Set(
      (this.reviewData()?.evidenceDetail ?? [])
        .map((page) => page.pageNumber)
        .filter(
          (pageNumber): pageNumber is number => Number.isInteger(pageNumber) && pageNumber > 0,
        )
        .sort((a, b) => a - b),
    ),
  ]);

  readonly totalPages = computed(() => this.pageNumbers().length);

  readonly currentEvidencePageNumber = computed(
    () => this.pageNumbers()[this.currentPage() - 1] ?? null,
  );

  readonly currentPageIsUnique = computed(() => {
    const pageNumber = this.currentEvidencePageNumber();

    if (pageNumber === null) {
      return null;
    }

    return (
      this.reviewData()?.evidenceDetail.find((page) => page.pageNumber === pageNumber)?.isUnique ??
      null
    );
  });

  readonly currentPageFields = computed(() => {
    const pageNumber = this.currentEvidencePageNumber();

    if (pageNumber === null) {
      return [];
    }

    return this.evidenceDetail.controls.flatMap((field, index) =>
      field.controls.pageNumber.value === pageNumber ? [{ field, index }] : [],
    );
  });

  readonly currentPageLineItems = computed(() => {
    const pageNumber = this.currentEvidencePageNumber();

    if (pageNumber === null) {
      return [];
    }

    return this.lineItemControls.controls
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.controls.pageNumber.value === pageNumber);
  });

  readonly displayedRange = computed(() => {
    const totalItems = this.pageNumbers().length;
    const page = totalItems === 0 ? 0 : Math.min(this.currentPage(), totalItems);

    return { start: page, end: page, total: totalItems };
  });

  readonly isFirstPage = computed(() => this.totalPages() === 0 || this.currentPage() <= 1);
  readonly isLastPage = computed(
    () => this.totalPages() === 0 || this.currentPage() >= this.totalPages(),
  );
  ////////////////////////////////////////////////////////////
  private readonly evidenceReviewService = inject(EvidenceReviewService);

  readonly reviewData = signal<EvidenceDetailResponse | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly evidenceId = signal<number | null>(null);
  readonly editing = signal(false);
  private baseline: {
    fields: (string | null)[];
    lineItems: (string | null)[];
    evidencedValue: string | null;
  } = {
    fields: [],
    lineItems: [],
    evidencedValue: null,
  };

  readonly evidencedValueControl = new FormControl<string | null>(null);

  readonly extractedFieldsForm = new FormGroup({
    fields: new FormArray<ExtractedFieldForm>([]),
  });

  get evidenceDetail(): FormArray<ExtractedFieldForm> {
    return this.extractedFieldsForm.controls.fields;
  }

  readonly lineItemsForm = new FormGroup({
    items: new FormArray<LineItemForm>([]),
  });

  get lineItemControls(): FormArray<LineItemForm> {
    return this.lineItemsForm.controls.items;
  }

  ngOnInit(): void {
    this.loadActionAccess();
    this.route.queryParamMap
      .pipe(
        map((params) => {
          const value = params.get('evidenceId')?.trim();

          if (!value) {
            return null;
          }

          const id = Number(value);

          return Number.isNaN(id) ? null : id;
        }),
        distinctUntilChanged(),
        switchMap((evidenceId) => {
          this.evidenceId.set(evidenceId);
          this.reviewData.set(null);
          this.evidenceDetail.clear();
          this.errorMessage.set(null);
          this.lineItemControls.clear();
          this.editing.set(false);
          if (evidenceId === null) {
            this.loading.set(false);
            this.errorMessage.set('Invalid evidence ID.');
            return EMPTY;
          }

          this.loading.set(true);
          const userId = this.authStateService.getCurrentUserId();

          if (userId == null) {
            this.loading.set(false);
            this.errorMessage.set('Unable to identify the current user.');
            return EMPTY;
          }
          return this.evidenceReviewService.getEvidenceReviewById(evidenceId, userId).pipe(
            catchError((error: unknown) => {
              const apiError = error as {
                error?: {
                  errorCode?: string;
                };
              };

              this.errorMessage.set(
                apiError.error?.errorCode === 'NOT_FOUND'
                  ? 'Evidence not found'
                  : 'Unable to load evidence review data.',
              );

              return EMPTY;
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((response) => {
        this.reviewData.set(response);
        this.setExtractedFields(response.evidenceDetail);
        this.setLineItems(response);
        this.evidencedValueControl.setValue(response.evidenced?.evidencedValue ?? null);
        this.captureBaseline();
        this.applyEditMode();
      });
  }

  private captureBaseline(): void {
    this.baseline = {
      fields: this.evidenceDetail.getRawValue().map((field) => field.value),
      lineItems: this.lineItemControls.getRawValue().map((item) => item.value),
      evidencedValue: this.evidencedValueControl.value,
    };
  }

  hasUnsavedChanges(): boolean {
    if (this.saving() || !this.editing()) {
      return false;
    }

    return (
      this.extractedFieldsForm.dirty || this.lineItemsForm.dirty || this.evidencedValueControl.dirty
    );
  }

  onCancel(): void {
    if (this.saving()) {
      return;
    }

    this.evidenceDetail.controls.forEach((control, index) =>
      control.controls.value.setValue(this.baseline.fields[index] ?? null),
    );
    this.lineItemControls.controls.forEach((control, index) =>
      control.controls.value.setValue(this.baseline.lineItems[index] ?? null),
    );
    this.evidencedValueControl.setValue(this.baseline.evidencedValue);

    this.extractedFieldsForm.markAsPristine();
    this.lineItemsForm.markAsPristine();
    this.evidencedValueControl.markAsPristine();
    this.extractedFieldsForm.markAsUntouched();
    this.lineItemsForm.markAsUntouched();

    this.editing.set(false);
    this.applyEditMode();
  }

  private applyEditMode(): void {
    const forms = [this.extractedFieldsForm, this.lineItemsForm, this.evidencedValueControl];

    for (const form of forms) {
      if (this.editing()) {
        form.enable({ emitEvent: false });
      } else {
        form.disable({ emitEvent: false });
      }
    }
  }

  onEditOrSave(): void {
    if (this.editing()) {
      this.onSave();
      return;
    }

    this.editing.set(true);
    this.applyEditMode();
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
  private setExtractedFields(pages: EvidencePage[]): void {
    this.evidenceDetail.clear();

    for (const page of pages) {
      // A missing page number is invalid response data.
      if (!Number.isInteger(page.pageNumber) || page.pageNumber < 1) {
        console.warn('Skipping evidence fields with an invalid page number.', page);
        continue;
      }

      for (const field of page.details ?? []) {
        const required = field.required === true;

        const validators = required ? [Validators.required] : [];

        this.evidenceDetail.push(
          new FormGroup({
            evidenceDetailId: new FormControl<number | null>(field.evidenceDetailId ?? null),

            evidenceFieldId: new FormControl(field.evidenceFieldId, {
              nonNullable: true,
            }),
            pageNumber: new FormControl(page.pageNumber, {
              nonNullable: true,
            }),

            property: new FormControl(field.property, {
              nonNullable: true,
            }),

            label: new FormControl(field.label, {
              nonNullable: true,
            }),

            value: new FormControl<string | null>(field.value ?? null, validators),

            dataType: new FormControl(field.dataType, {
              nonNullable: true,
            }),

            required: new FormControl(required, {
              nonNullable: true,
            }),
          }),
        );
      }
    }

    this.currentPage.set(1);
  }

  private setLineItems(response: EvidenceDetailResponse): void {
    this.lineItemControls.clear();

    for (const item of response.lineItems?.items ?? []) {
      if (!Number.isInteger(item.evidenceDetailId) || item.evidenceDetailId <= 0) {
        console.warn('Skipping line item without a valid EvidenceDetailId.', item);
        continue;
      }

      this.lineItemControls.push(
        new FormGroup({
          evidenceDetailId: new FormControl(item.evidenceDetailId, {
            nonNullable: true,
          }),
          evidenceFieldId: new FormControl(item.evidenceFieldId, {
            nonNullable: true,
          }),
          pageNumber: new FormControl<number | null>(item.pageNumber),
          name: new FormControl(item.name, {
            nonNullable: true,
          }),
          value: new FormControl<string | null>(item.value),
        }),
      );
    }
  }

  goToPage(paginationPage: number): void {
    if (paginationPage >= 1 && paginationPage <= this.totalPages()) {
      this.currentPage.set(paginationPage);
    }
  }

  goToPreviousPage(): void {
    this.goToPage(this.currentPage() - 1);
  }

  goToNextPage(): void {
    this.goToPage(this.currentPage() + 1);
  }

  goToFirstPage(): void {
    this.goToPage(1);
  }

  goToLastPage(): void {
    this.goToPage(this.totalPages());
  }
  inputType(dataType: EvidenceDataType): string {
    switch (dataType) {
      case 'date':
        return 'date';

      case 'time':
        return 'time';

      case 'number':
        return 'number';

      default:
        return 'text';
    }
  }

  statusIcon(status: string): string {
    switch (status) {
      case 'Success':
        return '✓';

      case 'Warning':
        return '▲';

      case 'Error':
        return '✕';

      default:
        return '—';
    }
  }

  getEditedFields(): EvidenceField[] {
    return this.evidenceDetail.getRawValue();
  }

  downloadRawOutput(rawOutput: unknown, originalFileName: string): void {
    const content = JSON.stringify(rawOutput, null, 2);

    const blob = new Blob([content], {
      type: 'text/plain;charset=utf-8',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const fileNameWithoutExtension = originalFileName.replace(/\.pdf/gi, '').trim();
    link.href = url;
    link.download = `${fileNameWithoutExtension}-raw-output.txt`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  onSave(): void {
    if (!this.canSaveEvidenceReview() || this.saving()) {
      return;
    }

    if (this.extractedFieldsForm.invalid || this.lineItemsForm.invalid) {
      this.extractedFieldsForm.markAllAsTouched();
      this.lineItemsForm.markAllAsTouched();
      return;
    }

    const evidenceId = this.evidenceId();
    const updatedBy = this.authStateService.getCurrentUserId();

    if (evidenceId === null) {
      this.toastService.error('Unable to save: evidence ID is unavailable.');
      return;
    }

    if (updatedBy === null) {
      this.toastService.error('Unable to save: current user ID is unavailable.');
      return;
    }

    const scalarFields = this.evidenceDetail
      .getRawValue()
      .filter(
        (field): field is typeof field & { evidenceDetailId: number } =>
          field.evidenceDetailId !== null,
      )
      .map(({ evidenceDetailId, value }) => ({
        evidenceDetailId,
        value,
      }));

    const lineItems = this.lineItemControls.getRawValue().map(({ evidenceDetailId, value }) => ({
      evidenceDetailId,
      value,
    }));

    const fields = [...scalarFields, ...lineItems];

    if (fields.length === 0) {
      this.toastService.error('No existing fields or line items are available to update.');
      return;
    }

    const request: SaveEvidenceReviewRequest = {
      evidenceId,
      updatedBy,
      evidencedValue: this.evidencedValueControl.value,
      fields,
    };

    this.saving.set(true);

    this.evidenceReviewService
      .saveEvidenceReview(request)
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          if (response.success === false || !response.data) {
            this.toastService.error(response.message || 'Unable to save evidence review.');
            return;
          }

          this.extractedFieldsForm.markAsPristine();
          this.lineItemsForm.markAsPristine();
          this.evidencedValueControl.markAsPristine();
          this.captureBaseline();

          this.reviewData.update((current) =>
            current
              ? {
                  ...current,
                  evidenced: {
                    ...current.evidenced,
                    evidencedValue: request.evidencedValue ?? null,
                  },
                }
              : current,
          );
          this.editing.set(false);
          this.applyEditMode();

          this.toastService.success('Evidence review saved successfully.');
        },
        error: (error: unknown) => {
          console.error('[EvidenceReview] Failed to save evidence review.', error);
          this.toastService.error('Unable to save evidence review. Please try again.');
        },
      });
  }
  isWithinReporting(value: boolean | number | string | null | undefined): boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      return value === 1;
    }

    if (typeof value === 'string') {
      return ['yes', 'true', '1'].includes(value.trim().toLowerCase());
    }

    return false;
  }
  onBack(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

    if (returnUrl?.startsWith('/') && !returnUrl.startsWith('//')) {
      void this.router.navigateByUrl(returnUrl);
      return;
    }

    void this.router.navigate(['/workflow/reviewTasks']);
  }
}
