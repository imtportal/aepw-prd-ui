import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IncludeExcludeToggleComponent } from './include-exclude-toggle.component';

describe('IncludeExcludeToggleComponent', () => {
  let fixture:   ComponentFixture<IncludeExcludeToggleComponent>;
  let component: IncludeExcludeToggleComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncludeExcludeToggleComponent],
    }).compileComponents();
    fixture   = TestBed.createComponent(IncludeExcludeToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('shows "Included" text by default (included = true)', () => {
    expect(fixture.nativeElement.querySelector('button').textContent.trim()).toBe('Included');
  });

  it('shows "Excluded" text when included is false', () => {
    fixture.componentRef.setInput('included', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button').textContent.trim()).toBe('Excluded');
  });

  it('emits false when clicked while in Included state', () => {
    let emitted: boolean | undefined;
    component.includedChange.subscribe((v: boolean) => (emitted = v));
    fixture.nativeElement.querySelector('button').click();
    expect(emitted).toBe(false);
  });

  it('emits true when clicked while in Excluded state', () => {
    fixture.componentRef.setInput('included', false);
    fixture.detectChanges();
    let emitted: boolean | undefined;
    component.includedChange.subscribe((v: boolean) => (emitted = v));
    fixture.nativeElement.querySelector('button').click();
    expect(emitted).toBe(true);
  });

  it('button has data-include-exclude-toggle attribute for testing hooks', () => {
    expect(fixture.nativeElement.querySelector('[data-include-exclude-toggle]')).toBeTruthy();
  });
});
