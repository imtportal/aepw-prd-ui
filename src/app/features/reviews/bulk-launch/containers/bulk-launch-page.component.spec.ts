import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { BulkLaunchPageComponent } from './bulk-launch-page.component';
import { ProjectService } from '../../../admin/services/project.service';
import { ReviewService } from '../../services/review.service';
import { BulkProject } from '../../../admin/models/project.model';
import { MetricRow } from '../../models/review.model';

const MOCK_BULK: BulkProject[] = [
  {
    projectId:        'AEPW-001',
    projectName:      'Alpha Project',
    program:          'Program A',
    region:           'APAC',
    pm:               'Alice',
    fundingRecipient: { name: 'FR1', organization: 'Org1', email: 'fr@org.com' },
    metricConfig: [
      { code: 'MW01', enabled: true,  riskFactor: 10, optional: false },
      { code: 'MW02', enabled: false, riskFactor: 5,  optional: true  },
    ],
    lastReviewStatus: 'Completed',
    status: 'Active',
  },
  {
    projectId:        'AEPW-002',
    projectName:      'Beta Project',
    program:          'Program B',
    region:           'EMEA',
    pm:               'Bob',
    fundingRecipient: { name: 'FR2', organization: 'Org2', email: 'fr2@org.com' },
    metricConfig: [
      { code: 'CV01', enabled: true, riskFactor: 15, optional: false },
      { code: 'CV02', enabled: true, riskFactor: 8,  optional: false },
    ],
    lastReviewStatus: 'In Progress',
    status: 'Active',
  },
  {
    projectId:        'AEPW-003',
    projectName:      'Gamma Project',
    program:          'Program C',
    region:           'APAC',
    pm:               'Carol',
    fundingRecipient: { name: 'FR3', organization: 'Org3', email: 'fr3@org.com' },
    metricConfig: [
      { code: 'EE01', enabled: true, riskFactor: 12, optional: false },
    ],
    lastReviewStatus: 'Not Started',
    status: 'Paused',
  },
];

const MOCK_METRICS: MetricRow[] = [
  {
    metricCode: 'MW01', metricName: 'Metric One', categoryCode: 'MW',
    unit: 'tonnes', reportedValue: '100',
    pmStatus: 'Pending', reviewStatus: 'Pending', leadStatus: 'Pending',
    evidenceUploaded: 0, evidenceRequired: 1, evidenceFiles: [],
  },
];

