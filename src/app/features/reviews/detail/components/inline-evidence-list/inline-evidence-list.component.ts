import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import {
  LucideAngularModule, LucideIconProvider, LUCIDE_ICONS,
  FileText, FileSpreadsheet, Image, Trash2,
} from 'lucide-angular';
// import { AddEvidenceDropdownComponent } from '../add-evidence-dropdown/add-evidence-dropdown.component';
// import { AiDetailSheetComponent } from '../../../../ai-evidence-processing/components/ai-detail-sheet/ai-detail-sheet.component';
import { AiEvidenceService } from '../../../../ai-evidence-processing/services/ai-evidence.service';
import { ProcessingFile } from '../../../../ai-evidence-processing/models/ai-evidence.model';
import { CONFIDENCE_HIGH, CONFIDENCE_MEDIUM } from '../../../../../shared/utils/confidence.constants';
 import { parseReportedValue } from '../../../../../shared/utils/risk-adjusted.utils';
import { ApprovalStage, DetailEvidenceFile } from '../../../models/review.model';
import { AddEvidenceDropdownComponent } from '../add-evidence-dropdown/add-evidence-dropdown.component';
import { extractedValueForFile } from '../../../../../shared/utils/evidence-captured.utils';

@Component({
  selector: 'app-inline-evidence-list',
  standalone: true,
  imports: [LucideAngularModule, AddEvidenceDropdownComponent, ],
  providers: [
    { provide: LUCIDE_ICONS, multi: true,
      useValue: new LucideIconProvider({ FileText, FileSpreadsheet, Image, Trash2 }) },
  ],
  templateUrl: './inline-evidence-list.component.html',
})
export class InlineEvidenceListComponent {
  items            = input.required<DetailEvidenceFile[]>();
  evidenceRequired = input.required<number>();
  clearTrigger     = input(0);
  readonly         = input(false);
  metricUnit       = input('');
  reportedValue    = input('');
  excelComment     = input<string | undefined>(undefined);
  /** The "View" (AI extraction details) button is only meaningful for approval-queue reviewers. */
  fromQueue        = input(false);
  /** Viewer's approval-stage role (from the ?role= query param), forwarded to the AI detail sheet. */
  role             = input<ApprovalStage | null>(null);

  readonly filesSelected  = output<{ type: string; files: FileList }>();
  readonly selectionChange = output<string[]>();
  readonly deleteFile      = output<string>();

  private readonly aiSvc = inject(AiEvidenceService);

  readonly selectedIds           = signal<Set<string>>(new Set());
  readonly selectedDetailFile    = signal<ProcessingFile | null>(null);
  readonly selectedDetailComment = signal<string | null>(null);

  constructor() {
    // Broadcast selection whenever it changes
    effect(() => this.selectionChange.emit([...this.selectedIds()]));
    // Clear selection when parent increments clearTrigger
    effect(() => { if (this.clearTrigger() > 0) this.selectedIds.set(new Set()); });
  }

  // Items not yet sent to AI processing (no aiStatus = untouched)
  protected readonly actionableFiles = computed(() =>
    this.items().filter(f => f.aiStatus === undefined),
  );

  protected readonly reviewedCount = computed(() =>
    this.items().filter(f => f.aiStatus === 'approved' || f.aiStatus === 'rejected').length,
  );

  protected readonly selectAllState = computed<'none' | 'some' | 'all'>(() => {
    const actionable = this.actionableFiles();
    if (actionable.length === 0 || this.selectedIds().size === 0) return 'none';
    if (actionable.every(f => this.selectedIds().has(f.id))) return 'all';
    return 'some';
  });

  protected toggleSelect(id: string): void {
    this.selectedIds.update(s => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  protected selectAll(): void {
    const actionable = this.actionableFiles();
    if (actionable.every(f => this.selectedIds().has(f.id))) {
      this.selectedIds.set(new Set());
    } else {
      this.selectedIds.set(new Set(actionable.map(f => f.id)));
    }
  }

  protected canViewDetails(file: DetailEvidenceFile): boolean {
    return (file.aiStatus === 'approved' || file.aiStatus === 'rejected' || file.aiStatus === 'validated') && !!file.reviewComment;
  }

  protected confidenceClass(c: number | undefined): string {
    if (c === undefined) return 'text-muted-foreground/40';
    if (c >= CONFIDENCE_HIGH)   return 'font-semibold text-[hsl(var(--aepw-green))]';
    if (c >= CONFIDENCE_MEDIUM) return 'font-semibold text-[hsl(var(--aepw-orange))]';
    return 'font-semibold text-[hsl(var(--destructive))]';
  }

  protected aiStatusBadgeClass(aiStatus: string | undefined): string {
    switch (aiStatus) {
      case 'validated':
      case 'approved':     return 'bg-[hsl(var(--aepw-green)/0.12)] text-[hsl(var(--aepw-green))]';
      case 'needs-review': return 'bg-[hsl(var(--aepw-orange)/0.12)] text-[hsl(var(--aepw-orange))]';
      case 'processing':
      case 'queued':       return 'bg-[hsl(var(--aepw-blue)/0.12)] text-[hsl(var(--aepw-blue))]';
      case 'error':
      case 'rejected':     return 'bg-[hsl(var(--destructive)/0.1)] text-[hsl(var(--destructive))]';
      default:             return 'bg-muted text-muted-foreground';
    }
  }

  protected aiStatusLabel(aiStatus: string | undefined): string {
    switch (aiStatus) {
      case 'pending':      return 'Pending';
      case 'queued':       return 'Queued';
      case 'processing':   return 'Processing';
      case 'completed':    return 'Completed';
      case 'validated':    return 'Validated';
      case 'needs-review': return 'Review';
      case 'approved':     return 'Approved';
      case 'rejected':     return 'Rejected';
      case 'error':        return 'Error';
      default:             return '—';
    }
  }

  protected extractedForFile(fileId: string): number | null {
    return extractedValueForFile(this.aiSvc.files(), fileId, this.metricUnit());
  }

  protected formatExtracted(val: number): string {
    return val.toLocaleString(undefined, { maximumFractionDigits: 1 });
  }

  /** % of the metric's total reported value that this one evidence file's captured value accounts for. */
  protected contributionForFile(fileId: string): number | null {
    const captured = this.extractedForFile(fileId);
    const reported = parseReportedValue(this.reportedValue());
    if (captured == null || !reported) return null;
    return captured / reported * 100;
  }

  protected formatContribution(val: number): string {
    return `${val.toLocaleString(undefined, { maximumFractionDigits: 1 })}%`;
  }

  protected openViewDetails(file: DetailEvidenceFile): void {
    const aiFile = this.aiSvc.files().find(f => f.id === file.id);
    if (aiFile) {
      this.selectedDetailFile.set(aiFile);
      this.selectedDetailComment.set(file.reviewComment ?? null);
    }
  }

  protected closeViewDetails(): void {
    this.selectedDetailFile.set(null);
    this.selectedDetailComment.set(null);
  }

  protected onDelete(file: DetailEvidenceFile): void {
    if (!window.confirm(`Delete "${file.fileName}"? This cannot be undone.`)) return;
    this.selectedIds.update(s => {
      if (!s.has(file.id)) return s;
      const n = new Set(s);
      n.delete(file.id);
      return n;
    });
    this.deleteFile.emit(file.id);
  }
}
