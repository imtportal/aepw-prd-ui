import { Component, computed, effect, HostListener, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule, LucideIconProvider, LUCIDE_ICONS,
  ChevronDown, ChevronRight, Paperclip, TriangleAlert, Clock, Pencil, Sparkles, LoaderCircle,
  Check, X, MessageSquare, Info,
} from 'lucide-angular';
// import { BadgeComponent } from '../../../../../shared/ui/badge/badge.component';
import { MetricRow, ApprovalStatus, ApprovalStage, ReviewApprovalStatus } from '../../../models/review.model';
import { InlineEvidenceListComponent } from '../inline-evidence-list/inline-evidence-list.component';
import { AiEvidenceService } from '../../../../ai-evidence-processing/services/ai-evidence.service';
import { calculateRiskAdjustedValue } from '../../../../../shared/utils/risk-adjusted.utils';
import { sumEvidenceCapturedValue } from '../../../../../shared/utils/evidence-captured.utils';
import { MetricService } from '../../../../admin/services/metric.service';
import { Metric } from '../../../../admin/models/metric.model';
import { UserService } from '../../../../admin/services/user.service';
import { UserRole } from '../../../../../core/models/user.model';
import { BadgeComponent } from '../../../../../shared/ui/badge/badge.component';

const STATUS_CLASSES: Record<ApprovalStatus, string> = {
  'Pending':  'bg-muted text-muted-foreground',
  'Approved': 'bg-[hsl(var(--aepw-green)/0.15)] text-[hsl(var(--aepw-green))]',
  'Rejected': 'bg-destructive/10 text-destructive',
  // 'Recycled': 'bg-[hsl(var(--aepw-orange)/0.12)] text-[hsl(var(--aepw-orange))]',
} as Record<ApprovalStatus, string>;

const PROGRESS_STATUS_CLASSES: Record<string, string> = {
  ...STATUS_CLASSES,
  '-': 'bg-muted/60 text-muted-foreground/50',
};

interface ApprovalProgressRow {
  stage:          string;
  status:         string;
  comment:        string;
  approvedBy:     string;
  assignedUser:   string;
  updatedOn:      string;
  approverKey:    ApproverKey;
  /** The UserRole whose active users can be assigned to this stage; null when the stage has
   *  no distinct role in the user table (e.g. ICP), so it's never editable. */
  assignableRole: UserRole | null;
}

export type ApproverKey = 'pm' | 'reviewer' | 'lead' | 'final';

type StatusField = 'pmStatus' | 'reviewStatus' | 'leadStatus' | 'finalStatus';
type UpdatedOnField = 'pmStatusUpdatedOn' | 'reviewStatusUpdatedOn' | 'leadStatusUpdatedOn' | 'finalStatusUpdatedOn';

/** Approval chain in order — several stages share the same underlying MetricRow status field
 *  (and the same underlying approver identity, sourced from the review's ReviewItem). */
const APPROVAL_PROGRESS_STAGES: { label: string; field: StatusField; approver: ApproverKey; updatedOnField: UpdatedOnField; assignableRole: UserRole | null }[] = [
  { label: 'CPM',                     field: 'pmStatus',     approver: 'pm',       updatedOnField: 'pmStatusUpdatedOn',     assignableRole: <UserRole> 'Contract Performance Manager' },
  { label: 'ICP',                     field: 'reviewStatus', approver: 'reviewer', updatedOnField: 'reviewStatusUpdatedOn', assignableRole: null },
  { label: 'Program Leader',          field: 'reviewStatus', approver: 'reviewer', updatedOnField: 'reviewStatusUpdatedOn', assignableRole: <UserRole> 'Program Leader' },
  { label: 'Global Execution Leader', field: 'leadStatus',   approver: 'lead',     updatedOnField: 'leadStatusUpdatedOn',   assignableRole: <UserRole> 'Global Execution Leader' },
  { label: 'Admin',                   field: 'leadStatus',   approver: 'lead',     updatedOnField: 'leadStatusUpdatedOn',   assignableRole: <UserRole> 'Admin' },
  { label: 'Senior Leadership Team',  field: 'finalStatus',  approver: 'final',    updatedOnField: 'finalStatusUpdatedOn',  assignableRole: <UserRole> 'Senior Leadership Team' },
];

