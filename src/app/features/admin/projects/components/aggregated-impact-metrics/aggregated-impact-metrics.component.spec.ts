import '@angular/compiler';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthStateService } from '../../../../../core/auth';
import { ReviewDto, ReviewMetricDto } from '../../../../reviews/models/review.model';
import { ReviewService } from '../../../../reviews/services/review.service';
import { aggregateReviewMetrics, AggregatedImpactMetricsComponent } from './aggregated-impact-metrics.component';

const metric = (values: Partial<ReviewMetricDto>): ReviewMetricDto => ({
  metricId: 1,
  metricCode: 'MW1.1',
  metricName: 'Waste collected',
  categoryCode: 'MW',
  categoryName: 'Reduce Unmanaged Waste',
  unit: 'Tonnes',
  isTopLevel: true,
  reportedValue: '0',
  evidenceCount: 0,
  ...values,
} as ReviewMetricDto);

const review = (...reviewMetrics: ReviewMetricDto[]): ReviewDto => ({ reviewMetrics } as ReviewDto);

describe('AggregatedImpactMetricsComponent L1 count', () => {
  it('counts only children in the selected category, without duplicating metrics across reviews', async () => {
    const data = review(
      metric({ metricId: 1 }),
      metric({ metricId: 2, parentMetricId: 1, isTopLevel: false }),
      metric({ metricId: 3, parentMetricId: 1, isTopLevel: false }),
      metric({ metricId: 4, categoryCode: 'CV' }),
      metric({ metricId: 5, parentMetricId: 4, categoryCode: 'CV', isTopLevel: false }),
      metric({ metricId: 6, categoryCode: 'EE' }),
    );
    await TestBed.configureTestingModule({
      imports: [AggregatedImpactMetricsComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: AuthStateService, useValue: { getCurrentUserId: () => 7 } },
        { provide: ReviewService, useValue: { getReviewByReviewId: () => of(data) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(AggregatedImpactMetricsComponent);
    fixture.componentRef.setInput('reviewIds', [42, 43]);
    fixture.detectChanges();
    await fixture.whenStable();

    const heading = () => (fixture.nativeElement as HTMLElement).querySelector('h2')?.textContent;
    expect(heading()).toBe('L1 Metrics: 2');

    fixture.componentInstance.selectedCategory.set('CV');
    await fixture.whenStable();
    expect(heading()).toBe('L1 Metrics: 1');

    fixture.componentInstance.selectedCategory.set('EE');
    await fixture.whenStable();
    expect(heading()).toBe('L1 Metrics: 0');
  });
});

describe('aggregateReviewMetrics', () => {
  it('sums matching metrics across reviews and weights their risk by net reported value', () => {
    const result = aggregateReviewMetrics([
      review(metric({ rawValue: 100, baseline: 20, evidenceCount: 3, evidenced: 12.345, adjustedValue: 40, riskPctEffective: 50 })),
      review(metric({ rawValue: 50, baseline: 10, evidenceCount: 2, evidenced: 6.789, adjustedValue: 30, riskPctEffective: 75 })),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      reported: 150, baseline: 30, adjusted: 70, riskPercent: 175 / 3,
      reviewCount: 2,
    });
    expect(result[0].captured).toBeCloseTo(19.134, 3);
    expect(result[0].contributions.map((contribution) => contribution.captured)).toEqual([12.345, 6.789]);
  });

  it('uses evidenced values for parent and child metrics even when evidence counts are zero', () => {
    const result = aggregateReviewMetrics([
      review(
        metric({ evidenced: 8.125 }),
        metric({ metricId: 2, parentMetricId: 1, isTopLevel: false, evidenced: 8.125 }),
      ),
      review(
        metric({ evidenced: 1.25 }),
        metric({ metricId: 2, parentMetricId: 1, isTopLevel: false, evidenced: 1.25 }),
      ),
    ]);

    expect(result.map((item) => item.captured)).toEqual([9.375, 9.375]);
  });

  it('defaults missing evidenced values to zero instead of using evidence counts', () => {
    const [result] = aggregateReviewMetrics([
      review(metric({ evidenceCount: 3 })),
      review(metric({ evidenced: 0, evidenceCount: 2 })),
    ]);

    expect(result.captured).toBe(0);
    expect(result.contributions.map((contribution) => contribution.captured)).toEqual([0, 0]);
  });

  it('keeps child metrics separate and handles empty projects', () => {
    const result = aggregateReviewMetrics([
      review(metric({}), metric({ metricId: 2, metricCode: 'MW1.11', parentMetricId: 1, isTopLevel: false, reportedValue: '1,200' })),
    ]);

    expect(result).toHaveLength(2);
    expect(result[1]).toMatchObject({ metricId: 2, parentMetricId: 1, reported: 1200 });
    expect(result[1].contributions).toHaveLength(1);
    expect(aggregateReviewMetrics([])).toEqual([]);
  });

  it('counts approvals across reviews and retains risk when reported values are zero', () => {
    const [result] = aggregateReviewMetrics([
      review(metric({ status: 'Approved', riskOriginal: 32 })),
      review(metric({ status: 'Pending', riskOriginal: 100 })),
    ]);

    expect(result).toMatchObject({ reviewCount: 2, approvedReviewCount: 1, status: 'Mixed', riskPercent: 66 });
  });
});