import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  LucideAngularModule, LucideIconProvider, LUCIDE_ICONS, Send,
  Hourglass,
} from 'lucide-angular';
import { MetricService } from '../../../admin/services/metric.service';
import { ApprovalCycleRecord, PendingRiskAdjustmentReview, RiskOverride } from '../../../reviews/create/create-review.types';
import { ModalComponent } from '../../../../shared/ui/modal/modal.component';
import { Metric } from '../../../admin/models/metric.model';
import { mapStageToFormattedKeys } from '../../containers/dashboard-page.model';

export interface RowDecision {
  decision: 'approved' | 'rejected' | null;
  rejectionReason: string;
}

export interface ApprovalSubmission {
  allApproved: boolean;
  rejectionInfo: Record<string, string>;
  acceptedInfo?: Record<string, string>;
  changedMetrics?: unknown;
}

@Component({
  selector: 'app-approval-review-modal',
  standalone: true,
  imports: [LucideAngularModule, ModalComponent, DatePipe],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Send, Hourglass }) },
  ],
  templateUrl: './approval-review-modal.component.html',
})
export class ApprovalReviewModalComponent {
  review             = input.required<PendingRiskAdjustmentReview>();
  submitForApprovalInProgress             = input<boolean>(false);
  showActionsColumn  = input(true);
  close              = output<void>();
  submitted          = output<ApprovalSubmission>();
  submitForApproval  = output<void>();
  
  showPendingRiskAdjustments = input<boolean>(false); // for dashboard accept/reject action
  
  submittingDecision = input<boolean>(false);
  previousRAResponseMap = input<Record<string, { risk: number; comment?: string }>>({});
  pendingStatus = input<string>("");

  riskOverrides = input<Record<string, RiskOverride>>();

  private readonly metricSvc = inject(MetricService);

  _changedMetrics = input<Metric[]>([]);
  readonly changedMetrics = computed(() => {
    const r            = this.review();
    const overrides    = this.riskOverrides() ? this.riskOverrides() : r.riskOverrides;
    const newCodes     = r.newOverrideCodes ? new Set(r.newOverrideCodes) : null;
    const mandatoryCodes = new Set(r.mandatoryCodes);

    const previousRAResponseMap = this.previousRAResponseMap();
    const pendingStatus = this.pendingStatus();

    console.log("return this.metricSvc.metrics()")
    debugger
    return this.metricSvc.metrics()
    // return this._changedMetrics()
      .filter(m => {
        const o = (overrides as any)[m.code];

        if (this.showPendingRiskAdjustments() === true) {
          console.log({overrides, [m.code]: m.code})
          console.log(this.riskOverrides(), r)

          return overrides && overrides[m.code]
        }

        const msc = mapStageToFormattedKeys({ "Pending Review Launch": "true", "Pending Risk Adjust": "true" });

        if (o) {
          if (msc[pendingStatus || ""] == "true" || msc[pendingStatus || ""] == "true") {
            return previousRAResponseMap[m.code].risk && (previousRAResponseMap[m.code].risk != o.risk)
          }
        }

        // if (r.status)

        if (!o || o.risk === m.defaultRiskPct) {
          return false;
        }
        // When the submission carries explicit new-cycle codes, only show those.
        // Fall back to showing all non-default overrides for backward compat. 
        return newCodes ? newCodes.has(m.code) : true;
      })
      .map(m => {
        return {
          metricId:        m.metricId,
          code:              m.code,
          name:              m.name, 
          defaultRiskPct: this.showPendingRiskAdjustments() ? m.riskPctEffective : m.defaultRiskPct,
          isMandatory:       mandatoryCodes.has(m.code),
          updatedRisk:       (overrides as any)[m.code]?.risk,
          pmReason:          (overrides as any)[m.code]?.reason,
        }
      });
  });

  readonly historyItems = computed(() => {
    const r            = this.review();
    const history      = r.approvalHistory ?? [];
    const mandatorySet = new Set(r.mandatoryCodes);
    const allMetrics   = this.metricSvc.metrics();

    return history.map((cycle: ApprovalCycleRecord, idx: number) => ({
      cycleNumber: idx + 1,
      createdAt:   cycle.createdAt,
      status:      cycle.status,
      metrics: allMetrics
        .filter(m => cycle.newOverrideCodes.includes(m.code))
        .map(m => ({
          code:              m.code,
          name:              m.name,
          defaultRiskPct: m.defaultRiskPct,
          isMandatory:       mandatorySet.has(m.code),
          updatedRisk:       cycle.riskOverrides[m.code]?.risk,
          pmReason:          cycle.riskOverrides[m.code]?.reason,
          outcome:           cycle.rejectionInfo?.[m.code] ? 'rejected' : 'approved' as const,
          rejectionReason:   cycle.rejectionInfo?.[m.code],
        })),
    }));
  });

  readonly rowDecisions = signal<Record<string, RowDecision>>({});

  constructor() {
    effect(() => {
      const initial: Record<string, RowDecision> = {};
      this.changedMetrics().forEach(m => {
        initial[m.code] = { decision: null, rejectionReason: '' };
      });
      this.rowDecisions.set(initial);
    });
  }

  readonly canSubmit = computed(() => {
    if (!this.showActionsColumn()) return true;
    const decisions = this.rowDecisions();
    return this.changedMetrics().every(m => {
      const d = decisions[m.code];
      if (!d || d.decision === null) return false;
      if (d.decision === 'rejected' && !d.rejectionReason.trim()) return false;
      return true;
    });
  });

  setDecision(code: string, decision: 'approved' | 'rejected'): void {
    this.rowDecisions.update(d => ({ ...d, [code]: { ...d[code], decision } }));
  }

  setRejectionReason(code: string, reason: string): void {
    this.rowDecisions.update(d => ({ ...d, [code]: { ...d[code], rejectionReason: reason } }));
  }

  onSubmit(): void {
    const decisions   = this.rowDecisions();
    const allApproved = this.changedMetrics().every(m => decisions[m.code]?.decision === 'approved');
    const rejectionInfo: Record<string, string> = {};

    const changedMetrics = this.changedMetrics();
    if (!allApproved) {
      this.changedMetrics()
        .filter(m => decisions[m.code]?.decision === 'rejected')
        .forEach(m => { rejectionInfo[m.code] = decisions[m.code].rejectionReason; });
    }

    this.submitted.emit({ allApproved, rejectionInfo, changedMetrics });
  }
}
