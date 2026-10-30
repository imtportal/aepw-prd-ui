import { Component, computed, input, output } from '@angular/core';
import {
  LucideAngularModule, LucideIconProvider, LUCIDE_ICONS,
  FileText, Image, FileCheck, Zap, Eye,
} from 'lucide-angular';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { QueueItem } from '../../models/ai-processing.model';
import { CONFIDENCE_HIGH, CONFIDENCE_MEDIUM } from '../../../../shared/utils/confidence.constants';

@Component({
  selector: '[app-ai-queue-row]',
  standalone: true,
  imports: [LucideAngularModule, BadgeComponent],
  providers: [
    { provide: LUCIDE_ICONS, multi: true,
      useValue: new LucideIconProvider({ FileText, Image, FileCheck, Zap, Eye }) },
  ],
  templateUrl: './ai-queue-row.component.html',
})
export class AiQueueRowComponent {
  item       = input.required<QueueItem>();
  openDetail = output<string>();

  protected readonly confidenceClass = computed(() => {
    const c = this.item().confidence;
    if (c === undefined) return '';
    if (c >= CONFIDENCE_HIGH)   return 'font-semibold text-[hsl(var(--aepw-green))]';
    if (c >= CONFIDENCE_MEDIUM) return 'font-semibold text-[hsl(var(--aepw-orange))]';
    return 'font-semibold text-[hsl(var(--destructive))]';
  });

  protected readonly noteClass = computed(() =>
    this.item().status === 'error'
      ? 'text-xs text-[hsl(var(--destructive))]'
      : 'text-xs text-[hsl(var(--aepw-orange))]',
  );

  protected readonly statusBadgeClass = computed(() => {
    switch (this.item().status) {
      case 'processing':   return 'text-xs bg-[hsl(var(--aepw-blue)/0.1)] text-[hsl(var(--aepw-blue))]';
      case 'completed':    return 'text-xs bg-[hsl(var(--aepw-green)/0.1)] text-[hsl(var(--aepw-green))]';
      case 'needs-review': return 'text-xs bg-[hsl(var(--aepw-orange)/0.1)] text-[hsl(var(--aepw-orange))]';
      case 'error':        return 'text-xs bg-[hsl(var(--destructive)/0.1)] text-[hsl(var(--destructive))]';
      default:             return 'text-xs';
    }
  });

  protected readonly statusLabel = computed(() => {
    switch (this.item().status) {
      case 'queued':       return 'Queued';
      case 'processing':   return 'Processing';
      case 'completed':    return 'Completed';
      case 'needs-review': return 'Review';
      case 'error':        return 'Error';
    }
  });
}
