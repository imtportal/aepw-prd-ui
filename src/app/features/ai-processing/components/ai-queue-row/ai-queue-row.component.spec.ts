import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AiQueueRowComponent } from './ai-queue-row.component';
import { QueueItem } from '../../models/ai-processing.model';

const MOCK_ITEM: QueueItem = {
  id: 'p1', fileName: 'Challan_7025.jpg', fileType: 'image',
  projectId: '2023-0042', projectName: 'Project Hydra', period: 'Q3 2025',
  metricCode: 'MW1.11', metricName: 'Plastic waste diverted',
  uploadedAt: '22 Sep 10:32', processedAt: '22 Sep 10:33',
  status: 'completed', confidence: 98, processingTime: '12s',
  extracted: { challanNo: '7025', quantity: 767 },
};

describe('AiQueueRowComponent', () => {
  let fixture: ComponentFixture<AiQueueRowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AiQueueRowComponent] }).compileComponents();
    fixture = TestBed.createComponent(AiQueueRowComponent);
    fixture.componentRef.setInput('item', MOCK_ITEM);
    fixture.detectChanges();
  });

  it('renders project name', () => {
    expect(fixture.debugElement.query(By.css('[data-project-name]')).nativeElement.textContent).toContain('Project Hydra');
  });

  it('renders period', () => {
    expect(fixture.debugElement.query(By.css('[data-period]')).nativeElement.textContent.trim()).toBe('Q3 2025');
  });

  it('renders metric code', () => {
    expect(fixture.debugElement.query(By.css('[data-metric-code]')).nativeElement.textContent.trim()).toBe('MW1.11');
  });

  it('renders confidence in green when >= 90', () => {
    const el = fixture.debugElement.query(By.css('[data-confidence] span'));
    expect(el.nativeElement.classList.toString()).toContain('aepw-green');
  });

  it('renders confidence in orange when 75-89', () => {
    fixture.componentRef.setInput('item', { ...MOCK_ITEM, confidence: 80 });
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('[data-confidence] span'));
    expect(el.nativeElement.classList.toString()).toContain('aepw-orange');
  });

  it('renders dash when confidence undefined', () => {
    fixture.componentRef.setInput('item', { ...MOCK_ITEM, confidence: undefined });
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('[data-confidence]')).nativeElement.textContent.trim()).toBe('—');
  });

  it('emits openDetail with item.id when eye button clicked', () => {
    const emitted: string[] = [];
    fixture.componentInstance.openDetail.subscribe((id: string) => emitted.push(id));
    fixture.debugElement.query(By.css('[data-eye-btn]')).nativeElement.click();
    expect(emitted).toEqual(['p1']);
  });

  it('shows processing time with zap icon when defined', () => {
    expect(fixture.debugElement.query(By.css('[data-processing-time]')).nativeElement.textContent).toContain('12s');
  });

  it('shows dash for processing time when undefined', () => {
    fixture.componentRef.setInput('item', { ...MOCK_ITEM, processingTime: undefined });
    fixture.detectChanges();
    const cell = fixture.debugElement.queryAll(By.css('td'))[5];
    expect(cell.nativeElement.textContent.trim()).toBe('—');
  });
});
