import { Component, input } from '@angular/core';

@Component({
  selector: 'app-kpi-bar',
  standalone: true,
  templateUrl: './kpi-bar.component.html',
})
export class KpiBarComponent {
  pendingMetricsCount = input.required<number>();
  materialFlagsCount  = input.required<number>();
  rejectionsCount     = input.required<number>();
}
