import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StepDotsComponent } from './step-dots.component';
import { ApprovalStage } from '../../../reviews/models/review.model';

describe('StepDotsComponent', () => {
  let fixture:   ComponentFixture<StepDotsComponent>;
  let component: StepDotsComponent;

  function create(stage: ApprovalStage) {
    fixture   = TestBed.createComponent(StepDotsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('currentStage', stage);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StepDotsComponent],
    }).compileComponents();
  });

  it('renders 4 dots — one per stage in APPROVAL_STAGE_ORDER', () => {
    create('PM Review');
    const dots = fixture.nativeElement.querySelectorAll('[data-stage]');
    expect(dots.length).toBe(4);
  });

  it('dot for currentStage has data-active="true"', () => {
    create('Reviewer');
    const activeDot = fixture.nativeElement.querySelector('[data-stage="Reviewer"]');
    expect(activeDot.getAttribute('data-active')).toBe('true');
  });

  it('dots for other stages have data-active="false"', () => {
    create('PM Review');
    const reviewerDot = fixture.nativeElement.querySelector('[data-stage="Reviewer"]');
    expect(reviewerDot.getAttribute('data-active')).toBe('false');
  });
});
