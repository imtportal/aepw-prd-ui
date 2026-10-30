import { TestBed } from '@angular/core/testing';
import { MetricService } from './metric.service';
import { Metric } from '../models/metric.model';

const NEW_METRIC: Metric = {
  metricId: 99, code: 'SB1.3', name: 'New metric', description: 'Test',
  categoryId: 5, unit: 'count', isTopLevel: false, parentMetricId: null,
  isCorporate: false, defaultRiskPct: 5, evidenceRequiredMin: 1, isActive: true,
  effectiveFromUtc: null, createdBy: 1, createdOnUtc: '2023-01-01',
  updatedBy: null, updatedOnUtc: null, rowVersion: 'AAA=',
};

describe('MetricService', () => {
  let svc: MetricService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(MetricService);
  });

  it('metrics() returns initial list', () => {
    expect(svc.metrics().length).toBeGreaterThan(0);
  });

  it('toggleActive() flips the isActive flag', () => {
    const code   = svc.metrics()[0].code;
    const before = svc.metrics()[0].isActive;
    svc.toggleActive(code);
    expect(svc.metrics().find(m => m.code === code)?.isActive).toBe(!before);
  });

  it('addMetric() appends the metric to the list', () => {
    const before = svc.metrics().length;
    svc.addMetric(NEW_METRIC);
    expect(svc.metrics().length).toBe(before + 1);
    expect(svc.metrics().at(-1)?.code).toBe('SB1.3');
  });

  it('addMetric() does not mutate the existing list', () => {
    const before = svc.metrics();
    svc.addMetric(NEW_METRIC);
    expect(svc.metrics()).not.toBe(before);
  });
});
