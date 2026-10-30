import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { EvidenceDetailSheetComponent } from './evidence-detail-sheet.component';
import { EvidenceFile } from '../../models/evidence.model';

const BASE: EvidenceFile = {
  id: 'e1', fileName: 'Challan_7025.jpg', fileType: 'image',
  projectId: '2023-0042', projectName: 'Project Hydra', period: 'Q3 2025',
  pm: 'Sarah Chen', metricCode: 'MW1.11', uploadedAt: '22 Sep 2025',
  uploadedBy: 'Budi Santoso', status: 'validated', aiConfidence: 98,
};

describe('EvidenceDetailSheetComponent', () => {
  let fixture: ComponentFixture<EvidenceDetailSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvidenceDetailSheetComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(EvidenceDetailSheetComponent);
    fixture.detectChanges();
  });

  it('renders nothing when file is null', () => {
    expect(fixture.debugElement.query(By.css('[data-sheet-content]'))).toBeNull();
  });

  it('renders content when file is set', () => {
    fixture.componentRef.setInput('file', BASE);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('[data-sheet-content]'))).not.toBeNull();
  });

  it('shows approve button for pending', () => {
    fixture.componentRef.setInput('file', { ...BASE, status: 'pending' });
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('[data-approve-btn]'))).not.toBeNull();
  });

  it('shows approve button for needs-review', () => {
    fixture.componentRef.setInput('file', { ...BASE, status: 'needs-review' });
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('[data-approve-btn]'))).not.toBeNull();
  });

  it('hides approve button for validated', () => {
    fixture.componentRef.setInput('file', BASE);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('[data-approve-btn]'))).toBeNull();
  });

  it('emits approve with file.id when approve clicked', () => {
    fixture.componentRef.setInput('file', { ...BASE, status: 'pending' });
    fixture.detectChanges();
    const emitted: string[] = [];
    fixture.componentInstance.approve.subscribe((id: string) => emitted.push(id));
    fixture.debugElement.query(By.css('[data-approve-btn]')).nativeElement.click();
    expect(emitted).toEqual(['e1']);
  });

  it('emits close when close button clicked', () => {
    fixture.componentRef.setInput('file', BASE);
    fixture.detectChanges();
    let emitCount = 0;
    fixture.componentInstance.close.subscribe(() => emitCount++);
    fixture.debugElement.query(By.css('[data-close-btn]')).nativeElement.click();
    expect(emitCount).toBe(1);
  });

  it('shows validationNote section when present', () => {
    fixture.componentRef.setInput('file', { ...BASE, validationNote: 'Unclear quantity' });
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('[data-validation-note]')).nativeElement.textContent).toContain('Unclear quantity');
  });

  it('hides validationNote section when absent', () => {
    fixture.componentRef.setInput('file', BASE);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('[data-validation-note]'))).toBeNull();
  });
});
