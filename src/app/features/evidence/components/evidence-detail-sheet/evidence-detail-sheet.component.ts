import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideAngularModule, LucideIconProvider, LUCIDE_ICONS,
  X, ThumbsUp, Download, ExternalLink, AlertTriangle,
  FileText, Image, FileCheck,
} from 'lucide-angular';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { EvidenceListDto, EvidenceStatus } from '../../models/evidence.model';

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
  file    = input<EvidenceListDto | null>(null);
  close   = output<void>();
  approve = output<string>();

  readonly isApprovable = computed(() => {
    const s = this.file()?.status;
    return s === 'Pending' || s === 'NeedsReview';
  });

  protected readonly statusBadgeClass = computed(() => {
    switch (this.file()?.status as EvidenceStatus) {
      case 'Validated':   return 'text-[10px] bg-[hsl(var(--aepw-green)/0.1)] text-[hsl(var(--aepw-green))]';
      case 'NeedsReview': return 'text-[10px] bg-[hsl(var(--aepw-orange)/0.1)] text-[hsl(var(--aepw-orange))]';
      case 'Rejected':    return 'text-[10px] bg-[hsl(var(--destructive)/0.1)] text-[hsl(var(--destructive))]';
      case 'Processing':  return 'text-[10px] bg-[hsl(var(--aepw-blue)/0.1)] text-[hsl(var(--aepw-blue))]';
      default:            return 'text-[10px]';
    }
  });

  protected readonly statusLabel = computed(() => {
    switch (this.file()?.status as EvidenceStatus) {
      case 'Pending':     return 'Pending';
      case 'Validated':   return 'Validated';
      case 'NeedsReview': return 'Review';
      case 'Rejected':    return 'Rejected';
      case 'Processing':  return 'Processing';
      default:            return '';
    }
  });
}
