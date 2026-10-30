import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { computed, signal } from '@angular/core';
import { ReportingPageComponent } from './reporting-page.component';
import { ReportingService } from '../services/reporting-old.service';
import { Program, ReportingProject, TopLevelMetric } from '../models/reporting.modelold';

const MOCK_AEPW: TopLevelMetric[] = [
  { code: 'MW1.1', name: 'MW test', reported: 2409.7, riskAdjusted: 1768.2, unit: 'tonnes', yoyChange: 18, l1Metrics: [] },
  { code: 'CV1.1', name: 'CV test', reported: 13088, riskAdjusted: 12339, unit: 'tonnes',   yoyChange: 42, l1Metrics: [] },
  { code: 'EE1.1', name: 'EE test', reported: 214,   riskAdjusted: 197,   unit: 'count',    yoyChange: 8,  l1Metrics: [] },
  { code: 'SB1.1', name: 'SB test', reported: 1063196, riskAdjusted: 891378, unit: 'people', yoyChange: 35, l1Metrics: [] },
  { code: 'MC1.1', name: 'MC test', reported: 85.4,  riskAdjusted: 78.2,  unit: 'USD millions', yoyChange: 22, l1Metrics: [] },
];

const MOCK_PROGRAMS: Program[] = [
  {
    id: 'indonesia', name: 'Indonesia', region: 'Asia Pacific', projectCount: 2, lat: -2.5, lng: 118,
    metrics: [
      { code: 'MW1.1', name: 'MW', reported: 1121, riskAdjusted: 784.7, unit: 'tonnes', yoyChange: 55, l1Metrics: [] },
    ],
  },
];

const MOCK_PROJECTS: ReportingProject[] = [
  { pin: 'A003A', title: 'Test Project', program: 'Indonesia', pm: 'PM', status: 'Closed', metrics: [] },
];

describe('ReportingPageComponent', () => {
  let fixture:   ComponentFixture<ReportingPageComponent>;
  let component: ReportingPageComponent;

  const selectedIdSig = signal<string | null>(null);

  const fakeReportingSvc = {
    programs:        signal(MOCK_PROGRAMS),
    projects:        signal(MOCK_PROJECTS),
    aepwMetrics:     signal(MOCK_AEPW),
    programProjects: signal(MOCK_PROJECTS),
    selectedProgram: computed(() => {
      const id = selectedIdSig();
      return id ? (MOCK_PROGRAMS.find(p => p.id === id) ?? null) : null;
    }),
    loading:         signal(false),
    error:           signal<string | null>(null),
    selectProgram:   vi.fn((id: string | null) => selectedIdSig.set(id)),
    yoyData:         [],
    pieData:         [],
  };

  beforeEach(async () => {
    fakeReportingSvc.selectProgram.mockClear();

    await TestBed.configureTestingModule({
      imports:   [ReportingPageComponent],
      providers: [
        provideRouter([]),
        { provide: ReportingService, useValue: fakeReportingSvc },
      ],
    }).compileComponents();

    fixture   = TestBed.createComponent(ReportingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('AEPW level: renders 5 data-metric-card elements', () => {
    const cards = fixture.nativeElement.querySelectorAll('[data-metric-card]');
    expect(cards.length).toBe(5);
  });

  it('category filter "MW" reduces metric cards to 1', () => {
    component.onCategoryChange('MW');
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('[data-metric-card]');
    expect(cards.length).toBe(1);
  });

  it('onSelectProgram("indonesia") sets drillLevel to "program"', () => {
    component.onSelectProgram('indonesia');
    fixture.detectChanges();
    expect(component.drillLevel()).toBe('program');
    expect(fixture.nativeElement.querySelector('[data-drill-program]')).toBeTruthy();
  });

  it('onSelectProject("A003A") sets drillLevel to "project"', () => {
    component.onSelectProgram('indonesia');
    component.onSelectProject('A003A');
    fixture.detectChanges();
    expect(component.drillLevel()).toBe('project');
    expect(fixture.nativeElement.querySelector('[data-drill-project]')).toBeTruthy();
  });

  it('onNavigateBack() from project returns to program', () => {
    component.onSelectProgram('indonesia');
    component.onSelectProject('A003A');
    component.onNavigateBack();
    expect(component.drillLevel()).toBe('program');
  });

  it('onNavigateBack() from program returns to aepw', () => {
    component.onSelectProgram('indonesia');
    component.onNavigateBack();
    expect(component.drillLevel()).toBe('aepw');
  });

  it('onNavigateToAepw() from project resets to aepw', () => {
    component.onSelectProgram('indonesia');
    component.onSelectProject('A003A');
    component.onNavigateToAepw();
    expect(component.drillLevel()).toBe('aepw');
  });

  it('onToggleMetric adds code to expandedCodes()', () => {
    component.onToggleMetric('MW1.1');
    expect(component.expandedCodes()).toContain('MW1.1');
  });

  it('onToggleMetric again removes code from expandedCodes()', () => {
    component.onToggleMetric('MW1.1');
    component.onToggleMetric('MW1.1');
    expect(component.expandedCodes()).not.toContain('MW1.1');
  });

  it('PBI panels data-pbi-yoy and data-pbi-pie present only at aepw level', () => {
    expect(fixture.nativeElement.querySelector('[data-pbi-yoy]')).toBeTruthy();
    component.onSelectProgram('indonesia');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-pbi-yoy]')).toBeFalsy();
  });

  it('programs table present only at aepw level', () => {
    expect(fixture.nativeElement.querySelector('app-programs-table')).toBeTruthy();
    component.onSelectProgram('indonesia');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-programs-table')).toBeFalsy();
  });

  it('projects table present only at program level', () => {
    expect(fixture.nativeElement.querySelector('app-projects-table')).toBeFalsy();
    component.onSelectProgram('indonesia');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-projects-table')).toBeTruthy();
  });

  it('data-project-summary present only at project level', () => {
    expect(fixture.nativeElement.querySelector('[data-project-summary]')).toBeFalsy();
    component.onSelectProgram('indonesia');
    component.onSelectProject('A003A');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-project-summary]')).toBeTruthy();
  });
});