/** The only metric with a "Type of Valorization" selector, editable by the Contract Performance Manager only. */
const VALORIZATION_METRIC_CODE = 'MW1.3';

export const VALORIZATION_TYPE_OPTIONS = [
  'Recycled Plastic (Mechanical)',
  'Recycled Plastic (Physical/Chemical)',
  'Co-processing',
  'Waste-to-Fuel',
  'Waste-to-Energy',
  'Multiple',
  'Others',
];

/** Placeholder sign-off note shown for a stage once it's Approved (real per-stage comments aren't tracked yet). */
const APPROVED_STAGE_COMMENTS: Record<string, string> = {
  'CPM':                    'Data submitted and verified against source records.',
  'ICP':                    'Independent Compliance Partner reviewed evidence — no discrepancies found.',
  'Program Leader':         'Metric aligns with program targets; approved for next stage.',
  'Global Execution Leader':  'Cross-program consistency confirmed; approved.',
  'Admin':                  'Administrative review complete; documentation in order.',
  'Senior Leadership Team': 'Final sign-off granted; metric closed for this cycle.',
};

@Component({
  selector: 'app-metric-row',
  standalone: true,
  imports: [LucideAngularModule, InlineEvidenceListComponent, FormsModule, BadgeComponent],
  providers: [
    { provide: LUCIDE_ICONS, multi: true,
      useValue: new LucideIconProvider({
        ChevronDown, ChevronRight, Paperclip, TriangleAlert, Clock, Pencil, Sparkles, LoaderCircle,
        Check, X, MessageSquare, Info,
      }) },
  ],
  templateUrl: './metric-row.component.html',
})
export class MetricRowComponent {
  metric         = input.required<MetricRow>();
  isExpanded     = input.required<boolean>();
  hasChildren    = input(false);
  readOnly       = input(false);
  fromQueue      = input(false);
  /** Cross-quarter aggregate view — sub-metrics have no evidence detail to expand into. */
  isReport       = input(false);
  approvalStatus = input<ApprovalStatus>('Pending');
  /** Viewer's approval-stage role (from the ?role= query param), forwarded to the AI detail sheet. */
  role           = input<ApprovalStage | null>(null);
  /** Approver names for the "View Progress" modal's Approved By column, sourced from the review's ReviewItem. */
  approvers      = input<Partial<Record<ApproverKey, string>>>({});

  toggle                  = output<void>();
  reportedValueChange     = output<string>();
  riskFactorChange        = output<string>();
  valorizationTypeChange  = output<string>();
  assigneeChange          = output<{ approver: ApproverKey; name: string }>();
  aiProcess               = output<void>();
  evidenceSelectionChange = output<string[]>();
  deleteEvidence          = output<string>();
  approve                 = output<string>();
  reject                  = output<string>();
  openComments            = output<void>();

  aiLoading         = input(false);
  hasSubSelection   = input(false);
  showCommentIcon   = input(false);

  private readonly aiSvc = inject(AiEvidenceService);
  private readonly metricSvc = inject(MetricService);
  private readonly userSvc = inject(UserService);

  readonly isEditingValue   = signal(false);
  readonly editValue        = signal('');
  readonly isEditingRisk    = signal(false);
  readonly editRiskValue    = signal('');
  readonly selectedFileIds  = signal<string[]>([]);
  readonly clearTrigger     = signal(0);
  readonly actionModalOpen  = signal(false);
  /** Stage label currently showing the "Assigned User" edit dropdown (Admin only), or null. */
  readonly editingAssigneeStage = signal<string | null>(null);
  readonly actionComment    = signal('');
  readonly approvalProgressModalOpen = signal(false);
  readonly infoModalOpen    = signal(false);

  /** The Metric Config entry (from the admin "Configure" panel) for this row's metric code. */
  readonly configMetric = computed<Metric | null>(() =>
    this.metricSvc.metrics().find(m => m.code === this.metric().metricCode) ?? null,
  );

