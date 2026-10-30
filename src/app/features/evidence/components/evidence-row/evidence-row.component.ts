import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideAngularModule, LucideIconProvider, LUCIDE_ICONS,
  FileText, Image, FileCheck, Eye, ExternalLink, AlertCircle,
} from 'lucide-angular';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { TooltipDirective } from '../../../../shared/ui/tooltip/tooltip.directive';
import { EvidenceListDto, EvidenceStatus } from '../../models/evidence.model';
import { CONFIDENCE_HIGH, CONFIDENCE_MEDIUM } from '../../../../shared/utils/confidence.constants';

@Component({
  selector: '[app-evidence-row]',
  standalone: true,
  imports: [LucideAngularModule, BadgeComponent, RouterLink, TooltipDirective],
  providers: [
    { provide: LUCIDE_ICONS, multi: true,
      useValue: new LucideIconProvider({ FileText, Image, FileCheck, Eye, ExternalLink, AlertCircle }) },
  ],
  templateUrl: './evidence-row.component.html',
})
export class EvidenceRowComponent {
  file     = input.required<EvidenceListDto>();
  selected = input<boolean>(false);

  selectToggle = output<string>();
  openDetail   = output<string>();

  readonly isApprovable = computed(() =>
    this.file().status === 'Pending' || this.file().status === 'NeedsReview',
  );

  protected readonly confidenceClass = computed(() => {
    const c = this.file().aiConfidence;
    if (c === undefined) return '';
    if (c >= CONFIDENCE_HIGH)   return 'text-[hsl(var(--aepw-green))]';
    if (c >= CONFIDENCE_MEDIUM) return 'text-[hsl(var(--aepw-orange))]';
    return 'text-[hsl(var(--destructive))]';
  });

  protected readonly statusBadgeClass = computed(() => {
    switch (this.file().status as EvidenceStatus) {
      case 'Validated':   return 'text-xs bg-[hsl(var(--aepw-green)/0.1)] text-[hsl(var(--aepw-green))]';
      case 'NeedsReview': return 'text-xs bg-[hsl(var(--aepw-orange)/0.1)] text-[hsl(var(--aepw-orange))]';
      case 'Rejected':    return 'text-xs bg-[hsl(var(--destructive)/0.1)] text-[hsl(var(--destructive))]';
      case 'Processing':  return 'text-xs bg-[hsl(var(--aepw-blue)/0.1)] text-[hsl(var(--aepw-blue))]';
      default:            return 'text-xs';
    }
  });

  protected readonly statusLabel = computed(() => {
    switch (this.file().status as EvidenceStatus) {
      case 'Pending':     return 'Pending';
      case 'Validated':   return 'Validated';
      case 'NeedsReview': return 'Review';
      case 'Rejected':    return 'Rejected';
      case 'Processing':  return 'Processing';
    }
  });
}
