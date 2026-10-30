import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProjectsTableComponent } from './projects-table.component';
import { ReportingProject } from '../../models/reporting.modelold';

const MOCK_PROJECTS: ReportingProject[] = [
  {
    pin: 'A003A', title: 'Rethinking Recycling', program: 'Indonesia',
    pm: 'Paola Chabrol', status: 'Closed',
    metrics: [
      { code: 'MW1.1', name: 'Total waste', reported: 1121, riskAdjusted: 784.7, unit: 'tonnes', yoyChange: 55, l1Metrics: [] },
    ],
  },
  {
    pin: 'J020', title: 'Cidades+', program: 'Brazil',
    pm: 'Marina Rossi', status: 'Implementation',
    metrics: [],
  },
];

describe('ProjectsTableComponent', () => {
  let fixture: ComponentFixture<ProjectsTableComponent>;
  let component: ProjectsTableComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports:   [ProjectsTableComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture   = TestBed.createComponent(ProjectsTableComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('projects', MOCK_PROJECTS);
    fixture.detectChanges();
  });

  it('renders one row per project', () => {
    const rows = fixture.nativeElement.querySelectorAll('[data-project-row]');
    expect(rows.length).toBe(2);
  });

  it('clicking a row emits projectSelected with that project pin', () => {
    let emitted: string | undefined;
    component.projectSelected.subscribe((pin: string) => (emitted = pin));
    fixture.nativeElement.querySelector('[data-project-row="A003A"]').click();
    expect(emitted).toBe('A003A');
  });

  it('status badge renders the status field text', () => {
    const row = fixture.nativeElement.querySelector('[data-project-row="A003A"]');
    expect(row?.textContent).toContain('Closed');
  });
});
