import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ReviewHeaderComponent } from './review-header.component';
import { ReviewListDto, ReviewDetail } from '../../../models/review.model';

const MOCK_DETAIL: ReviewDetail = {
  reviewId:    1,
  projectId:   1,
  projectName: 'Project Hydra',
  periodCode:  'Q3 2025',
  stage:       'Evidence Collection',
  metrics:     [],
  comments:    [],
};

const MOCK_REVIEW: ReviewListDto = {
  reviewId:             1,
  projectId:            1,
  project:              'Project Hydra',
  pm:                   'Sarah Chen',
  recipient:            'Budi Santoso',
  stage:                'Evidence Collection',
  dataCompletionPct:    100,
  evidenceConfirmedPct: 72,
  updatedAt:            '2025-07-18T14:32:00',
};

describe('ReviewHeaderComponent', () => {
  let fixture: ComponentFixture<ReviewHeaderComponent>;
  let component: ReviewHeaderComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReviewHeaderComponent, RouterTestingModule],
    }).compileComponents();
    fixture = TestBed.createComponent(ReviewHeaderComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('reviewDetail', MOCK_DETAIL);
    fixture.componentRef.setInput('review', MOCK_REVIEW);
    fixture.detectChanges();
  });

  it('renders project name', () => {
    expect(fixture.nativeElement.textContent).toContain('Project Hydra');
  });

  it('renders period', () => {
    expect(fixture.nativeElement.textContent).toContain('Q3 2025');
  });

  it('renders stage badge', () => {
    expect(fixture.nativeElement.textContent).toContain('Evidence Collection');
  });

  it('renders PM name', () => {
    expect(fixture.nativeElement.textContent).toContain('Sarah Chen');
  });

  it('renders derived review ID', () => {
    expect(fixture.nativeElement.textContent).toContain('REV-2025-Q3-1');
  });

  it('renders evidence progress percentage', () => {
    expect(fixture.nativeElement.textContent).toContain('72%');
  });

  it('emits "save-draft" when Save as Draft button is clicked', () => {
    let emitted: string | undefined;
    component.action.subscribe((a) => (emitted = a));
    fixture.nativeElement.querySelector('[data-save-btn]').click();
    expect(emitted).toBe('save-draft');
  });

  it('emits "audit-history" when Audit History button is clicked', () => {
    let emitted: string | undefined;
    component.action.subscribe((a) => (emitted = a));
    fixture.nativeElement.querySelector('[data-audit-btn]').click();
    expect(emitted).toBe('audit-history');
  });

  it('emits "upload-excel" when Upload button is clicked', () => {
    let emitted: string | undefined;
    component.action.subscribe((a) => (emitted = a));
    fixture.nativeElement.querySelector('[data-upload-btn]').click();
    expect(emitted).toBe('upload-excel');
  });
});
