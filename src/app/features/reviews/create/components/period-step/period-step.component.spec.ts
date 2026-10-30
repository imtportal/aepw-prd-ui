import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { PeriodStepComponent } from './period-step.component';
import { SelectComponent } from '../../../../../shared/ui/select/select.component';

describe('PeriodStepComponent', () => {
  let fixture:   ComponentFixture<PeriodStepComponent>;
  let component: PeriodStepComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PeriodStepComponent],
    }).compileComponents();
    fixture   = TestBed.createComponent(PeriodStepComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('selectedPeriod', 'Q3 2025');
    fixture.componentRef.setInput('startDate', '2025-07-01');
    fixture.componentRef.setInput('endDate',   '2025-09-30');
    fixture.detectChanges();
  });

  it('renders [data-period-step] in DOM', () => {
    expect(fixture.nativeElement.querySelector('[data-period-step]')).toBeTruthy();
  });

  it('periodChange emits when SelectComponent value changes', () => {
    let emitted: string | undefined;
    component.periodChange.subscribe((v: string) => (emitted = v));
    const selectInst = fixture.debugElement
      .query(By.directive(SelectComponent))
      .componentInstance as any;
    selectInst.onValueChange('Q4 2025');
    expect(emitted).toBe('Q4 2025');
  });

  it('startDateChange emits when start date input changes', () => {
    let emitted: string | undefined;
    component.startDateChange.subscribe((v: string) => (emitted = v));
    const input = fixture.nativeElement.querySelector('[data-start-date]');
    input.value = '2025-10-01';
    input.dispatchEvent(new Event('change'));
    expect(emitted).toBe('2025-10-01');
  });

  it('endDateChange emits when end date input changes', () => {
    let emitted: string | undefined;
    component.endDateChange.subscribe((v: string) => (emitted = v));
    const input = fixture.nativeElement.querySelector('[data-end-date]');
    input.value = '2025-12-31';
    input.dispatchEvent(new Event('change'));
    expect(emitted).toBe('2025-12-31');
  });
});
