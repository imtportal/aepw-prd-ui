import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { EvidenceUploadDialogComponent } from './evidence-upload-dialog.component';
import { SelectOption } from '../../../../shared/models/select-option';

const PROJECTS: SelectOption[] = [
  { value: '2023-0042', label: 'Project Hydra' },
  { value: '2023-0015', label: 'Circular Plastics' },
];

describe('EvidenceUploadDialogComponent', () => {
  let fixture: ComponentFixture<EvidenceUploadDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [EvidenceUploadDialogComponent] }).compileComponents();
    fixture = TestBed.createComponent(EvidenceUploadDialogComponent);
    fixture.componentRef.setInput('visible', true);
    fixture.componentRef.setInput('projects', PROJECTS);
    fixture.detectChanges();
  });

  it('shows dialog when visible is true', () => {
    expect(fixture.debugElement.query(By.css('[data-dialog]'))).not.toBeNull();
  });

  it('hides dialog when visible is false', () => {
    fixture.componentRef.setInput('visible', false);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('[data-dialog]'))).toBeNull();
  });

  it('emits upload when upload button clicked', () => {
    let emitCount = 0;
    fixture.componentInstance.upload.subscribe(() => emitCount++);
    fixture.debugElement.query(By.css('[data-upload-btn]')).nativeElement.click();
    expect(emitCount).toBe(1);
  });

  it('emits close when cancel button clicked', () => {
    let emitCount = 0;
    fixture.componentInstance.close.subscribe(() => emitCount++);
    fixture.debugElement.query(By.css('[data-cancel-btn]')).nativeElement.click();
    expect(emitCount).toBe(1);
  });

  it('drop zone is present', () => {
    expect(fixture.debugElement.query(By.css('[data-drop-zone]'))).not.toBeNull();
  });
});
