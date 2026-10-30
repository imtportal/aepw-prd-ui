import { Component, computed, input, signal } from '@angular/core';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { DataTableComponent, DataColumn } from '../../../../shared/ui/data-table/data-table.component';
import { TopLevelMetric, L1Metric } from '../../models/reporting.modelold';
import { PagedRequest } from '../../../../core/models/api-response.model';

@Component({
  selector: 'app-l1-breakdown-table',
  standalone: true,
  imports: [BadgeComponent, DataTableComponent],
  templateUrl: './l1-breakdown-table.component.html',
})
export class L1BreakdownTableComponent {
  metrics       = input.required<TopLevelMetric[]>();
  expandedCodes = input<string[]>([]);

  private readonly currentPage     = signal(0);
  private readonly currentPageSize = signal(10);

  protected readonly tableColumns: DataColumn[] = [
    { key: 'code',        header: 'Code',     sortable: true,  headerClass: 'w-20' },
    { key: 'name',        header: 'Metric',   sortable: true  },
    { key: 'reported',    header: 'Reported', sortable: true,  align: 'right', headerClass: 'w-24' },
    { key: 'riskAdjusted',header: 'Risk-Adj', sortable: true,  align: 'right', headerClass: 'w-24' },
    { key: 'type',        header: 'Type',     sortable: false, headerClass: 'w-20' },
  ];

  protected readonly allRows = computed((): L1Metric[] => {
    const codes = this.expandedCodes();
    return this.metrics()
      .filter(m => codes.includes(m.code))
      .flatMap(m => m.l1Metrics);
  });

  protected readonly pageData = computed(() => {
    const start = this.currentPage() * this.currentPageSize();
    return this.allRows().slice(start, start + this.currentPageSize());
  });

  protected onPage(params: PagedRequest): void {
    this.currentPage.set(params.page);
    this.currentPageSize.set(params.pageSize);
  }
}
