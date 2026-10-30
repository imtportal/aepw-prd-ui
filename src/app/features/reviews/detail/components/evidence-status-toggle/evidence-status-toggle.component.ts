import { Component, computed, input, output } from '@angular/core';
import { EvidenceStatus } from '../../../../evidence/models/evidence.model';

const STATUS_CYCLE: EvidenceStatus[] =
  ['Pending', 'Processing', 'NeedsReview', 'Validated', 'Rejected'];

const STATUS_LABELS: Record<EvidenceStatus, string> = {
  'Pending':     'Pending',
  'Processing':  'Processing',
  'NeedsReview': 'Needs Review',
  'Validated':   'Validated',
  'Rejected':    'Rejected',
};

const STATUS_CLASSES: Record<EvidenceStatus, string> = {
  'Pending':     'bg-muted text-muted-foreground',
  'Processing':  'bg-[hsl(var(--aepw-light-blue)/0.2)] text-[hsl(var(--aepw-blue))]',
  'NeedsReview': 'bg-[hsl(var(--aepw-orange)/0.15)] text-[hsl(var(--aepw-orange))]',
  'Validated':   'bg-[hsl(var(--aepw-green)/0.15)] text-[hsl(var(--aepw-green))]',
  'Rejected':    'bg-destructive/10 text-destructive',
};

@Component({
  selector: 'app-evidence-status-toggle',
  standalone: true,
  templateUrl: './evidence-status-toggle.component.html',
})
export class EvidenceStatusToggleComponent {
  status = input.required<EvidenceStatus>();
  change = output<EvidenceStatus>();

  protected readonly statusLabel = computed(() => STATUS_LABELS[this.status()]);
  protected readonly statusClass = computed(() => STATUS_CLASSES[this.status()]);

  protected cycle(): void {
    const idx = STATUS_CYCLE.indexOf(this.status());
    this.change.emit(STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]);
  }
}
