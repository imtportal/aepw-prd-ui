import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { Metric2, MetricCategory2 } from '../../../models/metric.model';
import { MetricCategoryCardComponent } from './metric-category-card.component';

const childMetric: Metric2 = {
  metricId: 'child',
  metricCode: 'MW1.11',
  metricName: 'Collected waste',
  isTopLevel: false,
  isActive: true,
  isRiskAdjustmentRequired: false,
  isICPRequired: false,
  evidenceTypes: [],
  children: [],
};

const category: MetricCategory2 = {
  categoryId: 'category',
  categoryCode: 'MW',
  categoryName: 'Reduce Unmanaged Waste',
  categoryDescription: '',
  metrics: [
    {
      metricId: 'parent',
      metricCode: 'MW1.1',
      metricName: 'Total reduction in unmanaged plastic waste',
      isTopLevel: true,
      isActive: true,
      isRiskAdjustmentRequired: false,
      isICPRequired: false,
      evidenceTypes: [],
      children: [childMetric],
    },
  ],
};

const createMetricForm = (): FormGroup =>
  new FormGroup({
    isActive: new FormControl(true),
    isICPRequired: new FormControl(false),
    metricSourceId: new FormControl(null),
    isRiskAdjustmentRequired: new FormControl(false),
  });

describe('MetricCategoryCardComponent', () => {
  let fixture: ComponentFixture<MetricCategoryCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetricCategoryCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MetricCategoryCardComponent);
    const metricForms = new Map([
      ['parent', createMetricForm()],
      ['child', createMetricForm()],
    ]);
    fixture.componentRef.setInput('category', category);
    fixture.componentRef.setInput('categoryForm', createMetricForm());
    fixture.componentRef.setInput('getMetricForm', (metricId: string) => metricForms.get(metricId)!);
    fixture.componentRef.setInput('metricSources', []);
    fixture.componentRef.setInput('expanded', true);
    fixture.detectChanges();
  });

  it('toggles child metrics when the top-level metric chevron is clicked', () => {
    const toggle = fixture.nativeElement.querySelector(
      'tr[data-metric-row="MW1.1"] td:nth-child(2) button',
    ) as HTMLButtonElement;

    expect(fixture.nativeElement.querySelector('tr[data-metric-row="MW1.11"]')).not.toBeNull();

    toggle.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('tr[data-metric-row="MW1.11"]')).toBeNull();

    toggle.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('tr[data-metric-row="MW1.11"]')).not.toBeNull();
  });

  it('keeps a collapsed metric closed when action permissions change', () => {
    const toggle = fixture.nativeElement.querySelector(
      'tr[data-metric-row="MW1.1"] td:nth-child(2) button',
    ) as HTMLButtonElement;

    toggle.click();
    fixture.detectChanges();
    fixture.componentRef.setInput('canSource', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('tr[data-metric-row="MW1.11"]')).toBeNull();
  });
});
