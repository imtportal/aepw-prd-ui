import { Component, input } from '@angular/core';
import { ApprovalStage } from '../../../reviews/models/review.model';
import { APPROVAL_STAGE_ORDER } from '../../reviewer-queue.types';

@Component({
  selector: 'app-step-dots',
  standalone: true,
  templateUrl: './step-dots.component.html',
})
export class StepDotsComponent {
  currentStage = input.required<string>();
  protected readonly stages = APPROVAL_STAGE_ORDER;
}
