import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule, LucideIconProvider, LUCIDE_ICONS,
  ArrowLeft, ChevronRight, Download,
} from 'lucide-angular';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { BadgeComponent } from '../../../shared/ui/badge/badge.component';
import { SelectComponent } from '../../../shared/ui/select/select.component';
import { PowerBiPanelComponent } from '../../../shared/ui/power-bi-panel/power-bi-panel.component';
import { ReportingService } from '../services/reporting-old.service';
import { DrillLevel, TimePeriod, TopLevelMetric } from '../models/reporting.modelold';
import { SelectOption } from '../../../shared/models/select-option';
import { MetricKpiCardComponent } from '../components/metric-kpi-card/metric-kpi-card.component';
import { L1BreakdownTableComponent } from '../components/l1-breakdown-table/l1-breakdown-table.component';
import { RegionalMapComponent } from '../components/regional-map/regional-map.component';
import { ProgramsTableComponent } from '../components/programs-table/programs-table.component';
import { ProjectsTableComponent } from '../components/projects-table/projects-table.component';

@Component({
  selector: 'app-reporting-page-old',
  standalone: true,
  imports: [
    RouterLink, FormsModule,
    LucideAngularModule,
    CardComponent, BadgeComponent, SelectComponent,
    PowerBiPanelComponent,
    MetricKpiCardComponent, L1BreakdownTableComponent, RegionalMapComponent,
    ProgramsTableComponent, ProjectsTableComponent,
  ],
  providers: [
    { provide: LUCIDE_ICONS, multi: true,
      useValue: new LucideIconProvider({ ArrowLeft, ChevronRight, Download }) },
  ],
  templateUrl: './reporting-page.old.component.html',
})
export class ReportingPageOldComponent {
  protected readonly reportingSvc = inject(ReportingService);

  readonly drillLevel         = signal<DrillLevel>('aepw');
  readonly selectedProjectPin = signal<string | null>(null);
  readonly expandedCodes      = signal<string[]>([]);
  readonly selectedCategory   = signal<string>('all');
  readonly selectedYear       = signal<string>('2024');
  readonly selectedPeriod     = signal<TimePeriod>('annual');

  protected readonly currentProgram = computed(() => this.reportingSvc.selectedProgram());
  protected readonly currentProject = computed(() =>
    this.reportingSvc.projects().find(p => p.pin === this.selectedProjectPin()) ?? null
  );
  protected readonly programProjects = this.reportingSvc.programProjects;

  protected readonly availableCategories = computed(() => {
    const cats = new Set(this.reportingSvc.aepwMetrics().map(m => m.code.substring(0, 2)));
    return Array.from(cats);
  });

  protected readonly currentMetrics = computed((): TopLevelMetric[] => {
    let metrics: TopLevelMetric[];
    if (this.drillLevel() === 'project' && this.currentProject()) {
      metrics = this.currentProject()!.metrics;
    } else if (this.drillLevel() === 'program' && this.currentProgram()) {
      metrics = this.currentProgram()!.metrics;
    } else {
      metrics = this.reportingSvc.aepwMetrics();
    }
    const cat = this.selectedCategory();
    return cat === 'all' ? metrics : metrics.filter(m => m.code.startsWith(cat));
  });

  // Getter/setter bridges for SelectComponent (ControlValueAccessor requires ngModel)
  protected get selectedYearModel(): string { return this.selectedYear(); }
  protected set selectedYearModel(v: string) { this.selectedYear.set(v); }

  protected get selectedPeriodModel(): string { return this.selectedPeriod(); }
  protected set selectedPeriodModel(v: string) { this.selectedPeriod.set(v as TimePeriod); }

  protected readonly yearOptions: SelectOption[] = [
    { value: '2024', label: '2024' },
    { value: '2023', label: '2023' },
    { value: '2022', label: '2022' },
  ];

  protected readonly periodOptions: SelectOption[] = [
    { value: 'q1',          label: 'Q1'          },
    { value: 'q2',          label: 'Q2'          },
    { value: 'q3',          label: 'Q3'          },
    { value: 'q4',          label: 'Q4'          },
    { value: 'annual',      label: 'Annual'      },
    { value: 'ytd',         label: 'YTD'         },
    { value: 'since-start', label: 'Since Start' },
  ];

  protected readonly categoryBadgeClasses: Record<string, string> = {
    MW: 'bg-[hsl(var(--aepw-blue))] text-white text-[9px] px-1.5 py-0',
    CV: 'bg-[hsl(var(--aepw-green))] text-white text-[9px] px-1.5 py-0',
    EE: 'bg-[hsl(var(--aepw-orange))] text-white text-[9px] px-1.5 py-0',
    SB: 'bg-purple-600 text-white text-[9px] px-1.5 py-0',
    MC: 'bg-teal-600 text-white text-[9px] px-1.5 py-0',
  };

  onSelectProgram(id: string): void {
    this.reportingSvc.selectProgram(id);
    this.drillLevel.set('program');
    this.expandedCodes.set([]);
  }

  onSelectProject(pin: string): void {
    this.selectedProjectPin.set(pin);
    this.drillLevel.set('project');
    this.expandedCodes.set([]);
  }

  onNavigateBack(): void {
    if (this.drillLevel() === 'project') {
      this.selectedProjectPin.set(null);
      this.drillLevel.set('program');
    } else if (this.drillLevel() === 'program') {
      this.reportingSvc.selectProgram(null);
      this.drillLevel.set('aepw');
    }
    this.expandedCodes.set([]);
  }

  onNavigateToAepw(): void {
    this.selectedProjectPin.set(null);
    this.reportingSvc.selectProgram(null);
    this.drillLevel.set('aepw');
    this.expandedCodes.set([]);
  }

  onToggleMetric(code: string): void {
    const curr = this.expandedCodes();
    this.expandedCodes.set(
      curr.includes(code) ? curr.filter(c => c !== code) : [...curr, code]
    );
  }

  onCategoryChange(cat: string): void { this.selectedCategory.set(cat); }
}
