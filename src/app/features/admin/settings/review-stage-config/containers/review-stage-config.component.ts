import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, of, take, throwError } from 'rxjs';
import { ChevronDown, ChevronUp } from 'lucide-angular';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  ReviewApprovalChangesPreviewDto,
  ReviewStageApprovalChangeRequest,
  ReviewStageOption,
} from '../models/review-stage-management.model';
import { DialogComponent } from '../../../../../shared/ui/dialog/dialog.component';
import { ReviewStageManagementService } from '../services/review-stage-management.service';
import { ToastService } from '../../../../../shared/ui/toast/toast.service';

import {
  LUCIDE_ICONS,
  LucideAngularModule,
  LucideIconProvider,
  Save,
  LoaderCircle,
  RotateCcw,
} from 'lucide-angular';

import { CardComponent, CardContentComponent } from '../../../../../shared/ui/card/card.component';
import { AuthStateService } from '../../../../../core/auth';
import { ReviewMetricApproveRejectDto } from '../../../../reviews/models/review.model';
import { ReviewService } from '../../../../reviews/services/review.service';

@Component({
  selector: 'review-stage-config',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    CardComponent,
    CardContentComponent,
    DialogComponent,
  ],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({
        Save,
        LoaderCircle,
        RotateCcw,
        ChevronDown,
        ChevronUp,
      }),
    },
  ],
  templateUrl: './review-stage-config.component.html',
  styleUrl: './review-stage-config.component.css',
})
export class ReviewStageConfigComponent implements OnInit {
  private readonly authStateService = inject(AuthStateService);
  private readonly toast = inject(ToastService);
  private readonly reviewStageService = inject(ReviewStageManagementService);
  protected readonly reviewService = inject(ReviewService);
  protected readonly haveStageOptionsChanged = this.reviewStageService.haveStageOptionsChanged;

  protected readonly loadingReviewStages = this.reviewStageService.loadingReviewStages;

  protected readonly reviewStages = this.reviewStageService.stageOptions;

  protected readonly savingReviewStages = this.reviewStageService.savingReviewStages;
  protected readonly approvalChangesDialogVisible = signal(false);

  protected readonly disablePreview = signal<ReviewApprovalChangesPreviewDto['disablePreview']>([]);

  protected readonly enablePreview = signal<ReviewApprovalChangesPreviewDto['enablePreview']>([]);
  ngOnInit(): void {
    this.refreshReviewStages();
  }
  protected readonly totalDisableApprovals = computed(() =>
    this.disablePreview().reduce((total, stage) => total + stage.changes.length, 0),
  );

  protected readonly totalEnableApprovals = computed(() =>
    this.enablePreview().reduce((total, stage) => total + stage.changes.length, 0),
  );
  refreshReviewStages(showLoader = true): void {
    this.reviewStageService
      .getReviewStages(showLoader)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          console.log('Review stage API response:', res);
          console.log('Stage options:', this.reviewStages());
          console.log('Loading:', this.loadingReviewStages());
        },
        error: (error) => {
          console.error('Failed to load review stages:', error);
          this.toast.error('Failed to load review stages.');
        },
      });
  }

  toggleUpdated(reviewStageId: number, isActive: boolean): void {
    this.reviewStageService.toggleStageOption(reviewStageId, isActive);
  }

  saveReviewStageStates(): void {
    const changedStages = this.reviewStageService.getChangedStageRequests();

    if (changedStages.length === 0) {
      this.toast.error('No review stage changes detected.');
      return;
    }

    if (changedStages.some((stage) => !Number.isInteger(stage.StageCode))) {
      this.toast.error('One or more changed stages have an invalid stage code.');
      return;
    }

    this.reviewStageService
      .getReviewStageApprovalChanges(changedStages)
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          if (!res.success || !res.data) {
            this.toast.error(res.message || 'Failed to fetch review approval changes.');
            return;
          }

          this.disablePreview.set(res.data.disablePreview);
          this.enablePreview.set(res.data.enablePreview);
          this.approvalChangesDialogVisible.set(true);
        },
        error: (error) => {
          console.error('Failed to fetch review approval changes:', error);
          this.toast.error('Failed to fetch review approval changes.');
        },
      });
  }

  private approvePendingDisablePreviews(): Observable<unknown> {
    const userId = this.authStateService.getCurrentUserId();

    if (userId === null) {
      this.toast.error('Unable to identify the current user.');
      return throwError(() => new Error('Current user ID is unavailable.'));
    }

    const input: ReviewMetricApproveRejectDto[] = this.disablePreview().flatMap((stage) =>
      stage.changes.map((change) => ({
        ReviewId: change.reviewId,
        MetricCode: change.metricCode,
        Decision: 'Approved',
        Comment: 'Automatically approved because the review stage was disabled in System Settings.',
        StageCode: String(stage.stageCode),
      })),
    );

    if (input.length === 0) {
      return of(null);
    }

    return this.reviewService.takeReviewMetricActionForTopLevel(input, userId);
  }

  /////////////////////////////////////////////////////////////////////////////////////////////
  protected cancelApprovalChanges(): void {
    this.approvalChangesDialogVisible.set(false);
  }

  protected confirmApprovalChanges(): void {
    this.approvePendingDisablePreviews()
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.toast.success('Pending approvals processed successfully.');
          this.approvalChangesDialogVisible.set(false);

          // TODO: Save stage active states after the complete workflow succeeds.
        },
        error: (error) => {
          console.error('Failed to process pending approvals:', error);
          this.toast.error('Failed to process pending approvals.');
        },
      });
  }

  resetStageStates(): void {
    this.reviewStageService.resetStageStates();
  }

  toggleKeyDown(event: KeyboardEvent, reviewStageListItem: HTMLElement, isActive: boolean): void {
    if (event.key === 'Escape') {
      (event.target as HTMLElement)?.blur();
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      reviewStageListItem.click();
    } else if (event.key === 'ArrowLeft' && isActive) {
      reviewStageListItem.click();
    } else if (event.key === 'ArrowRight' && !isActive) {
      reviewStageListItem.click();
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      const current = event.target as HTMLElement;
      const row = current.closest('li');
      const sibling =
        event.key === 'ArrowUp' ? row?.previousElementSibling : row?.nextElementSibling;

      sibling?.querySelector<HTMLElement>('[data-toggle-track]')?.focus();
    }

    event.stopPropagation();
  }
}
