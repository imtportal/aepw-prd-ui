import { Component, computed, input, output, Signal, signal } from '@angular/core';
import { Metric } from '../../../../admin/models/metric.model';
import { IncludeExcludeToggleComponent } from '../../../../../shared/ui/include-exclude-toggle/include-exclude-toggle.component';
import { Building2, Hourglass, LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, MapPin, User, X } from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// Category IDs: MW=1, CV=2, EE=3, MC=4, SB=5 — mirrors metric.mock-repo.ts CAT map
const CATEGORY_COLORS: Record<number, string> = {
  1: 'rounded px-2 py-0.5 text-xs font-bold bg-[hsl(var(--aepw-blue))] text-[hsl(var(--primary-foreground))]',
  2: 'rounded px-2 py-0.5 text-xs font-bold bg-[hsl(var(--aepw-green))] text-[hsl(var(--accent-foreground))]',
  3: 'rounded px-2 py-0.5 text-xs font-bold bg-[hsl(var(--aepw-accent-green))] text-[hsl(var(--aepw-dark-grey))]',
  4: 'rounded px-2 py-0.5 text-xs font-bold bg-[hsl(var(--aepw-orange))] text-[hsl(var(--destructive-foreground))]',
  5: 'rounded px-2 py-0.5 text-xs font-bold bg-[hsl(var(--aepw-light-blue))] text-[hsl(var(--aepw-dark-grey))]',
};

const CATEGORY_NAMES: Record<number, string> = {
  1: 'Reduce Unmanaged Waste',
  2: 'Capture Value',
  3: 'Enable Ecosystem',
  4: 'Mobilise Capital',
  5: 'Social Benefit',
};

interface CategoryMetric extends Metric {
  metrics?: CategoryMetric[];
}

@Component({
  selector: 'app-metric-selection-step',
  standalone: true,
  imports: [CommonModule, FormsModule, IncludeExcludeToggleComponent, LucideAngularModule],
  templateUrl: './metric-selection-step.component.html',
   providers: [
      {
        provide: LUCIDE_ICONS,
        multi: true,
        useValue: new LucideIconProvider({ Building2, User, MapPin, Hourglass, X }),
      },
    ],
})
export class MetricSelectionStepComponent {
  metricsByCategory = input.required<Map<number, CategoryMetric[]>>();
  selectedCodes     = input.required<Set<string>>();
  excludedCodes     = input.required<Set<string>>();
  selectedParentMetricIds = input.required<Record<string, boolean>>();

  // parentMetricIdMap = computed(() => {})

  toggleCode        = output<string>();
  selectedParentMetricIdUpdated = output<{ code: string; value: boolean }>();
  toggleCategoryAll = output<{ codes: string[]; selectAll: boolean }>();
  toggleExclude     = output<string>();

  expandedCategories = signal(new Set<number>());
  metricsLoading = input.required<boolean>();

  readonly categoryEntries_old = computed(() =>
    Array.from(this.metricsByCategory().entries())
  );

  readonly categoryEntries = computed(() => { 
    const categories = Array.from(this.metricsByCategory().entries()); 
    const result: [number, CategoryMetric[]][] = [];
    for (const category of categories) {
      const [categoryId, metricsForCategory] = category;

      const parent_l1_metrics: { [categoryId: number]: { parentMetric: CategoryMetric | null; l1Metrics: CategoryMetric[] }[] } = {};

      if (!parent_l1_metrics[categoryId]) {
        parent_l1_metrics[categoryId] = [];
      }
      
      for (const metric of metricsForCategory) {
        if (metric.isTopLevel) {
          const index = (parent_l1_metrics[categoryId] || []).findIndex(p => p.parentMetric?.metricId === metric.metricId);
          if (index == -1) {
            parent_l1_metrics[categoryId].push({ parentMetric: metric, l1Metrics: [] });
          }
          else {
            parent_l1_metrics[categoryId][index].parentMetric = metric;
          }
          continue;
        }

        if (!metric.parentMetricId) {
          continue;
        }
        
        const parentIndex = (parent_l1_metrics[categoryId] || []).findIndex(p => p.parentMetric?.metricId === metric.parentMetricId);
        if (parentIndex === -1) {
          continue;
        }

        parent_l1_metrics[categoryId][parentIndex].l1Metrics.push(metric);
      }

      const entries = Object.entries(parent_l1_metrics);

      for (const entry of entries) {
        // if (!parent_l1_metrics[categoryId].parentMetric) {
        //   continue;
        // }
        const resultElem: [number, CategoryMetric[]] = [categoryId, <CategoryMetric[]> parent_l1_metrics[categoryId].map(p => ({ ...p.parentMetric, metrics: p.l1Metrics }))];

        result.push(resultElem);
      } 
    }

    // return k;
    // return Array.from(this.metricsByCategory().entries());
    return result;
  });

  protected toggleCategory(cat: number): void {
    this.expandedCategories.update(s => {
      const n = new Set(s);
      n.has(cat) ? n.delete(cat) : n.add(cat);
      return n;
    });
  }

  protected onToggleCategoryAll(metrics: Metric[]): void {
    const codes = metrics.filter(m => !this.excludedCodes().has(m.code)).map(m => m.code);
    const allSelected = codes.length > 0 && codes.every(c => this.selectedCodes().has(c));
    this.toggleCategoryAll.emit({ codes, selectAll: !allSelected });
  }

  protected selectedInCategory(metrics: Metric[]): number {
    return metrics.filter(m => this.selectedCodes().has(m.code)).length;
  }

  protected includedInCategory(metrics: Metric[]): number {
    return metrics.filter(m => !this.excludedCodes().has(m.code)).length;
  }

  protected categoryColor(cat: number): string {
    return CATEGORY_COLORS[cat] ?? 'rounded px-2 py-0.5 text-xs font-bold bg-muted text-muted-foreground';
  }

  protected categoryName(cat: number): string {
    return CATEGORY_NAMES[cat] ?? String(cat);
  }

  protected updateSelectedParentMetricIds(code: string, $event: any) {
    this.selectedParentMetricIdUpdated.emit({ code, value: $event.target.checked });
  }
}
