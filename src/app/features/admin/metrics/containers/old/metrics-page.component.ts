import { Component, computed, inject, signal } from '@angular/core';
import { LucideAngularModule, LucideIconProvider, LUCIDE_ICONS, Plus } from 'lucide-angular';
import { DialogComponent } from '../../../../../shared/ui/dialog/dialog.component';
import { InfoBannerComponent } from '../../../../../shared/ui/info-banner/info-banner.component';
import { MetricCategoryCardComponent } from '../../components/metric-category-card-old/metric-category-card-old.component';
import { MetricService } from '../../../services/metric.service';
import { CategoryDef } from '../../../models/metric-old.model';
import { Metric } from '../../../models/metric.model';

const CATEGORIES: CategoryDef[] = [
  {
    code: 'MW',
    name: 'Reduce Unmanaged Waste',
    color: 'bg-[hsl(var(--aepw-blue))] text-white',
    description: 'Metrics tracking plastic waste management and diversion',
  },
  {
    code: 'CV',
    name: 'Capture Value',
    color: 'bg-[hsl(var(--aepw-green))] text-white',
    description: 'Metrics tracking economic value creation from waste',
  },
  {
    code: 'EE',
    name: 'Enable Ecosystem',
    color: 'bg-[hsl(var(--aepw-accent-green))] text-[hsl(var(--aepw-dark-grey))]',
    description: 'Metrics tracking capacity building and awareness',
  },
  {
    code: 'MC',
    name: 'Mobilise Capital',
    color: 'bg-[hsl(var(--aepw-orange))] text-white',
    description: 'Metrics tracking investment and funding mobilisation',
  },
  {
    code: 'SB',
    name: 'Social Benefit',
    color: 'bg-[hsl(var(--aepw-light-blue))] text-[hsl(var(--aepw-dark-grey))]',
    description: 'Metrics tracking social impact and livelihoods',
  },
];

@Component({
  selector: 'app-metrics-page',
  standalone: true,
  imports: [LucideAngularModule, DialogComponent, InfoBannerComponent, MetricCategoryCardComponent],
  providers: [{ provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({ Plus }) }],
  templateUrl: './metrics-page.component.html',
})
export class MetricsPageComponent {
  protected readonly metricSvc = inject(MetricService);

  readonly expandedCategories = signal<Set<string>>(new Set(['MW', 'EE']));
  readonly showAddModal = signal(false);

  protected readonly categories = CATEGORIES;

  readonly metricsByCategory = computed(() => {
    const map = new Map<string, Metric[]>();
    for (const m of this.metricSvc.metrics()) {
      const key = m.categoryId.toString();
      const arr = map.get(key) ?? [];
      arr.push(m);
      map.set(key, arr);
    }
    return map;
  });

  readonly corporateCount = computed(
    () => this.metricSvc.metrics().filter((m) => m.isCorporate).length,
  );
  readonly projectLevelCount = computed(
    () => this.metricSvc.metrics().filter((m) => !m.isTopLevel && !m.isCorporate).length,
  );

  onToggleCategory(code: string): void {
    const curr = this.expandedCategories();
    const next = new Set(curr);
    if (next.has(code)) {
      next.delete(code);
    } else {
      next.add(code);
    }
    this.expandedCategories.set(next);
  }

  onMetricChanged(code: string, changes: Partial<Metric>): void {
    this.metricSvc.updateMetric(code, changes);
  }
}
