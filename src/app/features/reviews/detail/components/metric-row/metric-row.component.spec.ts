import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MetricRowComponent } from './metric-row.component';
import { MetricRow } from '../../../models/review.model';
import { EvidenceDetailDto } from '../../../../evidence/models/evidence.model';

const makeFile = (id: number, status: 'pending' | 'complete'): EvidenceDetailDto => ({
  evidenceId: id, evidenceTypeId: 1, fileName: `file-${id}.pdf`, evidenceType: 'Report',
  uploadedBy: 'User', uploadedDate: '22 Sep 2025', status,
});

const MOCK_METRIC: MetricRow = {
  reviewMetricId: 1, metricId: 1,
  metricCode: 'MW1.11', metricName: 'Plastic waste diverted',
  categoryCode: 'MW', unit: 'tonnes', reportedValue: '1,250',
  pmStatus: 'Approved', reviewStatus: 'Pending', leadStatus: 'Pending',
  parentCode: 'MW1.1',
  evidenceUploaded: 1, evidenceRequired: 3,
  evidenceFiles: [makeFile(1, 'pending')],
};

const TOP_LEVEL_METRIC: MetricRow = {
  reviewMetricId: 2, metricId: 2,
  metricCode: 'MW1.1', metricName: 'Total plastic waste managed',
  categoryCode: 'MW', unit: 'tonnes', reportedValue: '2,500',
  pmStatus: 'Approved', reviewStatus: 'Approved', leadStatus: 'Pending',
  isTopLevel: true,
  evidenceUploaded: 0, evidenceRequired: 0,
  evidenceFiles: [],
};

const WARNED_METRIC: MetricRow = {
  ...MOCK_METRIC,
  validationWarning: 'Value exceeds expected range',
};

describe('MetricRowComponent', () => {
  let fixture: ComponentFixture<MetricRowComponent>;
  let component: MetricRowComponent;

  const create = async (metric = MOCK_METRIC, expanded = false) => {
    await TestBed.configureTestingModule({
      imports: [MetricRowComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(MetricRowComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('metric', metric);
    fixture.componentRef.setInput('isExpanded', expanded);
    fixture.detectChanges();
  };

  it('hides evidence section when isExpanded is false', async () => {
    await create(MOCK_METRIC, false);
    expect(fixture.nativeElement.querySelector('[data-evidence-section]')).toBeNull();
  });

  it('shows evidence section when isExpanded is true', async () => {
    await create(MOCK_METRIC, true);
    expect(fixture.nativeElement.querySelector('[data-evidence-section]')).not.toBeNull();
  });

  it('does not show evidence section for top-level metric even when expanded', async () => {
    await create(TOP_LEVEL_METRIC, true);
    expect(fixture.nativeElement.querySelector('[data-evidence-section]')).toBeNull();
  });

  it('emits toggle when header button is clicked on non-top-level metric', async () => {
    await create();
    let toggled = false;
    component.toggle.subscribe(() => (toggled = true));
    fixture.nativeElement.querySelector('[data-header]').click();
    expect(toggled).toBe(true);
  });

  it('shows validation warning when metric has validationWarning', async () => {
    await create(WARNED_METRIC);
    expect(fixture.nativeElement.querySelector('[data-flagged]')).not.toBeNull();
  });

  it('does not show validation warning when metric has no validationWarning', async () => {
    await create(MOCK_METRIC);
    expect(fixture.nativeElement.querySelector('[data-flagged]')).toBeNull();
  });

  it('renders metric code and reported value', async () => {
    await create();
    expect(fixture.nativeElement.textContent).toContain('MW1.11');
    expect(fixture.nativeElement.textContent).toContain('1,250');
  });

  it('shows "= sum of L1 metrics" label for top-level metric', async () => {
    await create(TOP_LEVEL_METRIC);
    expect(fixture.nativeElement.textContent).toContain('= sum of L1 metrics');
  });

  it('renders evidence badge with uploaded/required ratio', async () => {
    await create(MOCK_METRIC);
    expect(fixture.nativeElement.textContent).toContain('1/3');
  });
});
