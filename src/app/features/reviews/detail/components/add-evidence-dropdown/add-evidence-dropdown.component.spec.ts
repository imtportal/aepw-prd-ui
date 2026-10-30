import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddEvidenceDropdownComponent } from './add-evidence-dropdown.component';

describe('AddEvidenceDropdownComponent', () => {
  let fixture: ComponentFixture<AddEvidenceDropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEvidenceDropdownComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(AddEvidenceDropdownComponent);
    fixture.detectChanges();
  });

  it('form is hidden on initial render', () => {
    expect(fixture.nativeElement.querySelector('[data-form]')).toBeNull();
  });

  it('reveals form when trigger button is clicked', () => {
    fixture.nativeElement.querySelector('[data-trigger]').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-form]')).not.toBeNull();
  });

  it('hides form when trigger is clicked again', () => {
    fixture.nativeElement.querySelector('[data-trigger]').click();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('[data-trigger]').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-form]')).toBeNull();
  });
});
