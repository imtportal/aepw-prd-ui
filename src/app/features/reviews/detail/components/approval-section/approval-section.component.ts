import { Component, computed, input, output } from '@angular/core';
import {
  LucideAngularModule, LucideIconProvider, LUCIDE_ICONS,
  Check, X, RefreshCw,
} from 'lucide-angular';
import { BadgeComponent } from '../../../../../shared/ui/badge/badge.component';
import {
  ReviewItem, ApprovalStatus, ApprovalStage,
} from '../../../models/review.model';
import { ApprovalStepId } from '../../review-detail.types';

interface StepDef {
  label:      string;
  stepId:     ApprovalStepId;
  stageLabel: ApprovalStage;
  person:     (item: ReviewItem) => string;
  status:     (item: ReviewItem) => ApprovalStatus;
}

const STEPS: StepDef[] = [
  {
    label: 'PM Review',       stepId: 'pmStatus',
    stageLabel: 'PM Review',  person: i => i.pm,
    status: i => i.pmStatus,
  },
  {
    label: 'Reviewer',           stepId: 'reviewerStatus',
    stageLabel: 'Reviewer',      person: i => i.reviewer,
    status: i => i.reviewerStatus,
  },
  {
    label: 'Lead Reviewer',       stepId: 'leadStatus',
    stageLabel: 'Lead Reviewer',  person: i => i.leadReviewer,
    status: i => i.leadStatus,
  },
  {
    label: 'Final Approval',       stepId: 'finalStatus',
    stageLabel: 'Final Approval',  person: i => i.finalApprover,
    status: i => i.finalStatus,
  },
];

const STATUS_CLASSES: Record<ApprovalStatus, string> = {
  'Pending':           'bg-muted text-muted-foreground',
  'Approved':          'bg-[hsl(var(--aepw-green)/0.15)] text-[hsl(var(--aepw-green))]',
  'Rejected':          'bg-destructive/10 text-destructive',
  'Recalled':          'bg-[hsl(var(--aepw-orange)/0.12)] text-[hsl(var(--aepw-orange))]',
  'RequestCorrection': 'bg-[hsl(var(--aepw-orange)/0.12)] text-[hsl(var(--aepw-orange))]',
  'Amended':           'bg-[hsl(var(--aepw-blue)/0.12)] text-[hsl(var(--aepw-blue))]',
  'Skipped':           'bg-muted text-muted-foreground',
};

@Component({
  selector: 'app-approval-section',
  standalone: true,
  imports: [LucideAngularModule, BadgeComponent],
  providers: [
    { provide: LUCIDE_ICONS, multi: true,
      useValue: new LucideIconProvider({ Check, X, RefreshCw }) },
  ],
  templateUrl: './approval-section.component.html',
})
export class ApprovalSectionComponent {
  reviewItem = input<ReviewItem | null>(null);
  approve    = output<ApprovalStepId>();
  reject     = output<ApprovalStepId>();
  recycle    = output<ApprovalStepId>();

  protected readonly steps = computed(() => {
    const item = this.reviewItem();
    if (!item) return [];
    return STEPS.map(s => ({
      label:    s.label,
      stepId:   s.stepId,
      person:   s.person(item),
      status:   s.status(item),
      isActive: item.currentApprovalStage === s.stageLabel,
    }));
  });

  protected statusClass(status: ApprovalStatus): string {
    return STATUS_CLASSES[status] ?? '';
  }
}
