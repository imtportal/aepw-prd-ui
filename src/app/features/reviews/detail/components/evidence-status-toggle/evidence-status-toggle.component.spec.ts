import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EvidenceStatusToggleComponent } from './evidence-status-toggle.component';
import { EvidenceStatus } from '../../../../evidence/models/evidence.model';

describe('EvidenceStatusToggleComponent', () => {
  let fixture: ComponentFixture<EvidenceStatusToggleComponent>;
  let component: EvidenceStatusToggleComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvidenceStatusToggleComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(EvidenceStatusToggleComponent);
    component = fixture.componentInstance;
  });

  it('renders the current status label', () => {
    fixture.componentRef.setInput('status', 'pending');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Pending');
  });

  it('renders needs-review as "Needs Review"', () => {
    fixture.componentRef.setInput('status', 'needs-review');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Needs Review');
  });

  it('emits next status in cycle on click (pending → processing)', () => {
    fixture.componentRef.setInput('status', 'pending');
    fixture.detectChanges();
    let emitted: EvidenceStatus | undefined;
    component.change.subscribe((s: EvidenceStatus) => (emitted = s));
    fixture.nativeElement.querySelector('button').click();
    expect(emitted).toBe('processing');
  });

  it('wraps from last status (rejected) back to pending', () => {
    fixture.componentRef.setInput('status', 'rejected');
    fixture.detectChanges();
    let emitted: EvidenceStatus | undefined;
    component.change.subscribe((s: EvidenceStatus) => (emitted = s));
    fixture.nativeElement.querySelector('button').click();
    expect(emitted).toBe('pending');
  });
});