describe('BulkLaunchPageComponent', () => {
  let fixture:   ComponentFixture<BulkLaunchPageComponent>;
  let component: BulkLaunchPageComponent;
  let router:    Router;

  const bulkSig      = signal<BulkProject[]>(MOCK_BULK);
  const bulkLaunchFn = vi.fn();
  const getDetailFn  = vi.fn().mockReturnValue(null);

  const fakeProjectSvc = {
    bulkProjects: bulkSig.asReadonly(),
    projects:     signal([]).asReadonly(),
    getProject:   vi.fn().mockReturnValue(null),
  };

  const fakeReviewSvc = {
    loading:         signal(false),
    error:           signal<string | null>(null),
    getReviewDetail: getDetailFn,
    bulkLaunch:      bulkLaunchFn,
  };

  beforeEach(async () => {
    bulkLaunchFn.mockClear();
    getDetailFn.mockReturnValue(null);

    await TestBed.configureTestingModule({
      imports:   [BulkLaunchPageComponent],
      providers: [
        provideRouter([]),
        { provide: ProjectService, useValue: fakeProjectSvc },
        { provide: ReviewService,  useValue: fakeReviewSvc  },
      ],
    }).compileComponents();

    router    = TestBed.inject(Router);
    fixture   = TestBed.createComponent(BulkLaunchPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders one row per bulk project', () => {
    const rows = fixture.nativeElement.querySelectorAll('[data-project-row]');
    expect(rows.length).toBe(3);
  });

  it('filters by search query after 300 ms debounce', async () => {
    vi.useFakeTimers();
    component.onSearchInput({ target: { value: 'Alpha' } } as any);
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(300);
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('[data-project-row]');
    expect(rows.length).toBe(1);
    vi.useRealTimers();
  });

  it('does not filter before 300 ms debounce fires', async () => {
    vi.useFakeTimers();
    component.onSearchInput({ target: { value: 'Alpha' } } as any);
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(299);
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('[data-project-row]');
    expect(rows.length).toBe(3);
    vi.useRealTimers();
  });

  it('filters by status', () => {
    component.filterStatus.set('Paused');
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('[data-project-row]');
    expect(rows.length).toBe(1);
  });

  it('toggleSelect adds ID as new Set reference', () => {
    const before = component.selectedIds();
    component.toggleSelect('AEPW-001');
    const after = component.selectedIds();
    expect(before).not.toBe(after);
    expect(after.has('AEPW-001')).toBe(true);
  });

  it('toggleSelect on already-selected ID removes it as new Set reference', () => {
    component.toggleSelect('AEPW-001');
    const mid = component.selectedIds();
    component.toggleSelect('AEPW-001');
    const after = component.selectedIds();
    expect(after).not.toBe(mid);
    expect(after.has('AEPW-001')).toBe(false);
  });

  it('toggleSelectAll selects all filtered projects', () => {
    component.toggleSelectAll();
    expect(component.selectedIds().size).toBe(3);
  });

  it('toggleSelectAll when all selected deselects all', () => {
    component.toggleSelectAll();
    component.toggleSelectAll();
    expect(component.selectedIds().size).toBe(0);
  });

  it('allSelected() is false on partial selection', () => {
    component.toggleSelect('AEPW-001');
    fixture.detectChanges();
    expect(component.allSelected()).toBe(false);
  });

  it('selectedTotalMetrics() sums enabled metrics across selected projects', () => {
    // AEPW-001: 1 enabled (MW01), AEPW-002: 2 enabled (CV01, CV02)
    component.toggleSelect('AEPW-001');
    component.toggleSelect('AEPW-002');
    fixture.detectChanges();
    expect(component.selectedTotalMetrics()).toBe(3);
  });

  it('data-launch-btn is disabled when no projects selected', () => {
    const btn = fixture.nativeElement.querySelector('[data-launch-btn]');
    expect(btn.disabled).toBe(true);
  });

  it('onLaunch() calls reviewSvc.bulkLaunch with selected IDs and navigates to /reviews', async () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component.toggleSelect('AEPW-001');
    fixture.detectChanges();
    component.onLaunch();
    expect(bulkLaunchFn).toHaveBeenCalledWith(['AEPW-001']);
    expect(navigateSpy).toHaveBeenCalledWith(['/reviews']);
  });

  it('hasUnsavedChanges() returns true when selection is non-empty', () => {
    component.toggleSelect('AEPW-001');
    expect(component.hasUnsavedChanges()).toBe(true);
  });

  it('hasUnsavedChanges() returns false with empty selection', () => {
    expect(component.hasUnsavedChanges()).toBe(false);
  });

  it('openConfig sets configProjectId and sheetOpen', () => {
    component.openConfig('AEPW-001');
    expect(component.configProjectId()).toBe('AEPW-001');
    expect(component.sheetOpen()).toBe(true);
  });

  it('configMetrics() returns metrics from getReviewDetail for configProjectId', () => {
    getDetailFn.mockReturnValue({ metrics: MOCK_METRICS });
    component.openConfig('AEPW-001');
    fixture.detectChanges();
    expect(component.configMetrics()).toEqual(MOCK_METRICS);
  });

  it('data-empty shown when filteredProjects() is empty', async () => {
    vi.useFakeTimers();
    component.onSearchInput({ target: { value: 'ZZZZZ-NO-MATCH' } } as any);
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(300);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-empty]')).toBeTruthy();
    vi.useRealTimers();
  });
});
