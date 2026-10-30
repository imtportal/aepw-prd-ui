import { Component, input } from '@angular/core';
import type {
  DashboardPortfolioAdjustmentByCategories
} from '../model/dashboard.model';
import { LUCIDE_ICONS, LucideIconProvider,  } from 'lucide-angular';

@Component({
  selector: 'app-impact-metric-card',
  standalone: true,
  templateUrl: './impact-metric-card.component.html',
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider({}) },
  ],
  imports: [] 
})
export class ImpactMetricCardComponent {

  metric = input.required<DashboardPortfolioAdjustmentByCategories>();
TrendingUp: any;

getGrowthClass(value: string | number | null | undefined): string {
  const growth = Number(value);

  if (growth > 0) {
    return 'text-green-700';
  }

  if (growth < 0) {
    return 'text-red-600';
  }

  return 'text-gray-500';
}


getGrowthIcon(value: string | number | null | undefined): string {
  const growth = Number(value);

  if (growth > 0) {
    return '↗';
  }

  if (growth < 0) {
    return '↘';
  }

  return '→';
}


// getGrowthValue(value: string | number | null | undefined): string {
//   const growth = Number(value);


//   if (!Number.isFinite(growth)) {
//   return '0.00%';
// }


//   // if (growth > 0 || growth < 0) {
//     // return `+${growth}%`;
//     return `${growth > 0 ? '+' : ''}${growth.toFixed(3)}%`;
 
// }

getGrowthValue(value: string | number | null | undefined): string {
  const growth = Number(value);

  if (!Number.isFinite(growth)) {
    return '0.000%';
  }

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  }).format(growth);

  return `${growth > 0 ? '+' : ''}${formatted}%`;
}

// formatValue(value: string | number | null | undefined): string {
//   const num = Number(value);

//   if (isNaN(num)) {
//     return '0';
//   }

//   const abs = Math.abs(num);

//   if (abs >= 1_000_000_000) {
//     return `${this.formatNumber(num / 1_000_000_000)}B`;
//   }

//   if (abs >= 1_000_000) {
//     return `${this.formatNumber(num / 1_000_000)}M`;
//   }

//   if (abs >= 1_000) {
//     return `${this.formatNumber(num / 1_000)}K`;
//   }

//   return this.formatNumber(num);
// }

formatValue(value: string | number | null | undefined): string {
  const num = Number(value);

  if (!Number.isFinite(num)) {
    return '0';
  }

  const abs = Math.abs(num);

  if (abs >= 1_000_000_000) {
    return `${this.formatNumber(num / 1_000_000_000)}B`;
  }

  if (abs >= 1_000_000) {
    return `${this.formatNumber(num / 1_000_000)}M`;
  }

  if (abs >= 1_000) {
    return `${this.formatNumber(num / 1_000)}K`;
  }

  return this.formatNumber(num);
}

// private formatNumber(value: number): string {
//   return Number.isInteger(value)
//     ? value.toString()
//     : value.toFixed(1).replace(/\.0$/, '');
// }

private formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2
  }).format(value);
}

}