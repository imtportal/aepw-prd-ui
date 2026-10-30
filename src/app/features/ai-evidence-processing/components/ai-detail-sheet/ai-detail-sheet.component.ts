import { Component, computed, effect, input, output, signal } from '@angular/core';
import {
  LucideAngularModule, LucideIconProvider, LUCIDE_ICONS,
  X, Sparkles, Eye, RotateCcw, AlertTriangle, XCircle, Check, Pencil,
} from 'lucide-angular';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { ProcessingFile, ExtractedFields, AiEvidenceRole } from '../../models/ai-evidence.model';
import { CONFIDENCE_HIGH, CONFIDENCE_MEDIUM } from '../../../../shared/utils/confidence.constants';

@Component({
  selector: 'app-ai-detail-sheet',
  standalone: true,
  imports: [LucideAngularModule, BadgeComponent],
  providers: [
    { provide: LUCIDE_ICONS, multi: true,
      useValue: new LucideIconProvider({ X, Sparkles, Eye, RotateCcw, AlertTriangle, XCircle, Check, Pencil }) },
  ],
  templateUrl: './ai-detail-sheet.component.html',
})
export class AiDetailSheetComponent {
  item         = input<ProcessingFile | null>(null);
  readonlyMode = input(false);
  viewComment  = input<string | null>(null);
  fromQueue    = input(false);
  /** Viewer's approval-stage role (from the ?role= query param). When present, extraction-field editing is further restricted to ICP. */
  role         = input<AiEvidenceRole | null>(null);
  close        = output<void>();
  reprocess    = output<string>();
  approve      = output<string>();
  reject       = output<string>();

  readonly comment          = signal('');
  readonly submitted        = signal(false);
  readonly showCommentError = computed(() => this.submitted() && this.comment().trim().length === 0);

  /** Extraction fields stay editable outside read-only mode; inside it, only when opened from the approval queue —
   *  and, when a viewer role is known, only for Contract Performance Manager or Admin. */
  protected readonly canEditExtraction = computed(() => {
    if (this.readonlyMode() && !this.fromQueue()) return false;
    const role = this.role();
    return role == null || role === <any>'Contract Performance Manager' || role === <any>'Admin';
  });

  readonly isApprovable = computed(() => {
    if (this.readonlyMode()) return false;
    const s = this.item()?.status;
    return s === 'pending' || s === 'needs-review';
  });

  // Editable copy of the AI-extracted fields, so reviewers can correct them without mutating the source record.
  readonly localExtracted = signal<ExtractedFields>({});
  readonly editingField   = signal<keyof ExtractedFields | null>(null);
  readonly editValue      = signal('');

  // Editable copy of the review comment shown in read-only mode.
  readonly localComment     = signal('');
  readonly isEditingComment = signal(false);
  readonly editCommentValue = signal('');

  constructor() {
    effect(() => {
      const it = this.item();
      this.comment.set('');
      this.submitted.set(false);
      this.localExtracted.set(it?.extracted ? { ...it.extracted } : {});
      this.editingField.set(null);
    });
    effect(() => {
      this.localComment.set(this.viewComment() ?? '');
      this.isEditingComment.set(false);
    });
  }

  protected startEditField(field: keyof ExtractedFields): void {
    if (!this.canEditExtraction()) return;
    const val = this.localExtracted()[field];
    this.editValue.set(val !== undefined ? String(val) : '');
    this.editingField.set(field);
  }

  protected confirmEditField(): void {
    const field = this.editingField();
    if (!field) return;
    const raw = this.editValue().trim();
    this.localExtracted.update(ext => {
      const next: ExtractedFields = { ...ext };
      if (field === 'quantity' || field === 'weight') {
        const num = Number(raw.replace(/,/g, ''));
        if (raw && !isNaN(num)) next[field] = num;
      } else if (raw) {
        next[field] = raw;
      }
      return next;
    });
    this.editingField.set(null);
  }

  protected cancelEditField(): void { this.editingField.set(null); }

  protected startEditComment(): void {
    if (!this.canEditExtraction()) return;
    this.editCommentValue.set(this.localComment());
    this.isEditingComment.set(true);
  }

  protected confirmEditComment(): void {
    this.localComment.set(this.editCommentValue().trim());
    this.isEditingComment.set(false);
  }

  protected cancelEditComment(): void { this.isEditingComment.set(false); }

  protected readonly confidenceClass = computed(() => {
    const c = this.item()?.confidence;
    if (c === undefined) return '';
    if (c >= CONFIDENCE_HIGH)   return 'text-xs font-semibold text-[hsl(var(--aepw-green))]';
    if (c >= CONFIDENCE_MEDIUM) return 'text-xs font-semibold text-[hsl(var(--aepw-orange))]';
    return 'text-xs font-semibold text-[hsl(var(--destructive))]';
  });

  protected readonly validationNoteClass = computed(() =>
    this.item()?.status === 'error'
      ? 'rounded-lg bg-[hsl(var(--destructive)/0.1)] text-[hsl(var(--destructive))] flex items-start gap-2 p-3 text-sm'
      : 'rounded-lg bg-[hsl(var(--aepw-orange)/0.1)] text-[hsl(var(--aepw-orange))] flex items-start gap-2 p-3 text-sm',
  );

  protected readonly statusBadgeClass = computed(() => {
    switch (this.item()?.status) {
      case 'processing':   return 'text-xs bg-[hsl(var(--aepw-blue)/0.1)] text-[hsl(var(--aepw-blue))]';
      case 'completed':
      case 'validated':    return 'text-xs bg-[hsl(var(--aepw-green)/0.1)] text-[hsl(var(--aepw-green))]';
      case 'needs-review': return 'text-xs bg-[hsl(var(--aepw-orange)/0.1)] text-[hsl(var(--aepw-orange))]';
      case 'error':
      case 'rejected':     return 'text-xs bg-[hsl(var(--destructive)/0.1)] text-[hsl(var(--destructive))]';
      default:             return 'text-xs';
    }
  });

  protected readonly statusLabel = computed(() => {
    switch (this.item()?.status) {
      case 'queued':       return 'Queued';
      case 'processing':   return 'Processing';
      case 'completed':    return 'Completed';
      case 'validated':    return 'Validated';
      case 'needs-review': return 'Review';
      case 'error':        return 'Error';
      case 'rejected':     return 'Rejected';
      case 'pending':      return 'Pending';
      default:             return '';
    }
  });

  onApprove(id: string): void {
    this.submitted.set(true);
    if (this.comment().trim().length === 0) return;
    this.approve.emit(id);
    this.comment.set('');
    this.submitted.set(false);
  }

  onReject(id: string): void {
    this.submitted.set(true);
    if (this.comment().trim().length === 0) return;
    this.reject.emit(id);
    this.comment.set('');
    this.submitted.set(false);
  }
}
