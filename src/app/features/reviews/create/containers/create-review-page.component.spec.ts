import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { CreateReviewPageComponent } from './create-review-page.component';
import { ProjectService } from '../../../admin/services/project.service';
import { MetricService } from '../../../admin/services/metric.service';
import { ReviewService } from '../../services/review.service';
import { Project } from '../../../admin/models/project.model';
import { Metric } from '../../../admin/models/metric.model';

const MOCK_PROJECTS: Project[] = [
  {
    projectId:          1,
    pin:                '2023-0042',
    title:              'Project Hydra - Southeast Asia',
    programId:          1,
    fundingRecipientId: 1,
    pmUserId:           1,
    status:             'Active',
    startDate:          '2023-01-15',
    reportingFrequency: 'Quarterly',
    createdBy:          1,
    createdOnUtc:       '2023-01-15',
    rowVersion:         'AAAAAAAAAAM=',
  },
];

const MOCK_METRICS: Metric[] = [
  {
    metricId: 1, code: 'MW1.11', name: 'Plastic waste diverted', description: null,
    categoryId: 1, unit: 'tonnes', isTopLevel: false, parentMetricId: null,
    isCorporate: false, defaultRiskPct: 15, evidenceRequiredMin: 5, isActive: true,
    effectiveFromUtc: null, createdBy: 1, createdOnUtc: '2023-01-01',
    updatedBy: null, updatedOnUtc: null, rowVersion: 'AAA=',
  },
  {
    metricId: 2, code: 'MW1.12', name: 'Plastic waste recycled', description: null,
    categoryId: 1, unit: 'tonnes', isTopLevel: false, parentMetricId: null,
    isCorporate: false, defaultRiskPct: 15, evidenceRequiredMin: 4, isActive: true,
    effectiveFromUtc: null, createdBy: 1, createdOnUtc: '2023-01-01',
    updatedBy: null, updatedOnUtc: null, rowVersion: 'AAA=',
  },
  {
    metricId: 3, code: 'CV1.1', name: 'Revenue', description: null,
    categoryId: 2, unit: 'USD', isTopLevel: false, parentMetricId: null,
    isCorporate: false, defaultRiskPct: 10, evidenceRequiredMin: 3, isActive: true,
    effectiveFromUtc: null, createdBy: 1, createdOnUtc: '2023-01-01',
    updatedBy: null, updatedOnUtc: null, rowVersion: 'AAA=',
  },
  {
    metricId: 4, code: 'EE1.99', name: 'Inactive metric', description: null,
    categoryId: 3, unit: 'count', isTopLevel: false, parentMetricId: null,
    isCorporate: false, defaultRiskPct: 5, evidenceRequiredMin: 1, isActive: false,
    effectiveFromUtc: null, createdBy: 1, createdOnUtc: '2023-01-01',
    updatedBy: null, updatedOnUtc: null, rowVersion: 'AAA=',
  },
];

