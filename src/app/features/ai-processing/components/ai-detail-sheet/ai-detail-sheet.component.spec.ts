import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AiDetailSheetComponent } from './ai-detail-sheet.component';
import { QueueItem } from '../../models/ai-processing.model';

const COMPLETED_ITEM: QueueItem = {
  id: 'p1', fileName: 'Challan_7025.jpg', fileType: 'image',
  projectId: '2023-0042', projectName: 'Project Hydra', period: 'Q3 2025',
  metricCode: 'MW1.11', metricName: 'Plastic waste diverted',
  uploadedAt: '22 Sep 10:32', processedAt: '22 Sep 10:33',
  status: 'completed', confidence: 98, processingTime: '12s',
  extracted: { challanNo: '7025', quantity: 767 },
};

const ERROR_ITEM: QueueItem = {
  ...COMPLETED_ITEM, id: 'p8', status: 'error',
  validationNote: 'File corrupted', confidence: undefined, extracted: undefined,
};

describe('AiDetailSheetComponent', () => {
  let fixture: ComponentFixture<AiDetailSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiDetailSheetComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(AiDetailSheetComponent);
    fixture.detectChanges();
  });

  it('shows nothing when item is null', () => {
    expect(fixture.debugElement.query(By.css('[data-detail-content]'))).toBeNull();
  });

  it('shows content when item is set', () => {
    fixture.componentRef.setInput('item', COMPLETED_ITEM);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('[data-detail-content]'))).not.toBeNull();
  });

  it('shows extracted fields section when item.extracted is set', () => {
    fixture.componentRef.setInput('item', COMPLETED_ITEM);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('[data-extracted-fields]'))).not.toBeNull();
  });

  it('hides extracted fields section when item.extracted is undefined', () => {
    fixture.componentRef.setInput('item', ERROR_ITEM);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('[data-extracted-fields]'))).toBeNull();
  });

  it('shows reprocess button only for error status', () => {
    fixture.componentRef.setInput('item', ERROR_ITEM);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('[data-reprocess-btn]'))).not.toBeNull();
  });

  it('hides reprocess button for completed status', () => {
    fixture.componentRef.setInput('item', COMPLETED_ITEM);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('[data-reprocess-btn]'))).toBeNull();
  });

  it('emits reprocess with item.id when reprocess button clicked', () => {
    fixture.componentRef.setInput('item', ERROR_ITEM);
    fixture.detectChanges();
    const emitted: string[] = [];
    fixture.componentInstance.reprocess.subscribe((id: string) => emitted.push(id));
    fixture.debugElement.query(By.css('[data-reprocess-btn]')).nativeElement.click();
    expect(emitted).toEqual(['p8']);
  });

  it('shows review-in-evidence link only for needs-review status', () => {
    fixture.componentRef.setInput('item', { ...COMPLETED_ITEM, status: 'needs-review' });
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('[data-review-link]'))).not.toBeNull();
    fixture.componentRef.setInput('item', COMPLETED_ITEM);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('[data-review-link]'))).toBeNull();
  });

  it('emits close when close button clicked', () => {
    fixture.componentRef.setInput('item', COMPLETED_ITEM);
    fixture.detectChanges();
    let emitCount = 0;
    fixture.componentInstance.close.subscribe(() => emitCount++);
    fixture.debugElement.query(By.css('[data-close-btn]')).nativeElement.click();
    expect(emitCount).toBe(1);
  });
});
