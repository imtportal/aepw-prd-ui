import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { LucideAngularModule, LucideIconProvider, LUCIDE_ICONS, Pencil, ArrowRight, PlusCircle, MessageSquare } from 'lucide-angular';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { AuditTimelineItem } from '../../models/audit.model';

@Component({
  selector: 'app-audit-timeline-item',
  standalone: true,
  imports: [DatePipe, LucideAngularModule, BadgeComponent],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({ Pencil, ArrowRight, PlusCircle, MessageSquare }),
    },
  ],
  templateUrl: './audit-timeline-item.component.html',
})
export class AuditTimelineItemComponent {
  readonly item = input.required<AuditTimelineItem>();
}
