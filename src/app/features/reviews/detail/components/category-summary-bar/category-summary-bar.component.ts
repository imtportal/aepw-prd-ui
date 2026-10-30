import { Component, computed, input } from '@angular/core';
import { MetricRow } from '../../../models/review.model';

@Component({
  selector: 'app-category-summary-bar',
  standalone: true,
  templateUrl: './category-summary-bar.component.html',
})
export class CategorySummaryBarComponent {
  metrics = input.required<MetricRow[]>();

  protected readonly evUploaded = computed(
    () => this.metrics().reduce((s, m) => s + (m.evidenceUploadCount || 0), 0),
  );
  protected readonly evRequired = computed(
    () => this.metrics().reduce((s, m) => s + m.evidenceCount, 0),
  );
  protected readonly completeFiles = computed(
    () => this.metrics().flatMap(m => m.evidenceFiles).filter(f => f && f.status === 'complete').length,
  );
  protected readonly totalFiles = computed(
    () => this.metrics().flatMap(m => m.evidenceFiles).length,
  );
  protected readonly evPercent = computed(() => {
    const req = this.evRequired();
    return req > 0 ? Math.round((this.evUploaded() / req) * 100) : 0;
  });
}
