import { Component, input } from '@angular/core';
import {
  LucideAngularModule, LucideIconProvider, LUCIDE_ICONS,
  Activity, Loader2, Clock, CheckCircle2, AlertTriangle, XCircle,
} from 'lucide-angular';
import {
  CardComponent, CardContentComponent,
} from '../../../../shared/ui/card/card.component';

@Component({
  selector: 'app-ai-stats-row',
  standalone: true,
  imports: [LucideAngularModule, CardComponent, CardContentComponent],
  providers: [
    { provide: LUCIDE_ICONS, multi: true,
      useValue: new LucideIconProvider({ Activity, Loader2, Clock, CheckCircle2, AlertTriangle, XCircle }) },
  ],
  templateUrl: './ai-stats-row.component.html',
})
export class AiStatsRowComponent {
  total       = input.required<number>();
  queued      = input.required<number>();
  processing  = input.required<number>();
  completed   = input.required<number>();
  needsReview = input.required<number>();
  errorCount  = input.required<number>();
}
