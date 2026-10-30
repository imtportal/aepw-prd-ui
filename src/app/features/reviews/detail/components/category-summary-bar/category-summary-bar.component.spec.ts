import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CategorySummaryBarComponent } from './category-summary-bar.component';
import { MetricRow } from '../../../models/review.model';
import { EvidenceDetailDto } from '../../../../evidence/models/evidence.model';

const makeFile = (id: number, status: 'pending' | 'complete'): EvidenceDetailDto => ({
  evidenceId: id, evidenceTypeId: 1, fileName: `file-${id}.pdf`, evidenceType: 'Report',
  uploadedBy: 'User', uploadedDate: '1 Sep 2025', status,
});

let _metricId = 0;
const makeMetric = (code: string, evFiles: EvidenceDetailDto[] = [], evidenceRequired = 3): MetricRow => ({
  reviewMetricId: ++_metricId, metricId: _metricId,
  metricCode: code, metricName: code, categoryCode: 'MW', unit: 'u',
  reportedValue: '100',
  pmStatus: 'Approved', reviewStatus: 'Pending', leadStatus: 'Pending',
  evidenceUploaded: evFiles.length,
  evidenceRequired,
  evidenceFiles: evFiles,
});

// MW1: 2 files (1 complete, 1 pending) → evUploaded=2, evRequired=3
// MW2: 1 file (1 complete)             → evUploaded=1, evRequired=3
// MW3: 0 files                          → evUploaded=0, evRequired=3
const METRICS: MetricRow[] = [
  makeMetric('MW1', [makeFile(1, 'complete'), makeFile(2, 'pending')]),
  makeMetric('MW2', [makeFile(3, 'complete')]),
  makeMetric('MW3', []),
];
// Totals: evUploaded=3, evRequired=9, completeFiles=2, totalFiles=3

describe('CategorySummaryBarComponent', () => {
  let fixture: ComponentFixture<CategorySummaryBarComponent>;
  let component: CategorySummaryBarComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategorySummaryBarComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(CategorySummaryBarComponent);
    component = fixture.componentInstance;
  });

  it('renders metric count', () => {
    fixture.componentRef.setInput('metrics', METRICS);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('3');
  });

  it('renders evidence uploaded/required', () => {
    fixture.componentRef.setInput('metrics', METRICS);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('3/9');
  });

  it('renders complete files count', () => {
    fixture.componentRef.setInput('metrics', METRICS);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('2/3');
  });

  it('renders zero complete when no evidence files', () => {
    const emptyMetrics = [makeMetric('MW1'), makeMetric('MW2')];
    fixture.componentRef.setInput('metrics', emptyMetrics);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('0/0');
  });

  it('does not render progress bar when evRequired is zero', () => {
    const topLevelOnly: MetricRow[] = [{
      reviewMetricId: 99, metricId: 99,
      metricCode: 'MW1.1', metricName: 'Total', categoryCode: 'MW', unit: 'tonnes',
      reportedValue: '2,500', pmStatus: 'Approved', reviewStatus: 'Pending', leadStatus: 'Pending',
      isTopLevel: true, evidenceUploaded: 0, evidenceRequired: 0, evidenceFiles: [],
    }];
    fixture.componentRef.setInput('metrics', topLevelOnly);
    fixture.detectChanges();
    const progressBar = fixture.nativeElement.querySelector('[style*="width"]');
    expect(progressBar).toBeNull();
  });
});
