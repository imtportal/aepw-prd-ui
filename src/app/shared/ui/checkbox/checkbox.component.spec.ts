import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CheckboxComponent } from './checkbox.component';

@Component({
  standalone: true,
  imports: [CheckboxComponent, ReactiveFormsModule],
  template: `<ui-checkbox [formControl]="ctrl" label="Accept terms" />`,
})
class Host { ctrl = new FormControl(false); }

describe('CheckboxComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [Host] }));
  it('should create', () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    expect(f.componentInstance).toBeTruthy();
  });
  it('renders label', () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Accept terms');
  });
});
