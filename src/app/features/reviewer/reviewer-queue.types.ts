import { ApprovalStage } from '../reviews/models/review.model';

export type { ApprovalStage };

export interface QueueTab {
  id:    ApprovalStage;
  label: string;
  count: number;
}

export const STAGE_TO_STEP_ID: Record<
  ApprovalStage,
  'pmStatus' | 'reviewerStatus' | 'leadStatus' | 'finalStatus'
> = {
  'PM Review':      'pmStatus',
  'Reviewer':       'reviewerStatus',
  'Lead Reviewer':  'leadStatus',
  'Final Approval': 'finalStatus',
  'Complete':       'finalStatus',
  'Admin':       'finalStatus',
};

export const APPROVAL_STAGE_ORDER: ApprovalStage[] = [
  'PM Review',
  'Reviewer',
  'Lead Reviewer',
  'Final Approval',
];
