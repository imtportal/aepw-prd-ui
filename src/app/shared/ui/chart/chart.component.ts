import { Component, computed, input } from '@angular/core';
// import { ChartModule } from 'primeng/chart';

const AEPW_COLORS = [
  'hsl(200, 100%, 30%)',  // --chart-1 AEPW blue
  'hsl(148, 86%, 23%)',   // --chart-2 AEPW green
  'hsl(90, 50%, 60%)',    // --chart-3 accent green
  'hsl(12, 66%, 62%)',    // --chart-4 AEPW orange
  'hsl(190, 43%, 71%)',   // --chart-5 light blue
];

const AEPW_COLORS_ALPHA = AEPW_COLORS.map(c => c.replace(')', ', 0.2)').replace('hsl(', 'hsla('));

@Component({
  selector: 'ui-chart',
  standalone: true,
  imports: [],
  templateUrl: './chart.component.html',
})
export class ChartComponent {
  readonly type    = input<'bar' | 'line' | 'pie' | 'doughnut'>('bar');
  readonly data    = input<any>({ labels: [], datasets: [] });
  readonly options = input<any>({});
  readonly height  = input<string>('300px');
  readonly styleClass = input<string>('');

  readonly coloredData = computed(() => {
    const raw = this.data();
    if (!raw?.datasets?.length) return raw;
    return {
      ...raw,
      datasets: raw.datasets.map((ds: any, i: number) => ({
        backgroundColor: this.type() === 'line'
          ? AEPW_COLORS_ALPHA[i % AEPW_COLORS_ALPHA.length]
          : AEPW_COLORS[i % AEPW_COLORS.length],
        borderColor: AEPW_COLORS[i % AEPW_COLORS.length],
        borderWidth: 2,
        ...ds,
      })),
    };
  });

  readonly mergedOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: 'hsl(197, 29%, 25%)' } },
    },
    scales: this.type() !== 'pie' && this.type() !== 'doughnut'
      ? {
          x: { ticks: { color: 'hsl(205, 10%, 48%)' }, grid: { color: 'hsl(200, 15%, 88%)' } },
          y: { ticks: { color: 'hsl(205, 10%, 48%)' }, grid: { color: 'hsl(200, 15%, 88%)' } },
        }
      : undefined,
    ...this.options(),
  }));
}
