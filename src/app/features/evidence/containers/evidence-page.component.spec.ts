import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { EvidencePageComponent } from './evidence-page.component';
import { EvidenceService } from '../services/evidence.service';
import { EvidenceFile } from '../models/evidence.model';

const MOCK_FILES: EvidenceFile[] = [
  { id: 'e1', fileName: 'Challan_A.jpg', fileType: 'image', projectId: 'P1', projectName: 'Hydra',
    period: 'Q3 2025', pm: 'Sarah', metricCode: 'MW1.11', uploadedAt: '22 Sep', uploadedBy: 'Budi',
    status: 'validated', aiConfidence: 98 },
  { id: 'e2', fileName: 'Report_B.pdf', fileType: 'pdf', projectId: 'P2', projectName: 'Circular',
    period: 'Annual 2025', pm: 'Priya', metricCode: 'CV1.11', uploadedAt: '21 Sep', uploadedBy: 'Raj',
    status: 'pending' },
  { id: 'e3', fileName: 'Challan_C.jpg', fileType: 'image', projectId: 'P1', projectName: 'Hydra',
    period: 'Q3 2025', pm: 'Sarah', metricCode: 'MW1.12', uploadedAt: '22 Sep', uploadedBy: 'Budi',
    status: 'needs-review', aiConfidence: 72 },
];

function makeFakeSvc(files = MOCK_FILES) {
  return {
    files:        signal([...files]),
    loading:      signal(false),
    error:        signal<string | null>(null),
    updateStatus: vi.fn(),
    addFile:      vi.fn(),
    getDetailFiles: vi.fn().mockReturnValue([]),
  };
}

describe('EvidencePageComponent', () => {
  let fixture: ComponentFixture<EvidencePageComponent>;
  let component: EvidencePageComponent;
  let fakeSvc: ReturnType<typeof makeFakeSvc>;

  beforeEach(async () => {
    vi.useFakeTimers();
    fakeSvc = makeFakeSvc();
    await TestBed.configureTestingModule({
      imports: [EvidencePageComponent],
      providers: [
        { provide: EvidenceService, useValue: fakeSvc },
        provideRouter([]),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(EvidencePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => vi.useRealTimers());

  it('totalCount reflects full list regardless of filter', () => {
    expect(component.totalCount()).toBe(3);
  });

  it('pendingCount reflects full list', () => {
    expect(component.pendingCount()).toBe(1);
  });

  it('needsReviewCount reflects full list', () => {
    expect(component.needsReviewCount()).toBe(1);
  });

  it('filteredFiles returns all by default', () => {
    expect(component.filteredFiles().length).toBe(3);
  });

  it('filteredFiles filters by status', () => {
    component.onStatusFilterChange('pending');
    expect(component.filteredFiles().length).toBe(1);
    expect(component.filteredFiles()[0].id).toBe('e2');
  });

  it('filteredFiles filters by project', () => {
    component.onProjectFilterChange('P1');
    expect(component.filteredFiles().length).toBe(2);
  });

  it('filteredFiles filters by period', () => {
    component.onPeriodFilterChange('Annual 2025');
    expect(component.filteredFiles().length).toBe(1);
  });

  it('filters by confidence low (< 85)', () => {
    component.onConfidenceFilterChange('low');
    expect(component.filteredFiles().length).toBe(1);
    expect(component.filteredFiles()[0].id).toBe('e3');
  });

  it('filters by confidence high (>= 85 or undefined)', () => {
    component.onConfidenceFilterChange('high');
    expect(component.filteredFiles().length).toBe(2);
  });

  it('filters after 300ms debounce on search', async () => {
    component.onSearchChange('challan');
    await vi.advanceTimersByTimeAsync(300);
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(component.filteredFiles().every(f => f.fileName.toLowerCase().includes('challan'))).toBe(true);
  });

  it('does not filter before debounce completes', async () => {
    component.onSearchChange('challan');
    await vi.advanceTimersByTimeAsync(100);
    TestBed.flushEffects();
    expect(component.filteredFiles().length).toBe(3);
  });

  it('actionableFiles contains only pending + needs-review from filtered list', () => {
    expect(component.actionableFiles().length).toBe(2);
  });

  it('selectAllState is none when no ids selected', () => {
    expect(component.selectAllState()).toBe('none');
  });

  it('selectAllState is all when all actionable selected', () => {
    component.onSelectAll();
    expect(component.selectAllState()).toBe('all');
  });

  it('selectAllState is some when subset selected', () => {
    component.onToggleSelect('e2');
    expect(component.selectAllState()).toBe('some');
  });

  it('onToggleSelect adds id to selectedIds', () => {
    component.onToggleSelect('e2');
    expect(component.selectedIds().has('e2')).toBe(true);
  });

  it('onToggleSelect removes id if already selected', () => {
    component.onToggleSelect('e2');
    component.onToggleSelect('e2');
    expect(component.selectedIds().has('e2')).toBe(false);
  });

  it('onSelectAll selects all actionable', () => {
    component.onSelectAll();
    expect(component.selectedIds().has('e2')).toBe(true);
    expect(component.selectedIds().has('e3')).toBe(true);
    expect(component.selectedIds().has('e1')).toBe(false);
  });

  it('onSelectAll clears when all already selected', () => {
    component.onSelectAll();
    component.onSelectAll();
    expect(component.selectedIds().size).toBe(0);
  });

  it('onApprove calls evidSvc.updateStatus with validated', () => {
    component.onApprove('e2');
    expect(fakeSvc.updateStatus).toHaveBeenCalledWith('e2', 'validated');
  });

  it('onApproveSelected calls updateStatus for each selected id then clears', () => {
    component.onToggleSelect('e2');
    component.onToggleSelect('e3');
    component.onApproveSelected();
    expect(fakeSvc.updateStatus).toHaveBeenCalledWith('e2', 'validated');
    expect(fakeSvc.updateStatus).toHaveBeenCalledWith('e3', 'validated');
    expect(component.selectedIds().size).toBe(0);
  });

  it('onOpenDetail sets detailFile', () => {
    component.onOpenDetail('e1');
    expect(component.detailFile()?.id).toBe('e1');
  });

  it('onCloseDetail clears detailFile', () => {
    component.onOpenDetail('e1');
    component.onCloseDetail();
    expect(component.detailFile()).toBeNull();
  });

  it('onUpload sets showUploadDialog to false', () => {
    component.showUploadDialog.set(true);
    component.onUpload();
    expect(component.showUploadDialog()).toBe(false);
  });

  it('projectOptions contains all unique projectIds plus all', () => {
    const opts = component.projectOptions();
    expect(opts[0].value).toBe('all');
    expect(opts.some(o => o.value === 'P1')).toBe(true);
    expect(opts.some(o => o.value === 'P2')).toBe(true);
  });
});
