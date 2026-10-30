import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RiskAdjustmentStepComponent } from './risk-adjustment-step.component';
import { Metric } from '../../../../admin/models/metric.model';

const MOCK_METRICS: Metric[] = [
  { code: 'MW1.11', name: 'Plastic waste diverted', description: '', category: 'MW', unit: 'tonnes', isTopLevel: false, evidenceRequired: 5, defaultRiskFactor: 15, active: true },
  { code: 'CV1.1',  name: 'Revenue',                description: '', category: 'CV', unit: 'USD',    isTopLevel: false, evidenceRequired: 3, defaultRiskFactor: 10, active: true },
];

describe('RiskAdjustmentStepComponent', () => {
  let fixture:   ComponentFixture<RiskAdjustmentStepComponent>;
  let component: RiskAdjustmentStepComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RiskAdjustmentStepComponent],
    }).compileComponents();
    fixture   = TestBed.createComponent(RiskAdjustmentStepComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('selectedMetrics', MOCK_METRICS);
    fixture.componentRef.setInput('riskOverrides', {});
    fixture.detectChanges();
  });

  it('renders selectedMetrics().length rows in [data-metrics-table]', () => {
    const rows = fixture.nativeElement.querySelectorAll('[data-metric-row]');
    expect(rows.length).toBe(2);
  });

  it('default risk value shown from m.defaultRiskFactor when no override', () => {
    const input = fixture.nativeElement.querySelector('[data-metric-row="MW1.11"] [data-risk-input]');
    expect(Number(input.value)).toBe(15);
  });

  it('override value shown from riskOverrides()[m.code] when override exists', () => {
    fixture.componentRef.setInput('riskOverrides', { 'MW1.11': 20 });
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('[data-metric-row="MW1.11"] [data-risk-input]');
    expect(Number(input.value)).toBe(20);
  });

  it('[data-risk-input] change emits overrideChange with { code, value }', () => {
    let emitted: { code: string; value: number } | undefined;
    component.overrideChange.subscribe((e) => (emitted = e));
    const input = fixture.nativeElement.querySelector('[data-metric-row="MW1.11"] [data-risk-input]');
    input.value = '25';
    input.dispatchEvent(new Event('change'));
    expect(emitted).toEqual({ code: 'MW1.11', value: 25 });
  });

  it('[data-launch-btn] click emits launch', () => {
    let emitted = false;
    component.launch.subscribe(() => (emitted = true));
    fixture.nativeElement.querySelector('[data-launch-btn]').click();
    expect(emitted).toBe(true);
  });

  it('[data-download-btn] is disabled', () => {
    const btn = fixture.nativeElement.querySelector('[data-download-btn]');
    expect(btn.disabled).toBe(true);
  });

  it('[data-no-metrics] shown when selectedMetrics() is empty', () => {
    fixture.componentRef.setInput('selectedMetrics', []);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-no-metrics]')).toBeTruthy();
  });
});
