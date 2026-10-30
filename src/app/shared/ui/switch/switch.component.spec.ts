import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SwitchComponent } from './switch.component';

@Component({
  standalone: true,
  imports: [SwitchComponent, ReactiveFormsModule],
  template: `<ui-switch [formControl]="ctrl" label="Enable notifications" />`,
})
class Host { ctrl = new FormControl(false); }

describe('SwitchComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [Host] }));
  it('should create', () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    expect(f.componentInstance).toBeTruthy();
  });
  it('renders label', () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Enable notifications');
  });
});
