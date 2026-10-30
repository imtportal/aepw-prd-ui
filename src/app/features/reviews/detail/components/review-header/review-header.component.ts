import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideAngularModule, LucideIconProvider, LUCIDE_ICONS,
  ArrowLeft, ChevronRight, Save, History, Upload,
  LoaderCircle,
  MessageSquare,
  MessageCircle,
  Settings2,
  ListRestart,
  ListCheck,
} from 'lucide-angular';
import { BadgeComponent } from '../../../../../shared/ui/badge/badge.component';
import { ReviewListDto, ReviewDetail, ReviewWorkflowStage, ReviewDto } from '../../../models/review.model';
import { STAGE_COLORS } from '../../../../dashboard/containers/dashboard-page.model'; 
import { ProgressComponent } from '../../../../../shared/ui/progress/progress.component';
import { ReviewHeaderAction } from './review-header.model';
import { ProjectDetailsComponent } from '../../../../admin/projects/components/project-details/project-details';
import { JsonPipe } from '@angular/common';


// const STAGE_COLORS: Record<ReviewWorkflowStage, string> = {
//   'Due':                     'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]',
//   'Draft':                   'bg-[hsl(var(--aepw-blue)/0.12)] text-[hsl(var(--aepw-blue))]',
//   'Data Collection':         Color_Codes.Green,
//   'Evidence Collection':     Color_Codes.Orange,
//   'Validation':              'bg-[hsl(var(--aepw-light-blue)/0.25)] text-[hsl(var(--aepw-blue))]',
//   'Approval':                'bg-[hsl(var(--aepw-green)/0.15)] text-[hsl(var(--aepw-green))]',
//   'Closed':                  'bg-[hsl(var(--aepw-dark-grey)/0.12)] text-[hsl(var(--aepw-dark-grey))]',
//   'Risk Adjustment Pending':  Color_Codes.Orange,
//   'Risk Adjustment Reviewed': 'bg-[hsl(var(--aepw-green)/0.15)] text-[hsl(var(--aepw-green))]',
  
//   'RISKADJUSTMENT': Color_Codes.Orange,
//   [('PendingRiskAdjust').toUpperCase ()]: Color_Codes.Orange,
//   'Pending Risk Adjust': Color_Codes.Orange,
//   'Risk Adjustment': Color_Codes.Orange,
// };

@Component({
  selector: 'app-review-header',
  standalone: true,
  imports: [RouterLink, LucideAngularModule, BadgeComponent, ProgressComponent, JsonPipe, ProjectDetailsComponent],
  providers: [
    { provide: LUCIDE_ICONS, multi: true,
      useValue: new LucideIconProvider({ ArrowLeft, ChevronRight, Save, History, Upload, LoaderCircle, MessageSquare, Settings2, ListRestart, ListCheck }) },
  ],
  templateUrl: './review-header.component.html',
})
export class ReviewHeaderComponent {
  review       = input<ReviewDto | null>(null);
  dataCollectionFileUploading = input<boolean>(false);
  showUploadDataButton = input<boolean>(false);
  showAddCommentButton = input<boolean>(false);
  showEditMetricsButton = input<boolean>(false);
  showRestatementButton = input<boolean>(false);
  restatementModeActive = input<boolean>(false);
  issuingRestatement = input<boolean>(false);
  reviewDetail = input.required<ReviewDto>();
  action       = output<ReviewHeaderAction>();

  public reviewHeaderAction: (typeof ReviewHeaderAction) = ReviewHeaderAction;

  protected p = {
   
  }
  
  protected readonly stageClass = computed(
    () => STAGE_COLORS[this.reviewDetail().stage] ?? '',
  );

  protected readonly pmName = computed(
    () =>  '—',
  );

  protected readonly evidenceProgress = computed(
    () => {
      return this.review()?.evidenceConfirmedPct ?? 0;
    }
  );

  // protected readonly reviewId = computed(() => {
  //   const d = this.reviewDetail();
  //   const parts   = d.reviewPeriodCode?.split(' ');
  //   const quarter = parts[0] ?? '';
  //   const year    = parts[1] ?? '';
  //   return `REV-${year}-${quarter}-${d.projectId}`;
  // });

  onEditMetrics(): void {
    this.action.emit(ReviewHeaderAction.EditMetrics);
  }

  goBack(): void {
    this.action.emit(ReviewHeaderAction.GoBack);
  }

}