  constructor() {
    effect(() => this.evidenceSelectionChange.emit(this.selectedFileIds()));
  }

  readonly totalExtracted = computed<number | null>(() =>
    0 //TODO: replace with real value
    // sumEvidenceCapturedValue(this.aiSvc.files(), this.metric().evidenceFiles, this.metric().unit),
  );

  /** Whether this row's header can be toggled: top-level rows toggle their children's visibility,
   *  sub-metric rows toggle their own evidence detail (unavailable in report mode). */
  protected readonly canToggle = computed(() =>
    this.metric().isTopLevel ? this.hasChildren() : !this.isReport(),
  );

  protected readonly valorizationOptions = VALORIZATION_TYPE_OPTIONS;

  /** MW1.3 (top-level only) carries a "Type of Valorization" selector alongside its name. */
  protected readonly showValorizationType = computed(() =>
    this.metric().isTopLevel === true && this.metric().metricCode === VALORIZATION_METRIC_CODE,
  );

  /** Only the Contract Performance Manager may edit it; every other viewer sees it as plain text. */
  protected readonly canEditValorizationType = computed(() =>
    this.role() === <UserRole> 'Contract Performance Manager',
  );

  onValorizationTypeChange(value: string): void {
    this.valorizationTypeChange.emit(value);
  }

  /** SB1.11's Risk % is fixed and hidden from editors — its stored riskFactor is always 100 so
   *  every Risk Adjusted calculation already treats it as unadjusted; only the display differs. */
  protected readonly isFixedFullRiskMetric = computed(() =>
    this.metric().metricCode === 'SB1.11',
  );

  /** Submetric Captured value = sum of its evidence files' captured values, falling back to the stored value. */
  readonly displayCapturedValue = computed<number | null>(() =>
    this.totalExtracted() ?? this.metric().rawValue ?? null,
  );

  readonly riskAdjustedValue = computed<number | null>(() =>
    calculateRiskAdjustedValue(this.metric().reportedValue, this.metric().riskOriginal),
  );

