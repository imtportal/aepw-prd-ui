import { DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown, Info, LUCIDE_ICONS, LucideAngularModule, LucideIconProvider } from 'lucide-angular';
import { catchError, forkJoin, map, of, startWith, switchMap } from 'rxjs';
import { AuthStateService } from '../../../../../core/auth';
import { ReviewDto } from '../../../../reviews/models/review.model';
import { ReviewService } from '../../../../reviews/services/review.service';
import { ReviewMetricsByIdSourceNames } from '../../../../reviews/detail/components/review-metrics-by-id/review-metrics-by-id.types';

const CATEGORY_ORDER = ['MW', 'CV', 'EE', 'MC', 'SB', 'CI'];

export interface AggregatedMetric {
  metricId: number;
  parentMetricId?: number;
  code: string;
  name: string;
  unit: string;
  categoryCode: string;
  categoryName: string;
  categoryColor: string;
  description: string;
  isTopLevel: boolean;
  reported: number;
  baseline: number;
  captured: number;
  adjusted: number;
  riskPercent: number;
  reviewCount: number;
  approvedReviewCount: number;
  status: string;
  contributions: {
    reviewId: number;
    period: string;
    reported: number;
    captured: number;
    adjusted: number;
  }[];
}

export function aggregateReviewMetrics(reviews: ReviewDto[]): AggregatedMetric[] {
  const metrics = new Map<number, AggregatedMetric>();
  const riskTotals = new Map<number, { weighted: number; weight: number; sum: number }>();

  for (const review of reviews) {
    for (const metric of review.reviewMetrics ?? []) {
      const existing = metrics.get(metric.metricId) ?? {
        metricId: metric.metricId,
        parentMetricId: metric.parentMetricId,
        code: metric.metricCode,
        name: metric.metricName,
        unit: metric.unit,
        categoryCode: metric.categoryCode,
        categoryName: metric.categoryName ?? '',
        categoryColor: metric.categoryColor ?? '#64748b',
        description: metric.metricDescription ?? metric.frComment ?? '',
        isTopLevel: !!metric.isTopLevel,
        reported: 0,
        baseline: 0,
        captured: 0,
        adjusted: 0,
        riskPercent: 0,
        reviewCount: 0,
        approvedReviewCount: 0,
        status: metric.status ?? '',
        contributions: [],
      };
      const reported = Number(metric.rawValue ?? metric.reportedValue?.replace(/,/g, '') ?? 0);
      const baseline = Number(metric.baseline ?? 0);
      const weight = Math.max(0, reported - baseline);
      const risk = riskTotals.get(metric.metricId) ?? { weighted: 0, weight: 0, sum: 0 };

      existing.reported += Number.isFinite(reported) ? reported : 0;
      existing.baseline += baseline;
      existing.captured += metric.evidenced ?? 0;
      existing.adjusted += metric.adjustedValue ?? 0;
      existing.reviewCount++;
      existing.contributions.push({
        reviewId: review.reviewId,
        period: review.reviewPeriodCode ?? `Review ${review.reviewId}`,
        reported: Number.isFinite(reported) ? reported : 0,
        captured: metric.evidenced ?? 0,
        adjusted: metric.adjustedValue ?? 0,
      });
      if (metric.status?.toLowerCase() === 'approved') existing.approvedReviewCount++;
      if (existing.status !== (metric.status ?? '')) existing.status = 'Mixed';
      const riskPercent = metric.riskPctEffective ?? metric.riskPctProposed ?? metric.riskOriginal ?? 0;
      risk.weighted += weight * riskPercent;
      risk.weight += weight;
      risk.sum += riskPercent;
      metrics.set(metric.metricId, existing);
      riskTotals.set(metric.metricId, risk);
    }
  }

  return [...metrics.values()].map((metric) => {
    const risk = riskTotals.get(metric.metricId)!;
    return { ...metric, riskPercent: risk.weight ? risk.weighted / risk.weight : risk.sum / metric.reviewCount };
  }).sort((left, right) => left.code.localeCompare(right.code, undefined, { numeric: true }));
}

@Component({
  selector: 'app-aggregated-impact-metrics',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './aggregated-impact-metrics.component.html',
  imports: [DecimalPipe, NgTemplateOutlet, LucideAngularModule],
  providers: [{
    provide: LUCIDE_ICONS,
    multi: true,
    useValue: new LucideIconProvider({ ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown, Info }),
  }],
})
export class AggregatedImpactMetricsComponent {
  readonly reviewIds = input.required<number[]>();
  readonly expanded = signal(true);
  readonly selectedCategory = signal('');
  readonly expandedMetricIds = signal<Set<number>>(new Set());
  readonly expandedChildIds = signal<Set<number>>(new Set());
  private readonly reviewService = inject(ReviewService);
  private readonly authState = inject(AuthStateService);

