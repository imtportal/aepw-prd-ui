import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProgramsTableComponent } from './programs-table.component';
import { Program } from '../../models/reporting.modelold';

const MOCK_PROGRAMS: Program[] = [
  {
    id: 'indonesia', name: 'Indonesia', region: 'Asia Pacific', projectCount: 2, lat: -2.5, lng: 118,
    metrics: [
      { code: 'MW1.1', name: 'Total waste', reported: 1121, riskAdjusted: 784.7, unit: 'tonnes', yoyChange: 55, l1Metrics: [] },
    ],
  },
  {
    id: 'brazil', name: 'Brazil', region: 'Americas', projectCount: 2, lat: -14, lng: -51,
    metrics: [
      { code: 'MW1.1', name: 'Total waste', reported: 267.7, riskAdjusted: 246.7, unit: 'tonnes', yoyChange: 12, l1Metrics: [] },
    ],
  },
];

describe('ProgramsTableComponent', () => {
  let fixture: ComponentFixture<ProgramsTableComponent>;
  let component: ProgramsTableComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgramsTableComponent],
    }).compileComponents();
    fixture   = TestBed.createComponent(ProgramsTableComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('programs', MOCK_PROGRAMS);
    fixture.detectChanges();
  });

  it('renders one row per program', () => {
    const rows = fixture.nativeElement.querySelectorAll('[data-program-row]');
    expect(rows.length).toBe(2);
  });

  it('clicking a row emits programSelected with that program id', () => {
    let emitted: string | undefined;
    component.programSelected.subscribe((id: string) => (emitted = id));
    fixture.nativeElement.querySelector('[data-program-row="indonesia"]').click();
    expect(emitted).toBe('indonesia');
  });

  it('MW1.1 cell for Indonesia shows "1.1K"', () => {
    const row = fixture.nativeElement.querySelector('[data-program-row="indonesia"]');
    expect(row?.textContent).toContain('1.1K');
  });
});