describe('CreateReviewPageComponent', () => {
  let fixture:   ComponentFixture<CreateReviewPageComponent>;
  let component: CreateReviewPageComponent;
  let router:    Router;

  const projectsSig    = signal<Project[]>(MOCK_PROJECTS);
  const metricsSig     = signal<Metric[]>(MOCK_METRICS);
  const createReviewFn = vi.fn().mockReturnValue(1);

  const fakeProjectSvc = {
    projects:      projectsSig.asReadonly(),
    getProject:    vi.fn().mockImplementation((id: number) =>
      MOCK_PROJECTS.find(p => p.projectId === id) ?? null
    ),
    getAllProjects: vi.fn().mockReturnValue(of({ success: true, data: MOCK_PROJECTS })),
  };

  const fakeMetricSvc = {
    metrics: metricsSig.asReadonly(),
  };

  const fakeReviewSvc = {
    loading:      signal(false),
    error:        signal<string | null>(null),
    createReview: createReviewFn,
  };

  beforeEach(async () => {
    createReviewFn.mockClear();
    createReviewFn.mockReturnValue(1);

    await TestBed.configureTestingModule({
      imports:   [CreateReviewPageComponent],
      providers: [
        provideRouter([]),
        { provide: ProjectService, useValue: fakeProjectSvc },
        { provide: MetricService,  useValue: fakeMetricSvc  },
        { provide: ReviewService,  useValue: fakeReviewSvc  },
      ],
    }).compileComponents();

    router    = TestBed.inject(Router);
    fixture   = TestBed.createComponent(CreateReviewPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('step 0 visible initially ([data-step-0] in DOM, others absent)', () => {
    expect(fixture.nativeElement.querySelector('[data-step-0]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-step-1]')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('[data-step-2]')).toBeFalsy();
    expect(fixture.nativeElement.querySelector('[data-step-3]')).toBeFalsy();
  });

  it('canProceedStep0() is false when selectedProjectId() is null', () => {
    expect(component.canProceedStep0()).toBe(false);
  });

  it('canProceedStep0() is true after selectedProjectId is set', () => {
    component.selectedProjectId.set('2023-0042');
    expect(component.canProceedStep0()).toBe(true);
  });

  it('data-next-btn is disabled on step 0 when canProceedStep0() is false', () => {
    const btn = fixture.nativeElement.querySelector('[data-next-btn]');
    expect(btn.disabled).toBe(true);
  });

  it('goNext() from step 0 advances to step 1 when canProceedStep0() is true', () => {
    component.selectedProjectId.set('2023-0042');
    component.goNext();
    fixture.detectChanges();
    expect(component.currentStep()).toBe(1);
    expect(fixture.nativeElement.querySelector('[data-step-1]')).toBeTruthy();
  });

  it('goBack() from step 1 returns to step 0', () => {
    component.selectedProjectId.set('2023-0042');
    component.goNext();
    component.goBack();
    expect(component.currentStep()).toBe(0);
  });

  it('metricsByCategory() groups active metrics by categoryId, excludes inactive', () => {
    const map = component.metricsByCategory();
    expect(map.has(1)).toBe(true);   // MW = categoryId 1
    expect(map.has(2)).toBe(true);   // CV = categoryId 2
    expect(map.has(3)).toBe(false);  // EE = categoryId 3, inactive metric excluded
    expect(map.get(1)!.length).toBe(2);
  });

  it('onToggleCode("MW1.11") adds code to selectedCodes() as new Set reference', () => {
    const before = component.selectedCodes();
    component.onToggleCode('MW1.11');
    const after = component.selectedCodes();
    expect(before).not.toBe(after);
    expect(after.has('MW1.11')).toBe(true);
  });

  it('onToggleCode("MW1.11") again removes code (new Set reference)', () => {
    component.onToggleCode('MW1.11');
    const mid = component.selectedCodes();
    component.onToggleCode('MW1.11');
    const after = component.selectedCodes();
    expect(after).not.toBe(mid);
    expect(after.has('MW1.11')).toBe(false);
  });

  it('selectedMetrics() returns active metrics not in excludedCodes', () => {
    // By default, all active metrics are excluded after construction
    // Removing metrics from excludedCodes makes them appear in selectedMetrics
    component.onToggleExclude('MW1.11');
    component.onToggleExclude('CV1.1');
    const selected = component.selectedMetrics();
    expect(selected.length).toBe(2);
    expect(selected.map(m => m.code).sort()).toEqual(['CV1.1', 'MW1.11']);
  });

  it('onOverrideChange updates riskOverrides()', () => {
    component.onOverrideChange({ code: 'MW1.11', risk: 80, reason: '' });
    expect(component.riskOverrides()['MW1.11']?.risk).toBe(80);
  });

  it('onLaunch() calls reviewSvc.createReview() with correct payload', () => {
    component.selectedProjectId.set('2023-0042');
    component.selectedPeriod.set('Q3 2025');
    component.onOverrideChange({ code: 'MW1.11', risk: 20, reason: '' });
    component.onLaunch();
    expect(createReviewFn).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: '2023-0042',
        period:    'Q3 2025',
      })
    );
  });

  it('onLaunch() sets launched to true', () => {
    component.selectedProjectId.set('2023-0042');
    component.onLaunch();
    expect(component.launched()).toBe(true);
  });

  it('hasUnsavedChanges() returns false at step 0', () => {
    expect(component.hasUnsavedChanges()).toBe(false);
  });

  it('hasUnsavedChanges() returns true at step 1+', () => {
    component.selectedProjectId.set('2023-0042');
    component.goNext();
    expect(component.hasUnsavedChanges()).toBe(true);
  });

  it('data-back-btn is disabled at step 0', () => {
    const btn = fixture.nativeElement.querySelector('[data-back-btn]');
    expect(btn.disabled).toBe(true);
  });
});
