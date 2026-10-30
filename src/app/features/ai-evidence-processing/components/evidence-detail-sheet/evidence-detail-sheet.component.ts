import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideAngularModule, LucideIconProvider, LUCIDE_ICONS,
  X, ThumbsUp, Download, ExternalLink, AlertTriangle,
  FileText, Image, FileCheck,
} from 'lucide-angular';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { ProcessingFile } from '../../models/ai-evidence.model';

@Component({
  selector: 'app-evidence-detail-sheet',
  standalone: true,
  imports: [LucideAngularModule, BadgeComponent, RouterLink],
  providers: [
    { provide: LUCIDE_ICONS, multi: true,
      useValue: new LucideIconProvider({ X, ThumbsUp, Download, ExternalLink, AlertTriangle, FileText, Image, FileCheck }) },
  ],
  templateUrl: './evidence-detail-sheet.component.html',
})
export class EvidenceDetailSheetComponent {
  file    = input<ProcessingFile | null>(null);
  close   = output<void>();
  approve = output<string>();

  readonly isApprovable = computed(() => {
    const s = this.file()?.status;
    return s === 'pending' || s === 'needs-review';
  });

  protected readonly statusBadgeClass = computed(() => {
    switch (this.file()?.status) {
      case 'validated':
      case 'completed':    return 'text-[10px] bg-[hsl(var(--aepw-green)/0.1)] text-[hsl(var(--aepw-green))]';
      case 'needs-review': return 'text-[10px] bg-[hsl(var(--aepw-orange)/0.1)] text-[hsl(var(--aepw-orange))]';
      case 'rejected':
      case 'error':        return 'text-[10px] bg-[hsl(var(--destructive)/0.1)] text-[hsl(var(--destructive))]';
      case 'processing':   return 'text-[10px] bg-[hsl(var(--aepw-blue)/0.1)] text-[hsl(var(--aepw-blue))]';
      default:             return 'text-[10px]';
    }
  });

  protected readonly statusLabel = computed(() => {
    switch (this.file()?.status) {
      case 'pending':      return 'Pending';
      case 'queued':       return 'Queued';
      case 'validated':    return 'Validated';
      case 'completed':    return 'Completed';
      case 'needs-review': return 'Review';
      case 'rejected':     return 'Rejected';
      case 'processing':   return 'Processing';
      case 'error':        return 'Error';
      default:             return '';
    }
  });
}
