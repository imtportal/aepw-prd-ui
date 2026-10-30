import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReviewProgressCellComponent } from './review-progress-cell.component';
import { Review } from '../../../reviews/models/review.model';

function makeReview(stage: Review['stage']): Review {
  return {
    projectId: 'TEST-001', project: 'Test', pm: 'PM', recipient: 'Rec',
    stage, dataCompletion: 80, evidenceConfirmed: 60, updatedAt: '2025-07-01T00:00:00',
  };
}

describe('ReviewProgressCellComponent', () => {
  let fixture: ComponentFixture<ReviewProgressCellComponent>;
  let component: ReviewProgressCellComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewProgressCellComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ReviewProgressCellComponent);
    component = fixture.componentInstance;
  });

  it('renders Initiate button when stage is Due', () => {
    fixture.componentRef.setInput('review', makeReview('Due'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Initiate');
  });

  it('renders Configuring text when stage is Draft', () => {
    fixture.componentRef.setInput('review', makeReview('Draft'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Configuring');
  });

  it('renders data progress bar for Data Collection stage', () => {
    fixture.componentRef.setInput('review', makeReview('Data Collection'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('ui-progress')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Data');
  });

  it('shows evidence bar for Evidence Collection stage', () => {
    fixture.componentRef.setInput('review', makeReview('Evidence Collection'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Evid');
  });

  it('shows evidence bar for Validation stage', () => {
    fixture.componentRef.setInput('review', makeReview('Validation'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Evid');
  });

  it('shows evidence bar for Approval stage', () => {
    fixture.componentRef.setInput('review', makeReview('Approval'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Evid');
  });

  it('shows evidence bar for Closed stage', () => {
    fixture.componentRef.setInput('review', makeReview('Closed'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Evid');
  });

  it('does not show evidence bar for Data Collection stage', () => {
    fixture.componentRef.setInput('review', makeReview('Data Collection'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Evid');
  });

  it('emits initiate output when Initiate button is clicked', () => {
    fixture.componentRef.setInput('review', makeReview('Due'));
    fixture.detectChanges();
    let emitted = false;
    component.initiate.subscribe(() => (emitted = true));
    fixture.nativeElement.querySelector('button').click();
    expect(emitted).toBe(true);
  });
});
