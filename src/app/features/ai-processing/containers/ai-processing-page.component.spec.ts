import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { AIProcessingPageComponent } from './ai-processing-page.component';
import { AIProcessingService } from '../services/ai-processing.service';
import { QueueItem } from '../models/ai-processing.model';

const MOCK_QUEUE: QueueItem[] = [
  { id: 'p1', fileName: 'f1.jpg', fileType: 'image', projectId: 'P1', projectName: 'Project A',
    period: 'Q3 2025', metricCode: 'MW1.11', metricName: 'Metric A',
    uploadedAt: '22 Sep', status: 'completed', confidence: 98 },
  { id: 'p2', fileName: 'f2.pdf', fileType: 'pdf', projectId: 'P1', projectName: 'Project A',
    period: 'Q3 2025', metricCode: 'MW1.12', metricName: 'Metric B',
    uploadedAt: '22 Sep', status: 'queued' },
  { id: 'p3', fileName: 'f3.jpg', fileType: 'image', projectId: 'P2', projectName: 'Project B',
    period: 'Q3 2025', metricCode: 'MW1.13', metricName: 'Metric C',
    uploadedAt: '22 Sep', status: 'error', validationNote: 'Corrupted' },
];

function makeFakeSvc(queue = MOCK_QUEUE) {
  return {
    queue:            signal([...queue]),
    loading:          signal(false),
    error:            signal<string | null>(null),
    updateItemStatus: vi.fn(),
    reprocess:        vi.fn(),
  };
}

describe('AIProcessingPageComponent', () => {
  let fixture: ComponentFixture<AIProcessingPageComponent>;
  let component: AIProcessingPageComponent;
  let fakeSvc: ReturnType<typeof makeFakeSvc>;

  beforeEach(async () => {
    fakeSvc = makeFakeSvc();
    await TestBed.configureTestingModule({
      imports: [AIProcessingPageComponent],
      providers: [{ provide: AIProcessingService, useValue: fakeSvc }],
    }).compileComponents();
    fixture = TestBed.createComponent(AIProcessingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('totalCount equals queue length', () => {
    expect(component.totalCount()).toBe(3);
  });

  it('completedCount counts completed items', () => {
    expect(component.completedCount()).toBe(1);
  });

  it('errorCount counts error items', () => {
    expect(component.errorCount()).toBe(1);
  });

  it('filteredItems returns all when statusFilter is all', () => {
    expect(component.filteredItems().length).toBe(3);
  });

  it('filteredItems filters by status', () => {
    component.onFilterChange('queued');
    expect(component.filteredItems().length).toBe(1);
    expect(component.filteredItems()[0].id).toBe('p2');
  });

  it('onOpenDetail sets detailItem', () => {
    component.onOpenDetail('p1');
    expect(component.detailItem()?.id).toBe('p1');
  });

  it('onCloseDetail clears detailItem', () => {
    component.onOpenDetail('p1');
    component.onCloseDetail();
    expect(component.detailItem()).toBeNull();
  });

  it('onReprocess calls aiSvc.reprocess', () => {
    component.onReprocess('p3');
    expect(fakeSvc.reprocess).toHaveBeenCalledWith('p3');
  });
});
