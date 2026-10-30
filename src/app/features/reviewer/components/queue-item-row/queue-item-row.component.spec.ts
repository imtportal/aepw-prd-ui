import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QueueItemRowComponent } from './queue-item-row.component';
import { ReviewItem } from '../../../reviews/models/review.model';

const MOCK_ITEM: ReviewItem = {
  projectId:            'AEPW-001',
  projectName:          'Alpha Project',
  period:               'Q3 2025',
  currentApprovalStage: 'PM Review',
  pm:                   'Alice',
  reviewer:             'Bob',
  leadReviewer:         'Carol',
  finalApprover:        'Dave',
  pmStatus:             'Pending',
  reviewerStatus:       'Pending',
  leadStatus:           'Pending',
  finalStatus:          'Pending',
  totalMetrics:         10,
  approvedMetrics:      7,
  rejectedMetrics:      2,
  recycledMetrics:      0,
  materialFlags:        3,
  evidenceComplete:     true,
  lastActivity:         '2025-09-01',
};

describe('QueueItemRowComponent', () => {
  let fixture:   ComponentFixture<QueueItemRowComponent>;
  let component: QueueItemRowComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QueueItemRowComponent],
    }).compileComponents();
    fixture   = TestBed.createComponent(QueueItemRowComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('item', MOCK_ITEM);
    fixture.detectChanges();
  });

  it('renders projectId in [data-queue-row]', () => {
    const row = fixture.nativeElement.querySelector('[data-queue-row]');
    expect(row.textContent).toContain('AEPW-001');
  });

  it('renders projectName', () => {
    expect(fixture.nativeElement.textContent).toContain('Alpha Project');
  });

  it('shows data-flags-badge when materialFlags > 0', () => {
    expect(fixture.nativeElement.querySelector('[data-flags-badge]')).toBeTruthy();
  });

  it('hides data-flags-badge when materialFlags is 0', () => {
    fixture.componentRef.setInput('item', { ...MOCK_ITEM, materialFlags: 0 });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-flags-badge]')).toBeFalsy();
  });

  it('data-approve-btn click emits approve with projectId', () => {
    let emitted: string | undefined;
    component.approve.subscribe((id: string) => (emitted = id));
    fixture.nativeElement.querySelector('[data-approve-btn]').click();
    expect(emitted).toBe('AEPW-001');
  });

  it('data-reject-btn click emits reject with projectId', () => {
    let emitted: string | undefined;
    component.reject.subscribe((id: string) => (emitted = id));
    fixture.nativeElement.querySelector('[data-reject-btn]').click();
    expect(emitted).toBe('AEPW-001');
  });

  it('data-recycle-btn click emits recycle with projectId', () => {
    let emitted: string | undefined;
    component.recycle.subscribe((id: string) => (emitted = id));
    fixture.nativeElement.querySelector('[data-recycle-btn]').click();
    expect(emitted).toBe('AEPW-001');
  });
});
