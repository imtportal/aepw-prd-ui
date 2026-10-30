import { Component, input, output } from '@angular/core';
import { ReviewItem } from '../../../reviews/models/review.model';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { StepDotsComponent } from '../step-dots/step-dots.component';
import { formatDateTime } from '../../../../shared/utils/date.utils';

@Component({
  selector: 'app-queue-item-row',
  standalone: true,
  imports: [BadgeComponent, StepDotsComponent],
  host: { style: 'display: contents' },
  templateUrl: './queue-item-row.component.html',
})
export class QueueItemRowComponent {
  item = input.required<ReviewItem>();

  approve = output<number>();
  reject  = output<number>();
  recycle = output<number>();

  protected readonly formatDate = formatDateTime;
}
