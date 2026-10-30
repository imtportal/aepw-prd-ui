import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { MetricSelectionStepComponent } from './metric-selection-step.component';
import { Metric } from '../../../../admin/models/metric.model';

const MOCK_MW: Metric[] = [
  { code: 'MW1.11', name: 'Plastic waste diverted', description: '', category: 'MW', unit: 'tonnes', isTopLevel: false, evidenceRequired: 5, defaultRiskFactor: 15, active: true },
  { code: 'MW1.12', name: 'Plastic waste recycled', description: '', category: 'MW', unit: 'tonnes', isTopLevel: false, evidenceRequired: 4, defaultRiskFactor: 15, active: true },
  { code: 'MW1.13', name: 'Plastic waste reused',   description: '', category: 'MW', unit: 'tonnes', isTopLevel: false, evidenceRequired: 3, defaultRiskFactor: 15, active: true },
];

const MOCK_CV: Metric[] = [
  { code: 'CV1.1', name: 'Revenue from recycled materials', description: '', category: 'CV', unit: 'USD', isTopLevel: false, evidenceRequired: 3, defaultRiskFactor: 10, active: true },
  { code: 'CV1.2', name: 'Circular economy partnerships',   description: '', category: 'CV', unit: 'count', isTopLevel: false, evidenceRequired: 2, defaultRiskFactor: 10, active: true },
];

function makeMap(): Map<string, Metric[]> {
  return new Map([['MW', MOCK_MW], ['CV', MOCK_CV]]);
}

describe('MetricSelectionStepComponent', () => {
  let fixture:   ComponentFixture<MetricSelectionStepComponent>;
  let component: MetricSelectionStepComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetricSelectionStepComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
    fixture   = TestBed.createComponent(MetricSelectionStepComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('metricsByCategory', makeMap());
    fixture.componentRef.setInput('selectedCodes', new Set<string>());
    fixture.componentRef.setInput('excludedCodes', new Set<string>());
    fixture.detectChanges();
  });

  it('renders one [data-category-panel] per category', () => {
    const panels = fixture.nativeElement.querySelectorAll('[data-category-panel]');
    expect(panels.length).toBe(2);
  });

  it('category metrics are hidden when collapsed (default)', () => {
    expect(fixture.nativeElement.querySelector('[data-category-metrics]')).toBeFalsy();
  });

  it('clicking [data-category-header] expands that category', () => {
    fixture.nativeElement.querySelector('[data-category-header]').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-category-metrics]')).toBeTruthy();
  });

  it('clicking expanded category header collapses it', () => {
    fixture.nativeElement.querySelector('[data-category-header]').click();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('[data-category-header]').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-category-metrics]')).toBeFalsy();
  });

  it('checked metrics (in selectedCodes) have checkbox checked', () => {
    fixture.componentRef.setInput('selectedCodes', new Set(['MW1.11']));
    fixture.nativeElement.querySelector('[data-category-header]').click();
    fixture.detectChanges();
    const row = fixture.nativeElement.querySelector('[data-code="MW1.11"]');
    expect(row.querySelector('input[type="checkbox"]').checked).toBe(true);
  });

  it('unchecked metrics (not in selectedCodes) have checkbox unchecked', () => {
    fixture.componentRef.setInput('selectedCodes', new Set<string>());
    fixture.nativeElement.querySelector('[data-category-header]').click();
    fixture.detectChanges();
    const row = fixture.nativeElement.querySelector('[data-code="MW1.12"]');
    expect(row.querySelector('input[type="checkbox"]').checked).toBe(false);
  });

  it('clicking a metric checkbox emits toggleCode with that metric code', () => {
    let emitted: string | undefined;
    component.toggleCode.subscribe((code: string) => (emitted = code));
    fixture.nativeElement.querySelector('[data-category-header]').click();
    fixture.detectChanges();
    const row = fixture.nativeElement.querySelector('[data-code="MW1.11"]');
    row.querySelector('input[type="checkbox"]').click();
    expect(emitted).toBe('MW1.11');
  });

  it('shows correct selected count in category header', () => {
    fixture.componentRef.setInput('selectedCodes', new Set(['MW1.11', 'MW1.12']));
    fixture.detectChanges();
    const header = fixture.nativeElement.querySelectorAll('[data-category-header]')[0];
    expect(header.textContent).toContain('2 / 3');
  });

  describe('exclude toggle behaviour', () => {
    beforeEach(() => {
      fixture.nativeElement.querySelector('[data-category-header]').click();
      fixture.detectChanges();
    });

    it('metric row is NOT greyed out when not excluded', () => {
      fixture.componentRef.setInput('excludedCodes', new Set<string>());
      fixture.detectChanges();
      const row = fixture.nativeElement.querySelector('[data-code="MW1.11"]');
      expect(row.classList).not.toContain('opacity-50');
    });

    it('metric row gets opacity-50 when its code is in excludedCodes', () => {
      fixture.componentRef.setInput('excludedCodes', new Set(['MW1.11']));
      fixture.detectChanges();
      const row = fixture.nativeElement.querySelector('[data-code="MW1.11"]');
      expect(row.classList).toContain('opacity-50');
    });

    it('checkbox is disabled when metric is excluded', () => {
      fixture.componentRef.setInput('excludedCodes', new Set(['MW1.11']));
      fixture.detectChanges();
      const row = fixture.nativeElement.querySelector('[data-code="MW1.11"]');
      expect(row.querySelector('input[type="checkbox"]').disabled).toBe(true);
    });

    it('checkbox is enabled when metric is not excluded', () => {
      fixture.componentRef.setInput('excludedCodes', new Set<string>());
      fixture.detectChanges();
      const row = fixture.nativeElement.querySelector('[data-code="MW1.11"]');
      expect(row.querySelector('input[type="checkbox"]').disabled).toBe(false);
    });

    it('toggle pill shows "Included" when metric is not excluded', () => {
      fixture.componentRef.setInput('excludedCodes', new Set<string>());
      fixture.detectChanges();
      const row  = fixture.nativeElement.querySelector('[data-code="MW1.11"]');
      const pill = row.querySelector('[data-include-exclude-toggle]');
      expect(pill.textContent.trim()).toBe('Included');
    });

    it('toggle pill shows "Excluded" when metric is in excludedCodes', () => {
      fixture.componentRef.setInput('excludedCodes', new Set(['MW1.11']));
      fixture.detectChanges();
      const row  = fixture.nativeElement.querySelector('[data-code="MW1.11"]');
      const pill = row.querySelector('[data-include-exclude-toggle]');
      expect(pill.textContent.trim()).toBe('Excluded');
    });

    it('clicking the toggle pill emits toggleExclude with that metric code', () => {
      let emitted: string | undefined;
      component.toggleExclude.subscribe((code: string) => (emitted = code));
      fixture.componentRef.setInput('excludedCodes', new Set<string>());
      fixture.detectChanges();
      const row  = fixture.nativeElement.querySelector('[data-code="MW1.11"]');
      row.querySelector('[data-include-exclude-toggle]').click();
      expect(emitted).toBe('MW1.11');
    });
  });

  it('renders the mandatory/optional note bar', () => {
    expect(fixture.nativeElement.querySelector('[data-note-bar]')).toBeTruthy();
  });
});
