import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MetricKpiCardComponent } from './metric-kpi-card.component';
import { TopLevelMetric } from '../../models/reporting.modelold';

const METRIC_POS: TopLevelMetric = {
  code: 'MW1.1', name: 'Total reduction in unmanaged waste',
  reported: 2409.7, riskAdjusted: 1768.2, unit: 'tonnes', yoyChange: 18,
  l1Metrics: [],
};
const METRIC_NEG: TopLevelMetric = {
  code: 'CV1.1', name: 'Total plastic waste valorised',
  reported: 572, riskAdjusted: 400.4, unit: 'tonnes', yoyChange: -21,
  l1Metrics: [],
};

describe('MetricKpiCardComponent', () => {
  let fixture: ComponentFixture<MetricKpiCardComponent>;
  let component: MetricKpiCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetricKpiCardComponent],
    }).compileComponents();
    fixture   = TestBed.createComponent(MetricKpiCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('metric', METRIC_POS);
    fixture.detectChanges();
  });

  it('renders data-category-badge with metric code text', () => {
    const badge = fixture.nativeElement.querySelector('[data-category-badge]');
    expect(badge?.textContent?.trim()).toBe('MW1.1');
  });

  it('data-reported-value shows formatted value (2409.7 → "2.4K")', () => {
    const el = fixture.nativeElement.querySelector('[data-reported-value]');
    expect(el?.textContent?.trim()).toBe('2.4K');
  });

  it('data-yoy-change shows "+18%" for positive yoyChange', () => {
    const el = fixture.nativeElement.querySelector('[data-yoy-change]');
    expect(el?.textContent).toContain('+18%');
  });

  it('data-yoy-change shows "-21%" for negative yoyChange', () => {
    fixture.componentRef.setInput('metric', METRIC_NEG);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('[data-yoy-change]');
    expect(el?.textContent).toContain('-21%');
  });

  it('click emits toggleExpand with the metric code', () => {
    let emitted: string | undefined;
    component.toggleExpand.subscribe((code: string) => (emitted = code));
    fixture.nativeElement.querySelector('[data-kpi-card]').click();
    expect(emitted).toBe('MW1.1');
  });

  it('ChevronDown present when expanded=true, ChevronRight when false', () => {
    fixture.componentRef.setInput('expanded', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-chevron-down]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-chevron-right]')).toBeFalsy();
  });
});
