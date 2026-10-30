import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { EvidenceRowComponent } from './evidence-row.component';
import { EvidenceFile } from '../../models/evidence.model';

const MOCK_FILE: EvidenceFile = {
  id: 'e1', fileName: 'Challan_7025.jpg', fileType: 'image',
  projectId: '2023-0042', projectName: 'Project Hydra', period: 'Q3 2025',
  pm: 'Sarah Chen', metricCode: 'MW1.11', uploadedAt: '22 Sep 2025',
  uploadedBy: 'Budi Santoso', status: 'validated', aiConfidence: 98,
};

const PENDING_FILE: EvidenceFile = { ...MOCK_FILE, id: 'e5', status: 'pending', aiConfidence: undefined };
const NEEDS_REVIEW_FILE: EvidenceFile = { ...MOCK_FILE, id: 'e3', status: 'needs-review', aiConfidence: 72 };

describe('EvidenceRowComponent', () => {
  let fixture: ComponentFixture<EvidenceRowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvidenceRowComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(EvidenceRowComponent);
    fixture.componentRef.setInput('file', MOCK_FILE);
    fixture.detectChanges();
  });

  it('renders project name', () => {
    expect(fixture.debugElement.query(By.css('[data-project-name]')).nativeElement.textContent).toContain('Project Hydra');
  });

  it('renders metric code badge', () => {
    expect(fixture.debugElement.query(By.css('[data-metric-code]')).nativeElement.textContent.trim()).toBe('MW1.11');
  });

  it('renders confidence in green when >= 90', () => {
    const el = fixture.debugElement.query(By.css('[data-confidence]'));
    expect(el.nativeElement.classList.toString()).toContain('aepw-green');
  });

  it('renders confidence in red when < 75', () => {
    fixture.componentRef.setInput('file', NEEDS_REVIEW_FILE);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('[data-confidence]')).nativeElement.classList.toString()).toContain('destructive');
  });

  it('renders dash when aiConfidence undefined', () => {
    fixture.componentRef.setInput('file', PENDING_FILE);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('[data-ai-pct]')).nativeElement.textContent.trim()).toBe('—');
  });

  it('does NOT show checkbox for validated status', () => {
    expect(fixture.debugElement.query(By.css('[data-select-checkbox]'))).toBeNull();
  });

  it('shows checkbox for pending status', () => {
    fixture.componentRef.setInput('file', PENDING_FILE);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('[data-select-checkbox]'))).not.toBeNull();
  });

  it('shows checkbox for needs-review status', () => {
    fixture.componentRef.setInput('file', NEEDS_REVIEW_FILE);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('[data-select-checkbox]'))).not.toBeNull();
  });

  it('emits selectToggle with file.id when checkbox changed', () => {
    fixture.componentRef.setInput('file', PENDING_FILE);
    fixture.detectChanges();
    const emitted: string[] = [];
    fixture.componentInstance.selectToggle.subscribe((id: string) => emitted.push(id));
    const cb = fixture.debugElement.query(By.css('[data-select-checkbox]')).nativeElement;
    cb.dispatchEvent(new Event('change'));
    expect(emitted).toEqual(['e5']);
  });

  it('emits openDetail with file.id when eye button clicked', () => {
    const emitted: string[] = [];
    fixture.componentInstance.openDetail.subscribe((id: string) => emitted.push(id));
    fixture.debugElement.query(By.css('[data-eye-btn]')).nativeElement.click();
    expect(emitted).toEqual(['e1']);
  });

  it('has routerLink to /reviews/:projectId on external link', () => {
    const link = fixture.debugElement.query(By.css('[data-review-link]'));
    expect(link).not.toBeNull();
  });
});
