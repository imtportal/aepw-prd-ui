import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideAngularModule, LucideIconProvider, LUCIDE_ICONS,
  FileText, Image, FileCheck, Sparkles, Eye, ExternalLink, AlertCircle, AlertTriangle,
} from 'lucide-angular';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { TooltipDirective } from '../../../../shared/ui/tooltip/tooltip.directive';
import { ProcessingFile } from '../../models/ai-evidence.model';
import { CONFIDENCE_HIGH, CONFIDENCE_MEDIUM } from '../../../../shared/utils/confidence.constants';

@Component({
  selector: '[app-ai-evidence-row]',
  standalone: true,
  imports: [LucideAngularModule, BadgeComponent, RouterLink, TooltipDirective],
  providers: [
    { provide: LUCIDE_ICONS, multi: true,
      useValue: new LucideIconProvider({ FileText, Image, FileCheck, Sparkles, Eye, ExternalLink, AlertCircle, AlertTriangle }) },
  ],
  templateUrl: './ai-evidence-row.component.html',
})
export class AiEvidenceRowComponent {
  file     = input.required<ProcessingFile>();
  selected = input<boolean>(false);

  selectToggle   = output<string>();
  openAiDetail   = output<string>();
  openEvidDetail = output<string>();

  readonly isApprovable = computed(() => {
    const s = this.file().status;
    return s === 'pending' || s === 'needs-review';
  });

  protected readonly confidenceClass = computed(() => {
    const c = this.file().confidence;
    if (c === undefined) return '';
    if (c >= CONFIDENCE_HIGH)   return 'text-sm font-semibold text-[hsl(var(--aepw-green))]';
    if (c >= CONFIDENCE_MEDIUM) return 'text-sm font-semibold text-[hsl(var(--aepw-orange))]';
    return 'text-sm font-semibold text-[hsl(var(--destructive))]';
  });

  protected readonly statusBadgeClass = computed(() => {
    switch (this.file().status) {
      case 'validated':
      case 'completed':    return 'text-xs bg-[hsl(var(--aepw-green)/0.1)] text-[hsl(var(--aepw-green))]';
      case 'needs-review': return 'text-xs bg-[hsl(var(--aepw-orange)/0.1)] text-[hsl(var(--aepw-orange))]';
      case 'processing':   return 'text-xs bg-[hsl(var(--aepw-blue)/0.1)] text-[hsl(var(--aepw-blue))]';
      case 'rejected':
      case 'error':        return 'text-xs bg-[hsl(var(--destructive)/0.1)] text-[hsl(var(--destructive))]';
      default:             return 'text-xs';
    }
  });

  protected readonly statusLabel = computed(() => {
    switch (this.file().status) {
      case 'pending':      return 'Pending';
      case 'queued':       return 'Queued';
      case 'processing':   return 'Processing';
      case 'completed':    return 'Completed';
      case 'validated':    return 'Validated';
      case 'needs-review': return 'Review';
      case 'rejected':     return 'Rejected';
      case 'error':        return 'Error';
    }
  });

  protected readonly noteClass = computed(() =>
    this.file().status === 'error'
      ? 'text-xs text-[hsl(var(--destructive))] flex items-center gap-1'
      : 'text-xs text-[hsl(var(--aepw-orange))] flex items-center gap-1',
  );
}
