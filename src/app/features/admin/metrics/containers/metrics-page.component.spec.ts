import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { MetricsPageComponent } from './old/metrics-page.component';
import { MetricService } from '../../services/metric.service';
import { Metric } from '../../models/metric.model';

const makeMetric = (partial: Partial<Metric>): Metric => ({
  metricId:            partial.metricId ?? 1,
  code:                partial.code ?? 'MW1.1',
  name:                partial.name ?? 'Total waste',
  description:         null,
  categoryId:          partial.categoryId ?? 1,
  unit:                'tonnes',
  isTopLevel:          partial.isTopLevel ?? false,
  parentMetricId:      null,
  isCorporate:         false,
  defaultRiskPct:      0,
  evidenceRequiredMin: partial.evidenceRequiredMin ?? 0,
  isActive:            partial.isActive ?? true,
  effectiveFromUtc:    null,
  createdBy:           1,
  createdOnUtc:        '2023-01-01',
  updatedBy:           null,
  updatedOnUtc:        null,
  rowVersion:          'AAA=',
});

const METRICS: Metric[] = [
  makeMetric({ metricId: 1, code: 'MW1.1',  name: 'Total waste', categoryId: 1, isTopLevel: true,  evidenceRequiredMin: 0 }),
  makeMetric({ metricId: 2, code: 'MW1.11', name: 'Diverted',    categoryId: 1, isTopLevel: false, evidenceRequiredMin: 5 }),
  makeMetric({ metricId: 3, code: 'CV1.1',  name: 'Revenue',     categoryId: 2, isTopLevel: false, evidenceRequiredMin: 3 }),
];

describe('MetricsPageComponent', () => {
  let fixture: ComponentFixture<MetricsPageComponent>;
  let component: MetricsPageComponent;
  const fakeMetricSvc = {
    metrics:      signal(METRICS),
    updateMetric: vi.fn(),
    addMetric:    vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports:   [MetricsPageComponent],
      providers: [{ provide: MetricService, useValue: fakeMetricSvc }],
    }).compileComponents();
    fixture   = TestBed.createComponent(MetricsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('metricsByCategory() groups MW (1) and CV (2) separately', () => {
    const map = component.metricsByCategory();
    expect(map.get('1')?.length).toBe(2);
    expect(map.get('2')?.length).toBe(1);
  });

  it('expandedCategories starts with MW and EE expanded', () => {
    expect(component.expandedCategories().has('MW')).toBe(true);
    expect(component.expandedCategories().has('EE')).toBe(true);
  });

  it('onToggleCategory() adds a collapsed category to expandedCategories', () => {
    component.onToggleCategory('CV');
    expect(component.expandedCategories().has('CV')).toBe(true);
  });

  it('onToggleCategory() removes an already-expanded category', () => {
    component.onToggleCategory('MW');
    expect(component.expandedCategories().has('MW')).toBe(false);
  });

  it('onMetricChanged() calls metricSvc.updateMetric', () => {
    component.onMetricChanged('MW1.11', { evidenceRequiredMin: 7 });
    expect(fakeMetricSvc.updateMetric).toHaveBeenCalledWith('MW1.11', { evidenceRequiredMin: 7 });
  });

  it('renders metric summary footer [data-metric-summary]', () => {
    const el = fixture.nativeElement.querySelector('[data-metric-summary]');
    expect(el).not.toBeNull();
  });
});