  readonly result = toSignal(toObservable(this.reviewIds).pipe(
    switchMap((ids) => {
      if (!ids.length) return of({ metrics: [] as AggregatedMetric[], loading: false, error: false });
      const userId = this.authState.getCurrentUserId() ?? 0;
      return forkJoin(ids.map((id) => this.reviewService.getReviewByReviewId({ reviewId: String(id), userId, stageId: null, sourcePage: ReviewMetricsByIdSourceNames.ProjectLibrary }))).pipe(
        map((reviews) => ({ metrics: aggregateReviewMetrics(reviews.filter((review): review is ReviewDto => !!review)), loading: false, error: false })),
        catchError(() => of({ metrics: [] as AggregatedMetric[], loading: false, error: true })),
        startWith({ metrics: [] as AggregatedMetric[], loading: true, error: false }),
      );
    }),
  ), { initialValue: { metrics: [] as AggregatedMetric[], loading: false, error: false } });

  readonly categories = computed(() => {
    const categories = new Map<string, { code: string; name: string; color: string; total: number; done: number }>();
    for (const metric of this.result().metrics) {
      const category = categories.get(metric.categoryCode) ?? {
        code: metric.categoryCode, name: metric.categoryName, color: metric.categoryColor, total: 0, done: 0,
      };
      if (metric.isTopLevel) {
        category.total++;
        if (metric.approvedReviewCount === metric.reviewCount) category.done++;
      }
      categories.set(metric.categoryCode, category);
    }
    return [...categories.values()].sort((left, right) => {
      const leftIndex = CATEGORY_ORDER.indexOf(left.code);
      const rightIndex = CATEGORY_ORDER.indexOf(right.code);
      return (leftIndex === -1 ? CATEGORY_ORDER.length : leftIndex) -
        (rightIndex === -1 ? CATEGORY_ORDER.length : rightIndex);
    });
  });

  readonly activeCategory = computed(() =>
    this.categories().some((category) => category.code === this.selectedCategory())
      ? this.selectedCategory()
      : this.categories()[0]?.code ?? '',
  );
  readonly visibleMetrics = computed(() =>
    this.result().metrics.filter((metric) => metric.categoryCode === this.activeCategory()),
  );
  readonly visibleTopMetrics = computed(() => this.visibleMetrics().filter((metric) => metric.isTopLevel));
  readonly visibleL1MetricCount = computed(() =>
    this.visibleTopMetrics().reduce((count, metric) => count + this.childrenFor(metric.metricId).length, 0),
  );
  readonly allExpanded = computed(() =>
    this.visibleTopMetrics().length > 0 &&
    this.visibleMetrics().every((metric) =>
      metric.isTopLevel
        ? this.expandedMetricIds().has(metric.metricId)
        : this.expandedChildIds().has(metric.metricId)),
  );

  childrenFor(metricId: number): AggregatedMetric[] {
    return this.visibleMetrics().filter((metric) => metric.parentMetricId === metricId);
  }

  isMetricExpanded(metricId: number): boolean {
    return this.expandedMetricIds().has(metricId);
  }

  toggleMetric(metricId: number): void {
    const expanded = new Set(this.expandedMetricIds());
    if (expanded.has(metricId)) expanded.delete(metricId);
    else expanded.add(metricId);
    this.expandedMetricIds.set(expanded);
  }

  isChildExpanded(metricId: number): boolean {
    return this.expandedChildIds().has(metricId);
  }

  toggleChild(metricId: number): void {
    const expanded = new Set(this.expandedChildIds());
    if (expanded.has(metricId)) expanded.delete(metricId);
    else expanded.add(metricId);
    this.expandedChildIds.set(expanded);
  }

  toggleExpandAll(): void {
    const expanded = new Set(this.expandedMetricIds());
    const collapse = this.allExpanded();
    for (const metric of this.visibleTopMetrics()) {
      if (collapse) expanded.delete(metric.metricId);
      else expanded.add(metric.metricId);
    }
    this.expandedMetricIds.set(expanded);
    const children = new Set(this.expandedChildIds());
    for (const metric of this.visibleMetrics()) {
      if (metric.isTopLevel) continue;
      if (collapse) children.delete(metric.metricId);
      else children.add(metric.metricId);
    }
    this.expandedChildIds.set(children);
  }
}