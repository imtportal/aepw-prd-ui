import { ComponentFixture, TestBed } from '@angular/core/testing';
import { L1BreakdownTableComponent } from './l1-breakdown-table.component';
import { TopLevelMetric } from '../../models/reporting.modelold';

const MOCK_METRICS: TopLevelMetric[] = [
  {
    code: 'MW1.1', name: 'Total waste', reported: 2409.7, riskAdjusted: 1768.2,
    unit: 'tonnes', yoyChange: 18,
    l1Metrics: [
      { code: 'MW1.11', name: 'Controlled landfill', reported: 113, riskAdjusted: 101.7, unit: 'tonnes' },
      { code: 'EE1.11', name: 'Policy advocacy',     reported: 73,  riskAdjusted: 70,    unit: 'count', isCorporate: true },
    ],
  },
  {
    code: 'CV1.1', name: 'CV waste', reported: 572, riskAdjusted: 400,
    unit: 'tonnes', yoyChange: 10,
    l1Metrics: [
      { code: 'CV1.10', name: 'Uncategorised', reported: 100, riskAdjusted: 90, unit: 'tonnes' },
    ],
  },
];

describe('L1BreakdownTableComponent', () => {
  let fixture: ComponentFixture<L1BreakdownTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [L1BreakdownTableComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(L1BreakdownTableComponent);
    fixture.componentRef.setInput('metrics', MOCK_METRICS);
    fixture.componentRef.setInput('expandedCodes', ['MW1.1']);
    fixture.detectChanges();
  });

  it('renders one row per L1 metric across all expanded top-level metrics', () => {
    // MW1.1 expanded → 2 L1 rows
    const rows = fixture.nativeElement.querySelectorAll('[data-l1-table] tbody tr');
    expect(rows.length).toBe(2);
  });

  it('data-corp-badge present on isCorporate rows', () => {
    expect(fixture.nativeElement.querySelector('[data-corp-badge]')).toBeTruthy();
  });

  it('renders no rows when expandedCodes is empty', () => {
    fixture.componentRef.setInput('expandedCodes', []);
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('[data-l1-table] tbody tr');
    expect(rows.length).toBe(0);
  });
});
