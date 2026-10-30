import { TestBed } from '@angular/core/testing';
import { ReportingService } from './reporting-old.service';

describe('ReportingService', () => {
  let svc: ReportingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(ReportingService);
  });

  it('programs() returns initial list', () => {
    expect(svc.programs().length).toBeGreaterThan(0);
  });

  it('projects() returns initial list', () => {
    expect(svc.projects().length).toBeGreaterThan(0);
  });

  it('selectedProgram() is null initially', () => {
    expect(svc.selectedProgram()).toBeNull();
  });

  it('selectProgram() sets the selected program', () => {
    const id = svc.programs()[0].id;
    svc.selectProgram(id);
    expect(svc.selectedProgram()?.id).toBe(id);
  });

  it('selectProgram() with null clears selection', () => {
    svc.selectProgram(svc.programs()[0].id);
    svc.selectProgram(null);
    expect(svc.selectedProgram()).toBeNull();
  });

  it('programProjects() returns projects for selected program', () => {
    const prog = svc.programs()[0];
    svc.selectProgram(prog.id);
    const pp = svc.programProjects();
    expect(pp.every(p => p.program === prog.name)).toBe(true);
  });

  it('programProjects() returns all projects when no program selected', () => {
    expect(svc.programProjects().length).toBe(svc.projects().length);
  });
});

describe('aepwMetrics, loading, error', () => {
  let svc: ReportingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    svc = TestBed.inject(ReportingService);
  });

  it('aepwMetrics() returns 5 portfolio-level metrics', () => {
    expect(svc.aepwMetrics().length).toBe(5);
  });

  it('aepwMetrics()[0].l1Metrics is non-empty', () => {
    expect(svc.aepwMetrics()[0].l1Metrics.length).toBeGreaterThan(0);
  });

  it('loading defaults to false', () => {
    expect(svc.loading()).toBe(false);
  });

  it('error defaults to null', () => {
    expect(svc.error()).toBeNull();
  });
});
