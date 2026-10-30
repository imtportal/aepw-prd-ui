import { Component, computed, input, output } from '@angular/core';
import {
  LucideAngularModule, LucideIconProvider, LUCIDE_ICONS,
  TrendingUp, TrendingDown, ChevronDown, ChevronRight,
} from 'lucide-angular';
import { BadgeComponent } from '../../../../shared/ui/badge/badge.component';
import { TopLevelMetric } from '../../models/reporting.modelold';

@Component({
  selector: 'app-metric-kpi-card',
  standalone: true,
  imports: [LucideAngularModule, BadgeComponent],
  providers: [
    { provide: LUCIDE_ICONS, multi: true,
      useValue: new LucideIconProvider({ TrendingUp, TrendingDown, ChevronDown, ChevronRight }) },
  ],
  templateUrl: './metric-kpi-card.component.html',
})
export class MetricKpiCardComponent {
  metric       = input.required<TopLevelMetric>();
  expanded     = input<boolean>(false);
  toggleExpand = output<string>();

  private readonly categoryColors: Record<string, string> = {
    MW: 'bg-[hsl(var(--aepw-blue))] text-white',
    CV: 'bg-[hsl(var(--aepw-green))] text-white',
    EE: 'bg-[hsl(var(--aepw-orange))] text-white',
    SB: 'bg-purple-600 text-white',
    MC: 'bg-teal-600 text-white',
  };

  protected readonly categoryBadgeClass = computed(() =>
    this.categoryColors[this.metric().code.substring(0, 2)] ?? 'bg-muted'
  );

  protected readonly formatValue = (value: number, unit: string): string => {
    if (unit.includes('USD') && unit.includes('millions')) return `$${value.toFixed(1)}M`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000)     return `${(value / 1_000).toFixed(1)}K`;
    return value.toLocaleString();
  };
}
