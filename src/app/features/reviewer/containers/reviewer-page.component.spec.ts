import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ReviewerPageComponent } from './reviewer-page.component';
import { ReviewService } from '../../reviews/services/review.service';
import { CurrentUserService, CurrentUser } from '../../../core/services/current-user.service';
import { ReviewItem } from '../../reviews/models/review.model';

const MOCK_QUEUE: ReviewItem[] = [
  {
    projectId: 'AEPW-001',
    projectName: 'Alpha',
    period: 'Q3 2025',
    currentApprovalStage: 'PM Review',
    pm: 'Alice',
    reviewer: 'Bob',
    leadReviewer: 'Carol',
    finalApprover: 'Dave',
    pmStatus: 'Pending',
    reviewerStatus: 'Pending',
    leadStatus: 'Pending',
    finalStatus: 'Pending',
    totalMetrics: 10,
    approvedMetrics: 7,
    rejectedMetrics: 2,
    recycledMetrics: 0,
    materialFlags: 3,
    evidenceComplete: true,
    lastActivity: '2025-09-01',
  },
  {
    projectId: 'AEPW-002',
    projectName: 'Beta',
    period: 'Q3 2025',
    currentApprovalStage: 'Reviewer',
    pm: 'Eve',
    reviewer: 'Frank',
    leadReviewer: 'Grace',
    finalApprover: 'Henry',
    pmStatus: 'Approved',
    reviewerStatus: 'Pending',
    leadStatus: 'Pending',
    finalStatus: 'Pending',
    totalMetrics: 5,
    approvedMetrics: 5,
    rejectedMetrics: 0,
    recycledMetrics: 0,
    materialFlags: 0,
    evidenceComplete: true,
    lastActivity: '2025-09-02',
  },
];

const MOCK_USER: CurrentUser = {
  id: 'u1',
  name: 'Sarah Chen',
  email: 's@aepw.org',
  initials: 'SC',
};

describe('ReviewerPageComponent', () => {
  let fixture: ComponentFixture<ReviewerPageComponent>;
  let component: ReviewerPageComponent;

  const queueSig = signal<ReviewItem[]>(MOCK_QUEUE);
  const updateApprovalStepFn = vi.fn();

  const fakeReviewSvc = {
    loading: signal(false),
    error: signal<string | null>(null),
    reviewerQueue: queueSig.asReadonly(),
    updateApprovalStep: updateApprovalStepFn,
  };

  const fakeUserSvc = {
    currentUser: signal<CurrentUser>(MOCK_USER),
  };

  beforeEach(async () => {
    updateApprovalStepFn.mockClear();

    await TestBed.configureTestingModule({
      imports: [ReviewerPageComponent],
      providers: [
        { provide: ReviewService, useValue: fakeReviewSvc },
        { provide: CurrentUserService, useValue: fakeUserSvc },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReviewerPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders data-welcome with current user name', () => {
    const el = fixture.nativeElement.querySelector('[data-welcome]');
    expect(el.textContent).toContain('Sarah Chen');
  });

  it('pendingMetricsCount() sums (totalMetrics - approvedMetrics) across queue', () => {
    // AEPW-001: 10-7=3, AEPW-002: 5-5=0 → total 3
    expect(component.pendingMetricsCount()).toBe(3);
  });

  it('materialFlagsCount() counts items where materialFlags > 0', () => {
    // Only AEPW-001 has materialFlags=3 > 0
    expect(component.materialFlagsCount()).toBe(1);
  });

  it('rejectionsCount() sums rejectedMetrics across queue', () => {
    // AEPW-001: 2, AEPW-002: 0 → total 2
    expect(component.rejectionsCount()).toBe(2);
  });

  it('queueTabs() returns 4 tabs with correct count per stage', () => {
    const tabs = component.queueTabs();
    expect(tabs.length).toBe(4);
    expect(tabs.find((t) => t.id === 'PM Review')!.count).toBe(1);
    expect(tabs.find((t) => t.id === 'Reviewer')!.count).toBe(1);
    expect(tabs.find((t) => t.id === 'Lead Reviewer')!.count).toBe(0);
    expect(tabs.find((t) => t.id === 'Final Approval')!.count).toBe(0);
  });

  it('tabItems() filters queue by selectedTab()', () => {
    component.setTab('PM Review');
    fixture.detectChanges();
    expect(component.tabItems().length).toBe(1);
    expect(component.tabItems()[0].projectId).toBe('AEPW-001');
  });

  it('setTab("Reviewer") updates selectedTab()', () => {
    component.setTab('Reviewer');
    expect(component.selectedTab()).toBe('Reviewer');
  });

  it('onApprove calls updateApprovalStep with pmStatus for PM Review stage', () => {
    component.onApprove('AEPW-001');
    expect(updateApprovalStepFn).toHaveBeenCalledWith('AEPW-001', 'pmStatus', 'approved');
  });

  it('onReject calls updateApprovalStep with pmStatus for PM Review stage', () => {
    component.onReject('AEPW-001');
    expect(updateApprovalStepFn).toHaveBeenCalledWith('AEPW-001', 'pmStatus', 'rejected');
  });

  it('onRecycle calls updateApprovalStep with pmStatus for PM Review stage', () => {
    component.onRecycle('AEPW-001');
    expect(updateApprovalStepFn).toHaveBeenCalledWith('AEPW-001', 'pmStatus', 'recycled');
  });

  it('onApprove for Reviewer-stage item uses reviewerStatus', () => {
    component.onApprove('AEPW-002');
    expect(updateApprovalStepFn).toHaveBeenCalledWith('AEPW-002', 'reviewerStatus', 'approved');
  });

  it('data-empty shown when tabItems() is empty', () => {
    component.setTab('Lead Reviewer');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-empty]')).toBeTruthy();
  });

  it('data-loading shown when loading() is true', () => {
    fakeReviewSvc.loading.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-loading]')).toBeTruthy();
    fakeReviewSvc.loading.set(false);
  });

  it('data-error shown when error() is non-null', () => {
    fakeReviewSvc.error.set('Network error');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-error]')).toBeTruthy();
    fakeReviewSvc.error.set(null);
  });
});
