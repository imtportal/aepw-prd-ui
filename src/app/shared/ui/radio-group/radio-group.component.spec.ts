import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RadioGroupComponent, RadioItemComponent } from './radio-group.component';

@Component({
  standalone: true,
  imports: [RadioGroupComponent, RadioItemComponent, ReactiveFormsModule],
  template: `
    <ui-radio-group [formControl]="ctrl">
      <ui-radio-item value="a" label="Option A" />
      <ui-radio-item value="b" label="Option B" />
    </ui-radio-group>
  `,
})
class Host { ctrl = new FormControl('a'); }

describe('RadioGroup', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [Host] }));
  it('should create', () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    expect(f.componentInstance).toBeTruthy();
  });
  it('renders radio item labels', () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Option A');
    expect(f.nativeElement.textContent).toContain('Option B');
  });
});