  formatValue(val: number): string {
    const unit = this.metric().unit;
    if (unit === 'USD Million') {
      return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return val.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  formatExtracted(val: number): string {
    return val.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  formatPercent(val: number): string {
    return val.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  bumpClearTrigger(): void { this.clearTrigger.update(v => v + 1); }

  protected progressStatusClass(status: string): string {
    return PROGRESS_STATUS_CLASSES[status] ?? PROGRESS_STATUS_CLASSES['-'];
  }

  startEdit(): void {
    this.editValue.set(this.metric().reportedValue ?? '');
    this.isEditingValue.set(true);
  }

  @HostListener('document:click')
  protected onDocumentClick(): void {
    if (this.isEditingValue()) this.confirmEdit();
    if (this.isEditingRisk()) this.confirmEditRisk();
    if (this.actionModalOpen()) this.actionModalOpen.set(false);
    if (this.approvalProgressModalOpen()) this.approvalProgressModalOpen.set(false);
  }

  toggleActionModal(): void {
    if (!this.actionModalOpen()) this.actionComment.set('');
    this.actionModalOpen.update(v => !v);
  }

  toggleInfoModal(): void {
    this.infoModalOpen.update(v => !v);
  }

  /** Once a stage's status resolves to Pending, every stage after it hasn't been reached yet. */
  // readonly approvalProgressRows = computed<ApprovalProgressRow[]>(() => {
  //   const m = this.metric();
  //   const approvers = this.approvers();
  //   let cutoff = false;
  //   return APPROVAL_PROGRESS_STAGES.map(({ label, field, approver, updatedOnField, assignableRole }) => {
  //     // Who's assigned is known regardless of whether this stage has been reached yet.
  //     const assignedUser = approvers[approver] ?? '—';
  //     if (cutoff) return { stage: label, status: '-', comment: '-', approvedBy: '-', updatedOn: '-', assignedUser, approverKey: approver, assignableRole };
  //     const status = m[field] ?? 'Pending';
  //     if (status === 'Pending') cutoff = true;
  //     const comment = status === 'Approved'
  //       ? (label === 'CPM' ? (m.excelComment ?? APPROVED_STAGE_COMMENTS[label]) : APPROVED_STAGE_COMMENTS[label])
  //       : '-';
  //     const approvedBy = status === 'Approved' ? (approvers[approver] ?? '—') : '-';
  //     const updatedOn = status === 'Approved' ? (m[updatedOnField] ?? '—') : '-';
  //     return {
  //       stage:   label,
  //       status,
  //       comment,
  //       approvedBy,
  //       updatedOn,
  //       assignedUser,
  //       approverKey: approver,
  //       assignableRole,
  //     };
  //   });
  // });

  toggleApprovalProgressModal(): void {
    this.approvalProgressModalOpen.update(v => !v);
  }

  /** Only an Admin viewer may reassign a stage's user. */
  protected readonly canEditAssignedUser = computed(() => this.role() === <ApprovalStage>'Admin');

  /** Active users holding the given role, for the "Assigned User" reassignment dropdown. */
  protected usersForRole(role: UserRole | null): string[] {
    if (!role) return [];
    return this.userSvc.users()
      .filter(u => u.role === role && u.status === 'Active')
      .map(u => u.displayName);
  }

  startEditAssignee(stage: string): void {
    this.editingAssigneeStage.set(stage);
  }

  confirmEditAssignee(approverKey: ApproverKey, name: string): void {
    this.editingAssigneeStage.set(null);
    this.assigneeChange.emit({ approver: approverKey, name });
  }

  cancelEditAssignee(): void {
    this.editingAssigneeStage.set(null);
  }

  onApprove(): void {
    this.approve.emit(this.actionComment());
    this.actionModalOpen.set(false);
    this.actionComment.set('');
  }

  onReject(): void {
    this.reject.emit(this.actionComment());
    this.actionModalOpen.set(false);
    this.actionComment.set('');
  }

  confirmEdit(): void {
    if (!this.isEditingValue()) return;
    this.isEditingValue.set(false);
    this.reportedValueChange.emit(this.editValue());
  }

  cancelEdit(): void { this.isEditingValue.set(false); }

  startEditRisk(): void {
    this.editRiskValue.set(this.metric().riskOriginal?.toString() ?? '');
    this.isEditingRisk.set(true);
  }

  confirmEditRisk(): void {
    if (!this.isEditingRisk()) return;
    this.isEditingRisk.set(false);
    this.riskFactorChange.emit(this.editRiskValue());
  }

  cancelEditRisk(): void { this.isEditingRisk.set(false); }

  protected readonly outerClass = computed(() => {
    const top = this.metric().isTopLevel;
    let cls = 'relative rounded border transition-colors';
    if (top) {
      cls += ' border-[hsl(var(--aepw-blue)/0.2)] bg-muted/30';
    } else if (this.isExpanded()) {
      cls += ' border-[hsl(var(--aepw-blue)/0.3)] bg-card shadow-sm';
    } else {
      cls += ' border-border/40 bg-card hover:border-border hover:bg-muted/20';
    }
    return cls;
  });

  protected readonly completeCount = computed(
    () => this.metric().evidenceFiles.filter(f => f.status === 'complete').length,
  );

  protected readonly evidenceBadgeClass = computed(() => {
    const uploaded = this.metric().evidenceUploadCount;
    const required = 1000; // TODO: replace with actual count
    const base = 'flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold shrink-0';
    if (uploaded === 0)         return `${base} bg-muted text-muted-foreground`;
    if (uploaded >= required)   return `${base} bg-[hsl(var(--aepw-green)/0.1)] text-[hsl(var(--aepw-green))]`;
    return                             `${base} bg-[hsl(var(--aepw-orange)/0.1)] text-[hsl(var(--aepw-orange))]`;
  });

  protected readonly pmClass             = computed(() => STATUS_CLASSES[this.metric().pmStatus]);
  protected readonly reviewClass         = computed(() => STATUS_CLASSES[this.metric().reviewStatus]);
  protected readonly leadClass           = computed(() => STATUS_CLASSES[this.metric().leadStatus]);
  protected readonly approvalStatusClass = computed(() => STATUS_CLASSES[this.approvalStatus()]);
}
