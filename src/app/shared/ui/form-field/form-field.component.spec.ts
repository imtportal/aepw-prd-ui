import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FormFieldComponent } from './form-field.component';
import { InputComponent } from '../input/input.component';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [FormFieldComponent, InputComponent, ReactiveFormsModule],
  template: `
    <ui-form-field label="Email" [error]="err" [hint]="hint" [required]="req">
      <ui-input [formControl]="ctrl" />
    </ui-form-field>
  `,
})
class Host {
  ctrl = new FormControl('');
  err = '';
  hint = '';
  req = false;
}

describe('FormFieldComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [Host] }));

  it('renders label', () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Email');
  });

  it('shows required asterisk when required=true', () => {
    const f = TestBed.createComponent(Host);
    f.componentInstance.req = true;
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('*');
  });

  it('does not show asterisk when required=false', () => {
    const f = TestBed.createComponent(Host);
    f.componentInstance.req = false;
    f.detectChanges();
    expect(f.nativeElement.textContent).not.toContain('*');
  });

  it('shows error message when error is set', () => {
    const f = TestBed.createComponent(Host);
    f.componentInstance.err = 'This field is required';
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('This field is required');
  });

  it('does not show error element when error is empty', () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    // No paragraph with text-destructive class visible
    const errPara = Array.from(f.nativeElement.querySelectorAll('p')).find(
      (el: any) => el.className.includes('text-destructive'),
    );
    expect(errPara).toBeUndefined();
  });

  it('shows hint when hint is set and no error', () => {
    const f = TestBed.createComponent(Host);
    f.componentInstance.hint = 'Use your work email';
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Use your work email');
  });

  it('suppresses hint when error is also set', () => {
    const f = TestBed.createComponent(Host);
    f.componentInstance.hint = 'Use your work email';
    f.componentInstance.err = 'Invalid email';
    f.detectChanges();
    expect(f.nativeElement.textContent).not.toContain('Use your work email');
    expect(f.nativeElement.textContent).toContain('Invalid email');
  });
});
