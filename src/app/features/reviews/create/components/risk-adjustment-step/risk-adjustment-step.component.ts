import { Component, computed, effect, input, output, signal } from '@angular/core';
import { Metric } from '../../../../admin/models/metric.model';
import { RiskOverride } from '../../create-review.types';
import { DataTableComponent, DataColumn } from '../../../../../shared/ui/data-table/data-table.component';
import { PagedRequest } from '../../../../../core/models/api-response.model';
import { mapStageToFormattedKeys, STAGE_COLORS, upperCasedWithoutSpaceStages } from '../../../../dashboard/containers/dashboard-page.model';
import { TranslocoPipe } from '@jsverse/transloco';


type TypeFilter = 'all' | 'mandatory' | 'optional';
type PendingStatus = 'none' | 'pending_approval' | 'approved' | 'rejected' | 'RISKADJUSTMENT';
type MetricStatus  = 'Default' | 'Pending' | 'Approved' | 'Rejected' | 'None';

@Component({
  selector: 'app-risk-adjustment-step',
  standalone: true,
  imports: [
    DataTableComponent,
    TranslocoPipe
  ],
  templateUrl: './risk-adjustment-step.component.html',
})
export class RiskAdjustmentStepComponent {
  selectedMetrics = input.required<Metric[]>();
  mandatoryCodes  = input.required<Set<string>>();
  riskOverrides   = input.required<Record<string, RiskOverride>>();
  readOnly          = input<boolean>(false);
  rejectionInfo     = input<Record<string, string>>({});
  pendingStatus     = input<string>('none');
  /** Overrides at the time of the last submission — used to detect live edits vs submitted state. */
  submittedOverrides = input<Record<string, RiskOverride>>({});

  previousRAResponseMap = input<Record<string, { risk: number; comment?: string, raStatus?: string; }>>({});

  overrideChange = output<{ code: string; risk: number; reason: string }>();

  readonly searchQuery = signal('');
  readonly typeFilter  = signal<TypeFilter>('all');
  readonly pageState   = signal<PagedRequest>({ page: 0, pageSize: 10 });

  readonly columns: DataColumn[] = [
    { key: 'metric',  header: 'Metric',    sortable: true },
    { key: 'type',    header: 'Type',      sortable: true },
    { key: 'default', header: 'Default %', sortable: true, align: 'center' },
    { key: 'updated', header: 'Updated %', align: 'center' },
    // { key: 'status',  header: 'Status',    align: 'center' },
    { key: 'comment', header: 'Comment' },
  ];

  constructor() {
    // reset to page 0 whenever search or filter changes
    effect(() => {
      this.searchQuery();
      this.typeFilter();
      this.pageState.update(s => ({ ...s, page: 0 }));
    });
  }

