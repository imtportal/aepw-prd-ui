import { Component, computed, input, output } from '@angular/core';
import {
  LucideAngularModule,
  LucideIconProvider,
  LUCIDE_ICONS,
  ChevronDown,
  ChevronRight,
} from 'lucide-angular';
import { CardComponent, CardContentComponent } from '../../../../../shared/ui/card/card.component';
import { BadgeComponent } from '../../../../../shared/ui/badge/badge.component';
import { CategoryDef } from '../../../models/metric-old.model';
import { Metric } from '../../../models/metric.model';

@Component({
  selector: 'app-metric-category-card',
  standalone: true,
  imports: [LucideAngularModule, CardComponent, CardContentComponent, BadgeComponent],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({ ChevronDown, ChevronRight }),
    },
  ],
  templateUrl: './metric-category-card-old.component.html',
})
export class MetricCategoryCardComponent {
  category = input.required<CategoryDef>();
  metrics = input.required<Metric[]>();
  expanded = input<boolean>(false);

  toggleExpand = output<void>();
  metricChanged = output<{ code: string; changes: Partial<Metric> }>();

  readonly metricCount = computed(() => this.metrics().length);
}
