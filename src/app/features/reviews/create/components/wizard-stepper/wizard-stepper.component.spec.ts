import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WizardStepperComponent } from './wizard-stepper.component';

const STEPS = [
  { label: 'Project' },
  { label: 'Period' },
  { label: 'Metrics' },
  { label: 'Launch' },
];

describe('WizardStepperComponent', () => {
  let fixture:   ComponentFixture<WizardStepperComponent>;
  let component: WizardStepperComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WizardStepperComponent],
    }).compileComponents();
    fixture   = TestBed.createComponent(WizardStepperComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('currentStep', 1);
    fixture.componentRef.setInput('steps', STEPS);
    fixture.detectChanges();
  });

  it('renders correct number of step dots from steps() input', () => {
    const dots = fixture.nativeElement.querySelectorAll('[data-step]');
    expect(dots.length).toBe(4);
  });

  it('step with i === currentStep() has data-active="true"', () => {
    const active = fixture.nativeElement.querySelector('[data-step="1"]');
    expect(active.getAttribute('data-active')).toBe('true');
  });

  it('step with i < currentStep() has data-done="true"', () => {
    const done = fixture.nativeElement.querySelector('[data-step="0"]');
    expect(done.getAttribute('data-done')).toBe('true');
  });

  it('step with i > currentStep() has data-active="false" and data-done="false"', () => {
    const future = fixture.nativeElement.querySelector('[data-step="2"]');
    expect(future.getAttribute('data-active')).toBe('false');
    expect(future.getAttribute('data-done')).toBe('false');
  });
});
