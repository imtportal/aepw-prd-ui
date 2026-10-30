import { Component, computed, input, output, signal } from '@angular/core';
import {
  LucideAngularModule, LucideIconProvider, LUCIDE_ICONS, ChevronRight,
} from 'lucide-angular';
import { DataTableComponent, DataColumn } from '../../../../shared/ui/data-table/data-table.component';
import { Program } from '../../models/reporting.modelold';
import { PagedRequest } from '../../../../core/models/api-response.model';

@Component({
  selector: 'app-programs-table',
  standalone: true,
  imports: [LucideAngularModule, DataTableComponent],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ ChevronRight }) },
  ],
  templateUrl: './programs-table.component.html',
})
export class ProgramsTableComponent {
  programs        = input.required<Program[]>();
  programSelected = output<string>();

  private readonly currentPage     = signal(0);
  private readonly currentPageSize = signal(10);

  protected readonly tableColumns: DataColumn[] = [
    { key: 'name',         header: 'Program',   sortable: true  },
    { key: 'region',       header: 'Region',    sortable: true  },
    { key: 'projectCount', header: 'Projects',  sortable: true,  align: 'center' },
    { key: 'mw1',          header: 'MW1.1',     sortable: false, align: 'right'  },
    { key: 'cv1',          header: 'CV1.1',     sortable: false, align: 'right'  },
    { key: 'sb1',          header: 'SB1.1',     sortable: false, align: 'right'  },
    { key: 'arrow',        header: '',          sortable: false },
  ];

  protected readonly pageData = computed(() => {
    const start = this.currentPage() * this.currentPageSize();
    return this.programs().slice(start, start + this.currentPageSize());
  });

  protected onPage(params: PagedRequest): void {
    this.currentPage.set(params.page);
    this.currentPageSize.set(params.pageSize);
  }

  protected readonly formatValue = (value: number, unit: string): string => {
    if (unit.includes('USD') && unit.includes('millions')) return `$${value.toFixed(1)}M`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000)     return `${(value / 1_000).toFixed(1)}K`;
    return value.toLocaleString();
  };

  protected metricValue(program: Program, code: string): string {
    const m = program.metrics.find(x => x.code === code);
    return m ? this.formatValue(m.reported, m.unit) : '—';
  }
}