  readonly filteredSorted = computed(() => {
    const query     = this.searchQuery().toLowerCase().trim();
    const filter    = this.typeFilter();
    const mandatory = this.mandatoryCodes();
    const { sortBy, sortDir } = this.pageState();

    const selectedMetrics = this.selectedMetrics();
    let rows = selectedMetrics.filter(m => {
      const matchesSearch = !query ||
        m.name.toLowerCase().includes(query) ||
        m.code.toLowerCase().includes(query);
      const isMandatory = mandatory.has(m.code);
      const matchesType =
        filter === 'all' ||
        (filter === 'mandatory' &&  isMandatory) ||
        (filter === 'optional'  && !isMandatory);
      return matchesSearch && matchesType;
    });

    rows = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'metric')  cmp = a.name.localeCompare(b.name);
      else if (sortBy === 'type')    cmp = (mandatory.has(b.code) ? 1 : 0) - (mandatory.has(a.code) ? 1 : 0);
      else if (sortBy === 'default') cmp = (a.defaultRiskPct ?? 0) - (b.defaultRiskPct ?? 0);
      else cmp = (mandatory.has(b.code) ? 1 : 0) - (mandatory.has(a.code) ? 1 : 0); // default: mandatory first
      return sortDir === 'desc' ? -cmp : cmp;
    });

    return rows;
  });

  readonly pageSlice = computed(() => {
    const { page, pageSize } = this.pageState();
    return this.filteredSorted().slice(page * pageSize, (page + 1) * pageSize);
  });

  readonly filteredTotal = computed(() => this.filteredSorted().length);

  onPageChange(req: PagedRequest): void {
    this.pageState.set(req);
  }

  protected hasChanged(m: Metric): boolean {
    const override = this.riskOverrides()[m.code];

    const pendingStatus = this.pendingStatus();

    const allRARelatedStatuses = mapStageToFormattedKeys({ "Pending Risk Adjust": "true", "Pending Review Launch": "true" });

    const previousRAResponseMap = this.previousRAResponseMap();
    
    if (allRARelatedStatuses[pendingStatus] == "true") {
      if (override && previousRAResponseMap[m.code]) {
        if (override.risk == previousRAResponseMap[m.code].risk) {
          if (mapStageToFormattedKeys({"Pending Risk Adjust": "true" })[pendingStatus] == "true") {
            return override != undefined
          }
          else {
            return false;
          }
        }

        return true
      }

      return false;
    }

    // mappedStageColors({ "" });

    if (pendingStatus) {

    }

    return override !== undefined && override.risk !== (m.defaultRiskPct ?? 0);
  }

  protected metricStatus(m: Metric): MetricStatus {
    const ps = this.pendingStatus();
    const riskOverrides = this.riskOverrides();
    const rejectionInfo = this.rejectionInfo();

    const pendingReviewLaunchStage = mapStageToFormattedKeys({ "Pending Review Launch": "true",  });

    if (pendingReviewLaunchStage[ps] === 'true' ) {
      if (riskOverrides[m.code]) {
        const previousRAResponseMap = this.previousRAResponseMap();

        if (rejectionInfo[m.code]) {
          return 'Rejected'
        }

        if (previousRAResponseMap[m.code]?.risk != undefined) {
          if (previousRAResponseMap[m.code].risk != riskOverrides[m.code]?.risk) {
            return 'Pending'
          }

          if (previousRAResponseMap[m.code]?.raStatus?.toLowerCase() == 'approved') {
            return 'Approved';
          }
        }
      }

      return 'Default'
    }

    const pendingRiskAdjustStage = mapStageToFormattedKeys({ "Pending Risk Adjust": "true",  });

    if (pendingRiskAdjustStage[ps] === 'true' ) {
      if (rejectionInfo[m.code]) {
        return 'Rejected';
      }
    }

    // Rejected metric whose override was cleared on load (PM hasn't re-entered a value yet)
    if (ps === 'rejected' && this.rejectionInfo()[m.code] && !this.riskOverrides()[m.code]) return 'Rejected';

    // No submission in flight — always Default regardless of live edits
    if (ps === 'none') return 'Default';

    if (!this.hasChanged(m)) return 'Default';

    if (ps === 'pending_approval') return 'Pending';

    if (ps?.toUpperCase() === 'PENDINGRISKADJUST') return 'Pending';

    const currentRisk   = this.riskOverrides()[m.code]?.risk;
    const submittedRisk = this.submittedOverrides()[m.code]?.risk;

    if (currentRisk !== submittedRisk) {
      // For a rejected metric the PM is re-entering a value: keep showing 'Rejected'
      // until they resubmit. For an approved metric the PM has changed: show 'Default'.
      return (ps === 'rejected' && this.rejectionInfo()[m.code]) ? 'Rejected' : 'Default';
    }

    if (ps === 'approved') return 'Approved';
    if (ps === 'rejected') return this.rejectionInfo()[m.code] ? 'Rejected' : 'Approved';
    return 'Default';
  }

  protected onRiskChange(m: Metric, value: number): void {
    this.overrideChange.emit({
      code:   m.code,
      risk:   value,
      reason: this.riskOverrides()[m.code]?.reason ?? '',
    });
  }

  protected onReasonChange(m: Metric, reason: string): void {
    this.overrideChange.emit({
      code:   m.code,
      risk:   this.riskOverrides()[m.code]?.risk ?? (m.defaultRiskPct ?? 0),
      reason,
    });
  }

  protected getUpdatedPercentColumnValue(m: any) {
    const riskOverrides = this.riskOverrides();

    const pendingStatus = this.pendingStatus();

    return riskOverrides[m.code]?.risk
    // const pendingRiskAdjustStatusValue = mapStageToFormattedKeys({ "Pending Risk Adjust": "true" });
    // if (pendingRiskAdjustStatusValue[pendingStatus]) {
    //   // return m.riskP;
    // }

    // return riskOverrides[m.code]?.risk ?? m.defaultRiskFactor
  }
}
