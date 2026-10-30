import { Component, computed, input, output } from '@angular/core';
import {
  LucideAngularModule, LucideIconProvider, LUCIDE_ICONS, Play,
} from 'lucide-angular';
import { ProgressComponent } from '../../../../shared/ui/progress/progress.component';
import { ReviewListDto, ReviewWorkflowStage } from '../../../reviews/models/review.model';
import { mapStageToFormattedKeys, upperCasedWithoutSpaceStages } from '../../containers/dashboard-page.model';

const EVIDENCE_STAGES: ReadonlyArray<ReviewWorkflowStage> =
  ['Evidence Collection', 'Validation', 'Approval', 'Closed'];

@Component({
  selector: 'app-review-progress-cell',
  standalone: true,
  imports: [LucideAngularModule, ProgressComponent],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Play }) },
  ],
  templateUrl: './review-progress-cell.component.html',
})
export class ReviewProgressCellComponent {
  review   = input.required<ReviewListDto>();
  initiate = output<void>();

  protected isDue           = computed(() => this.review().stage === 'Due');
  protected isDraft         = computed(() => this.review().stage === 'Draft');
  protected showEvidenceBar = computed(() => {
    const evidenceBarStages = [
      "Evidence Collection",
      "PM Approval",
      "Reviewer Approval",
      "Lead Reviewer Approval",
      "Final Approval",
      "Closed",
    ];
    let stageAllCasesBuffer = {} as Record<string, string>;
    for (const evidenceBarStage of evidenceBarStages) {
      stageAllCasesBuffer = mapStageToFormattedKeys({ [evidenceBarStage]: "true" });

      if (stageAllCasesBuffer[this.review().stage] || (this.review().stageDisplayValue && stageAllCasesBuffer[this.review().stageDisplayValue as string])) {
        return true;
      }
    }
    
    return false;
  });
}
