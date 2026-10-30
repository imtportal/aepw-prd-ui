import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ApprovalSectionComponent } from './approval-section.component';
import { ReviewItem } from '../../../models/review.model';
import { ApprovalStepId } from '../../review-detail.types';

const MOCK_ITEM: ReviewItem = {
  reviewId:    1,
  projectId:   1,
  projectName: 'Test Project',
  periodCode:  'Q3 2025',
  currentApprovalStage: 'Reviewer',
  pm: 'Sarah Chen',
  reviewer: 'James Wright',
  leadReviewer: 'Priya Sharma',
  finalApprover: 'Michael Torres',
  pmStatus: 'Approved',
  reviewerStatus: 'Pending',
  leadStatus: 'Pending',
  finalStatus: 'Pending',
  totalMetrics: 12,
  approvedMetrics: 6,
  rejectedMetrics: 1,
  recycledMetrics: 1,
  materialFlags: 3,
  evidenceComplete: false,
  lastActivity: '22 Sep 14:32',
};

describe('ApprovalSectionComponent', () => {
  let fixture: ComponentFixture<ApprovalSectionComponent>;
  let component: ApprovalSectionComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApprovalSectionComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ApprovalSectionComponent);
    component = fixture.componentInstance;
  });

  it('renders 4 step labels', () => {
    fixture.componentRef.setInput('reviewItem', MOCK_ITEM);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('PM Review');
    expect(text).toContain('Reviewer');
    expect(text).toContain('Lead Reviewer');
    expect(text).toContain('Final Approval');
  });

  it('shows action buttons only for the active step (Reviewer)', () => {
    fixture.componentRef.setInput('reviewItem', MOCK_ITEM);
    fixture.detectChanges();
    const actionSections = fixture.nativeElement.querySelectorAll('[data-action-buttons]');
    expect(actionSections.length).toBe(1);
  });

  it('emits "reviewerStatus" on approve output when Approve clicked', () => {
    fixture.componentRef.setInput('reviewItem', MOCK_ITEM);
    fixture.detectChanges();
    let emitted: ApprovalStepId | undefined;
    component.approve.subscribe((s: ApprovalStepId) => (emitted = s));
    fixture.nativeElement.querySelector('[data-approve-btn]').click();
    expect(emitted).toBe('reviewerStatus');
  });

  it('emits "reviewerStatus" on reject output when Reject clicked', () => {
    fixture.componentRef.setInput('reviewItem', MOCK_ITEM);
    fixture.detectChanges();
    let emitted: ApprovalStepId | undefined;
    component.reject.subscribe((s: ApprovalStepId) => (emitted = s));
    fixture.nativeElement.querySelector('[data-reject-btn]').click();
    expect(emitted).toBe('reviewerStatus');
  });

  it('emits "reviewerStatus" on recycle output when Recycle clicked', () => {
    fixture.componentRef.setInput('reviewItem', MOCK_ITEM);
    fixture.detectChanges();
    let emitted: ApprovalStepId | undefined;
    component.recycle.subscribe((s: ApprovalStepId) => (emitted = s));
    fixture.nativeElement.querySelector('[data-recycle-btn]').click();
    expect(emitted).toBe('reviewerStatus');
  });

  it('renders "No approval record found" when reviewItem is null', () => {
    fixture.componentRef.setInput('reviewItem', null);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No approval record found');
  });
});
