import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideAngularModule, LucideIconProvider, LUCIDE_ICONS,
  X, Eye, RotateCcw, ExternalLink, CheckCircle2, AlertTriangle,
  XCircle, Clock, Loader2, Sparkles,
} from 'lucide-angular';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { QueueItem } from '../../models/ai-processing.model';
import { CONFIDENCE_HIGH, CONFIDENCE_MEDIUM } from '../../../../shared/utils/confidence.constants';

@Component({
  selector: 'app-ai-detail-sheet',
  standalone: true,
  imports: [LucideAngularModule, BadgeComponent, RouterLink],
  providers: [
    { provide: LUCIDE_ICONS, multi: true,
      useValue: new LucideIconProvider({ X, Eye, RotateCcw, ExternalLink, CheckCircle2, AlertTriangle, XCircle, Clock, Loader2, Sparkles }) },
  ],
  templateUrl: './ai-detail-sheet.component.html',
})
export class AiDetailSheetComponent {
  item      = input<QueueItem | null>(null);
  close     = output<void>();
  reprocess = output<string>();

  protected readonly confidenceClass = computed(() => {
    const c = this.item()?.confidence;
    if (!c) return '';
    if (c >= CONFIDENCE_HIGH)   return 'text-[hsl(var(--aepw-green))]';
    if (c >= CONFIDENCE_MEDIUM) return 'text-[hsl(var(--aepw-orange))]';
    return 'text-[hsl(var(--destructive))]';
  });

  protected readonly validationNoteClass = computed(() =>
    this.item()?.status === 'error'
      ? 'bg-[hsl(var(--destructive)/0.08)] text-[hsl(var(--destructive))]'
      : 'bg-[hsl(var(--aepw-orange)/0.08)] text-[hsl(var(--aepw-orange))]',
  );

  protected readonly statusBadgeClass = computed(() => {
    switch (this.item()?.status) {
      case 'processing':   return 'text-[10px] bg-[hsl(var(--aepw-blue)/0.1)] text-[hsl(var(--aepw-blue))]';
      case 'completed':    return 'text-[10px] bg-[hsl(var(--aepw-green)/0.1)] text-[hsl(var(--aepw-green))]';
      case 'needs-review': return 'text-[10px] bg-[hsl(var(--aepw-orange)/0.1)] text-[hsl(var(--aepw-orange))]';
      case 'error':        return 'text-[10px] bg-[hsl(var(--destructive)/0.1)] text-[hsl(var(--destructive))]';
      default:             return 'text-[10px]';
    }
  });

  protected readonly statusLabel = computed(() => {
    switch (this.item()?.status) {
      case 'queued':       return 'Queued';
      case 'processing':   return 'Processing';
      case 'completed':    return 'Completed';
      case 'needs-review': return 'Review';
      case 'error':        return 'Error';
      default:             return '';
    }
  });
}
