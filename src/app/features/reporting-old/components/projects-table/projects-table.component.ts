import { Component, computed, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideAngularModule, LucideIconProvider, LUCIDE_ICONS, ExternalLink,
} from 'lucide-angular';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { DataTableComponent, DataColumn } from '../../../../shared/ui/data-table/data-table.component';
import { ReportingProject } from '../../models/reporting.modelold';
import { PagedRequest } from '../../../../core/models/api-response.model';

@Component({
  selector: 'app-projects-table',
  standalone: true,
  imports: [LucideAngularModule, BadgeComponent, RouterLink, DataTableComponent],
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ ExternalLink }) },
  ],
  templateUrl: './projects-table.component.html',
})
export class ProjectsTableComponent {
  projects        = input.required<ReportingProject[]>();
  projectSelected = output<string>();

  private readonly currentPage     = signal(0);
  private readonly currentPageSize = signal(10);

  protected readonly tableColumns: DataColumn[] = [
    { key: 'pin',    header: 'PIN',     sortable: true, headerClass: 'w-16' },
    { key: 'title',  header: 'Project', sortable: true  },
    { key: 'pm',     header: 'PM',      sortable: true  },
    { key: 'status', header: 'Status',  sortable: true  },
    { key: 'mw1',    header: 'MW1.1',   sortable: false, align: 'right' },
    { key: 'cv1',    header: 'CV1.1',   sortable: false, align: 'right' },
    { key: 'link',   header: '',        sortable: false },
  ];

  protected readonly pageData = computed(() => {
    const start = this.currentPage() * this.currentPageSize();
    return this.projects().slice(start, start + this.currentPageSize());
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

  protected metricValue(project: ReportingProject, code: string): string {
    const m = project.metrics.find(x => x.code === code);
    return m ? this.formatValue(m.reported, m.unit) : '—';
  }
}
